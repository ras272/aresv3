import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/jwt';
import { logSecurityEvent, monitorPerformance } from '@/lib/security-monitoring';
import { securityCleanup } from '@/lib/security-cleanup';

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated and has admin privileges
    const user = await getCurrentUser(request);
    
    if (!user) {
      await logSecurityEvent({
        event_type: 'suspicious_activity',
        severity: 'medium',
        ip_address: request.ip || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        details: {
          attempted_endpoint: '/api/security/cleanup',
          reason: 'unauthenticated_access'
        }
      });
      
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin privileges
    if (!['admin', 'super_admin'].includes(user.rol)) {
      await logSecurityEvent({
        event_type: 'suspicious_activity',
        user_id: user.id,
        email: user.email,
        severity: 'high',
        ip_address: request.ip || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        details: {
          attempted_endpoint: '/api/security/cleanup',
          user_role: user.rol,
          reason: 'insufficient_privileges'
        }
      });
      
      return NextResponse.json(
        { error: 'Insufficient privileges' },
        { status: 403 }
      );
    }

    // Log cleanup initiation
    await logSecurityEvent({
      event_type: 'login_success', // Using existing event type for admin action
      user_id: user.id,
      email: user.email,
      severity: 'low',
      ip_address: request.ip || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      details: {
        action: 'manual_security_cleanup',
        endpoint: '/api/security/cleanup'
      }
    });

    // Run cleanup
    const cleanupResult = await securityCleanup.runCleanup();
    
    // Monitor session patterns
    await securityCleanup.monitorSessionPatterns();
    
    // Get updated stats
    const stats = await securityCleanup.getCleanupStats();

    const response = {
      success: true,
      cleanup_result: cleanupResult,
      current_stats: stats,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Security cleanup API error:', error);
    
    await logSecurityEvent({
      event_type: 'suspicious_activity',
      severity: 'high',
      ip_address: request.ip || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      details: {
        endpoint: '/api/security/cleanup',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    return NextResponse.json(
      { error: 'Cleanup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated and has admin privileges
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin privileges
    if (!['admin', 'super_admin'].includes(user.rol)) {
      return NextResponse.json(
        { error: 'Insufficient privileges' },
        { status: 403 }
      );
    }

    // Get cleanup stats
    const stats = await securityCleanup.getCleanupStats();

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Security cleanup stats API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to get cleanup stats' },
      { status: 500 }
    );
  }
}