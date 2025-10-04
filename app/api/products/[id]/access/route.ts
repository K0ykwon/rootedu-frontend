import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkProductAccess } from '@/lib/redis';
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

    // 3. If user has access, fetch video URL from product
    let videoUrl: string | undefined;

    if (hasAccess) {
      const REDIS_URL = process.env.REDIS_URL || process.env.DATABASE_URL;
      const redis = createClient({ url: REDIS_URL });
      await redis.connect();

      const productData = await redis.hGetAll(`product:${productId}`);
      videoUrl = productData.videoUrl;

      await redis.disconnect();
    }

    return NextResponse.json({
      hasAccess,
      videoUrl: hasAccess ? videoUrl : undefined,
      productId
    }, { status: 200 });

  } catch (error) {
    console.error('Access check error:', error);
    return NextResponse.json(
      { hasAccess: false, error: 'Access check failed' },
      { status: 500 }
    );
  }
}
