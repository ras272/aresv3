import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  getCurrentUser,
  blacklistToken,
  isTokenBlacklisted,
  extractTokenFromRequest,
  isTokenNearExpiration,
  getTokenExpiration,
  createCookieString,
  createDeleteCookieString,
  isValidUserPayload,
  type UserPayload,
  type AuthJWTPayload,
  COOKIE_CONFIG
} from '../jwt';

// Mock environment variables
const mockEnv = {
  JWT_SECRET: 'test-secret-key-for-access-tokens-must-be-long-enough-for-security',
  JWT_REFRESH_SECRET: 'test-refresh-secret-key-for-refresh-tokens-must-be-long-enough-for-security',
  JWT_ISSUER: 'test-ares-app',
  JWT_ACCESS_TOKEN_EXPIRES_IN: '15m',
  JWT_REFRESH_TOKEN_EXPIRES_IN: '7d',
  SESSION_COOKIE_NAME: 'test_session',
  REFRESH_COOKIE_NAME: 'test_refresh',
  COOKIE_HTTP_ONLY: 'true',
  COOKIE_SECURE: 'true',
  COOKIE_SAME_SITE: 'strict',
  COOKIE_PATH: '/'
};

// Mock user payload for testing
const mockUser: UserPayload = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  nombre: 'Test User',
  rol: 'admin',
  activo: true
};

describe('JWT Utilities', () => {
  beforeEach(() => {
    // Mock environment variables
    Object.entries(mockEnv).forEach(([key, value]) => {
      vi.stubEnv(key, value);
    });
    
    // Clear token blacklist
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', async () => {
      const token = await generateAccessToken(mockUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include user data in token payload', async () => {
      const token = await generateAccessToken(mockUser);
      const payload = await verifyToken(token, 'access');
      
      expect(payload).toBeDefined();
      expect(payload?.id).toBe(mockUser.id);
      expect(payload?.email).toBe(mockUser.email);
      expect(payload?.nombre).toBe(mockUser.nombre);
      expect(payload?.rol).toBe(mockUser.rol);
      expect(payload?.activo).toBe(mockUser.activo);
      expect(payload?.type).toBe('access');
    });

    it('should set correct expiration time', async () => {
      const beforeGeneration = Math.floor(Date.now() / 1000);
      const token = await generateAccessToken(mockUser);
      const afterGeneration = Math.floor(Date.now() / 1000);
      
      const payload = await verifyToken(token, 'access');
      expect(payload?.exp).toBeDefined();
      
      // Should expire in approximately 15 minutes (900 seconds)
      const expectedExpiration = beforeGeneration + 900;
      const actualExpiration = payload!.exp;
      
      expect(actualExpiration).toBeGreaterThanOrEqual(expectedExpiration);
      expect(actualExpiration).toBeLessThanOrEqual(afterGeneration + 900);
    });

    it('should set correct issuer', async () => {
      const token = await generateAccessToken(mockUser);
      const payload = await verifyToken(token, 'access');
      
      expect(payload?.iss).toBe(mockEnv.JWT_ISSUER);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', async () => {
      const token = await generateRefreshToken(mockUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include user data with refresh type', async () => {
      const token = await generateRefreshToken(mockUser);
      const payload = await verifyToken(token, 'refresh');
      
      expect(payload).toBeDefined();
      expect(payload?.id).toBe(mockUser.id);
      expect(payload?.type).toBe('refresh');
    });

    it('should have longer expiration than access token', async () => {
      const accessToken = await generateAccessToken(mockUser);
      const refreshToken = await generateRefreshToken(mockUser);
      
      const accessPayload = await verifyToken(accessToken, 'access');
      const refreshPayload = await verifyToken(refreshToken, 'refresh');
      
      expect(refreshPayload?.exp).toBeGreaterThan(accessPayload?.exp!);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid access token', async () => {
      const token = await generateAccessToken(mockUser);
      const payload = await verifyToken(token, 'access');
      
      expect(payload).toBeDefined();
      expect(payload?.id).toBe(mockUser.id);
    });

    it('should verify valid refresh token', async () => {
      const token = await generateRefreshToken(mockUser);
      const payload = await verifyToken(token, 'refresh');
      
      expect(payload).toBeDefined();
      expect(payload?.type).toBe('refresh');
    });

    it('should reject invalid token', async () => {
      const payload = await verifyToken('invalid-token', 'access');
      expect(payload).toBeNull();
    });

    it('should reject empty token', async () => {
      const payload = await verifyToken('', 'access');
      expect(payload).toBeNull();
    });

    it('should reject null token', async () => {
      const payload = await verifyToken(null as any, 'access');
      expect(payload).toBeNull();
    });

    it('should reject access token when expecting refresh token', async () => {
      const accessToken = await generateAccessToken(mockUser);
      const payload = await verifyToken(accessToken, 'refresh');
      
      expect(payload).toBeNull();
    });

    it('should reject refresh token when expecting access token', async () => {
      const refreshToken = await generateRefreshToken(mockUser);
      const payload = await verifyToken(refreshToken, 'access');
      
      expect(payload).toBeNull();
    });

    it('should reject blacklisted token', async () => {
      const token = await generateAccessToken(mockUser);
      
      // First verification should work
      let payload = await verifyToken(token, 'access');
      expect(payload).toBeDefined();
      
      // Blacklist the token
      blacklistToken(token);
      
      // Second verification should fail
      payload = await verifyToken(token, 'access');
      expect(payload).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should extract user from cookie', async () => {
      const token = await generateAccessToken(mockUser);
      
      const request = new NextRequest('http://localhost:3000/test', {
        headers: {
          cookie: `${COOKIE_CONFIG.ACCESS_TOKEN.name}=${token}`
        }
      });
      
      const user = await getCurrentUser(request);
      expect(user).toBeDefined();
      expect(user?.id).toBe(mockUser.id);
      expect(user?.email).toBe(mockUser.email);
    });

    it('should extract user from Authorization header', async () => {
      const token = await generateAccessToken(mockUser);
      
      const request = new NextRequest('http://localhost:3000/test', {
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      
      const user = await getCurrentUser(request);
      expect(user).toBeDefined();
      expect(user?.id).toBe(mockUser.id);
    });

    it('should return null for invalid token', async () => {
      const request = new NextRequest('http://localhost:3000/test', {
        headers: {
          cookie: `${COOKIE_CONFIG.ACCESS_TOKEN.name}=invalid-token`
        }
      });
      
      const user = await getCurrentUser(request);
      expect(user).toBeNull();
    });

    it('should return null when no token provided', async () => {
      const request = new NextRequest('http://localhost:3000/test');
      
      const user = await getCurrentUser(request);
      expect(user).toBeNull();
    });

    it('should prioritize cookie over header', async () => {
      const cookieToken = await generateAccessToken(mockUser);
      const headerToken = await generateAccessToken({
        ...mockUser,
        id: 'different-user-id'
      });
      
      const request = new NextRequest('http://localhost:3000/test', {
        headers: {
          cookie: `${COOKIE_CONFIG.ACCESS_TOKEN.name}=${cookieToken}`,
          authorization: `Bearer ${headerToken}`
        }
      });
      
      const user = await getCurrentUser(request);
      expect(user?.id).toBe(mockUser.id); // Should use cookie token
    });
  });

  describe('Token Blacklist', () => {
    it('should blacklist token', () => {
      const token = 'test-token-to-blacklist';
      
      expect(isTokenBlacklisted(token)).toBe(false);
      
      blacklistToken(token);
      
      expect(isTokenBlacklisted(token)).toBe(true);
    });

    it('should handle empty token gracefully', () => {
      blacklistToken('');
      blacklistToken(null as any);
      blacklistToken(undefined as any);
      
      expect(isTokenBlacklisted('')).toBe(false);
    });
  });

  describe('extractTokenFromRequest', () => {
    it('should extract token from cookie', () => {
      const token = 'test-token-from-cookie';
      const request = new NextRequest('http://localhost:3000/test', {
        headers: {
          cookie: `${COOKIE_CONFIG.ACCESS_TOKEN.name}=${token}`
        }
      });
      
      const extractedToken = extractTokenFromRequest(request);
      expect(extractedToken).toBe(token);
    });

    it('should extract token from Authorization header', () => {
      const token = 'test-token-from-header';
      const request = new NextRequest('http://localhost:3000/test', {
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      
      const extractedToken = extractTokenFromRequest(request);
      expect(extractedToken).toBe(token);
    });

    it('should return null when no token found', () => {
      const request = new NextRequest('http://localhost:3000/test');
      
      const extractedToken = extractTokenFromRequest(request);
      expect(extractedToken).toBeNull();
    });
  });

  describe('isTokenNearExpiration', () => {
    it('should detect token near expiration', async () => {
      // Mock a token that expires in 2 minutes
      vi.stubEnv('JWT_ACCESS_TOKEN_EXPIRES_IN', '2m');
      
      const token = await generateAccessToken(mockUser);
      const isNearExpiration = await isTokenNearExpiration(token);
      
      expect(isNearExpiration).toBe(true);
    });

    it('should detect token not near expiration', async () => {
      // Use default 15 minutes
      const token = await generateAccessToken(mockUser);
      const isNearExpiration = await isTokenNearExpiration(token);
      
      expect(isNearExpiration).toBe(false);
    });

    it('should treat invalid token as expired', async () => {
      const isNearExpiration = await isTokenNearExpiration('invalid-token');
      expect(isNearExpiration).toBe(true);
    });
  });

  describe('getTokenExpiration', () => {
    it('should return expiration timestamp', async () => {
      const token = await generateAccessToken(mockUser);
      const expiration = await getTokenExpiration(token, 'access');
      
      expect(expiration).toBeDefined();
      expect(typeof expiration).toBe('number');
      expect(expiration).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('should return null for invalid token', async () => {
      const expiration = await getTokenExpiration('invalid-token', 'access');
      expect(expiration).toBeNull();
    });
  });

  describe('Cookie Utilities', () => {
    describe('createCookieString', () => {
      it('should create basic cookie string', () => {
        const cookieString = createCookieString('test', 'value');
        expect(cookieString).toBe('test=value');
      });

      it('should create cookie with all options', () => {
        const cookieString = createCookieString('test', 'value', {
          maxAge: 3600,
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          path: '/api'
        });
        
        expect(cookieString).toContain('test=value');
        expect(cookieString).toContain('Max-Age=3600');
        expect(cookieString).toContain('HttpOnly');
        expect(cookieString).toContain('Secure');
        expect(cookieString).toContain('SameSite=strict');
        expect(cookieString).toContain('Path=/api');
      });
    });

    describe('createDeleteCookieString', () => {
      it('should create cookie deletion string', () => {
        const deleteString = createDeleteCookieString('test');
        
        expect(deleteString).toContain('test=');
        expect(deleteString).toContain('Max-Age=0');
        expect(deleteString).toContain('HttpOnly');
        expect(deleteString).toContain('Secure');
      });

      it('should use custom path', () => {
        const deleteString = createDeleteCookieString('test', '/custom');
        expect(deleteString).toContain('Path=/custom');
      });
    });
  });

  describe('isValidUserPayload', () => {
    it('should validate correct user payload', () => {
      expect(isValidUserPayload(mockUser)).toBe(true);
    });

    it('should reject invalid payloads', () => {
      expect(isValidUserPayload(null)).toBe(false);
      expect(isValidUserPayload(undefined)).toBe(false);
      expect(isValidUserPayload({})).toBe(false);
      expect(isValidUserPayload({ id: 'test' })).toBe(false);
      expect(isValidUserPayload({ ...mockUser, id: 123 })).toBe(false);
      expect(isValidUserPayload({ ...mockUser, activo: 'true' })).toBe(false);
    });
  });

  describe('Token Expiration Edge Cases', () => {
    it('should handle expired token gracefully', async () => {
      // Create a token that expires immediately
      vi.stubEnv('JWT_ACCESS_TOKEN_EXPIRES_IN', '0s');
      
      const token = await generateAccessToken(mockUser);
      
      // Wait a moment to ensure expiration
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const payload = await verifyToken(token, 'access');
      expect(payload).toBeNull();
    });
  });

  describe('Environment Variable Fallbacks', () => {
    it('should use fallback values when env vars are missing', async () => {
      // Clear all environment variables
      vi.unstubAllEnvs();
      
      const token = await generateAccessToken(mockUser);
      expect(token).toBeDefined();
      
      const payload = await verifyToken(token, 'access');
      expect(payload).toBeDefined();
    });
  });
});