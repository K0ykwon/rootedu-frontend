import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { getRedisClient } from '../../../../../lib/redis';

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

    // Check access permissions - allow admin or influencer accessing their own dashboard
    const isInfluencer = userType === 'influencer' && (influencerSlug === slug || userId === slug);
    if (userRole !== 'admin' && !isInfluencer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const redis = await getRedisClient();
    
    try {
      // Get all pending messages
      const pendingKey = `influencer:${slug}:pending_messages`;
      const messageIds = await redis.lRange(pendingKey, 0, -1);
      
      const messages = [];
      
      for (const messageId of messageIds) {
        // Get message details
        const messageKey = `influencer:${slug}:message:${messageId}`;
        const messageData = await redis.hGetAll(messageKey);
        
        if (messageData && Object.keys(messageData).length > 0) {
          // Get AI draft
          const aiDraftKey = `influencer:${slug}:message:${messageId}:draft`;
          const aiDraftData = await redis.get(aiDraftKey);
          
          let aiDraft = '';
          if (aiDraftData) {
            try {
              const parsed = JSON.parse(aiDraftData);
              aiDraft = parsed.content || '';
            } catch (e) {
              aiDraft = aiDraftData;
            }
          }
          
          messages.push({
            id: messageId,
            userName: messageData.userName || 'Unknown',
            userEmail: messageData.userEmail || '',
            content: messageData.content,
            timestamp: messageData.timestamp,
            aiDraft,
            status: messageData.status || 'pending'
          });
        }
      }
      
      // Sort by timestamp (newest first)
      messages.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeB - timeA;
      });

      return NextResponse.json({ 
        messages
      });
      
    } finally {
      // Don't close the shared Redis connection
    }
    
  } catch (error) {
    console.error('Error fetching pending messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}