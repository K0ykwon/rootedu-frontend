/**
 * Medsky Complete Processing API Endpoint
 * 
 * This endpoint handles the complete medsky processing pipeline:
 * PDF upload → parsing → text extraction → LLM analysis → validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSession } from '@/lib/medsky/medskyService';
import { startProcessingPipeline, validateConfiguration } from '@/lib/medsky/medskyService';
import { MedskyError, ERROR_CODES } from '@/types/medsky';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
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

    // Validate configuration
    const configValidation = validateConfiguration();
    if (!configValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Configuration error: ' + configValidation.errors.join(', ') 
        },
        { status: 500 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'PDF file is required' 
        },
        { status: 400 }
      );
    }

    // Validate file type and size
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Only PDF files are allowed' 
        },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'File size must be less than 10MB' 
        },
        { status: 400 }
      );
    }

    // Create session and start background processing with user info
    const sessionId = createSession();
    const userInfo = {
      id: session.user.id,
      name: session.user.name || '',
      email: session.user.email || '',
      analyzedAt: new Date().toISOString()
    };
    startProcessingPipeline(sessionId, file, userInfo);

    // Return immediately with sessionId
    return NextResponse.json({
      success: true,
      sessionId,
      // No result initially; client will poll status and final result
      result: null
    });

  } catch (error) {
    console.error('Medsky processing error:', error);

    if (error instanceof MedskyError) {
      const statusCode = getStatusCodeForError(error.code);
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          code: error.code,
          stage: error.stage
        },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

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

    const { getProcessingResultAsync } = await import('@/lib/medsky/medskyService');
    const result = await getProcessingResultAsync(sessionId);

    if (!result) {
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
      result
    });

  } catch (error) {
    console.error('Get processing result error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Get appropriate HTTP status code for MedskyError
 */
function getStatusCodeForError(errorCode: string): number {
  switch (errorCode) {
    case ERROR_CODES.FILE_TOO_LARGE:
    case ERROR_CODES.INVALID_FILE_TYPE:
      return 400;
    case ERROR_CODES.PDF_PARSING_FAILED:
    case ERROR_CODES.SECTION_EXTRACTION_FAILED:
    case ERROR_CODES.LLM_EXTRACTION_FAILED:
    case ERROR_CODES.VALIDATION_FAILED:
      return 422;
    case ERROR_CODES.TIMEOUT:
      return 408;
    case ERROR_CODES.NETWORK_ERROR:
      return 503;
    default:
      return 500;
  }
}