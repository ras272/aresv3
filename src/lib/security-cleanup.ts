import { supabase } from './database/shared/supabase';
import { securityMonitor, logSecurityEvent } from './security-monitoring';

export interface CleanupResult {
  expiredSessions: number;
  oldSecurityEvents: number;
  oldPerformanceMetrics: number;
  staleSessions: number;
  totalCleaned: number;
}

export class SecurityCleanupService {
  private static instance: SecurityCleanupService;

  private constructor() {}

  public static getInstance(): SecurityCleanupService {
    if (!SecurityCleanupService.instance) {
      SecurityCleanupService.instance = new SecurityCleanupService();
    }
    return SecurityCleanupService.instance;
  }

  /**
   * Run comprehensive cleanup of security-related data
   */
  async runCleanup(): Promise<CleanupResult> {
    console.log('[SECURITY CLEANUP] Starting security cleanup process...');
    
    const result: CleanupResult = {
      expiredSessions: 0,
      oldSecurityEvents: 0,
      oldPerformanceMetrics: 0,
      staleSessions: 0,
      totalCleaned: 0
    };

    try {
      // Clean up expired sessions
      result.expiredSessions = await this.cleanupExpiredSessions();
      
      // Clean up stale sessions (not used in 7 days)
      result.staleSessions = await this.cleanupStaleSessions();
      
      // Clean up old security events (older than 90 days)
      result.oldSecurityEvents = await this.cleanupOldSecurityEvents();
      
      // Clean up old performance metrics (older than 30 days)
      result.oldPerformanceMetrics = await this.cleanupOldPerformanceMetrics();
      
      result.totalCleaned = result.expiredSessions + result.oldSecurityEvents + 
                           result.oldPerformanceMetrics + result.staleSessions;

      // Log cleanup results
      await logSecurityEvent({
        event_type: 'session_expired',
        severity: 'low',
        details: {
          cleanup_type: 'scheduled_cleanup',
          results: result,
          timestamp: new Date().toISOString()
        }
      });

      console.log('[SECURITY CLEANUP] Cleanup completed:', result);
      
      return result;
    } catch (error) {
      console.error('[SECURITY CLEANUP] Error during cleanup:', error);
      
      await logSecurityEvent({
        event_type: 'suspicious_activity',
        severity: 'medium',
        details: {
          cleanup_error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      });
      
      throw error;
    }
  }

  /**
   * Clean up expired sessions
   */
  private async cleanupExpiredSessions(): Promise<number> {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('active_sessions')
        .delete()
        .lt('expires_at', now)
        .select('id, user_id');

      if (error) {
        console.error('Error cleaning up expired sessions:', error);
        return 0;
      }

      const cleanedCount = data?.length || 0;
      
      if (cleanedCount > 0) {
        console.log(`[CLEANUP] Removed ${cleanedCount} expired sessions`);
      }

      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      return 0;
    }
  }

  /**
   * Clean up stale sessions (not used in 7 days)
   */
  private async cleanupStaleSessions(): Promise<number> {
    try {
      const staleThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('active_sessions')
        .delete()
        .lt('last_used_at', staleThreshold)
        .select('id, user_id, last_used_at');

      if (error) {
        console.error('Error cleaning up stale sessions:', error);
        return 0;
      }

      const cleanedCount = data?.length || 0;
      
      if (cleanedCount > 0) {
        console.log(`[CLEANUP] Removed ${cleanedCount} stale sessions`);
        
        // Log each stale session removal
        for (const session of data) {
          await logSecurityEvent({
            event_type: 'session_expired',
            user_id: session.user_id,
            severity: 'low',
            details: {
              session_id: session.id,
              last_used: session.last_used_at,
              reason: 'stale_session_cleanup'
            }
          });
        }
      }

      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up stale sessions:', error);
      return 0;
    }
  }

  /**
   * Clean up old security events (older than 90 days)
   */
  private async cleanupOldSecurityEvents(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('cleanup_old_security_events');

      if (error) {
        console.error('Error cleaning up old security events:', error);
        return 0;
      }

      const cleanedCount = data || 0;
      
      if (cleanedCount > 0) {
        console.log(`[CLEANUP] Removed ${cleanedCount} old security events`);
      }

      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up old security events:', error);
      return 0;
    }
  }

  /**
   * Clean up old performance metrics (older than 30 days)
   */
  private async cleanupOldPerformanceMetrics(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('cleanup_old_performance_metrics');

      if (error) {
        console.error('Error cleaning up old performance metrics:', error);
        return 0;
      }

      const cleanedCount = data || 0;
      
      if (cleanedCount > 0) {
        console.log(`[CLEANUP] Removed ${cleanedCount} old performance metrics`);
      }

      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up old performance metrics:', error);
      return 0;
    }
  }

  /**
   * Monitor and alert on unusual session patterns
   */
  async monitorSessionPatterns(): Promise<void> {
    try {
      // Check for users with too many active sessions
      const { data: userSessions, error } = await supabase
        .from('active_sessions')
        .select('user_id, count(*)')
        .group('user_id')
        .having('count(*) > 5');

      if (error) {
        console.error('Error monitoring session patterns:', error);
        return;
      }

      if (userSessions && userSessions.length > 0) {
        for (const userSession of userSessions) {
          await logSecurityEvent({
            event_type: 'suspicious_activity',
            user_id: userSession.user_id,
            severity: 'medium',
            details: {
              pattern_type: 'excessive_sessions',
              session_count: userSession.count,
              threshold: 5
            }
          });
        }
      }

      // Check for sessions from multiple locations for same user
      const { data: locationSessions, error: locationError } = await supabase
        .from('active_sessions')
        .select('user_id, ip_address, count(*)')
        .group('user_id, ip_address')
        .having('count(*) > 1');

      if (locationError) {
        console.error('Error monitoring location patterns:', locationError);
        return;
      }

      // Group by user to find users with sessions from multiple IPs
      const userLocationMap = new Map<string, string[]>();
      
      if (locationSessions) {
        for (const session of locationSessions) {
          if (!userLocationMap.has(session.user_id)) {
            userLocationMap.set(session.user_id, []);
          }
          userLocationMap.get(session.user_id)!.push(session.ip_address);
        }
      }

      // Alert on users with sessions from multiple IPs
      for (const [userId, ips] of userLocationMap.entries()) {
        if (ips.length > 2) {
          await logSecurityEvent({
            event_type: 'suspicious_activity',
            user_id: userId,
            severity: 'high',
            details: {
              pattern_type: 'multiple_locations',
              ip_addresses: ips,
              location_count: ips.length
            }
          });
        }
      }

    } catch (error) {
      console.error('Error monitoring session patterns:', error);
    }
  }

  /**
   * Get cleanup statistics
   */
  async getCleanupStats(): Promise<{
    activeSessions: number;
    expiredSessions: number;
    recentSecurityEvents: number;
    recentPerformanceMetrics: number;
    suspiciousActivities: number;
  }> {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [
        activeSessionsResult,
        expiredSessionsResult,
        recentEventsResult,
        recentMetricsResult,
        suspiciousResult
      ] = await Promise.all([
        supabase.from('active_sessions').select('id', { count: 'exact' }),
        supabase.from('active_sessions').select('id', { count: 'exact' }).lt('expires_at', now.toISOString()),
        supabase.from('security_events').select('id', { count: 'exact' }).gte('timestamp', oneDayAgo),
        supabase.from('performance_metrics').select('id', { count: 'exact' }).gte('timestamp', oneDayAgo),
        supabase.from('suspicious_activities').select('id', { count: 'exact' }).gte('timestamp', oneWeekAgo).eq('resolved', false)
      ]);

      return {
        activeSessions: activeSessionsResult.count || 0,
        expiredSessions: expiredSessionsResult.count || 0,
        recentSecurityEvents: recentEventsResult.count || 0,
        recentPerformanceMetrics: recentMetricsResult.count || 0,
        suspiciousActivities: suspiciousResult.count || 0
      };
    } catch (error) {
      console.error('Error getting cleanup stats:', error);
      return {
        activeSessions: 0,
        expiredSessions: 0,
        recentSecurityEvents: 0,
        recentPerformanceMetrics: 0,
        suspiciousActivities: 0
      };
    }
  }
}

// Export singleton instance
export const securityCleanup = SecurityCleanupService.getInstance();

// Utility function to schedule cleanup
export function scheduleSecurityCleanup(intervalHours: number = 24): NodeJS.Timeout {
  console.log(`[SECURITY CLEANUP] Scheduling cleanup every ${intervalHours} hours`);
  
  return setInterval(async () => {
    try {
      await securityCleanup.runCleanup();
      await securityCleanup.monitorSessionPatterns();
    } catch (error) {
      console.error('[SECURITY CLEANUP] Scheduled cleanup failed:', error);
    }
  }, intervalHours * 60 * 60 * 1000);
}