import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/jwt';
import { performanceOptimizer } from '@/lib/performance-optimization';
import { logSecurityEvent } from '@/lib/security-monitoring';

export async function GET(request: NextRequest) {
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
          attempted_endpoint: '/api/performance/metrics',
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
          attempted_endpoint: '/api/performance/metrics',
          user_role: user.rol,
          reason: 'insufficient_privileges'
        }
      });
      
      return NextResponse.json(
        { error: 'Insufficient privileges' },
        { status: 403 }
      );
    }

    // Get performance metrics
    const metrics = performanceOptimizer.getMetrics();
    
    // Add system metrics
    const systemMetrics = {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
      timestamp: new Date().toISOString()
    };

    const response = {
      performance: metrics,
      system: systemMetrics,
      recommendations: generatePerformanceRecommendations(metrics)
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Performance metrics API error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated and has admin privileges
    const user = await getCurrentUser(request);
    
    if (!user || !['admin', 'super_admin'].includes(user.rol)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'reset_metrics':
        performanceOptimizer.resetMetrics();
        return NextResponse.json({ success: true, message: 'Metrics reset successfully' });
        
      case 'clear_caches':
        performanceOptimizer.clearAllCaches();
        return NextResponse.json({ success: true, message: 'Caches cleared successfully' });
        
      case 'optimize_connections':
        await performanceOptimizer.optimizeConnections();
        return NextResponse.json({ success: true, message: 'Connection optimization completed' });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Performance action API error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generatePerformanceRecommendations(metrics: any): string[] {
  const recommendations: string[] = [];
  
  // Cache hit rate recommendations
  const cacheHitRate = metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses) * 100;
  if (cacheHitRate < 80) {
    recommendations.push('Consider increasing cache TTL or optimizing cache keys for better hit rate');
  }
  
  // Query performance recommendations
  if (metrics.averageQueryTime > 500) {
    recommendations.push('Average query time is high. Consider adding database indexes or optimizing queries');
  }
  
  if (metrics.slowQueries > metrics.totalQueries * 0.1) {
    recommendations.push('High number of slow queries detected. Review and optimize database queries');
  }
  
  // Memory recommendations
  if (metrics.blacklistSize > 10000) {
    recommendations.push('Token blacklist is large. Consider implementing Redis for better memory management');
  }
  
  if (metrics.permissionsCacheSize > 5000) {
    recommendations.push('Permissions cache is large. Consider reducing cache TTL or implementing cache eviction');
  }
  
  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push('Performance metrics look good! Continue monitoring for optimal performance');
  }
  
  return recommendations;
}