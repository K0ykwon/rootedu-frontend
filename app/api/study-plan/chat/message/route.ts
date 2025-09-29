import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { StudyPlanService } from '@/lib/services/study-plan.service';
import { OpenAIPlannerService } from '@/lib/services/openai-planner.service';
import type {
  ApiResponse,
  ChatMessageRequest,
  ChatMessageResponse,
  DailyStudyPlan
} from '@/lib/types/study-plan';

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

    // Parse request body
    const body: ChatMessageRequest = await request.json();
    const { sessionId, message } = body;

    if (!sessionId || !message) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get chat session
    const chatSession = await StudyPlanService.getChatSession(userId, sessionId);
    if (!chatSession) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Chat session not found' },
        { status: 404 }
      );
    }

    // Parse user response and update responses
    const updatedResponses = OpenAIPlannerService.parseUserResponse(
      chatSession.step,
      message,
      chatSession.responses
    );

    // Get next step
    const nextStep = OpenAIPlannerService.getNextStep(chatSession.step);

    // Update chat session
    await StudyPlanService.updateChatSession(
      userId,
      sessionId,
      nextStep,
      updatedResponses
    );

    // Check if we need to generate the plan
    if (nextStep === 'generating') {
      // Validate we have all required information
      if (!OpenAIPlannerService.validateResponses(updatedResponses)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Incomplete information for plan generation' },
          { status: 400 }
        );
      }

      try {
        // Generate study plan using OpenAI
        const generatedPlan = await OpenAIPlannerService.generateStudyPlan(updatedResponses);

        // Create plan in database
        const dailyPlan = await StudyPlanService.createPlan(
          userId,
          generatedPlan.plans,
          generatedPlan.motivationalQuote ?? undefined
        );

        // Mark session as completed
        await StudyPlanService.updateChatSession(
          userId,
          sessionId,
          'completed',
          updatedResponses
        );

        // Return completed response with plan
        const response: ChatMessageResponse = {
          step: 'completed',
          isComplete: true,
          plan: dailyPlan,
        };

        return NextResponse.json<ApiResponse<ChatMessageResponse>>(
          { success: true, data: response },
          { status: 200 }
        );
      } catch (error) {
        console.error('Error generating plan:', error);
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Failed to generate study plan' },
          { status: 500 }
        );
      }
    }

    // Return next question
    const nextQuestion = OpenAIPlannerService.getQuestion(nextStep);
    const response: ChatMessageResponse = {
      question: nextQuestion,
      step: nextStep,
      isComplete: false,
    };

    return NextResponse.json<ApiResponse<ChatMessageResponse>>(
      { success: true, data: response },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing chat message:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}