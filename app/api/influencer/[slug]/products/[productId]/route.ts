import { NextResponse } from 'next/server'
import { createClient } from 'redis'

const redis = createClient({
  url: process.env.DATABASE_URL || process.env.REDIS_URL
})

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string; productId: string }> }
) {
  try {
    const { slug, productId } = await context.params
    
    if (!redis.isOpen) {
      await redis.connect()
    }

    // Get the product
    const productData = await redis.hGet('products', productId)
    
    if (!productData) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const product = JSON.parse(productData)
    
    // Verify the product belongs to the influencer
    if (product.influencerSlug !== slug) {
      return NextResponse.json(
        { error: 'Product not found for this influencer' },
        { status: 404 }
      )
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  } finally {
    if (redis.isOpen) {
      await redis.disconnect()
    }
  }
}