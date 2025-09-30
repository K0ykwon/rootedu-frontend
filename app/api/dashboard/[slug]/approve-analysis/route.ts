import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { updateAnalysisApproval } from '../../../../../lib/medsky/medskyService';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    const userType = (session.user as any)?.userType;
    const userId = (session.user as any)?.userId;
    const influencerSlug = (session.user as any)?.influencerSlug;
    const params = await context.params;
    const slug = params.slug;

    // Only admin or the influencer can approve analyses
    const isAdmin = userRole === 'admin';
    const isInfluencer = userType === 'influencer' && (influencerSlug === slug || userId === slug);

    if (!isAdmin && !isInfluencer) {
      return NextResponse.json(
        { error: 'Forbidden - Only influencer or admin can approve analyses' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { sessionId, action, notes } = body;

    if (!sessionId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId and action' },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Update approval status
    const result = await updateAnalysisApproval(
      slug,
      sessionId,
      action,
      userId || session.user.id,
      notes
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 404 }
      );
    }

    console.log(`✅ Analysis ${sessionId} ${action}d by ${userId || session.user.id} for ${slug}`);

    return NextResponse.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Error approving analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}