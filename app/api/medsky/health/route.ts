/**
 * Medsky Health Check API Endpoint
 * 
 * This endpoint provides health status for the medsky system and its dependencies.
 */

import { NextRequest, NextResponse } from 'next/server';
import { healthCheck, validateConfiguration } from '@/lib/medsky/medskyService';

export async function GET(request: NextRequest) {
  try {
    // Check configuration
    const configValidation = validateConfiguration();
    
    // Check service health
    const health = await healthCheck();
    
    const response = {
      status: health.status,
      configuration: {
        isValid: configValidation.isValid,
        errors: configValidation.errors
      },
      services: health.services,
      errors: health.errors,
      timestamp: new Date().toISOString()
    };

    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 207 : 503;

    return NextResponse.json(response, { status: statusCode });

  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}