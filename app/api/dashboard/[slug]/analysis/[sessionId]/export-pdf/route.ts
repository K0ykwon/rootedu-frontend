/**
 * PDF Export API Endpoint
 *
 * Generates and downloads PDF reports for Medsky analysis results.
 * Handles authentication, data fetching, and PDF generation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateAnalysisPDF } from '@/lib/medsky/pdfGenerator';
import { generatePDFTemplate } from '@/lib/medsky/pdfTemplate';
import redis from '@/lib/redis';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes timeout for PDF generation (includes cold starts)

/**
 * GET /api/dashboard/[slug]/analysis/[sessionId]/export-pdf
 *
 * Generates and streams PDF report for analysis results
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; sessionId: string }> }
) {
  try {
    // Extract params
    const { slug, sessionId } = await params;

    console.log(`📥 PDF export request for session: ${sessionId}, influencer: ${slug}`);

    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // Fetch analysis result from Redis using correct key pattern
    const analysisKey = `${slug}:analysis_data:${sessionId}`;
    console.log(`🔍 Looking up Redis key: ${analysisKey}`);

    const analysisResult = await redis.get(analysisKey);

    if (!analysisResult) {
      console.error(`❌ Analysis not found for key: ${analysisKey}`);
      return NextResponse.json(
        { error: '분석 결과를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // Parse analysis data
    const parsedResult = typeof analysisResult === 'string'
      ? JSON.parse(analysisResult)
      : analysisResult;

    // Verify user has access to this analysis
    const userRole = (session.user as any)?.role;
    const userType = (session.user as any)?.userType;
    const userId = (session.user as any)?.userId;
    const influencerSlug = (session.user as any)?.influencerSlug;

    const isAdmin = userRole === 'admin';
    const isInfluencer = userType === 'influencer' && (influencerSlug === slug || userId === slug);

    // Get analysis owner
    const analysisUserId = parsedResult.userInfo?.id || parsedResult.userId;
    const isOwner = analysisUserId === userId;

    if (!isAdmin && !isOwner && !isInfluencer) {
      console.error(`❌ Unauthorized access attempt by user ${userId} for session ${sessionId}`);
      return NextResponse.json(
        { error: '이 분석 결과에 대한 접근 권한이 없습니다' },
        { status: 403 }
      );
    }

    // Extract necessary data - handle both direct and nested structures
    const resultData = parsedResult.result || parsedResult.analysis || parsedResult;
    const userName = parsedResult.userInfo?.name || parsedResult.userName || '학생';
    const analysisDate = parsedResult.completedAt || parsedResult.createdAt || new Date().toISOString();

    // Ensure all analysis fields are at the correct level
    const analysisData = {
      ...resultData,
      gradeTrends: resultData.gradeTrends || null,
      competencyScores: resultData.competencyScores || null,
      majorAlignment: resultData.majorAlignment || null,
      keywordMatrix: resultData.keywordMatrix || null,
      summaryDraft: resultData.summaryDraft || null,
      aiKeywordAnalysis: resultData.ai_keyword_analysis || null,
      aiSectionScoring: resultData.ai_section_scoring || null,
      aiAcademicAnalysisV2: resultData.enhanced_academic_analysis || null,
      aiAcademicAnalysis: resultData.ai_academic_analysis || null,
      aiMajorRecommendations: resultData.ai_major_recommendations || null,
      nextSemesterPlan: resultData.next_semester_plan || null,
    };

    // Validate that we have analysis data
    if (!analysisData || Object.keys(analysisData).length === 0) {
      console.error(`❌ No analysis data found for session: ${sessionId}`);
      return NextResponse.json(
        { error: '분석 데이터가 비어있습니다' },
        { status: 400 }
      );
    }

    console.log(`🔧 Generating PDF for ${userName} (${sessionId})...`);

    // Generate HTML template
    const html = generatePDFTemplate(
      sessionId,
      userName,
      analysisDate,
      analysisData
    );

    // Generate PDF from HTML
    const pdfBuffer = await generateAnalysisPDF(html);

    // Create filename with current date
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `생활기록부분석_${userName}_${dateStr}.pdf`;
    const encodedFilename = encodeURIComponent(filename);

    console.log(`✅ PDF generated successfully: ${filename} (${(pdfBuffer.length / 1024 / 1024).toFixed(2)}MB)`);

    // Return PDF with proper headers
    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(pdfBuffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodedFilename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('❌ PDF export error:', error);

    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json(
      {
        error: 'PDF 생성 중 오류가 발생했습니다',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
