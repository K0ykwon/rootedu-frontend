import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { getRedisClient } from '../../../../../lib/redis';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any)?.userId || (session.user as any)?.id;
    const userEmail = session.user?.email;
    const params = await context.params;
    const slug = params.slug;

    if (!userId && !userEmail) {
      return NextResponse.json({ error: 'User identification failed' }, { status: 400 });
    }

    const redis = await getRedisClient();
    
    try {
      // Check if user has purchased any product from this influencer
      const productsKey = `influencer:${slug}:products`;
      const productIds = await redis.sMembers(productsKey);
      
      const userProducts = [];
      let hasAccess = false;

      for (const productId of productIds) {
        // Check if user has purchased this product
        const customersKey = `influencer:${slug}:product:${productId}:customers`;
        const customers = await redis.sMembers(customersKey);
        
        // Check by userId or email
        let isPurchased = false;
        if (userId && customers.includes(userId)) {
          isPurchased = true;
        } else {
          // Check by email if userId check failed
          for (const customerId of customers) {
            const userData = await redis.hGetAll(`user:${customerId}`);
            if (userData.email === userEmail) {
              isPurchased = true;
              break;
            }
          }
        }
        
        if (isPurchased) {
          hasAccess = true;
          
          // Get product details
          const productKey = `product:${productId}`;
          const productData = await redis.hGetAll(productKey);
          
          if (productData && Object.keys(productData).length > 0) {
            userProducts.push({
              productId,
              name: productData.title || 'Unknown Product',
              description: productData.description || '',
              price: parseInt(productData.price) || 0
            });
          }
        }
      }

      return NextResponse.json({ 
        hasAccess,
        products: userProducts
      });
      
    } finally {
      // Don't close the shared Redis connection
    }
    
  } catch (error) {
    console.error('Error checking access:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}