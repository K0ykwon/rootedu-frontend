import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '../../../../../lib/redis';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await context.params;
    const slug = params.slug;

    const redis = await getRedisClient();
    
    try {
      // Get all products for this influencer
      const productsKey = `influencer:${slug}:products`;
      const productIds = await redis.sMembers(productsKey);
      
      const products = [];

      for (const productId of productIds) {
        // Get product details
        const productKey = `product:${productId}`;
        const productData = await redis.hGetAll(productKey);
        
        if (productData && Object.keys(productData).length > 0) {
          products.push({
            productId,
            name: productData.title || 'Unknown Product',
            description: productData.description || '',
            price: parseInt(productData.price) || 0,
            image: productData.image || null
          });
        }
      }

      return NextResponse.json({ 
        products,
        total: products.length
      });
      
    } finally {
      // Don't close the shared Redis connection
    }
    
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}