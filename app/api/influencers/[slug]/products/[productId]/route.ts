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

    // Get the product using the correct key format
    const productKey = `product:${productId}`
    const productData = await redis.hGetAll(productKey)
    
    if (!productData || Object.keys(productData).length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Parse JSON fields
    const product = {
      ...productData,
      price: parseInt(productData.price),
      description: productData.description ? JSON.parse(productData.description) : undefined,
      features: productData.features ? JSON.parse(productData.features) : undefined,
      createdAt: parseInt(productData.createdAt),
      updatedAt: productData.updatedAt ? parseInt(productData.updatedAt) : undefined
    }
    
    // Verify the product belongs to the influencer
    if ((product as any).influencerSlug !== slug) {
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