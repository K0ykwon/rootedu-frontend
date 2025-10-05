import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkProductAccess, ProductVideo } from '@/lib/redis';
import { createClient } from 'redis';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    // 1. Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !(session.user as any)?.userId) {
      return NextResponse.json(
        { hasAccess: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: productId } = await params;
    const userId = (session.user as any).userId;

    // 2. Check if user has access to this product
    const hasAccess = await checkProductAccess(userId, productId);

    if (!hasAccess) {
      return NextResponse.json(
        { hasAccess: false, error: 'Access denied. Purchase required.' },
        { status: 403 }
      );
    }

    // 3. Fetch product and video details
    const REDIS_URL = process.env.REDIS_URL || process.env.DATABASE_URL;
    const redis = createClient({ url: REDIS_URL });
    await redis.connect();

    const productData = await redis.hGetAll(`product:${productId}`);

    if (!productData || Object.keys(productData).length === 0) {
      await redis.disconnect();
      return NextResponse.json(
        { hasAccess: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    let videos: ProductVideo[] = [];

    // Parse videos array
    if (productData.videos) {
      try {
        videos = JSON.parse(productData.videos as string) as ProductVideo[];
      } catch (e) {
        console.error(`Failed to parse videos for product ${productId}:`, e);
      }
    }

    // Legacy support: convert single videoUrl to array
    if (videos.length === 0 && productData.videoUrl) {
      videos = [{
        id: `${productId}_legacy`,
        url: productData.videoUrl,
        type: 'youtube',
        title: productData.title || 'Video',
        order: 0
      }];
    }

    // Get influencer info
    let influencerName = '';
    if (productData.influencerSlug) {
      const influencerData = await redis.hGetAll(`influencer:${productData.influencerSlug}`);
      influencerName = influencerData.name || productData.influencerSlug;
    }

    await redis.disconnect();

    // Sort videos by order
    videos.sort((a, b) => a.order - b.order);

    return NextResponse.json({
      hasAccess: true,
      videos,
      videoCount: videos.length,
      product: {
        id: productId,
        title: productData.title,
        influencerSlug: productData.influencerSlug,
        influencerName,
        thumbnail: productData.thumbnail
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching product videos:', error);
    return NextResponse.json(
      { hasAccess: false, error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}
