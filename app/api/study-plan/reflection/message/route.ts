import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { streamConsultantResponse, generateReport } from '@/lib/services/studyConsultant';
import { sessions } from '../initialize/route';
import type {
  ReflectionMessageRequest,
  ReflectionMessage,
  DailyStudyPlan
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

    const body: ReflectionMessageRequest = await req.json();
    const { sessionId, message } = body;

    if (!sessionId || !message?.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Session ID and message are required' }),
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

    // 사용자 메시지 추가
    const userMessage: ReflectionMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
    };

    reflectionSession.messages.push(userMessage);
    reflectionSession.turnCount += 1;
    reflectionSession.updatedAt = new Date().toISOString();

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

    // 스트리밍 응답 설정
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let assistantResponse = '';

          // AI 응답 스트리밍
          for await (const chunk of streamConsultantResponse(reflectionSession.messages, plan)) {
            assistantResponse += chunk;

            // 클라이언트에 스트리밍 데이터 전송
            const data = JSON.stringify({
              type: 'content',
              content: chunk,
              turnCount: reflectionSession.turnCount,
              isComplete: false
            });

            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          // AI 응답을 세션에 저장
          const assistantMessage: ReflectionMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: assistantResponse,
            timestamp: new Date().toISOString(),
          };

          reflectionSession.messages.push(assistantMessage);

          // 대화 계속 진행 (5턴 후에도 자동 완료하지 않음)
          const continueData = JSON.stringify({
            type: 'continue',
            turnCount: reflectionSession.turnCount,
            isComplete: false,
            canComplete: reflectionSession.turnCount >= 5 // 5턴 이후 완료 가능
          });

          controller.enqueue(encoder.encode(`data: ${continueData}\n\n`));

          // 스트림 종료
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();

        } catch (error) {
          console.error('Error in streaming response:', error);

          const errorData = JSON.stringify({
            type: 'error',
            error: 'AI 응답 생성 중 오류가 발생했습니다.'
          });

          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Error processing reflection message:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Mock function to fetch study plan (same as in initialize route)
async function fetchStudyPlan(planId: string, userId: string): Promise<DailyStudyPlan | null> {
  // This should be replaced with actual database query
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