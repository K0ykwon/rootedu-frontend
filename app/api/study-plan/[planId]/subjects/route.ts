import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { CreateSubjectRequest, ApiResponse } from '@/lib/types/study-plan';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
): Promise<Response> {
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

    const { planId } = await params;
    const body: CreateSubjectRequest = await req.json();

    // 입력 검증
    if (!body.subject || !body.content || !body.startTime || !body.endTime) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Subject, content, startTime, and endTime are required'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 시간 형식 검증 (HH:mm)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(body.startTime) || !timeRegex.test(body.endTime)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid time format. Use HH:mm format'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 시간 유효성 검증 (시작시간 < 종료시간)
    const [startHour, startMin] = body.startTime.split(':').map(Number);
    const [endHour, endMin] = body.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Start time must be before end time'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 실제 구현에서는 데이터베이스에 저장
    // 현재는 mock response 반환
    const newSubject = {
      id: crypto.randomUUID(),
      subject: body.subject,
      content: body.content,
      startTime: body.startTime,
      endTime: body.endTime,
      completed: body.completed || false,
    };

    console.log('Creating new subject:', {
      planId,
      userId,
      subject: newSubject
    });

    const response: ApiResponse = {
      success: true,
      data: newSubject
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error creating subject:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}