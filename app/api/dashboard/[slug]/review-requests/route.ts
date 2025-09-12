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
      // Get all review requests
      const reviewRequestsKey = `influencer:${slug}:review_requests`;
      const reviewRequestIds = await redis.lRange(reviewRequestsKey, 0, -1);
      
      const reviewRequests = [];
      
      for (const reviewRequestId of reviewRequestIds) {
        // Get review request details
        const reviewRequestKey = `influencer:${slug}:review_request:${reviewRequestId}`;
        const reviewRequestData = await redis.hGetAll(reviewRequestKey);
        
        if (reviewRequestData && Object.keys(reviewRequestData).length > 0) {
          reviewRequests.push({
            id: reviewRequestId,
            userName: reviewRequestData.userName || 'Unknown',
            userEmail: reviewRequestData.userEmail || '',
            originalMessage: reviewRequestData.originalMessage,
            aiResponse: reviewRequestData.aiResponse,
            reviewReason: reviewRequestData.reviewReason || '',
            timestamp: reviewRequestData.timestamp,
            status: reviewRequestData.status || 'pending'
          });
        }
      }
      
      // Sort by timestamp (newest first)
      reviewRequests.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeB - timeA;
      });

      return NextResponse.json({ 
        reviewRequests
      });
      
    } finally {
      // Don't close the shared Redis connection
    }
    
  } catch (error) {
    console.error('Error fetching review requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}