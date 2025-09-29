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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Get plans by date range
    const plans = await StudyPlanService.getPlansByDateRange(userId, startDate, endDate);

    return NextResponse.json<ApiResponse<DailyStudyPlan[]>>(
      { success: true, data: plans },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting plans by date range:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}