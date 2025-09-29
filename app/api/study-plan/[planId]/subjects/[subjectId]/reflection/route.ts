import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { StudyPlanService } from '@/lib/services/study-plan.service';
import type { ApiResponse, AddReflectionRequest } from '@/lib/types/study-plan';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string; subjectId: string }> }
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

    const { planId, subjectId } = await params;

    // Verify plan exists and belongs to user
    const plan = await StudyPlanService.getPlanById(userId, planId);
    if (!plan) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body: AddReflectionRequest = await request.json();
    const { reflection } = body;

    if (!reflection || reflection.trim().length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Reflection content is required' },
        { status: 400 }
      );
    }

    // Add reflection
    const success = await StudyPlanService.addReflection(
      userId,
      planId,
      subjectId,
      reflection
    );

    if (!success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to add reflection' },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error adding reflection:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}