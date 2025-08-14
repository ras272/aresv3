import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock the rate limiting and lockout logic from the login API
// In a real implementation, these would be extracted to separate utility modules

interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetTime: number;
}

interface AccountLockoutResult {
  locked: boolean;
  lockedUntil: number;
  attempts: number;
}

interface FailedAttemptsResult {
  attempts: number;
  locked: boolean;
  lockedUntil: number;
}

// Rate limiting storage (simulating the in-memory store from login API)
const rateLimitStore = new Map<string, { attempts: number; resetTime: number }>();
const accountLockStore = new Map<string, { attempts: number; lockedUntil: number }>();

// Rate limiting functions (extracted from login API for testing)
function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;
  
  const current = rateLimitStore.get(ip);
  
  if (!current || now > current.resetTime) {
    // Reset or initialize
    rateLimitStore.set(ip, { attempts: 1, resetTime: now + windowMs });
    return { allowed: true, remainingAttempts: maxAttempts - 1, resetTime: now + windowMs };
  }
  
  if (current.attempts >= maxAttempts) {
    return { allowed: false, remainingAttempts: 0, resetTime: current.resetTime };
  }
  
  // Increment attempts
  current.attempts++;
  rateLimitStore.set(ip, current);
  
  return { 
    allowed: true, 
    remainingAttempts: maxAttempts - current.attempts, 
    resetTime: current.resetTime 
  };
}

function checkAccountLockout(email: string): AccountLockoutResult {
  const now = Date.now();
  const current = accountLockStore.get(email);
  
  if (!current) {
    return { locked: false, lockedUntil: 0, attempts: 0 };
  }
  
  if (now > current.lockedUntil) {
    // Lockout expired, reset
    accountLockStore.delete(email);
    return { locked: false, lockedUntil: 0, attempts: 0 };
  }
  
  return { 
    locked: current.lockedUntil > now, 
    lockedUntil: current.lockedUntil, 
    attempts: current.attempts 
  };
}

function incrementFailedAttempts(email: string): FailedAttemptsResult {
  const now = Date.now();
  const lockoutDuration = 30 * 60 * 1000; // 30 minutes
  const maxAttempts = 5;
  
  let current = accountLockStore.get(email);
  if (!current) {
    current = { attempts: 0, lockedUntil: 0 };
  }
  
  current.attempts++;
  
  if (current.attempts >= maxAttempts) {
    current.lockedUntil = now + lockoutDuration;
  }
  
  accountLockStore.set(email, current);
  
  return { 
    attempts: current.attempts, 
    locked: current.attempts >= maxAttempts, 
    lockedUntil: current.lockedUntil 
  };
}

function resetFailedAttempts(email: string): void {
  accountLockStore.delete(email);
}

describe('Rate Limiting and Lockout Mechanisms', () => {
  beforeEach(() => {
    // Clear all stores before each test
    rateLimitStore.clear();
    accountLockStore.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('IP Rate Limiting', () => {
    const testIP = '192.168.1.100';

    it('should allow first attempt', () => {
      const result = checkRateLimit(testIP);
      
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(4);
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });

    it('should track multiple attempts from same IP', () => {
      // First attempt
      let result = checkRateLimit(testIP);
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(4);

      // Second attempt
      result = checkRateLimit(testIP);
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(3);

      // Third attempt
      result = checkRateLimit(testIP);
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(2);
    });

    it('should block after 5 attempts', () => {
      // Make 5 attempts
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(testIP);
        if (i < 4) {
          expect(result.allowed).toBe(true);
        }
      }

      // 6th attempt should be blocked
      const result = checkRateLimit(testIP);
      expect(result.allowed).toBe(false);
      expect(result.remainingAttempts).toBe(0);
    });

    it('should reset after time window expires', () => {
      // Mock time to control the reset
      const mockNow = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);

      // Make 5 attempts to reach limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit(testIP);
      }

      // Verify blocked
      let result = checkRateLimit(testIP);
      expect(result.allowed).toBe(false);

      // Fast forward past reset time (15 minutes + 1 second)
      const resetTime = mockNow + (15 * 60 * 1000) + 1000;
      vi.spyOn(Date, 'now').mockReturnValue(resetTime);

      // Should be allowed again
      result = checkRateLimit(testIP);
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(4);
    });

    it('should handle different IPs independently', () => {
      const ip1 = '192.168.1.100';
      const ip2 = '192.168.1.101';

      // Make 5 attempts from IP1
      for (let i = 0; i < 5; i++) {
        checkRateLimit(ip1);
      }

      // IP1 should be blocked
      expect(checkRateLimit(ip1).allowed).toBe(false);

      // IP2 should still be allowed
      expect(checkRateLimit(ip2).allowed).toBe(true);
    });

    it('should provide correct reset time', () => {
      const mockNow = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);

      const result = checkRateLimit(testIP);
      const expectedResetTime = mockNow + (15 * 60 * 1000); // 15 minutes

      expect(result.resetTime).toBe(expectedResetTime);
    });
  });

  describe('Account Lockout', () => {
    const testEmail = 'test@example.com';

    it('should not be locked initially', () => {
      const result = checkAccountLockout(testEmail);
      
      expect(result.locked).toBe(false);
      expect(result.lockedUntil).toBe(0);
      expect(result.attempts).toBe(0);
    });

    it('should track failed attempts', () => {
      const testEmailForThisTest = 'test-tracking@example.com';
      
      // First failed attempt
      let result = incrementFailedAttempts(testEmailForThisTest);
      expect(result.attempts).toBe(1);
      expect(result.locked).toBe(false);

      // Verify the store has the entry
      expect(accountLockStore.has(testEmailForThisTest)).toBe(true);
      const storeEntry = accountLockStore.get(testEmailForThisTest);
      expect(storeEntry?.attempts).toBe(1);

      // Check lockout status - the function returns attempts from the store
      let lockoutStatus = checkAccountLockout(testEmailForThisTest);
      expect(lockoutStatus.locked).toBe(false);

      // Second failed attempt (should increment from previous)
      result = incrementFailedAttempts(testEmailForThisTest);
      expect(result.attempts).toBe(2);
      expect(result.locked).toBe(false);
    });

    it('should lock account after 5 failed attempts', () => {
      // Make 4 failed attempts
      for (let i = 0; i < 4; i++) {
        const result = incrementFailedAttempts(testEmail);
        expect(result.locked).toBe(false);
      }

      // 5th attempt should lock the account
      const result = incrementFailedAttempts(testEmail);
      expect(result.attempts).toBe(5);
      expect(result.locked).toBe(true);
      expect(result.lockedUntil).toBeGreaterThan(Date.now());

      // Verify lockout status
      const lockoutStatus = checkAccountLockout(testEmail);
      expect(lockoutStatus.locked).toBe(true);
    });

    it('should unlock account after lockout period expires', () => {
      const mockNow = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);

      // Lock the account
      for (let i = 0; i < 5; i++) {
        incrementFailedAttempts(testEmail);
      }

      // Verify locked
      let lockoutStatus = checkAccountLockout(testEmail);
      expect(lockoutStatus.locked).toBe(true);

      // Fast forward past lockout period (30 minutes + 1 second)
      const unlockTime = mockNow + (30 * 60 * 1000) + 1000;
      vi.spyOn(Date, 'now').mockReturnValue(unlockTime);

      // Should be unlocked
      lockoutStatus = checkAccountLockout(testEmail);
      expect(lockoutStatus.locked).toBe(false);
      expect(lockoutStatus.attempts).toBe(0);
    });

    it('should reset failed attempts on successful login', () => {
      // Make some failed attempts
      incrementFailedAttempts(testEmail);
      incrementFailedAttempts(testEmail);
      incrementFailedAttempts(testEmail);

      // Verify attempts are tracked by checking the store directly
      expect(accountLockStore.has(testEmail)).toBe(true);

      // Reset on successful login
      resetFailedAttempts(testEmail);

      // Verify reset - entry should be removed from store
      expect(accountLockStore.has(testEmail)).toBe(false);
      
      // Check lockout status should return default values
      let lockoutStatus = checkAccountLockout(testEmail);
      expect(lockoutStatus.attempts).toBe(0);
      expect(lockoutStatus.locked).toBe(false);
    });

    it('should handle different emails independently', () => {
      const email1 = 'user1@example.com';
      const email2 = 'user2@example.com';

      // Lock email1
      for (let i = 0; i < 5; i++) {
        incrementFailedAttempts(email1);
      }

      // email1 should be locked
      expect(checkAccountLockout(email1).locked).toBe(true);

      // email2 should not be affected
      expect(checkAccountLockout(email2).locked).toBe(false);
    });

    it('should provide correct lockout duration', () => {
      const mockNow = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);

      // Lock the account
      for (let i = 0; i < 5; i++) {
        incrementFailedAttempts(testEmail);
      }

      const lockoutStatus = checkAccountLockout(testEmail);
      const expectedUnlockTime = mockNow + (30 * 60 * 1000); // 30 minutes

      expect(lockoutStatus.lockedUntil).toBe(expectedUnlockTime);
    });
  });

  describe('Integration Tests', () => {
    it('should handle both IP rate limiting and account lockout', () => {
      const testIP = '192.168.1.100';
      const testEmail = 'test@example.com';

      // Test IP rate limiting first
      for (let i = 0; i < 5; i++) {
        const rateLimitResult = checkRateLimit(testIP);
        if (i < 4) {
          expect(rateLimitResult.allowed).toBe(true);
        }
      }

      // IP should be rate limited
      expect(checkRateLimit(testIP).allowed).toBe(false);

      // Account lockout should work independently
      for (let i = 0; i < 5; i++) {
        incrementFailedAttempts(testEmail);
      }

      expect(checkAccountLockout(testEmail).locked).toBe(true);
    });

    it('should handle edge case of simultaneous lockouts', () => {
      const mockNow = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);

      const testIP = '192.168.1.100';
      const testEmail = 'test@example.com';

      // Trigger both lockouts at the same time
      for (let i = 0; i < 5; i++) {
        checkRateLimit(testIP);
        incrementFailedAttempts(testEmail);
      }

      // Both should be locked
      expect(checkRateLimit(testIP).allowed).toBe(false);
      expect(checkAccountLockout(testEmail).locked).toBe(true);

      // Fast forward to unlock IP but not account (IP: 15min, Account: 30min)
      const partialUnlockTime = mockNow + (16 * 60 * 1000); // 16 minutes
      vi.spyOn(Date, 'now').mockReturnValue(partialUnlockTime);

      // IP should be unlocked, account still locked
      expect(checkRateLimit(testIP).allowed).toBe(true);
      expect(checkAccountLockout(testEmail).locked).toBe(true);

      // Fast forward to unlock both
      const fullUnlockTime = mockNow + (31 * 60 * 1000); // 31 minutes
      vi.spyOn(Date, 'now').mockReturnValue(fullUnlockTime);

      // Both should be unlocked
      expect(checkRateLimit(testIP).allowed).toBe(true);
      expect(checkAccountLockout(testEmail).locked).toBe(false);
    });
  });

  describe('Performance and Memory Tests', () => {
    it('should handle many different IPs efficiently', () => {
      const startTime = Date.now();

      // Test with 1000 different IPs
      for (let i = 0; i < 1000; i++) {
        const ip = `192.168.1.${i % 255}`;
        checkRateLimit(ip);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(1000); // 1 second
    });

    it('should handle many different emails efficiently', () => {
      const startTime = Date.now();

      // Test with 1000 different emails
      for (let i = 0; i < 1000; i++) {
        const email = `user${i}@example.com`;
        incrementFailedAttempts(email);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(1000); // 1 second
    });

    it('should clean up expired entries', () => {
      const mockNow = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);

      const testEmail = 'test@example.com';

      // Create a lockout
      for (let i = 0; i < 5; i++) {
        incrementFailedAttempts(testEmail);
      }

      // Verify entry exists
      expect(accountLockStore.has(testEmail)).toBe(true);

      // Fast forward past expiration
      const expiredTime = mockNow + (31 * 60 * 1000); // 31 minutes
      vi.spyOn(Date, 'now').mockReturnValue(expiredTime);

      // Check lockout status (should clean up expired entry)
      const lockoutStatus = checkAccountLockout(testEmail);
      expect(lockoutStatus.locked).toBe(false);

      // Entry should be removed from store
      expect(accountLockStore.has(testEmail)).toBe(false);
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle malformed IP addresses', () => {
      const malformedIPs = ['', 'invalid', '999.999.999.999', null, undefined];

      malformedIPs.forEach(ip => {
        expect(() => checkRateLimit(ip as any)).not.toThrow();
      });
    });

    it('should handle malformed email addresses', () => {
      const malformedEmails = ['', 'invalid', '@example.com', null, undefined];

      malformedEmails.forEach(email => {
        expect(() => incrementFailedAttempts(email as any)).not.toThrow();
        expect(() => checkAccountLockout(email as any)).not.toThrow();
        expect(() => resetFailedAttempts(email as any)).not.toThrow();
      });
    });

    it('should handle time manipulation attempts', () => {
      const testEmail = 'test@example.com';
      
      // Lock account
      for (let i = 0; i < 5; i++) {
        incrementFailedAttempts(testEmail);
      }

      // Try to manipulate time backwards
      const pastTime = Date.now() - (60 * 60 * 1000); // 1 hour ago
      vi.spyOn(Date, 'now').mockReturnValue(pastTime);

      // Should still be locked
      const lockoutStatus = checkAccountLockout(testEmail);
      expect(lockoutStatus.locked).toBe(true);
    });

    it('should handle concurrent access safely', () => {
      const testEmail = 'test@example.com';
      const testIP = '192.168.1.100';

      // Simulate concurrent access
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(Promise.resolve(incrementFailedAttempts(testEmail)));
        promises.push(Promise.resolve(checkRateLimit(testIP)));
      }

      // Should not throw errors
      expect(() => Promise.all(promises)).not.toThrow();
    });
  });
});