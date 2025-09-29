import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { StudyPlanService } from '@/lib/services/study-plan.service';
import type { ApiResponse, DailyStudyPlan } from '@/lib/types/study-plan';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
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

    const { planId } = await params;
    if (!planId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Get the plan
    const plan = await StudyPlanService.getPlanById(userId, planId);

    if (!plan) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<DailyStudyPlan>>(
      { success: true, data: plan },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting plan:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
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

    const { planId } = await params;
    if (!planId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Delete the plan
    const success = await StudyPlanService.deletePlan(userId, planId);

    if (success) {
      return NextResponse.json<ApiResponse>(
        { success: true },
        { status: 200 }
      );
    } else {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to delete plan' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}