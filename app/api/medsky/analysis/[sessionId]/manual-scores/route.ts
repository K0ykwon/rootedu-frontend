import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateManualCompetencyScores } from '@/lib/medsky/medskyService';
import { ManualCompetencyInput } from '@/types/medsky';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const scores = Array.isArray(body?.scores) ? body.scores : [];

    const { sessionId } = await params;
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID is required' }, { status: 400 });
    }

    const normalized: ManualCompetencyInput[] = scores.map((item: ManualCompetencyInput) => ({
      competency: item.competency,
      score: Number(item.score),
      notes: item.notes,
      updatedAt: new Date().toISOString(),
    }));

    const result = await updateManualCompetencyScores(sessionId, normalized);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Manual score update failed:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
