import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../../lib/auth';
import { getRedisClient } from '../../../../../../lib/redis';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    const userType = (session.user as any)?.userType;
    const userId = (session.user as any)?.userId;
    const influencerSlug = (session.user as any)?.influencerSlug;
    const params = await context.params;
    const slug = params.slug;

    // Check access permissions
    // Check access permissions - allow admin or influencer accessing their own dashboard
    const isInfluencer = userType === 'influencer' && (influencerSlug === slug || userId === slug);
    if (userRole !== 'admin' && !isInfluencer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      sessionId, 
      chatId, 
      messages, 
      studentName,
      title 
    } = body;

    if (!sessionId || !chatId || !messages) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const redis = await getRedisClient();
    
    try {
      // Save the chat messages
      const chatKey = `${slug}:student_chat:${sessionId}:${chatId}`;
      await redis.set(chatKey, JSON.stringify({
        messages,
        studentName,
        sessionId,
        chatId,
        lastUpdated: new Date().toISOString()
      }));
      
      // Set expiration to 1 year
      await redis.expire(chatKey, 365 * 24 * 60 * 60);

      // Save chat metadata
      const metadataKey = `${slug}:chat_metadata:${chatId}`;
      const chatTitle = title || messages[0]?.content?.substring(0, 50) || 'New Chat';
      
      await redis.set(metadataKey, JSON.stringify({
        chatId,
        sessionId,
        studentName,
        title: chatTitle,
        createdAt: new Date().toISOString(),
        lastMessage: messages[messages.length - 1]?.content || '',
        messageCount: messages.length
      }));
      
      await redis.expire(metadataKey, 365 * 24 * 60 * 60);

      // Add chat ID to the student's chat list
      const chatListKey = `${slug}:student_chats:${sessionId}`;
      await redis.sAdd(chatListKey, chatId);
      await redis.expire(chatListKey, 365 * 24 * 60 * 60);

      return NextResponse.json({ 
        success: true,
        chatId,
        message: 'Chat saved successfully'
      });
      
    } finally {
      // Don't close the shared Redis connection
    }
    
  } catch (error) {
    console.error('Error saving chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}