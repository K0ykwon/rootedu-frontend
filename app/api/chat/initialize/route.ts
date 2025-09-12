import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { createClient } from 'redis'
import { v4 as uuidv4 } from 'uuid'

const redis = createClient({
  url: process.env.DATABASE_URL || process.env.REDIS_URL
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { analysisSessionId, influencerSlug } = await request.json()

    if (!analysisSessionId || !influencerSlug) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Only allow yaktoon or admin to create chat sessions
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

    // Check if chat session already exists
    const chatKey = `chat:${influencerSlug}:${analysisSessionId}`
    const existingChat = await redis.hGetAll(chatKey)

    if (existingChat && existingChat.id) {
      // Return existing chat session with messages
      const messagesKey = `chat:messages:${existingChat.id}`
      const messages = await redis.lRange(messagesKey, 0, -1)
      const parsedMessages = messages.map(msg => JSON.parse(msg))

      return NextResponse.json({
        chatSessionId: existingChat.id,
        messages: parsedMessages,
        createdAt: existingChat.createdAt
      })
    }

    // Create new chat session
    const chatSessionId = uuidv4()
    const chatData = {
      id: chatSessionId,
      analysisSessionId,
      influencerSlug,
      userId: session.user?.id || userId,
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString()
    }

    await redis.hSet(chatKey, chatData)
    
    // Add to chat sessions list for the influencer
    await redis.sAdd(`chats:${influencerSlug}`, chatSessionId)

    // Store reverse lookup
    await redis.set(`chat:lookup:${chatSessionId}`, chatKey)

    return NextResponse.json({
      chatSessionId,
      messages: [],
      createdAt: chatData.createdAt
    })
  } catch (error) {
    console.error('Error initializing chat:', error)
    return NextResponse.json(
      { error: 'Failed to initialize chat' },
      { status: 500 }
    )
  } finally {
    if (redis.isOpen) {
      await redis.disconnect()
    }
  }
}