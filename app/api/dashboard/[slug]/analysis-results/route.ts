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
      console.log(`🔍 Searching for analysis data with pattern: ${pattern}`);

      const keys = await redis.keys(pattern);
      console.log(`📋 Found ${keys.length} analysis keys:`, keys);

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
            
            // Log data structure for debugging
            console.log(`📊 Processing analysis data for session ${sessionId}:`, {
              hasUserInfo: !!analysisData.userInfo,
              hasResult: !!analysisData.result,
              userInfoKeys: analysisData.userInfo ? Object.keys(analysisData.userInfo) : [],
              resultKeys: analysisData.result ? Object.keys(analysisData.result) : [],
              topLevelKeys: Object.keys(analysisData)
            });

            // Fix data structure - ensure transformer data is at the correct level
            const resultData = analysisData.result || analysisData.analysis || analysisData;

            // If data comes from analysisData.result, it's properly structured
            // If it comes from direct analysisData, it might be missing transformer fields
            const finalAnalysisData = {
              ...resultData,
              // Ensure transformer fields are available at top level
              gradeTrends: resultData.gradeTrends || null,
              competencyScores: resultData.competencyScores || null,
              majorAlignment: resultData.majorAlignment || null,
              keywordMatrix: resultData.keywordMatrix || null,
              summaryDraft: resultData.summaryDraft || null
            };

            console.log(`🔍 Final analysis data structure for ${sessionId}:`, {
              hasGradeTrends: !!finalAnalysisData.gradeTrends,
              hasCompetencyScores: !!finalAnalysisData.competencyScores,
              hasMajorAlignment: !!finalAnalysisData.majorAlignment,
              hasKeywordMatrix: !!finalAnalysisData.keywordMatrix,
              hasSummaryDraft: !!finalAnalysisData.summaryDraft,
              hasTextSections: !!finalAnalysisData.textSections,
              hasExtractedData: !!finalAnalysisData.extractedData,
              hasValidationAnalysis: !!finalAnalysisData.validationAnalysis
            });

            results.push({
              sessionId,
              userId: analysisData.userInfo?.id || analysisData.userId || 'unknown',
              userName: analysisData.userInfo?.name || analysisData.userName || '익명 사용자',
              analysisData: finalAnalysisData,
              profileGenerated: !!profile,
              generatedProfile: profile ? JSON.parse(profile).profile : null,
              createdAt: analysisData.createdAt || analysisData.userInfo?.analyzedAt || new Date().toISOString(),
              completedAt: analysisData.completedAt || analysisData.createdAt || new Date().toISOString()
            });
          }
        } catch (parseError) {
          console.error(`❌ Error parsing analysis data for key ${key}:`, parseError);
        }
      }

      // Sort by completion date (newest first)
      results.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

      console.log(`✅ Successfully processed ${results.length} analysis results for ${slug}`);

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