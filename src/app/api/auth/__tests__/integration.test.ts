import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST as loginPOST } from '../login/route';
import { POST as logoutPOST } from '../logout/route';
import { POST as refreshPOST } from '../refresh/route';
import { GET as mePOST } from '../me/route';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
    rpc: vi.fn(),
  },
}));

// Mock crypto functions
vi.mock('@/lib/crypto', () => ({
  verifyPassword: vi.fn(),
  hashPassword: vi.fn(),
}));

// Mock JWT functions
vi.mock('@/lib/jwt', () => ({
  generateAccessToken: vi.fn(),
  generateRefreshToken: vi.fn(),
  verifyToken: vi.fn(),
  getCurrentUser: vi.fn(),
  blacklistToken: vi.fn(),
  extractTokenFromRequest: vi.fn(),
  createCookieString: vi.fn(),
  createDeleteCookieString: vi.fn(),
  COOKIE_CONFIG: {
    ACCESS_TOKEN: {
      name: 'test_session',
      maxAge: 900,
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
    },
    REFRESH_TOKEN: {
      name: 'test_refresh',
      maxAge: 604800,
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
    },
  },
}));

import { verifyPassword } from '@/lib/crypto';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  getCurrentUser,
  blacklistToken,
  extractTokenFromRequest,
  createCookieString,
  createDeleteCookieString,
} from '@/lib/jwt';
import { supabase } from '@/lib/database/shared/supabase';

describe('Authentication API Integration Tests', () => {
  const mockUser = {
    id: 'user-123',
    nombre: 'Test User',
    email: 'test@example.com',
    password: '$2a$12$hashedPasswordExample',
    rol: 'admin',
    activo: true,
    login_attempts: 0,
    locked_until: null,
  };

  const mockUserPayload = {
    id: mockUser.id,
    email: mockUser.email,
    nombre: mockUser.nombre,
    rol: mockUser.rol,
    activo: mockUser.activo,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock implementations
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(generateAccessToken).mockResolvedValue('mock-access-token');
    vi.mocked(generateRefreshToken).mockResolvedValue('mock-refresh-token');
    vi.mocked(verifyToken).mockResolvedValue({
      id: mockUser.id,
      email: mockUser.email,
      nombre: mockUser.nombre,
      rol: mockUser.rol,
      activo: mockUser.activo,
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
      iss: 'test-app',
    });
    vi.mocked(getCurrentUser).mockResolvedValue(mockUserPayload);
    vi.mocked(extractTokenFromRequest).mockReturnValue('mock-token');
    vi.mocked(createCookieString).mockReturnValue('mock-cookie-string');
    vi.mocked(createDeleteCookieString).mockReturnValue('mock-delete-cookie');
    
    // Mock Supabase responses
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockUser,
            error: null,
          }),
        }),
      }),
    } as any);
    
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Login API (/api/auth/login)', () => {
    it('should successfully login with valid credentials', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.100',
          'user-agent': 'Mozilla/5.0 Test Browser',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'validPassword123!',
          rememberMe: false,
        }),
      });

      const response = await loginPOST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('Login exitoso');
      expect(responseData.user).toEqual({
        id: mockUser.id,
        nombre: mockUser.nombre,
        email: mockUser.email,
        rol: mockUser.rol,
        activo: mockUser.activo,
      });

      // Verify password was checked
      expect(verifyPassword).toHaveBeenCalledWith('validPassword123!', mockUser.password);
      
      // Verify tokens were generated
      expect(generateAccessToken).toHaveBeenCalledWith(mockUserPayload);
      expect(generateRefreshToken).toHaveBeenCalledWith(mockUserPayload);
      
      // Verify cookies were set
      expect(createCookieString).toHaveBeenCalledTimes(2);
    });

    it('should reject login with invalid credentials', async () => {
      vi.mocked(verifyPassword).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.100',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongPassword',
        }),
      });

      const response = await loginPOST(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.code).toBe('INVALID_CREDENTIALS');
      expect(responseData.message).toBe('Credenciales inválidas');
    });

    it('should reject login for non-existent user', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'User not found' },
            }),
          }),
        }),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.100',
        },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      });

      const response = await loginPOST(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login for inactive user', async () => {
      const inactiveUser = { ...mockUser, activo: false };
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: inactiveUser,
              error: null,
            }),
          }),
        }),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.100',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'validPassword123!',
        }),
      });

      const response = await loginPOST(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.code).toBe('USER_INACTIVE');
      expect(responseData.message).toBe('Usuario inactivo. Contacte al administrador.');
    });

    it('should handle validation errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: 'invalid-email',
          password: '',
        }),
      });

      const response = await loginPOST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.code).toBe('VALIDATION_ERROR');
      expect(responseData.errors).toBeDefined();
    });

    it('should handle remember me functionality', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.100',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'validPassword123!',
          rememberMe: true,
        }),
      });

      const response = await loginPOST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      
      // Verify extended session cookies were set
      expect(createCookieString).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          maxAge: 30 * 24 * 60 * 60, // 30 days
        })
      );
    });
  });

  describe('Logout API (/api/auth/logout)', () => {
    it('should successfully logout with valid token', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          cookie: 'test_session=mock-access-token; test_refresh=mock-refresh-token',
        },
      });

      const response = await logoutPOST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('Logout exitoso');

      // Verify token was blacklisted
      expect(blacklistToken).toHaveBeenCalledWith('mock-token');
      
      // Verify cookies were cleared
      expect(createDeleteCookieString).toHaveBeenCalledTimes(2);
    });

    it('should handle logout without token gracefully', async () => {
      vi.mocked(extractTokenFromRequest).mockReturnValue(null);

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      });

      const response = await logoutPOST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('Logout exitoso');
    });
  });

  describe('Token Refresh API (/api/auth/refresh)', () => {
    it('should successfully refresh valid token', async () => {
      vi.mocked(verifyToken).mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        nombre: mockUser.nombre,
        rol: mockUser.rol,
        activo: mockUser.activo,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 604800,
        iss: 'test-app',
      });

      const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        headers: {
          cookie: 'test_refresh=mock-refresh-token',
        },
      });

      const response = await refreshPOST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('Token renovado exitosamente');

      // Verify new access token was generated
      expect(generateAccessToken).toHaveBeenCalledWith(mockUserPayload);
      
      // Verify new cookie was set
      expect(createCookieString).toHaveBeenCalled();
    });

    it('should reject refresh with invalid token', async () => {
      vi.mocked(verifyToken).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        headers: {
          cookie: 'test_refresh=invalid-token',
        },
      });

      const response = await refreshPOST(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.code).toBe('INVALID_REFRESH_TOKEN');
    });

    it('should reject refresh without token', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
      });

      const response = await refreshPOST(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.code).toBe('REFRESH_TOKEN_REQUIRED');
    });
  });

  describe('User Info API (/api/auth/me)', () => {
    it('should return user info for valid token', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/me', {
        method: 'GET',
        headers: {
          cookie: 'test_session=mock-access-token',
        },
      });

      const response = await mePOST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.user).toEqual(mockUserPayload);

      // Verify getCurrentUser was called
      expect(getCurrentUser).toHaveBeenCalledWith(request);
    });

    it('should reject request without valid token', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/auth/me', {
        method: 'GET',
      });

      const response = await mePOST(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should apply rate limiting after multiple failed attempts', async () => {
      vi.mocked(verifyPassword).mockResolvedValue(false);

      const requests = [];
      for (let i = 0; i < 6; i++) {
        const request = new NextRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': '192.168.1.100',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'wrongPassword',
          }),
        });
        requests.push(loginPOST(request));
      }

      const responses = await Promise.all(requests);
      const lastResponse = responses[responses.length - 1];
      const lastResponseData = await lastResponse.json();

      // The last request should be rate limited
      expect(lastResponse.status).toBe(429);
      expect(lastResponseData.code).toBe('RATE_LIMITED');
    });

    it('should apply account lockout after multiple failed attempts', async () => {
      vi.mocked(verifyPassword).mockResolvedValue(false);

      // Simulate 5 failed attempts for the same email
      for (let i = 0; i < 5; i++) {
        const request = new NextRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': `192.168.1.${100 + i}`, // Different IPs to avoid IP rate limiting
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'wrongPassword',
          }),
        });
        await loginPOST(request);
      }

      // 6th attempt should be account locked
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.200',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongPassword',
        }),
      });

      const response = await loginPOST(request);
      const responseData = await response.json();

      expect(response.status).toBe(423);
      expect(responseData.code).toBe('ACCOUNT_LOCKED');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error('Database connection failed')),
          }),
        }),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'validPassword123!',
        }),
      });

      const response = await loginPOST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.code).toBe('INTERNAL_ERROR');
    });

    it('should handle malformed JSON gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: 'invalid-json{',
      });

      const response = await loginPOST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('Security Headers and Logging', () => {
    it('should log login attempts', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.100',
          'user-agent': 'Mozilla/5.0 Test Browser',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'validPassword123!',
        }),
      });

      await loginPOST(request);

      // Verify audit logging was called
      expect(supabase.rpc).toHaveBeenCalledWith('log_login_attempt', {
        p_email: 'test@example.com',
        p_ip_address: '192.168.1.100',
        p_user_agent: 'Mozilla/5.0 Test Browser',
        p_success: true,
        p_failure_reason: null,
      });
    });

    it('should extract IP from various headers', async () => {
      const testCases = [
        { header: 'x-forwarded-for', value: '203.0.113.1, 192.168.1.1' },
        { header: 'x-real-ip', value: '203.0.113.2' },
        { header: 'x-vercel-forwarded-for', value: '203.0.113.3' },
      ];

      for (const testCase of testCases) {
        const request = new NextRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            [testCase.header]: testCase.value,
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'validPassword123!',
          }),
        });

        await loginPOST(request);

        const expectedIP = testCase.header === 'x-forwarded-for' 
          ? testCase.value.split(',')[0].trim()
          : testCase.value;

        expect(supabase.rpc).toHaveBeenCalledWith('log_login_attempt', 
          expect.objectContaining({
            p_ip_address: expectedIP,
          })
        );
      }
    });
  });

  describe('Session Management', () => {
    it('should create active session on successful login', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.100',
          'user-agent': 'Mozilla/5.0 Test Browser',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'validPassword123!',
        }),
      });

      await loginPOST(request);

      // Verify active session creation was called
      expect(supabase.rpc).toHaveBeenCalledWith('create_active_session', 
        expect.objectContaining({
          p_user_id: mockUser.id,
          p_refresh_token_hash: 'mock-refresh-token',
          p_ip_address: '192.168.1.100',
          p_user_agent: 'Mozilla/5.0 Test Browser',
        })
      );
    });

    it('should clean up session on logout', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          cookie: 'test_session=mock-access-token; test_refresh=mock-refresh-token',
        },
      });

      await logoutPOST(request);

      // Verify session cleanup was called
      expect(supabase.rpc).toHaveBeenCalledWith('cleanup_user_sessions', 
        expect.objectContaining({
          p_refresh_token: 'mock-token',
        })
      );
    });
  });
});