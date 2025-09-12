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

    // Check access permissions
    // Check access permissions - allow admin or influencer accessing their own dashboard
    const isInfluencer = userType === 'influencer' && (influencerSlug === slug || userId === slug);
    if (userRole !== 'admin' && !isInfluencer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const redis = await getRedisClient();
    
    try {
      // Get all analysis results for this influencer
      const pattern = `${slug}:analysis_data:*`;
      const keys = await redis.keys(pattern);
      
      const results = [];
      
      for (const key of keys) {
        try {
          const data = await redis.get(key);
          if (data) {
            const analysisData = JSON.parse(data);
            const sessionId = key.split(':').pop();
            
            // Check if profile was generated for this analysis
            const profileKey = `${slug}:profile:${sessionId}`;
            const profile = await redis.get(profileKey);
            
            results.push({
              sessionId,
              userId: analysisData.userId || analysisData.userInfo?.id || 'unknown',
              userName: analysisData.userName || analysisData.userInfo?.name || '익명 사용자',
              analysisData: analysisData.analysis || analysisData.result || analysisData,
              profileGenerated: !!profile,
              generatedProfile: profile ? JSON.parse(profile).profile : null,
              createdAt: analysisData.createdAt || new Date().toISOString(),
              completedAt: analysisData.completedAt || analysisData.createdAt || new Date().toISOString()
            });
          }
        } catch (parseError) {
          console.error('Error parsing analysis data:', parseError);
        }
      }

      // Sort by completion date (newest first)
      results.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

      return NextResponse.json({ 
        results,
        total: results.length
      });
      
    } finally {
      // Don't close the shared Redis connection
    }
    
  } catch (error) {
    console.error('Error fetching analysis results:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}