import { createClient } from 'redis'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const redis = createClient({
  url: process.env.DATABASE_URL || process.env.REDIS_URL
})

interface UserPurchase {
  productId: string
  influencerSlug: string
  purchasedAt: string
  status: 'active' | 'expired' | 'cancelled'
  expiresAt?: string
}

async function updateUserPurchaseStructure() {
  try {
    await redis.connect()
    console.log('Connected to Redis')

    // Example: Add purchase tracking for existing users
    // This would typically be called when a user purchases a product
    
    // Example user purchase data
    const examplePurchases = [
      {
        userId: 'test-user-1',
        purchase: {
          productId: 'p1',
          influencerSlug: 'yaktoon',
          purchasedAt: new Date().toISOString(),
          status: 'active' as const,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
        }
      }
    ]

    for (const { userId, purchase } of examplePurchases) {
      // Add purchase to user's purchase list
      const purchaseKey = `user:${userId}:purchases`
      await redis.sAdd(purchaseKey, purchase.productId)

      // Store purchase details
      const purchaseDetailsKey = `user:${userId}:purchase:${purchase.productId}`
      await redis.hSet(purchaseDetailsKey, {
        productId: purchase.productId,
        influencerSlug: purchase.influencerSlug,
        purchasedAt: purchase.purchasedAt,
        status: purchase.status,
        expiresAt: purchase.expiresAt || ''
      })

      // Add user to product's customer list
      const productCustomersKey = `product:${purchase.productId}:customers`
      await redis.sAdd(productCustomersKey, userId)

      // Add user to influencer's customer list for this product
      const influencerProductCustomersKey = `influencer:${purchase.influencerSlug}:product:${purchase.productId}:customers`
      await redis.sAdd(influencerProductCustomersKey, userId)

      console.log(`Added purchase tracking for user ${userId} - product ${purchase.productId}`)
    }

    // Create index for quick lookup of all customers by influencer
    const influencerCustomersKey = 'influencer:yaktoon:all-customers'
    for (const { userId } of examplePurchases) {
      await redis.sAdd(influencerCustomersKey, userId)
    }

    console.log('User purchase structure update completed')
  } catch (error) {
    console.error('Error updating user purchase structure:', error)
  } finally {
    await redis.disconnect()
  }
}

// Helper function to add a purchase (to be used when user buys a product)
export async function addUserPurchase(
  userId: string,
  productId: string,
  influencerSlug: string
) {
  if (!redis.isOpen) {
    await redis.connect()
  }

  const purchase = {
    productId,
    influencerSlug,
    purchasedAt: new Date().toISOString(),
    status: 'active' as const,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
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

  return purchase
}

// Helper function to get user's purchases
export async function getUserPurchases(userId: string) {
  if (!redis.isOpen) {
    await redis.connect()
  }

  const purchaseIds = await redis.sMembers(`user:${userId}:purchases`)
  const purchases = []

  for (const productId of purchaseIds) {
    const purchaseDetails = await redis.hGetAll(`user:${userId}:purchase:${productId}`)
    if (purchaseDetails && Object.keys(purchaseDetails).length > 0) {
      purchases.push(purchaseDetails)
    }
  }

  return purchases
}

// Helper function to get all customers for a product
export async function getProductCustomers(influencerSlug: string, productId: string) {
  if (!redis.isOpen) {
    await redis.connect()
  }

  const customerIds = await redis.sMembers(`influencer:${influencerSlug}:product:${productId}:customers`)
  const customers = []

  for (const customerId of customerIds) {
    // Get user data
    const userData = await redis.hGetAll(`user:${customerId}`)
    
    // Get purchase details
    const purchaseDetails = await redis.hGetAll(`user:${customerId}:purchase:${productId}`)
    
    // Get analysis results for this user
    const analysisKey = `yaktoon:analysis_data:${customerId}:*`
    const analysisKeys = await redis.keys(analysisKey)
    const analysisResults = []
    
    for (const key of analysisKeys) {
      const analysisData = await redis.get(key)
      if (analysisData) {
        try {
          analysisResults.push(JSON.parse(analysisData))
        } catch (e) {
          console.error('Error parsing analysis data:', e)
        }
      }
    }

    customers.push({
      userId: customerId,
      userData,
      purchaseDetails,
      analysisResults
    })
  }

  return customers
}

// Run the update if this script is executed directly
if (require.main === module) {
  updateUserPurchaseStructure()
}