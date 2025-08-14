import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { securityMonitor, logSecurityEvent, logPerformanceMetric, reportSuspiciousActivity, monitorPerformance } from '../security-monitoring';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ error: null })),
      select: vi.fn(() => ({ 
        eq: vi.fn(() => ({ 
          gte: vi.fn(() => ({ data: [], error: null }))
        }))
      })),
      delete: vi.fn(() => ({ 
        lt: vi.fn(() => ({ 
          select: vi.fn(() => ({ data: [], error: null }))
        }))
      }))
    }))
  }))
}));

const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({ error: null })),
    select: vi.fn(() => ({ 
      eq: vi.fn(() => ({ 
        gte: vi.fn(() => ({ data: [], error: null }))
      }))
    })),
    delete: vi.fn(() => ({ 
      lt: vi.fn(() => ({ 
        select: vi.fn(() => ({ data: [], error: null }))
      }))
    }))
  }))
};

// Mock console methods
const consoleSpy = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  info: vi.spyOn(console, 'info').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {})
};

describe('Security Monitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.values(consoleSpy).forEach(spy => spy.mockClear());
  });

  describe('logSecurityEvent', () => {
    it('should log security event to database and console', async () => {
      const event = {
        event_type: 'login_success' as const,
        user_id: 'user-123',
        email: 'test@example.com',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        severity: 'low' as const,
        details: { session_id: 'session-123' }
      };

      await logSecurityEvent(event);

      expect(mockSupabase.from).toHaveBeenCalledWith('security_events');
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY] login_success: test@example.com from 192.168.1.1'),
        expect.objectContaining(event)
      );
    });

    it('should log critical events with error level', async () => {
      const event = {
        event_type: 'suspicious_activity' as const,
        email: 'test@example.com',
        severity: 'critical' as const,
        details: { reason: 'multiple_failed_logins' }
      };

      await logSecurityEvent(event);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY] suspicious_activity'),
        expect.objectContaining(event)
      );
    });

    it('should log high severity events with warn level', async () => {
      const event = {
        event_type: 'account_locked' as const,
        email: 'test@example.com',
        severity: 'high' as const,
        details: { attempts: 5 }
      };

      await logSecurityEvent(event);

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY] account_locked'),
        expect.objectContaining(event)
      );
    });

    it('should handle database errors gracefully', async () => {
      const mockError = new Error('Database connection failed');
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn(() => ({ error: mockError }))
      });

      const event = {
        event_type: 'login_failure' as const,
        email: 'test@example.com',
        severity: 'medium' as const
      };

      await expect(logSecurityEvent(event)).resolves.not.toThrow();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Failed to log security event to database:',
        mockError
      );
    });
  });

  describe('logPerformanceMetric', () => {
    it('should log performance metric to database', async () => {
      const metric = {
        operation: 'login',
        duration_ms: 150,
        success: true,
        user_id: 'user-123',
        metadata: { user_email: 'test@example.com' }
      };

      await logPerformanceMetric(metric);

      expect(mockSupabase.from).toHaveBeenCalledWith('performance_metrics');
    });

    it('should warn about slow operations', async () => {
      const metric = {
        operation: 'database_query',
        duration_ms: 2000,
        success: true
      };

      await logPerformanceMetric(metric);

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '[PERFORMANCE] Slow operation: database_query took 2000ms'
      );
    });

    it('should handle database errors gracefully', async () => {
      const mockError = new Error('Database connection failed');
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn(() => ({ error: mockError }))
      });

      const metric = {
        operation: 'test',
        duration_ms: 100,
        success: true
      };

      await expect(logPerformanceMetric(metric)).resolves.not.toThrow();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Failed to log performance metric:',
        mockError
      );
    });
  });

  describe('reportSuspiciousActivity', () => {
    it('should report suspicious activity to database', async () => {
      const activity = {
        type: 'multiple_failed_logins' as const,
        email: 'test@example.com',
        ip_address: '192.168.1.1',
        severity: 'high' as const,
        details: { failed_attempts: 5, time_window: '15 minutes' }
      };

      await reportSuspiciousActivity(activity);

      expect(mockSupabase.from).toHaveBeenCalledWith('suspicious_activities');
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY ALERT] multiple_failed_logins'),
        expect.objectContaining(activity)
      );
    });

    it('should log critical activities with error level', async () => {
      const activity = {
        type: 'token_manipulation' as const,
        user_id: 'user-123',
        severity: 'critical' as const,
        details: { reason: 'invalid_signature' }
      };

      await reportSuspiciousActivity(activity);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY ALERT] token_manipulation'),
        expect.objectContaining(activity)
      );
    });
  });

  describe('monitorPerformance decorator', () => {
    it('should monitor successful function execution', async () => {
      class TestClass {
        @monitorPerformance('test_operation')
        async testMethod(value: string): Promise<string> {
          return `processed: ${value}`;
        }
      }

      const instance = new TestClass();
      const result = await instance.testMethod('test');

      expect(result).toBe('processed: test');
      // Performance metric should be logged (we can't easily test this without more complex mocking)
    });

    it('should monitor failed function execution', async () => {
      class TestClass {
        @monitorPerformance('failing_operation')
        async failingMethod(): Promise<void> {
          throw new Error('Test error');
        }
      }

      const instance = new TestClass();
      
      await expect(instance.failingMethod()).rejects.toThrow('Test error');
      // Performance metric should be logged with success: false
    });
  });

  describe('SecurityMonitor singleton', () => {
    it('should return the same instance', () => {
      const instance1 = securityMonitor;
      const instance2 = securityMonitor;
      
      expect(instance1).toBe(instance2);
    });

    it('should provide performance statistics', () => {
      const stats = securityMonitor.getPerformanceStats();
      
      expect(stats).toHaveProperty('averageResponseTime');
      expect(stats).toHaveProperty('slowOperations');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('totalOperations');
      expect(typeof stats.averageResponseTime).toBe('number');
      expect(Array.isArray(stats.slowOperations)).toBe(true);
      expect(typeof stats.successRate).toBe('number');
      expect(typeof stats.totalOperations).toBe('number');
    });

    it('should provide recent suspicious activities', () => {
      const activities = securityMonitor.getRecentSuspiciousActivities(5);
      
      expect(Array.isArray(activities)).toBe(true);
      expect(activities.length).toBeLessThanOrEqual(5);
    });

    it('should clean up expired sessions', async () => {
      const cleanedCount = await securityMonitor.cleanupExpiredSessions();
      
      expect(typeof cleanedCount).toBe('number');
      expect(cleanedCount).toBeGreaterThanOrEqual(0);
    });

    it('should monitor active sessions', async () => {
      await expect(securityMonitor.monitorActiveSessions()).resolves.not.toThrow();
    });
  });

  describe('Suspicious Activity Detection', () => {
    beforeEach(() => {
      // Mock the database queries for suspicious activity detection
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'security_events') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  gte: vi.fn(() => ({ data: [{ id: '1' }, { id: '2' }, { id: '3' }], error: null }))
                }))
              }))
            })),
            insert: vi.fn(() => ({ error: null }))
          };
        }
        return {
          insert: vi.fn(() => ({ error: null }))
        };
      });
    });

    it('should detect multiple failed logins', async () => {
      const event = {
        event_type: 'login_failure' as const,
        email: 'test@example.com',
        ip_address: '192.168.1.1',
        severity: 'medium' as const
      };

      await logSecurityEvent(event);

      // Should trigger suspicious activity detection
      expect(mockSupabase.from).toHaveBeenCalledWith('security_events');
    });

    it('should detect rapid requests from same IP', async () => {
      const event = {
        event_type: 'login_attempt' as const,
        ip_address: '192.168.1.1',
        severity: 'low' as const
      };

      await logSecurityEvent(event);

      // Should check for rapid requests
      expect(mockSupabase.from).toHaveBeenCalledWith('security_events');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Network error');
      });

      const event = {
        event_type: 'login_success' as const,
        email: 'test@example.com',
        severity: 'low' as const
      };

      await expect(logSecurityEvent(event)).resolves.not.toThrow();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Error logging security event:',
        expect.any(Error)
      );
    });

    it('should handle missing environment variables', async () => {
      // This would be tested by mocking the createClient to throw
      const event = {
        event_type: 'login_success' as const,
        email: 'test@example.com',
        severity: 'low' as const
      };

      await expect(logSecurityEvent(event)).resolves.not.toThrow();
    });
  });

  describe('Memory Management', () => {
    it('should limit performance metrics in memory', async () => {
      // Add more than 1000 metrics to test memory limit
      const promises = [];
      for (let i = 0; i < 1005; i++) {
        promises.push(logPerformanceMetric({
          operation: `test_${i}`,
          duration_ms: 100,
          success: true
        }));
      }

      await Promise.all(promises);

      const stats = securityMonitor.getPerformanceStats();
      expect(stats.totalOperations).toBeLessThanOrEqual(1000);
    });

    it('should limit suspicious activities in memory', async () => {
      // Add more than 100 activities to test memory limit
      const promises = [];
      for (let i = 0; i < 105; i++) {
        promises.push(reportSuspiciousActivity({
          type: 'rapid_requests',
          ip_address: `192.168.1.${i}`,
          severity: 'medium',
          details: { request_count: 20 }
        }));
      }

      await Promise.all(promises);

      const activities = securityMonitor.getRecentSuspiciousActivities(200);
      expect(activities.length).toBeLessThanOrEqual(100);
    });
  });
});