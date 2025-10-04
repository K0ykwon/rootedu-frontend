import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserProducts } from '@/lib/redis';

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

    // 2. Fetch all products user has purchased
    const products = await getUserProducts(userId);

    return NextResponse.json({
      products,
      count: products.length
    }, { status: 200 });

  } catch (error) {
    console.error('Get user products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
