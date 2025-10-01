import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import redis from '@/lib/redis';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/dashboard/[slug]/analysis/[sessionId]/ai-academic
 * Update AI academic analysis data
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; sessionId: string }> }
) {
  try {
    const { slug, sessionId } = await params;

    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // Parse request body
    const { data } = await request.json();
    if (!data) {
      return NextResponse.json({ error: '데이터가 필요합니다' }, { status: 400 });
    }

    // Get current analysis from Redis
    const analysisKey = `${slug}:analysis_data:${sessionId}`;
    const currentAnalysis = await redis.get(analysisKey);

    if (!currentAnalysis) {
      return NextResponse.json({ error: '분석 결과를 찾을 수 없습니다' }, { status: 404 });
    }

    const parsedAnalysis = typeof currentAnalysis === 'string'
      ? JSON.parse(currentAnalysis)
      : currentAnalysis;

    // Verify user has access
    const userRole = (session.user as any)?.role;
    const userId = (session.user as any)?.userId;
    const analysisUserId = parsedAnalysis.userInfo?.id || parsedAnalysis.userId;
    const isOwner = analysisUserId === userId;
    const isAdmin = userRole === 'admin';
    const isInfluencer = (session.user as any)?.userType === 'influencer' &&
      ((session.user as any)?.influencerSlug === slug || userId === slug);

    if (!isAdmin && !isOwner && !isInfluencer) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    // Update the analysis with new academic data
    const updatedAnalysis = {
      ...parsedAnalysis,
      result: {
        ...(parsedAnalysis.result || {}),
        enhanced_academic_analysis: data,
      },
    };

    // Save back to Redis
    await redis.set(analysisKey, JSON.stringify(updatedAnalysis));

    return NextResponse.json({
      success: true,
      message: '학업 분석이 저장되었습니다',
      result: updatedAnalysis.result,
    });
  } catch (error) {
    console.error('❌ AI Academic update error:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json(
      { error: '업데이트 중 오류가 발생했습니다', details: errorMessage },
      { status: 500 }
    );
  }
}
