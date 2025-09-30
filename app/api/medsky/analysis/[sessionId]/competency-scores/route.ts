import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateCompetencyScores } from '@/lib/medsky/medskyService';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const data = body?.data;

    if (!data) {
      return NextResponse.json({ success: false, error: 'Competency scores data is required' }, { status: 400 });
    }

    const result = await updateCompetencyScores(sessionId, data);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Competency scores update failed:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}