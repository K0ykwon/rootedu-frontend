import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { createClient } from 'redis'

const redis = createClient({
  url: process.env.DATABASE_URL || process.env.REDIS_URL
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId, influencerSlug, userId: providedUserId } = await request.json()

    if (!productId || !influencerSlug) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Use provided userId or get from session
    const userId = providedUserId || (session.user as any)?.userId || session.user?.email

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 400 }
      )
    }

    if (!redis.isOpen) {
      await redis.connect()
    }

    // Check if product exists
    const productKey = `product:${productId}`
    const productData = await redis.hGetAll(productKey)
    
    if (!productData || Object.keys(productData).length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if user already purchased this product
    const userPurchases = await redis.sMembers(`user:${userId}:purchases`)
    if (userPurchases.includes(productId)) {
      return NextResponse.json(
        { error: 'Product already purchased' },
        { status: 400 }
      )
    }

    const purchase = {
      productId,
      influencerSlug,
      purchasedAt: new Date().toISOString(),
      status: 'active',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
    }

    // Add purchase to user's purchase list
    await redis.sAdd(`user:${userId}:purchases`, productId)

    // Store purchase details
    await redis.hSet(`user:${userId}:purchase:${productId}`, purchase)

    // Add user to product's customer list
    await redis.sAdd(`product:${productId}:customers`, userId)

    // Add user to influencer's product customer list
    await redis.sAdd(`influencer:${influencerSlug}:product:${productId}:customers`, userId)

    // Add to influencer's all customers
    await redis.sAdd(`influencer:${influencerSlug}:all-customers`, userId)

    // Store user info if not exists
    const userKey = `user:${userId}`
    const existingUser = await redis.hGetAll(userKey)
    if (!existingUser || Object.keys(existingUser).length === 0) {
      await redis.hSet(userKey, {
        userId,
        email: session.user?.email || '',
        name: session.user?.name || '',
        createdAt: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: true,
      purchase,
      message: '구매가 성공적으로 기록되었습니다.'
    })
  } catch (error) {
    console.error('Error tracking purchase:', error)
    return NextResponse.json(
      { error: 'Failed to track purchase' },
      { status: 500 }
    )
  } finally {
    if (redis.isOpen) {
      await redis.disconnect()
    }
  }
}

// GET endpoint to check user's purchases
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || (session.user as any)?.userId || session.user?.email

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 400 }
      )
    }

    if (!redis.isOpen) {
      await redis.connect()
    }

    // Get user's purchases
    const purchaseIds = await redis.sMembers(`user:${userId}:purchases`)
    const purchases = []

    for (const productId of purchaseIds) {
      const purchaseDetails = await redis.hGetAll(`user:${userId}:purchase:${productId}`)
      const productData = await redis.hGetAll(`product:${productId}`)
      
      if (purchaseDetails && Object.keys(purchaseDetails).length > 0) {
        purchases.push({
          ...purchaseDetails,
          productData
        })
      }
    }

    // Sort by purchase date
    purchases.sort((a, b) => {
      const dateA = new Date((a as any).purchasedAt).getTime()
      const dateB = new Date((b as any).purchasedAt).getTime()
      return dateB - dateA
    })

    return NextResponse.json({
      success: true,
      userId,
      purchases
    })
  } catch (error) {
    console.error('Error fetching purchases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchases' },
      { status: 500 }
    )
  } finally {
    if (redis.isOpen) {
      await redis.disconnect()
    }
  }
}