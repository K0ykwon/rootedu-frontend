import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { StudyPlanService } from '@/lib/services/study-plan.service';
import type { ApiResponse, UpdateSubjectRequest } from '@/lib/types/study-plan';
import { validateSubjectUpdate } from '@/lib/utils/timeUtils';

export async function PATCH(
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
    let body: UpdateSubjectRequest;
    try {
      body = await request.json();
    } catch (error) {
      console.error('🔧 API: Invalid JSON in request body:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid request body format' },
        { status: 400 }
      );
    }

    console.log('🔧 API: Processing update request', { planId, subjectId, body });

    // Validate the update request
    const validation = validateSubjectUpdate(body);
    if (!validation.valid) {
      console.error('🔧 API: Validation failed:', validation.error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    console.log('🔧 API: Validation passed, calling StudyPlanService');

    // Update subject plan
    const success = await StudyPlanService.updateSubjectPlan(
      userId,
      planId,
      subjectId,
      body
    );

    console.log('🔧 API: StudyPlanService result:', success);

    if (!success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to update subject' },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating subject:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}