import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserProducts, ProductVideo } from '@/lib/redis';
import { createClient } from 'redis';

interface ProductWithVideos {
  productId: string;
  productTitle: string;
  influencerSlug: string;
  influencerName: string;
  videos: ProductVideo[];
  videoCount: number;
  purchasedAt: number;
  thumbnail?: string;
}

export async function GET(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !(session.user as any)?.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).userId;

    // 2. Get all purchased products
    const purchasedProducts = await getUserProducts(userId);

    // 3. Filter products with videos and fetch video details
    const REDIS_URL = process.env.REDIS_URL || process.env.DATABASE_URL;
    const redis = createClient({ url: REDIS_URL });
    await redis.connect();

    const productsWithVideos: ProductWithVideos[] = [];

    for (const product of purchasedProducts) {
      // Check if product has videos
      if (!product.hasVideo) continue;

      let videos: ProductVideo[] = [];

      // Get full product data to access videos
      const productData = await redis.hGetAll(`product:${product.id}`);

      // Parse videos array
      if (productData.videos) {
        try {
          videos = JSON.parse(productData.videos as string) as ProductVideo[];
        } catch (e) {
          console.error(`Failed to parse videos for product ${product.id}:`, e);
        }
      }

      // Legacy support: convert single videoUrl to array
      if (videos.length === 0 && productData.videoUrl) {
        videos = [{
          id: `${product.id}_legacy`,
          url: productData.videoUrl,
          type: 'youtube',
          title: product.title || 'Video',
          order: 0
        }];
      }

      if (videos.length > 0) {
        // Get purchase timestamp
        const purchaseData = await redis.json.get(`purchase:${userId}:${product.id}`) as any;

        // Get influencer name from influencer data
        let influencerName = '';
        if (product.influencerSlug) {
          const influencerData = await redis.hGetAll(`influencer:${product.influencerSlug}`);
          influencerName = influencerData.name || product.influencerSlug;
        }

        productsWithVideos.push({
          productId: product.id,
          productTitle: product.title || 'Untitled Product',
          influencerSlug: product.influencerSlug || '',
          influencerName,
          videos: videos.sort((a, b) => a.order - b.order), // Sort by order
          videoCount: videos.length,
          purchasedAt: purchaseData?.purchasedAt || 0,
          thumbnail: product.thumbnail
        });
      }
    }

    await redis.disconnect();

    // 4. Sort by purchase date (most recent first)
    productsWithVideos.sort((a, b) => b.purchasedAt - a.purchasedAt);

    // 5. Calculate total stats
    const totalVideos = productsWithVideos.reduce((sum, p) => sum + p.videoCount, 0);

    return NextResponse.json({
      products: productsWithVideos,
      totalProducts: productsWithVideos.length,
      totalVideos,
      userId
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching user videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}
