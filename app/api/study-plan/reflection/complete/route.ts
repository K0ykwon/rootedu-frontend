import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { generateReport } from '@/lib/services/studyConsultant';
import { sessions } from '../initialize/route';
import type {
  DailyStudyPlan,
  ReflectionCompleteRequest
} from '@/lib/types/study-plan';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const userId = (session.user as any)?.userId || session.user?.email;
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID not found' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const body: ReflectionCompleteRequest = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Session ID is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 세션 조회
    const reflectionSession = sessions.get(sessionId);
    if (!reflectionSession) {
      return new Response(
        JSON.stringify({ success: false, error: 'Session not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 권한 확인
    if (reflectionSession.userId !== userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 이미 완료된 세션인지 확인
    if (reflectionSession.isComplete) {
      return new Response(
        JSON.stringify({ success: false, error: 'Session already completed' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 최소 턴 수 확인 (최소 3턴은 진행해야 함)
    if (reflectionSession.turnCount < 3) {
      return new Response(
        JSON.stringify({ success: false, error: 'Minimum 3 turns required before completion' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 학습 계획 가져오기
    const plan = await fetchStudyPlan(reflectionSession.planId, userId);
    if (!plan) {
      return new Response(
        JSON.stringify({ success: false, error: 'Study plan not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 리포트 생성
    const report = await generateReport(reflectionSession.messages, plan);

    // 세션 완료 처리
    reflectionSession.isComplete = true;
    reflectionSession.report = report;
    reflectionSession.updatedAt = new Date().toISOString();

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          report,
          turnCount: reflectionSession.turnCount,
          isComplete: true
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error completing reflection session:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Mock function to fetch study plan (same as in other routes)
async function fetchStudyPlan(planId: string, userId: string): Promise<DailyStudyPlan | null> {
  return {
    id: planId,
    userId,
    date: new Date().toISOString().split('T')[0],
    totalStartTime: '09:00',
    totalEndTime: '18:00',
    motivationalQuote: '오늘도 최선을 다해보세요!',
    plans: [
      {
        id: '1',
        subject: '수학',
        content: '미적분 복습',
        startTime: '09:00',
        endTime: '11:00',
        completed: true,
      },
      {
        id: '2',
        subject: '영어',
        content: '문법 학습',
        startTime: '13:00',
        endTime: '15:00',
        completed: true,
      },
      {
        id: '3',
        subject: '국어',
        content: '고전문학 읽기',
        startTime: '16:00',
        endTime: '18:00',
        completed: false,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}