import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { StudyPlanService } from '@/lib/services/study-plan.service';
import type { ApiResponse, DailyStudyPlan } from '@/lib/types/study-plan';

export async function GET(request: NextRequest) {
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

    // Get today's plan
    const plan = await StudyPlanService.getTodaysPlan(userId);

    if (!plan) {
      return NextResponse.json<ApiResponse<null>>(
        { success: true, data: null },
        { status: 200 }
      );
    }

    return NextResponse.json<ApiResponse<DailyStudyPlan>>(
      { success: true, data: plan },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting today\'s plan:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}