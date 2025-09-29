import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateKeywordOverridesForSession } from '@/lib/medsky/medskyService';
import { KeywordOverride } from '@/types/medsky';

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
    const overrides = Array.isArray(body?.overrides) ? body.overrides : [];

    const normalized: KeywordOverride[] = overrides.map((item: KeywordOverride) => ({
      term: item.term,
      competency: item.competency,
      action: item.action,
      updatedAt: new Date().toISOString(),
    }));

    const result = await updateKeywordOverridesForSession(sessionId, normalized);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Keyword override failed:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
