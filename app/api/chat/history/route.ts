import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { createClient } from 'redis'

const redis = createClient({
  url: process.env.DATABASE_URL || process.env.REDIS_URL
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const influencerSlug = searchParams.get('influencerSlug')
    const analysisSessionId = searchParams.get('analysisSessionId')

    if (!influencerSlug) {
      return NextResponse.json(
        { error: 'Missing influencer slug' },
        { status: 400 }
      )
    }

    // Only allow yaktoon or admin to view chat history
    const userRole = (session.user as any)?.role
    const userId = (session.user as any)?.userId
    const userEmail = (session.user as any)?.email
    
    if (influencerSlug === 'yaktoon') {
      const isYaktoon = userId === 'yaktoon' || userEmail === 'yaktoon@rootedu.com' || userRole === 'admin'
      if (!isYaktoon) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    if (!redis.isOpen) {
      await redis.connect()
    }

    if (analysisSessionId) {
      // Get specific chat session
      const chatKey = `chat:${influencerSlug}:${analysisSessionId}`
      const chatData = await redis.hGetAll(chatKey)
      
      if (chatData && chatData.id) {
        const messagesKey = `chat:messages:${chatData.id}`
        const messages = await redis.lRange(messagesKey, 0, -1)
        const parsedMessages = messages.map(msg => JSON.parse(msg))

        return NextResponse.json({
          chatSession: {
            ...chatData,
            messages: parsedMessages
          }
        })
      }
      
      return NextResponse.json({
        chatSession: null
      })
    } else {
      // Get all chat sessions for the influencer
      const chatSessionIds = await redis.sMembers(`chats:${influencerSlug}`)
      const chatSessions = []

      for (const chatSessionId of chatSessionIds) {
        const lookupKey = await redis.get(`chat:lookup:${chatSessionId}`)
        if (lookupKey) {
          const chatData = await redis.hGetAll(lookupKey)
          const messagesKey = `chat:messages:${chatSessionId}`
          const messageCount = await redis.lLen(messagesKey)
          
          // Get last message
          let lastMessage = null
          if (messageCount > 0) {
            const lastMsgStr = await redis.lIndex(messagesKey, -1)
            if (lastMsgStr) {
              lastMessage = JSON.parse(lastMsgStr)
            }
          }

          chatSessions.push({
            ...chatData,
            messageCount,
            lastMessage
          })
        }
      }

      // Sort by last message time
      chatSessions.sort((a, b) => {
        const timeA = new Date(a.lastMessage?.createdAt || (a as any).createdAt || Date.now()).getTime()
        const timeB = new Date(b.lastMessage?.createdAt || (b as any).createdAt || Date.now()).getTime()
        return timeB - timeA
      })

      return NextResponse.json({
        chatSessions
      })
    }
  } catch (error) {
    console.error('Error fetching chat history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    )
  } finally {
    if (redis.isOpen) {
      await redis.disconnect()
    }
  }
}