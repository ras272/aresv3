import { supabase } from './database/shared/supabase';

export interface SecurityEvent {
  event_type: 'login_attempt' | 'login_success' | 'login_failure' | 'logout' | 'token_refresh' | 'suspicious_activity' | 'session_expired' | 'account_locked';
  user_id?: string;
  email?: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp?: string;
}

export interface PerformanceMetric {
  operation: string;
  duration_ms: number;
  success: boolean;
  user_id?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface SuspiciousActivity {
  type: 'multiple_failed_logins' | 'unusual_location' | 'rapid_requests' | 'token_manipulation' | 'session_anomaly';
  user_id?: string;
  email?: string;
  ip_address?: string;
  severity: 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  timestamp?: string;
}

class SecurityMonitor {
  private static instance: SecurityMonitor;
  private performanceMetrics: PerformanceMetric[] = [];
  private suspiciousActivities: SuspiciousActivity[] = [];

  private constructor() {}

  public static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  /**
   * Log security events to database and console
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const eventData = {
        ...event,
        timestamp: event.timestamp || new Date().toISOString(),
      };

      // Log to database
      const { error } = await supabase
        .from('security_events')
        .insert([eventData]);

      if (error) {
        console.error('Failed to log security event to database:', error);
      }

      // Log to console with appropriate level
      const logMessage = `[SECURITY] ${event.event_type}: ${event.email || 'Unknown'} from ${event.ip_address || 'Unknown IP'}`;
      
      switch (event.severity) {
        case 'critical':
          console.error(logMessage, eventData);
          break;
        case 'high':
          console.warn(logMessage, eventData);
          break;
        case 'medium':
          console.info(logMessage, eventData);
          break;
        case 'low':
        default:
          console.log(logMessage, eventData);
          break;
      }

      // Check for suspicious patterns
      await this.detectSuspiciousActivity(event);

    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  /**
   * Log performance metrics
   */
  async logPerformanceMetric(metric: PerformanceMetric): Promise<void> {
    try {
      const metricData = {
        ...metric,
        timestamp: metric.timestamp || new Date().toISOString(),
      };

      // Store in memory for analysis
      this.performanceMetrics.push(metricData);

      // Keep only last 1000 metrics in memory
      if (this.performanceMetrics.length > 1000) {
        this.performanceMetrics = this.performanceMetrics.slice(-1000);
      }

      // Log to database
      const { error } = await supabase
        .from('performance_metrics')
        .insert([metricData]);

      if (error) {
        console.error('Failed to log performance metric:', error);
      }

      // Log slow operations
      if (metric.duration_ms > 1000) {
        console.warn(`[PERFORMANCE] Slow operation: ${metric.operation} took ${metric.duration_ms}ms`);
      }

    } catch (error) {
      console.error('Error logging performance metric:', error);
    }
  }

  /**
   * Detect suspicious activity patterns
   */
  private async detectSuspiciousActivity(event: SecurityEvent): Promise<void> {
    try {
      // Check for multiple failed logins
      if (event.event_type === 'login_failure' && event.email) {
        const recentFailures = await this.getRecentFailedLogins(event.email, 15); // Last 15 minutes
        
        if (recentFailures >= 3) {
          await this.reportSuspiciousActivity({
            type: 'multiple_failed_logins',
            email: event.email,
            ip_address: event.ip_address,
            severity: recentFailures >= 5 ? 'critical' : 'high',
            details: {
              failed_attempts: recentFailures,
              time_window: '15 minutes',
              latest_attempt: event.timestamp
            }
          });
        }
      }

      // Check for rapid requests from same IP
      if (event.ip_address) {
        const recentRequests = await this.getRecentRequestsFromIP(event.ip_address, 5); // Last 5 minutes
        
        if (recentRequests >= 20) {
          await this.reportSuspiciousActivity({
            type: 'rapid_requests',
            ip_address: event.ip_address,
            severity: 'medium',
            details: {
              request_count: recentRequests,
              time_window: '5 minutes'
            }
          });
        }
      }

    } catch (error) {
      console.error('Error detecting suspicious activity:', error);
    }
  }

  /**
   * Report suspicious activity
   */
  async reportSuspiciousActivity(activity: SuspiciousActivity): Promise<void> {
    try {
      const activityData = {
        ...activity,
        timestamp: activity.timestamp || new Date().toISOString(),
      };

      // Store in memory
      this.suspiciousActivities.push(activityData);

      // Keep only last 100 activities in memory
      if (this.suspiciousActivities.length > 100) {
        this.suspiciousActivities = this.suspiciousActivities.slice(-100);
      }

      // Log to database
      const { error } = await supabase
        .from('suspicious_activities')
        .insert([activityData]);

      if (error) {
        console.error('Failed to log suspicious activity:', error);
      }

      // Log alert
      const alertMessage = `[SECURITY ALERT] ${activity.type}: ${activity.email || activity.ip_address || 'Unknown'}`;
      
      switch (activity.severity) {
        case 'critical':
          console.error(alertMessage, activityData);
          break;
        case 'high':
          console.warn(alertMessage, activityData);
          break;
        case 'medium':
        default:
          console.info(alertMessage, activityData);
          break;
      }

    } catch (error) {
      console.error('Error reporting suspicious activity:', error);
    }
  }

  /**
   * Get recent failed login attempts for an email
   */
  private async getRecentFailedLogins(email: string, minutes: number): Promise<number> {
    try {
      const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('security_events')
        .select('id')
        .eq('event_type', 'login_failure')
        .eq('email', email)
        .gte('timestamp', since);

      if (error) {
        console.error('Error getting recent failed logins:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error getting recent failed logins:', error);
      return 0;
    }
  }

  /**
   * Get recent requests from an IP address
   */
  private async getRecentRequestsFromIP(ipAddress: string, minutes: number): Promise<number> {
    try {
      const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('security_events')
        .select('id')
        .eq('ip_address', ipAddress)
        .gte('timestamp', since);

      if (error) {
        console.error('Error getting recent requests from IP:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error getting recent requests from IP:', error);
      return 0;
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    averageResponseTime: number;
    slowOperations: PerformanceMetric[];
    successRate: number;
    totalOperations: number;
  } {
    if (this.performanceMetrics.length === 0) {
      return {
        averageResponseTime: 0,
        slowOperations: [],
        successRate: 100,
        totalOperations: 0
      };
    }

    const totalTime = this.performanceMetrics.reduce((sum, metric) => sum + metric.duration_ms, 0);
    const averageResponseTime = totalTime / this.performanceMetrics.length;
    
    const slowOperations = this.performanceMetrics.filter(metric => metric.duration_ms > 1000);
    
    const successfulOperations = this.performanceMetrics.filter(metric => metric.success).length;
    const successRate = (successfulOperations / this.performanceMetrics.length) * 100;

    return {
      averageResponseTime: Math.round(averageResponseTime),
      slowOperations,
      successRate: Math.round(successRate * 100) / 100,
      totalOperations: this.performanceMetrics.length
    };
  }

  /**
   * Get recent suspicious activities
   */
  getRecentSuspiciousActivities(limit: number = 10): SuspiciousActivity[] {
    return this.suspiciousActivities
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
      .slice(0, limit);
  }

  /**
   * Clean up old sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('active_sessions')
        .delete()
        .lt('expires_at', now)
        .select('id');

      if (error) {
        console.error('Error cleaning up expired sessions:', error);
        return 0;
      }

      const cleanedCount = data?.length || 0;
      
      if (cleanedCount > 0) {
        console.log(`[CLEANUP] Removed ${cleanedCount} expired sessions`);
        
        await this.logSecurityEvent({
          event_type: 'session_expired',
          severity: 'low',
          details: {
            cleaned_sessions: cleanedCount,
            cleanup_time: now
          }
        });
      }

      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      return 0;
    }
  }

  /**
   * Monitor active sessions for anomalies
   */
  async monitorActiveSessions(): Promise<void> {
    try {
      // Check for sessions that haven't been used in a while
      const staleThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours
      
      const { data: staleSessions, error } = await supabase
        .from('active_sessions')
        .select('*')
        .lt('last_used_at', staleThreshold);

      if (error) {
        console.error('Error monitoring active sessions:', error);
        return;
      }

      if (staleSessions && staleSessions.length > 0) {
        console.warn(`[SESSION MONITOR] Found ${staleSessions.length} stale sessions`);
        
        for (const session of staleSessions) {
          await this.reportSuspiciousActivity({
            type: 'session_anomaly',
            user_id: session.user_id,
            ip_address: session.ip_address,
            severity: 'medium',
            details: {
              session_id: session.id,
              last_used: session.last_used_at,
              created: session.created_at,
              reason: 'stale_session'
            }
          });
        }
      }

    } catch (error) {
      console.error('Error monitoring active sessions:', error);
    }
  }
}

// Export singleton instance
export const securityMonitor = SecurityMonitor.getInstance();

// Helper functions for easy use
export const logSecurityEvent = (event: SecurityEvent) => securityMonitor.logSecurityEvent(event);
export const logPerformanceMetric = (metric: PerformanceMetric) => securityMonitor.logPerformanceMetric(metric);
export const reportSuspiciousActivity = (activity: SuspiciousActivity) => securityMonitor.reportSuspiciousActivity(activity);

// Performance monitoring decorator
export function monitorPerformance(operationName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      let success = true;
      let error: any = null;

      try {
        const result = await method.apply(this, args);
        return result;
      } catch (err) {
        success = false;
        error = err;
        throw err;
      } finally {
        const duration = Date.now() - startTime;
        
        securityMonitor.logPerformanceMetric({
          operation: operationName,
          duration_ms: duration,
          success,
          metadata: error ? { error: error.message } : undefined
        });
      }
    };

    return descriptor;
  };
}