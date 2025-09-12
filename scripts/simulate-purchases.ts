import { createClient } from 'redis'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const redis = createClient({
  url: process.env.DATABASE_URL || process.env.REDIS_URL
})

async function simulatePurchases() {
  try {
    await redis.connect()
    console.log('Connected to Redis')

    // Simulate purchases for testing
    const testPurchases = [
      {
        userId: 'student1',
        userName: '김민준',
        userEmail: 'minjun.kim@example.com',
        productId: 'p1',
        influencerSlug: 'yaktoon'
      },
      {
        userId: 'student2',
        userName: '이서윤',
        userEmail: 'seoyoon.lee@example.com',
        productId: 'p1',
        influencerSlug: 'yaktoon'
      },
      {
        userId: 'student3',
        userName: '박지훈',
        userEmail: 'jihoon.park@example.com',
        productId: 'p1',
        influencerSlug: 'yaktoon'
      }
    ]

    for (const purchaseData of testPurchases) {
      const { userId, userName, userEmail, productId, influencerSlug } = purchaseData

      // Store user info
      const userKey = `user:${userId}`
      await redis.hSet(userKey, {
        userId,
        name: userName,
        userName: userName,
        email: userEmail,
        createdAt: new Date().toISOString()
      })

      // Add purchase
      const purchase = {
        productId,
        influencerSlug,
        purchasedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Random date within last 30 days
        status: 'active',
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

      console.log(`Added purchase for ${userName} (${userId})`)

      // Simulate some analysis data for these users
      const analysisSessionId = `session-${userId}-${Date.now()}`
      const analysisData = {
        sessionId: analysisSessionId,
        userId,
        userName,
        userInfo: {
          id: userId,
          name: userName,
          email: userEmail
        },
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        analysisData: {
          creativeActivities: {
            창의적체험활동상황: [
              {
                학년: '1',
                영역: '자율활동',
                특기사항: `${userName} 학생은 학급 회장으로서 리더십을 발휘했습니다.`
              },
              {
                학년: '2',
                영역: '동아리활동',
                특기사항: `과학 동아리에서 활발한 연구 활동을 수행했습니다.`
              }
            ]
          },
          academicDevelopments: {
            교과학습발달상황: [
              {
                학년: '1',
                과목: '수학',
                성취도: 'A',
                세부능력및특기사항: '수학적 사고력이 뛰어나며 문제 해결 능력이 우수합니다.'
              },
              {
                학년: '2',
                과목: '영어',
                성취도: 'A',
                세부능력및특기사항: '영어 의사소통 능력이 탁월하며 발표력이 좋습니다.'
              }
            ]
          },
          detailedAbilities: {
            세부특기사항: [
              {
                학년: '1',
                학기: '1',
                과목: '국어',
                내용: '문학 작품 분석 능력이 뛰어나고 창의적인 글쓰기를 합니다.'
              }
            ]
          }
        }
      }

      // Store analysis data
      const redisKey = `yaktoon:analysis_data:${userId}:${analysisSessionId}`
      await redis.set(redisKey, JSON.stringify(analysisData))
      
      // Add to influencer's analysis list
      await redis.sAdd(`yaktoon:analysis_sessions`, analysisSessionId)
      
      // Link analysis with product
      await redis.sAdd(`product:${productId}:analyses`, analysisSessionId)
      await redis.hSet(`analysis:${analysisSessionId}:metadata`, {
        productId,
        userId,
        createdAt: new Date().toISOString()
      })

      console.log(`Added sample analysis for ${userName}`)
    }

    console.log('\n✅ Purchase simulation completed!')
    console.log('You can now view these students in the yaktoon dashboard.')

  } catch (error) {
    console.error('Error simulating purchases:', error)
  } finally {
    await redis.disconnect()
  }
}

// Run the simulation
simulatePurchases()