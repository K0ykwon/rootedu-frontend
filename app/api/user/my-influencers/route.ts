import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getRedisClient } from '@/lib/redis'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any)?.userId || session.user?.email

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 400 }
      )
    }

    const redis = await getRedisClient()

    // Get user's purchases
    const purchaseIds = await redis.sMembers(`user:${userId}:purchases`)
    
    if (!purchaseIds || purchaseIds.length === 0) {
      return NextResponse.json({
        success: true,
        userId,
        influencers: []
      })
    }

    // Get unique influencers from purchases
    const influencerMap = new Map()
    const purchases = []

    for (const productId of purchaseIds) {
      const purchaseDetails = await redis.hGetAll(`user:${userId}:purchase:${productId}`)
      const productData = await redis.hGetAll(`product:${productId}`)
      
      if (purchaseDetails && Object.keys(purchaseDetails).length > 0 && 
          productData && Object.keys(productData).length > 0) {
        
        const influencerSlug = purchaseDetails.influencerSlug || productData.influencerSlug
        
        if (influencerSlug) {
          // Get influencer data
          const influencerData = await redis.hGetAll(`influencer:${influencerSlug}`)
          
          if (influencerData && Object.keys(influencerData).length > 0) {
            // Count products purchased from this influencer
            if (!influencerMap.has(influencerSlug)) {
              influencerMap.set(influencerSlug, {
                ...influencerData,
                slug: influencerSlug,
                purchasedProducts: [],
                totalPurchases: 0,
                latestPurchase: purchaseDetails.purchasedAt
              })
            }

            const influencer = influencerMap.get(influencerSlug)
            influencer.purchasedProducts.push({
              ...productData,
              ...purchaseDetails,
              productId
            })
            influencer.totalPurchases += 1
            
            // Update latest purchase date
            const currentDate = new Date(purchaseDetails.purchasedAt)
            const latestDate = new Date(influencer.latestPurchase)
            if (currentDate > latestDate) {
              influencer.latestPurchase = purchaseDetails.purchasedAt
            }
          }
        }
      }
    }

    // Convert map to array and sort by latest purchase date
    const influencers = Array.from(influencerMap.values()).sort((a, b) => {
      return new Date(b.latestPurchase).getTime() - new Date(a.latestPurchase).getTime()
    })

    return NextResponse.json({
      success: true,
      userId,
      influencers,
      totalInfluencers: influencers.length,
      totalPurchases: purchaseIds.length
    })

  } catch (error) {
    console.error('Error fetching user influencers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user influencers' },
      { status: 500 }
    )
  }
}