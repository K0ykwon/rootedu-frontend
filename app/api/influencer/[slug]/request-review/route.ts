import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { getRedisClient } from '../../../../../lib/redis';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { aiMessageId, originalMessage, aiResponse, reviewReason } = body;
    
    const userId = (session.user as any)?.userId || (session.user as any)?.id;
    const userEmail = session.user?.email;
    const userName = (session.user as any)?.name || session.user?.name || 'Customer';
    
    const params = await context.params;
    const slug = params.slug;

    if (!aiMessageId || !originalMessage || !aiResponse) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const redis = await getRedisClient();
    
    try {
      // Generate review request ID
      const reviewRequestId = uuidv4();
      const timestamp = new Date().toISOString();
      
      // Create the review request
      const reviewRequest = {
        id: reviewRequestId,
        userId,
        userEmail,
        userName,
        originalMessage,
        aiResponse,
        aiMessageId,
        reviewReason: reviewReason || '',
        timestamp,
        status: 'pending'
      };

      // Save review request
      const reviewRequestKey = `influencer:${slug}:review_request:${reviewRequestId}`;
      await redis.hSet(reviewRequestKey, {
        id: reviewRequest.id,
        userId: reviewRequest.userId || '',
        userEmail: reviewRequest.userEmail || '',
        userName: reviewRequest.userName || '',
        originalMessage: reviewRequest.originalMessage,
        aiResponse: reviewRequest.aiResponse,
        aiMessageId: reviewRequest.aiMessageId,
        reviewReason: reviewRequest.reviewReason || '',
        timestamp: reviewRequest.timestamp,
        status: reviewRequest.status
      });
      await redis.expire(reviewRequestKey, 30 * 24 * 60 * 60); // 30 days

      // Add to influencer's review requests queue
      const reviewRequestsKey = `influencer:${slug}:review_requests`;
      await redis.lPush(reviewRequestsKey, reviewRequestId);
      await redis.expire(reviewRequestsKey, 30 * 24 * 60 * 60);

      // Update the AI message to show review has been requested
      const conversationKey = `influencer:${slug}:user:${userId}:conversation`;
      const conversationMessages = await redis.lRange(conversationKey, 0, -1);
      
      // Find and update the AI message
      const updatedMessages = [];
      for (const msgStr of conversationMessages) {
        const msg = JSON.parse(msgStr);
        if (msg.id === aiMessageId) {
          msg.reviewRequested = true;
          msg.reviewRequestId = reviewRequestId;
        }
        updatedMessages.push(JSON.stringify(msg));
      }
      
      // Replace conversation with updated messages
      await redis.del(conversationKey);
      if (updatedMessages.length > 0) {
        for (const msg of updatedMessages) {
          await redis.lPush(conversationKey, msg);
        }
        await redis.expire(conversationKey, 30 * 24 * 60 * 60);
      }

      // Create notification for influencer
      const notificationKey = `influencer:${slug}:notifications`;
      await redis.lPush(notificationKey, JSON.stringify({
        type: 'review_request',
        reviewRequestId,
        userName,
        originalMessage: originalMessage.substring(0, 100),
        timestamp
      }));
      await redis.expire(notificationKey, 7 * 24 * 60 * 60);

      return NextResponse.json({ 
        success: true,
        reviewRequestId,
        message: 'Review request sent successfully'
      });
      
    } finally {
      // Don't close the shared Redis connection
    }
    
  } catch (error) {
    console.error('Error creating review request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}