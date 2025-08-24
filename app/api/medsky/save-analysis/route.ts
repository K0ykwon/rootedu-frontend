import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { getRedisClient } from '../../../../lib/redis';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { influencerSlug, sessionId, analysisData } = body;

    if (!influencerSlug || !sessionId || !analysisData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify user has access (must be the influencer or admin)
    const userRole = (session.user as any)?.role;
    const userId = (session.user as any)?.userId;
    
    if (userRole !== 'admin' && (userRole !== 'influencer' || userId !== influencerSlug)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const redis = await getRedisClient();
    
    try {
      // Save analysis data with influencer-specific key pattern
      const key = `${influencerSlug}:analysis_data:${sessionId}`;
      await redis.set(key, JSON.stringify(analysisData));

      // Set expiration to 1 year
      await redis.expire(key, 365 * 24 * 60 * 60);

      return NextResponse.json({ 
        success: true,
        message: 'Analysis saved successfully',
        key 
      });
      
    } finally {
      // Don't close the shared Redis connection
    }
    
  } catch (error) {
    console.error('Error saving analysis:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}