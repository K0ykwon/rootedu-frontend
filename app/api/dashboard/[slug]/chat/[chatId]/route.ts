import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../../lib/auth';
import { getRedisClient } from '../../../../../../lib/redis';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string, chatId: string }> }
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
    const { slug, chatId } = params;

    // Check access permissions
    // Check access permissions - allow admin or influencer accessing their own dashboard
    const isInfluencer = userType === 'influencer' && (influencerSlug === slug || userId === slug);
    if (userRole !== 'admin' && !isInfluencer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const redis = await getRedisClient();
    
    try {
      // Get the chat data
      const chatKey = `${slug}:student_chat:${sessionId}:${chatId}`;
      const chatData = await redis.get(chatKey);
      
      if (!chatData) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
      }

      const parsedChat = JSON.parse(chatData);

      // Also get metadata
      const metadataKey = `${slug}:chat_metadata:${chatId}`;
      const metadata = await redis.get(metadataKey);
      
      return NextResponse.json({ 
        ...parsedChat,
        metadata: metadata ? JSON.parse(metadata) : null
      });
      
    } finally {
      // Don't close the shared Redis connection
    }
    
  } catch (error) {
    console.error('Error getting chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}