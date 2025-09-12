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

    const userId = (session.user as any)?.userId || (session.user as any)?.id;
    const params = await context.params;
    const slug = params.slug;

    if (!userId) {
      return NextResponse.json({ error: 'User identification failed' }, { status: 400 });
    }

    const redis = await getRedisClient();
    
    try {
      // Get conversation messages (new format)
      const conversationKey = `influencer:${slug}:user:${userId}:conversation`;
      const conversationMessages = await redis.lRange(conversationKey, 0, -1);
      
      const messages = [];
      
      // Parse conversation messages
      for (const msgStr of conversationMessages.reverse()) { // Reverse to get chronological order
        try {
          const message = JSON.parse(msgStr);
          messages.push({
            id: message.id,
            role: message.role,
            content: message.content,
            timestamp: message.timestamp,
            status: message.status || 'delivered',
            responseSource: message.responseSource,
            canRequestReview: message.canRequestReview,
            reviewRequested: message.reviewRequested
          });
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      }
      
      // Also check for old format messages for backward compatibility
      const userMessagesKey = `influencer:${slug}:user:${userId}:messages`;
      const messageIds = await redis.sMembers(userMessagesKey);
      
      for (const messageId of messageIds) {
        // Get customer message
        const messageKey = `influencer:${slug}:message:${messageId}`;
        const messageData = await redis.hGetAll(messageKey);
        
        if (messageData && Object.keys(messageData).length > 0) {
          // Only add if not already in conversation format
          const existsInConversation = messages.some(m => m.id === messageId);
          if (!existsInConversation) {
            messages.push({
              id: messageId,
              role: messageData.role || 'customer',
              content: messageData.content,
              timestamp: messageData.timestamp,
              status: messageData.status || 'pending'
            });
          }
          
          // Check if there's a response
          const responseKey = `influencer:${slug}:message:${messageId}:response`;
          const responseData = await redis.hGetAll(responseKey);
          
          if (responseData && Object.keys(responseData).length > 0) {
            const responseId = `${messageId}-response`;
            const existsInConversation = messages.some(m => m.id === responseId);
            if (!existsInConversation) {
              messages.push({
                id: responseId,
                role: 'influencer',
                content: responseData.content,
                timestamp: responseData.timestamp,
                status: 'sent',
                responseSource: 'influencer'
              });
            }
          }
        }
      }
      
      // Sort messages by timestamp
      messages.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeA - timeB;
      });

      return NextResponse.json({ 
        messages
      });
      
    } finally {
      // Don't close the shared Redis connection
    }
    
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}