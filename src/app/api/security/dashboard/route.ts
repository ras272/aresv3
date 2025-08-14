import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/database/shared/supabase';
import { getCurrentUser } from '@/lib/jwt';
import { logSecurityEvent, monitorPerformance } from '@/lib/security-monitoring';

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
          attempted_endpoint: '/api/security/dashboard',
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
          attempted_endpoint: '/api/security/dashboard',
          user_role: user.rol,
          reason: 'insufficient_privileges'
        }
      });
      
      return NextResponse.json(
        { error: 'Insufficient privileges' },
        { status: 403 }
      );
    }

    // Get time range from query params (default to 24 hours)
    const url = new URL(request.url);
    const hoursBack = parseInt(url.searchParams.get('hours') || '24');
    
    // Get dashboard data
    const { data: dashboardData, error } = await supabase
      .rpc('get_security_dashboard_data', { hours_back: hoursBack });

    if (error) {
      console.error('Error fetching dashboard data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch dashboard data' },
        { status: 500 }
      );
    }

    // Get recent suspicious activities
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
    
    const { data: suspiciousActivities, error: suspiciousError } = await supabase
      .from('suspicious_activities')
      .select('*')
      .gte('timestamp', since)
      .eq('resolved', false)
      .order('timestamp', { ascending: false })
      .limit(10);

    if (suspiciousError) {
      console.error('Error fetching suspicious activities:', suspiciousError);
    }

    // Get recent security events by type
    const { data: eventsByType, error: eventsError } = await supabase
      .from('security_events')
      .select('event_type, count(*)')
      .gte('timestamp', since)
      .group('event_type')
      .order('count', { ascending: false });

    if (eventsError) {
      console.error('Error fetching events by type:', eventsError);
    }

    // Get top IP addresses by activity
    const { data: topIPs, error: ipsError } = await supabase
      .from('security_events')
      .select('ip_address, count(*)')
      .gte('timestamp', since)
      .not('ip_address', 'is', null)
      .group('ip_address')
      .order('count', { ascending: false })
      .limit(10);

    if (ipsError) {
      console.error('Error fetching top IPs:', ipsError);
    }

    // Log dashboard access
    await logSecurityEvent({
      event_type: 'login_success', // Using existing event type for dashboard access
      user_id: user.id,
      email: user.email,
      severity: 'low',
      ip_address: request.ip || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      details: {
        endpoint: '/api/security/dashboard',
        hours_requested: hoursBack
      }
    });

    const response = {
      dashboard: dashboardData,
      suspicious_activities: suspiciousActivities || [],
      events_by_type: eventsByType || [],
      top_ips: topIPs || [],
      time_range: {
        hours_back: hoursBack,
        since: since,
        until: new Date().toISOString()
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Security dashboard API error:', error);
    
    await logSecurityEvent({
      event_type: 'suspicious_activity',
      severity: 'high',
      ip_address: request.ip || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      details: {
        endpoint: '/api/security/dashboard',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}