import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { grantProductAccess } from '@/lib/redis';
import { createClient } from 'redis';

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Props) {
  try {
    // 1. Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !(session.user as any)?.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: productId } = await params;
    const userId = (session.user as any).userId;

    // 2. Verify product exists
    const REDIS_URL = process.env.REDIS_URL || process.env.DATABASE_URL;
    const redis = createClient({ url: REDIS_URL });
    await redis.connect();

    const productExists = await redis.exists(`product:${productId}`);

    if (!productExists) {
      await redis.disconnect();
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    await redis.disconnect();

    // 3. Grant access to the product (creates purchase record)
    await grantProductAccess(userId, productId);

    // 4. Return success with access confirmation
    return NextResponse.json({
      success: true,
      message: 'Product purchased successfully',
      accessGranted: true,
      productId,
      userId
    }, { status: 200 });

  } catch (error) {
    console.error('Purchase error:', error);
    return NextResponse.json(
      { error: 'Purchase failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}