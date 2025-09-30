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

    // Check access permissions - allow admin, influencer accessing their own dashboard, or user accessing their own analysis
    const isAdmin = userRole === 'admin';
    const isInfluencer = userType === 'influencer' && (influencerSlug === slug || userId === slug);
    const isUserAccessingOwnAnalysis = slug; // All logged-in users can access analysis results for any slug (will be filtered by userId later)

    if (!isAdmin && !isInfluencer && !isUserAccessingOwnAnalysis) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const redis = await getRedisClient();
    
    try {
      let keys: string[] = [];

      if (isAdmin || isInfluencer) {
        // Admin or influencer: get all analysis results for this influencer
        const pattern = `${slug}:analysis_data:*`;
        console.log(`🔍 Searching for analysis data with pattern: ${pattern}`);
        keys = await redis.keys(pattern);
        console.log(`📋 Found ${keys.length} analysis keys:`, keys);
      } else {
        // Regular user: get only their own analysis results across all influencers
        const userPattern = `user:${userId}:medsky:analysis:*`;
        console.log(`🔍 Searching for user-specific analysis data with pattern: ${userPattern}`);
        keys = await redis.keys(userPattern);
        console.log(`📋 Found ${keys.length} user analysis keys:`, keys);
      }

      const results = [];
      
      for (const key of keys) {
        try {
          const data = await redis.get(key);
          if (data) {
            const analysisData = JSON.parse(data);
            const sessionId = key.split(':').pop(); // Last part is always sessionId for both patterns
            
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
              summaryDraft: resultData.summaryDraft || null,
              // Ensure AI analysis fields are available at top level
              ai_keyword_analysis: resultData.ai_keyword_analysis || null,
              ai_section_scoring: resultData.ai_section_scoring || null,
              enhanced_academic_analysis: resultData.enhanced_academic_analysis || null,
              ai_major_recommendations: resultData.ai_major_recommendations || null,
              next_semester_plan: resultData.next_semester_plan || null,
              ai_analysis_timestamp: resultData.ai_analysis_timestamp || null,
              ai_model_versions: resultData.ai_model_versions || null
            };

            console.log(`🔍 Final analysis data structure for ${sessionId}:`, {
              hasGradeTrends: !!finalAnalysisData.gradeTrends,
              hasCompetencyScores: !!finalAnalysisData.competencyScores,
              hasMajorAlignment: !!finalAnalysisData.majorAlignment,
              hasKeywordMatrix: !!finalAnalysisData.keywordMatrix,
              hasSummaryDraft: !!finalAnalysisData.summaryDraft,
              hasTextSections: !!finalAnalysisData.textSections,
              hasExtractedData: !!finalAnalysisData.extractedData,
              hasValidationAnalysis: !!finalAnalysisData.validationAnalysis,
              // AI Analysis Fields
              hasAIKeywords: !!finalAnalysisData.ai_keyword_analysis,
              hasAIScoring: !!finalAnalysisData.ai_section_scoring,
              hasEnhancedAcademic: !!finalAnalysisData.enhanced_academic_analysis,
              hasAIMajorRecs: !!finalAnalysisData.ai_major_recommendations,
              hasStudyPlan: !!finalAnalysisData.next_semester_plan
            });

            const analysisUserId = analysisData.userInfo?.id || analysisData.userId || 'unknown';

            // Filter by userId for non-admin/non-influencer users
            if (!isAdmin && !isInfluencer && analysisUserId !== userId) {
              continue; // Skip this analysis result if it doesn't belong to the current user
            }

            // For regular users, only show approved analyses
            const approvalStatus = analysisData.approvalStatus || 'approved'; // Default to approved for old data
            if (!isAdmin && !isInfluencer && approvalStatus !== 'approved') {
              console.log(`⏭️  Skipping non-approved analysis ${sessionId} for regular user`);
              continue; // Skip pending or rejected analyses for regular users
            }

            results.push({
              sessionId,
              userId: analysisUserId,
              userName: analysisData.userInfo?.name || analysisData.userName || '익명 사용자',
              analysisData: finalAnalysisData,
              profileGenerated: !!profile,
              generatedProfile: profile ? JSON.parse(profile).profile : null,
              createdAt: analysisData.createdAt || analysisData.userInfo?.analyzedAt || new Date().toISOString(),
              completedAt: analysisData.completedAt || analysisData.createdAt || new Date().toISOString(),
              // Approval workflow fields
              approvalStatus: analysisData.approvalStatus || 'approved',
              approvedAt: analysisData.approvedAt || null,
              approvedBy: analysisData.approvedBy || null,
              influencerNotes: analysisData.influencerNotes || null
            });
          }
        } catch (parseError) {
          console.error(`❌ Error parsing analysis data for key ${key}:`, parseError);
        }
      }

      // Sort by completion date (newest first)
      results.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

      console.log(`✅ Successfully processed ${results.length} analysis results for ${slug}`);

      // For regular users, also return count of pending analyses
      let pendingCount = 0;
      if (!isAdmin && !isInfluencer) {
        const userPattern = `user:${userId}:medsky:analysis:*`;
        const allKeys = await redis.keys(userPattern);

        for (const key of allKeys) {
          try {
            const data = await redis.get(key);
            if (data) {
              const analysisData = JSON.parse(data);
              const status = analysisData.approvalStatus || 'approved';
              if (status === 'pending_review') {
                pendingCount++;
              }
            }
          } catch (err) {
            console.error(`Error checking pending status for key ${key}:`, err);
          }
        }

        console.log(`📊 User ${userId} has ${pendingCount} pending analyses`);
      }

      return NextResponse.json({
        results,
        total: results.length,
        pendingCount
      });
      
    } finally {
      // Don't close the shared Redis connection
    }
    
  } catch (error) {
    console.error('Error fetching analysis results:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}