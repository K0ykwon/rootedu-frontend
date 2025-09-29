import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { StudyPlanService } from '@/lib/services/study-plan.service';
import type { ApiResponse, PlanHistoryResponse } from '@/lib/types/study-plan';

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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Validate parameters
    if (page < 1 || limit < 1 || limit > 50) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Get user's plan history
    const result = await StudyPlanService.getUserPlans(userId, page, limit);

    return NextResponse.json<ApiResponse<PlanHistoryResponse>>(
      { success: true, data: result },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting plan history:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}