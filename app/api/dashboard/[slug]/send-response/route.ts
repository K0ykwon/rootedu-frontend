import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { getRedisClient } from '../../../../../lib/redis';

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

    // Check access permissions - allow admin or influencer accessing their own dashboard
    const isInfluencer = userType === 'influencer' && (influencerSlug === slug || userId === slug);
    if (userRole !== 'admin' && !isInfluencer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { messageId, response, usedAIDraft, reviewRequestId, isReviewResponse } = body;

    if ((!messageId && !reviewRequestId) || !response) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const redis = await getRedisClient();
    
    try {
      if (isReviewResponse && reviewRequestId) {
        // Handle review request response
        const reviewRequestKey = `influencer:${slug}:review_request:${reviewRequestId}`;
        const reviewRequestData = await redis.hGetAll(reviewRequestKey);
        
        if (!reviewRequestData || Object.keys(reviewRequestData).length === 0) {
          return NextResponse.json({ error: 'Review request not found' }, { status: 404 });
        }

        // Get user info from review request
        const reviewUserId = reviewRequestData.userId;

        // Create influencer response message
        const responseMessageId = `review-response-${Date.now()}`;
        const responseMessage = {
          id: responseMessageId,
          role: 'influencer',
          content: response,
          timestamp: new Date().toISOString(),
          status: 'delivered',
          responseSource: 'influencer',
          reviewResponseFor: reviewRequestData.aiMessageId
        };

        // Add to user's conversation
        const conversationKey = `influencer:${slug}:user:${reviewUserId}:conversation`;
        await redis.lPush(conversationKey, JSON.stringify(responseMessage));
        await redis.expire(conversationKey, 30 * 24 * 60 * 60);

        // Update review request status
        await redis.hSet(reviewRequestKey, 'status', 'responded');
        await redis.hSet(reviewRequestKey, 'responseContent', response);
        await redis.hSet(reviewRequestKey, 'respondedAt', new Date().toISOString());

        // Remove from review requests queue
        const reviewRequestsKey = `influencer:${slug}:review_requests`;
        await redis.lRem(reviewRequestsKey, 0, reviewRequestId);

        // Track statistics
        const statsKey = `influencer:${slug}:message_stats`;
        await redis.hIncrBy(statsKey, 'total_review_responses', 1);
        await redis.expire(statsKey, 365 * 24 * 60 * 60);

        return NextResponse.json({ 
          success: true,
          message: 'Review response sent successfully'
        });
      } else {
        // Handle regular message response (old flow)
        const messageKey = `influencer:${slug}:message:${messageId}`;
        const messageData = await redis.hGetAll(messageKey);
        
        if (!messageData || Object.keys(messageData).length === 0) {
          return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        // Save the response
        const responseKey = `influencer:${slug}:message:${messageId}:response`;
        const responseData = {
          content: response,
          timestamp: new Date().toISOString(),
          respondedBy: userId,
          usedAIDraft: usedAIDraft ? 'true' : 'false'
        };
        
        await redis.hSet(responseKey, responseData);
        await redis.expire(responseKey, 30 * 24 * 60 * 60); // 30 days

        // Update original message status
        await redis.hSet(messageKey, 'status', 'responded');

        // Remove from pending queue
        const pendingKey = `influencer:${slug}:pending_messages`;
        await redis.lRem(pendingKey, 0, messageId);

        // Add to responded messages list
        const respondedKey = `influencer:${slug}:responded_messages`;
        await redis.lPush(respondedKey, messageId);
        await redis.expire(respondedKey, 30 * 24 * 60 * 60);

        // Track statistics
        const statsKey = `influencer:${slug}:message_stats`;
        await redis.hIncrBy(statsKey, 'total_responded', 1);
        if (usedAIDraft) {
          await redis.hIncrBy(statsKey, 'ai_draft_used', 1);
        }
        await redis.expire(statsKey, 365 * 24 * 60 * 60);

        return NextResponse.json({ 
          success: true,
          message: 'Response sent successfully'
        });
      }
      
    } finally {
      // Don't close the shared Redis connection
    }
    
  } catch (error) {
    console.error('Error sending response:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}