import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { createClient } from 'redis'

const redis = createClient({
  url: process.env.DATABASE_URL || process.env.REDIS_URL
})

interface StudentInfo {
  userId: string
  name: string
  email: string
  purchaseDate: string
  purchaseStatus: string
  analysisCount: number
  lastAnalysis?: any
  profileGenerated: boolean
  generatedProfile?: string
}

interface ProductWithStudents {
  productId: string
  productName: string
  productDescription: string
  price: number
  studentCount: number
  students: StudentInfo[]
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await context.params

    // Check if user has access to this dashboard
    const userRole = (session.user as any)?.role
    const userType = (session.user as any)?.userType
    const userId = (session.user as any)?.userId
    const userEmail = (session.user as any)?.email
    const influencerSlug = (session.user as any)?.influencerSlug

    // Special check for yaktoon dashboard
    if (slug === 'yaktoon') {
      const isYaktoon = userId === 'yaktoon' || userEmail === 'yaktoon@rootedu.com' || 
                        userRole === 'admin' || influencerSlug === 'yaktoon'
      if (!isYaktoon) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    } else {
      // Allow access if admin or if influencer accessing their own dashboard
      const isInfluencer = userType === 'influencer' && (influencerSlug === slug || userId === slug)
      if (userRole !== 'admin' && !isInfluencer) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    if (!redis.isOpen) {
      await redis.connect()
    }

    // Get all products for this influencer
    const productsKey = `influencer:${slug}:products`
    const productIds = await redis.sMembers(productsKey)
    
    const productsByStudents: ProductWithStudents[] = []

    for (const productId of productIds) {
      // Get product details
      const productKey = `product:${productId}`
      const productData = await redis.hGetAll(productKey)
      
      if (!productData || Object.keys(productData).length === 0) {
        continue
      }

      // Get all customers for this product
      const customersKey = `influencer:${slug}:product:${productId}:customers`
      const customerIds = await redis.sMembers(customersKey)
      
      const students: StudentInfo[] = []

      for (const customerId of customerIds) {
        // Get user data
        const userData = await redis.hGetAll(`user:${customerId}`)
        
        // Get purchase details
        const purchaseDetails = await redis.hGetAll(`user:${customerId}:purchase:${productId}`)
        
        // Get all analysis sessions for this influencer and filter by user
        const analysisKeys = await redis.keys(`${slug}:analysis_data:*`)
        const analysisResults = []
        
        for (const key of analysisKeys) {
          const analysisData = await redis.get(key)
          if (analysisData) {
            try {
              const parsed = JSON.parse(analysisData)
              // Check if this analysis belongs to the current customer
              if (parsed.userId === customerId || 
                  parsed.userInfo?.id === customerId ||
                  parsed.userName === userData.name ||
                  parsed.userInfo?.name === userData.name) {
                // Add sessionId from the key
                const sessionId = key.split(':').pop()
                parsed.sessionId = sessionId
                analysisResults.push(parsed)
              }
            } catch (e) {
              console.error('Error parsing analysis data:', e)
            }
          }
        }

        // Sort analysis results by date
        analysisResults.sort((a, b) => {
          const dateA = new Date(a.completedAt || a.createdAt || 0).getTime()
          const dateB = new Date(b.completedAt || b.createdAt || 0).getTime()
          return dateB - dateA
        })

        // Get generated profile if exists
        let profileGenerated = false
        let generatedProfile = undefined
        
        if (analysisResults.length > 0) {
          const latestAnalysis = analysisResults[0]
          
          // Check if profile exists in Redis
          if (latestAnalysis.sessionId) {
            const profileKey = `${slug}:profile:${latestAnalysis.sessionId}`
            const profile = await redis.get(profileKey)
            if (profile) {
              profileGenerated = true
              try {
                const profileData = JSON.parse(profile)
                generatedProfile = profileData.profile || profileData
              } catch (e) {
                generatedProfile = profile
              }
            }
          }
          
          // Fallback to checking the analysis data itself
          if (!profileGenerated && latestAnalysis.profileGenerated) {
            profileGenerated = true
            generatedProfile = latestAnalysis.generatedProfile
          }
        }

        students.push({
          userId: customerId,
          name: userData.name || userData.userName || '이름 없음',
          email: userData.email || '',
          purchaseDate: purchaseDetails.purchasedAt || new Date().toISOString(),
          purchaseStatus: purchaseDetails.status || 'active',
          analysisCount: analysisResults.length,
          lastAnalysis: analysisResults[0] || null,
          profileGenerated,
          generatedProfile
        })
      }

      // Sort students by purchase date (newest first)
      students.sort((a, b) => {
        const dateA = new Date(a.purchaseDate).getTime()
        const dateB = new Date(b.purchaseDate).getTime()
        return dateB - dateA
      })

      productsByStudents.push({
        productId,
        productName: productData.title || '제품명 없음',
        productDescription: productData.description || '',
        price: parseInt(productData.price) || 0,
        studentCount: students.length,
        students
      })
    }

    // Sort products by student count (most students first)
    productsByStudents.sort((a, b) => b.studentCount - a.studentCount)

    return NextResponse.json({
      success: true,
      products: productsByStudents,
      totalStudents: productsByStudents.reduce((sum, p) => sum + p.studentCount, 0),
      totalProducts: productsByStudents.length
    })
  } catch (error) {
    console.error('Error fetching students by product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch students by product' },
      { status: 500 }
    )
  } finally {
    if (redis.isOpen) {
      await redis.disconnect()
    }
  }
}