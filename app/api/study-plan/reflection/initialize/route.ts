import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { generateFirstMessage } from '@/lib/services/studyConsultant';
import type {
  InitializeReflectionRequest,
  InitializeReflectionResponse,
  DailyStudyPlan,
  ReflectionSession
} from '@/lib/types/study-plan';

// In-memory storage for sessions (in production, use a database)
const sessions = new Map<string, ReflectionSession>();

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any)?.userId || session.user?.email;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID not found' },
        { status: 401 }
      );
    }

    const body: InitializeReflectionRequest = await req.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json(
        { success: false, error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // 학습 계획 가져오기 (실제 구현에서는 데이터베이스에서 조회)
    // 현재는 mock 데이터 사용
    const plan = await fetchStudyPlan(planId, userId);

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Study plan not found' },
        { status: 404 }
      );
    }

    // 회고 세션 생성
    const sessionId = crypto.randomUUID();
    const firstMessage = await generateFirstMessage(plan);

    const reflectionSession: ReflectionSession = {
      id: sessionId,
      planId,
      userId,
      messages: [],
      turnCount: 0,
      isComplete: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 세션 저장
    sessions.set(sessionId, reflectionSession);

    const response: InitializeReflectionResponse = {
      sessionId,
      message: firstMessage,
    };

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error initializing reflection:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Mock function to fetch study plan (replace with actual database query)
async function fetchStudyPlan(planId: string, userId: string): Promise<DailyStudyPlan | null> {
  // This should be replaced with actual database query
  // For now, return a mock plan for testing
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

// Export sessions for use in other endpoints
export { sessions };