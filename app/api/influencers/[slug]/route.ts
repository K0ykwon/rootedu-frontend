import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '../../../../lib/redis';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { slug } = await params;
    
    // Redis 연결 보장 후 인플루언서 데이터 조회
    const redis = await getRedisClient();
    const influencerData = await redis.hGetAll(`influencer:${slug}`);
    
    if (!influencerData || !influencerData.name) {
      return NextResponse.json({ error: 'Influencer not found' }, { status: 404 });
    }

    // 데이터 파싱
    const influencer = {
      id: influencerData.id,
      slug: influencerData.slug,
      name: influencerData.name,
      username: influencerData.username,
      instagram: influencerData.instagram,
      avatar: influencerData.avatar,
      bio: influencerData.bio,
      description: influencerData.description,
      tags: influencerData.tags ? JSON.parse(influencerData.tags) : [],
      stats: influencerData.stats ? JSON.parse(influencerData.stats) : {}
    };

    // 관련 상품 조회
    const productIds = await redis.sMembers(`influencer:${slug}:products`);
    const products = [];

    for (const productId of productIds) {
      const productData = await redis.hGetAll(`product:${productId}`);
      if (productData && productData.title) {
        const product = {
          id: productData.id,
          influencerSlug: productData.influencerSlug,
          title: productData.title,
          price: parseInt(productData.price || '0'),
          level: productData.level,
          thumbnail: productData.thumbnail,
          summary: productData.summary,
          description: productData.description,
          createdAt: parseInt(productData.createdAt || '0')
        };
        products.push(product);
      }
    }

    // 최신순으로 정렬
    products.sort((a, b) => b.createdAt - a.createdAt);

    return NextResponse.json({
      influencer,
      products
    });

  } catch (error) {
    console.error('Error fetching influencer:', error);
    return NextResponse.json({ error: 'Failed to fetch influencer' }, { status: 500 });
  }
}