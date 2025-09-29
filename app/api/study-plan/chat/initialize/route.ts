import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { StudyPlanService } from '@/lib/services/study-plan.service';
import { OpenAIPlannerService } from '@/lib/services/openai-planner.service';
import type { ApiResponse, ChatInitResponse } from '@/lib/types/study-plan';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any)?.userId || session.user?.email;
    if (!userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User ID not found' },
        { status: 400 }
      );
    }

    // Parse request body for force parameter
    const body = await request.json().catch(() => ({}));
    const force = body.force === true;

    // Check if user already has a plan for today (skip if force is true)
    if (!force) {
      const hasActivePlan = await StudyPlanService.hasActivePlanToday(userId);
      if (hasActivePlan) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'You already have a plan for today' },
          { status: 400 }
        );
      }
    }

    // Create new chat session
    const chatSession = await StudyPlanService.createChatSession(userId);

    // Get first question
    const firstQuestion = OpenAIPlannerService.getQuestion(chatSession.step);

    const response: ChatInitResponse = {
      sessionId: chatSession.sessionId,
      question: firstQuestion,
      step: chatSession.step,
    };

    return NextResponse.json<ApiResponse<ChatInitResponse>>(
      { success: true, data: response },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error initializing chat session:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}