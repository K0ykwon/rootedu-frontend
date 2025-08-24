/**
 * Medsky Status API Endpoint
 * 
 * This endpoint provides real-time status updates for processing sessions
 * and allows checking the current state of a medsky analysis.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getProcessingStatus, getProcessingStatusAsync } from '@/lib/medsky/medskyService';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required' 
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Session ID is required' 
        },
        { status: 400 }
      );
    }

    let status = getProcessingStatus(sessionId);
    if (!status) {
      status = await getProcessingStatusAsync(sessionId);
    }

    if (!status) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Session not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      status
    });

  } catch (error) {
    console.error('Get status error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}