import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../../lib/auth';
import { getRedisClient } from '../../../../../../lib/redis';

export async function GET(
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

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const redis = await getRedisClient();
    
    try {
      // Get all chat IDs for this student
      const chatListKey = `${slug}:student_chats:${sessionId}`;
      const chatIds = await redis.sMembers(chatListKey);
      
      const chats = [];
      
      // Get metadata for each chat
      for (const chatId of chatIds) {
        const metadataKey = `${slug}:chat_metadata:${chatId}`;
        const metadata = await redis.get(metadataKey);
        
        if (metadata) {
          try {
            const parsedMetadata = JSON.parse(metadata);
            chats.push(parsedMetadata);
          } catch (e) {
            console.error('Error parsing chat metadata:', e);
          }
        }
      }
      
      // Sort chats by creation date (newest first)
      chats.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      return NextResponse.json({ 
        chats,
        total: chats.length
      });
      
    } finally {
      // Don't close the shared Redis connection
    }
    
  } catch (error) {
    console.error('Error listing chats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}