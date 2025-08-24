/**
 * Admin API for Medsky Analytics
 * 
 * This endpoint allows administrators to view all medsky analysis data
 * stored in Redis with user information and analysis results.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getRedisClient } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
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

    // Check if user is admin
    const isAdmin = (session.user as any).role === 'admin';
    if (!isAdmin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Admin access required' 
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sessionId = searchParams.get('sessionId');

    const client = await getRedisClient();

    try {
      // If specific session requested, return just that one
      if (sessionId) {
        const analysisData = await client.get(`yaktoon:analysis_data:${sessionId}`);
        await client.quit();
        
        if (!analysisData) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Analysis session not found' 
            },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          data: JSON.parse(analysisData)
        });
      }

      // Get all analysis sessions
      const allSessions = await client.sMembers('yaktoon:analysis_sessions');
      
      // Sort sessions by creation time (newest first) and paginate
      const sortedSessions = allSessions.sort((a, b) => {
        // Extract timestamp from session ID (format: medsky_timestamp_random)
        const timestampA = parseInt(a.split('_')[1] || '0');
        const timestampB = parseInt(b.split('_')[1] || '0');
        return timestampB - timestampA;
      });

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedSessions = sortedSessions.slice(startIndex, endIndex);

      // Fetch analysis data for paginated sessions
      const analysisPromises = paginatedSessions.map(async (sessionId) => {
        try {
          const data = await client.get(`yaktoon:analysis_data:${sessionId}`);
          return data ? JSON.parse(data) : null;
        } catch (error) {
          console.error(`Failed to fetch analysis data for ${sessionId}:`, error);
          return null;
        }
      });

      const analysisResults = await Promise.all(analysisPromises);
      const validResults = analysisResults.filter(result => result !== null);

      await client.quit();

      return NextResponse.json({
        success: true,
        data: validResults,
        pagination: {
          page,
          limit,
          total: allSessions.length,
          totalPages: Math.ceil(allSessions.length / limit)
        }
      });

    } finally {
      if (client.isOpen) {
        await client.quit();
      }
    }

  } catch (error) {
    console.error('Admin analytics API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication and admin role
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

    const isAdmin = (session.user as any).role === 'admin';
    if (!isAdmin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Admin access required' 
        },
        { status: 403 }
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

    const client = await getRedisClient();

    try {
      // Delete analysis data
      await client.del(`yaktoon:analysis_data:${sessionId}`);
      // Remove from sessions set
      await client.sRem('yaktoon:analysis_sessions', sessionId);
      
      await client.quit();

      return NextResponse.json({
        success: true,
        message: 'Analysis data deleted successfully'
      });

    } finally {
      if (client.isOpen) {
        await client.quit();
      }
    }

  } catch (error) {
    console.error('Admin delete analytics API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}