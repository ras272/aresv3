import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '../middleware';

// Mock JWT functions
const mockGetCurrentUser = vi.fn();
const mockVerifyToken = vi.fn();
const mockIsTokenBlacklisted = vi.fn();

vi.mock('@/lib/jwt', () => ({
  getCurrentUser: mockGetCurrentUser,
  verifyToken: mockVerifyToken,
  isTokenBlacklisted: mockIsTokenBlacklisted,
  COOKIE_CONFIG: {
    ACCESS_TOKEN: {
      name: 'test_session',
    },
  },
}));

describe('Middleware Integration Tests', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    nombre: 'Test User',
    rol: 'admin',
    activo: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default to authenticated user
    mockGetCurrentUser.mockResolvedValue(mockUser);
    mockVerifyToken.mockResolvedValue({
      ...mockUser,
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
      iss: 'test-app',
    });
    mockIsTokenBlacklisted.mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Public Routes', () => {
    const publicRoutes = [
      '/login',
      '/api/auth/login',
      '/api/auth/refresh',
      '/',
      '/public-page',
    ];

    publicRoutes.forEach(route => {
      it(`should allow access to public route: ${route}`, async () => {
        const request = new NextRequest(`http://localhost:3000${route}`);
        
        const response = await middleware(request);
        
        // Should not redirect or block
        expect(response).toBeUndefined();
      });
    });
  });

  describe('Protected Routes', () => {
    const protectedRoutes = [
      '/equipos',
      '/inventario-tecnico',
      '/mercaderias',
      '/stock',
      '/remisiones',
      '/usuarios',
      '/clinicas',
      '/documentos',
      '/archivos',
      '/reportes',
      '/servtec',
    ];

    protectedRoutes.forEach(route => {
      it(`should allow authenticated access to protected route: ${route}`, async () => {
        const request = new NextRequest(`http://localhost:3000${route}`, {
          headers: {
            cookie: 'test_session=valid-token',
          },
        });
        
        const response = await middleware(request);
        
        // Should allow access
        expect(response).toBeUndefined();
        expect(mockGetCurrentUser).toHaveBeenCalledWith(request);
      });

      it(`should redirect unauthenticated access to protected route: ${route}`, async () => {
        mockGetCurrentUser.mockResolvedValue(null);
        
        const request = new NextRequest(`http://localhost:3000${route}`);
        
        const response = await middleware(request);
        
        expect(response).toBeInstanceOf(NextResponse);
        expect(response?.status).toBe(302);
        expect(response?.headers.get('location')).toBe('/login');
      });
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow admin access to all routes', async () => {
      const adminUser = { ...mockUser, rol: 'admin' };
      mockGetCurrentUser.mockResolvedValue(adminUser);
      
      const request = new NextRequest('http://localhost:3000/usuarios', {
        headers: {
          cookie: 'test_session=admin-token',
        },
      });
      
      const response = await middleware(request);
      
      expect(response).toBeUndefined();
    });

    it('should allow super_admin access to all routes', async () => {
      const superAdminUser = { ...mockUser, rol: 'super_admin' };
      mockGetCurrentUser.mockResolvedValue(superAdminUser);
      
      const request = new NextRequest('http://localhost:3000/usuarios', {
        headers: {
          cookie: 'test_session=super-admin-token',
        },
      });
      
      const response = await middleware(request);
      
      expect(response).toBeUndefined();
    });

    it('should restrict tecnico access to admin-only routes', async () => {
      const tecnicoUser = { ...mockUser, rol: 'tecnico' };
      mockGetCurrentUser.mockResolvedValue(tecnicoUser);
      
      const request = new NextRequest('http://localhost:3000/usuarios', {
        headers: {
          cookie: 'test_session=tecnico-token',
        },
      });
      
      const response = await middleware(request);
      
      // Should redirect to unauthorized or home page
      expect(response).toBeInstanceOf(NextResponse);
      expect(response?.status).toBe(302);
    });

    it('should allow tecnico access to appropriate routes', async () => {
      const tecnicoUser = { ...mockUser, rol: 'tecnico' };
      mockGetCurrentUser.mockResolvedValue(tecnicoUser);
      
      const request = new NextRequest('http://localhost:3000/servtec', {
        headers: {
          cookie: 'test_session=tecnico-token',
        },
      });
      
      const response = await middleware(request);
      
      expect(response).toBeUndefined();
    });
  });

  describe('Token Validation', () => {
    it('should reject blacklisted tokens', async () => {
      mockIsTokenBlacklisted.mockReturnValue(true);
      mockGetCurrentUser.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost:3000/equipos', {
        headers: {
          cookie: 'test_session=blacklisted-token',
        },
      });
      
      const response = await middleware(request);
      
      expect(response).toBeInstanceOf(NextResponse);
      expect(response?.status).toBe(302);
      expect(response?.headers.get('location')).toBe('/login');
    });

    it('should reject expired tokens', async () => {
      mockVerifyToken.mockResolvedValue(null);
      mockGetCurrentUser.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost:3000/equipos', {
        headers: {
          cookie: 'test_session=expired-token',
        },
      });
      
      const response = await middleware(request);
      
      expect(response).toBeInstanceOf(NextResponse);
      expect(response?.status).toBe(302);
      expect(response?.headers.get('location')).toBe('/login');
    });

    it('should handle malformed tokens gracefully', async () => {
      mockGetCurrentUser.mockRejectedValue(new Error('Invalid token format'));
      
      const request = new NextRequest('http://localhost:3000/equipos', {
        headers: {
          cookie: 'test_session=malformed-token',
        },
      });
      
      const response = await middleware(request);
      
      expect(response).toBeInstanceOf(NextResponse);
      expect(response?.status).toBe(302);
      expect(response?.headers.get('location')).toBe('/login');
    });
  });

  describe('Token Refresh Logic', () => {
    it('should handle near-expiry tokens', async () => {
      // Mock token that expires in 2 minutes
      const nearExpiryToken = {
        ...mockUser,
        type: 'access' as const,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 120, // 2 minutes
        iss: 'test-app',
      };
      
      mockVerifyToken.mockResolvedValue(nearExpiryToken);
      
      const request = new NextRequest('http://localhost:3000/equipos', {
        headers: {
          cookie: 'test_session=near-expiry-token; test_refresh=refresh-token',
        },
      });
      
      const response = await middleware(request);
      
      // Should still allow access but might set refresh headers
      expect(response).toBeUndefined();
    });
  });

  describe('API Route Protection', () => {
    it('should protect API routes that require authentication', async () => {
      mockGetCurrentUser.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost:3000/api/protected-endpoint');
      
      const response = await middleware(request);
      
      expect(response).toBeInstanceOf(NextResponse);
      expect(response?.status).toBe(401);
    });

    it('should allow authenticated API access', async () => {
      const request = new NextRequest('http://localhost:3000/api/protected-endpoint', {
        headers: {
          authorization: 'Bearer valid-token',
        },
      });
      
      const response = await middleware(request);
      
      expect(response).toBeUndefined();
    });
  });

  describe('Header-based Authentication', () => {
    it('should authenticate using Authorization header', async () => {
      const request = new NextRequest('http://localhost:3000/equipos', {
        headers: {
          authorization: 'Bearer valid-token',
        },
      });
      
      const response = await middleware(request);
      
      expect(response).toBeUndefined();
      expect(mockGetCurrentUser).toHaveBeenCalledWith(request);
    });

    it('should prioritize cookie over Authorization header', async () => {
      const request = new NextRequest('http://localhost:3000/equipos', {
        headers: {
          cookie: 'test_session=cookie-token',
          authorization: 'Bearer header-token',
        },
      });
      
      const response = await middleware(request);
      
      expect(response).toBeUndefined();
      expect(mockGetCurrentUser).toHaveBeenCalledWith(request);
    });
  });

  describe('Inactive User Handling', () => {
    it('should reject inactive users', async () => {
      const inactiveUser = { ...mockUser, activo: false };
      mockGetCurrentUser.mockResolvedValue(inactiveUser);
      
      const request = new NextRequest('http://localhost:3000/equipos', {
        headers: {
          cookie: 'test_session=inactive-user-token',
        },
      });
      
      const response = await middleware(request);
      
      expect(response).toBeInstanceOf(NextResponse);
      expect(response?.status).toBe(302);
      expect(response?.headers.get('location')).toBe('/login');
    });
  });

  describe('Path Matching', () => {
    it('should handle nested protected routes', async () => {
      const request = new NextRequest('http://localhost:3000/equipos/edit/123', {
        headers: {
          cookie: 'test_session=valid-token',
        },
      });
      
      const response = await middleware(request);
      
      expect(response).toBeUndefined();
    });

    it('should handle query parameters', async () => {
      const request = new NextRequest('http://localhost:3000/equipos?page=1&limit=10', {
        headers: {
          cookie: 'test_session=valid-token',
        },
      });
      
      const response = await middleware(request);
      
      expect(response).toBeUndefined();
    });

    it('should handle hash fragments', async () => {
      const request = new NextRequest('http://localhost:3000/equipos#section1', {
        headers: {
          cookie: 'test_session=valid-token',
        },
      });
      
      const response = await middleware(request);
      
      expect(response).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication service errors gracefully', async () => {
      mockGetCurrentUser.mockRejectedValue(new Error('Authentication service unavailable'));
      
      const request = new NextRequest('http://localhost:3000/equipos');
      
      const response = await middleware(request);
      
      expect(response).toBeInstanceOf(NextResponse);
      expect(response?.status).toBe(302);
      expect(response?.headers.get('location')).toBe('/login');
    });

    it('should handle network timeouts', async () => {
      mockGetCurrentUser.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );
      
      const request = new NextRequest('http://localhost:3000/equipos');
      
      const response = await middleware(request);
      
      expect(response).toBeInstanceOf(NextResponse);
      expect(response?.status).toBe(302);
    });
  });

  describe('Performance', () => {
    it('should complete authentication check within reasonable time', async () => {
      const startTime = Date.now();
      
      const request = new NextRequest('http://localhost:3000/equipos', {
        headers: {
          cookie: 'test_session=valid-token',
        },
      });
      
      await middleware(request);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 1 second
      expect(duration).toBeLessThan(1000);
    });

    it('should handle concurrent requests efficiently', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => 
        new NextRequest(`http://localhost:3000/equipos?id=${i}`, {
          headers: {
            cookie: 'test_session=valid-token',
          },
        })
      );
      
      const startTime = Date.now();
      const responses = await Promise.all(requests.map(req => middleware(req)));
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      
      // All requests should complete within 2 seconds
      expect(duration).toBeLessThan(2000);
      
      // All should be successful
      responses.forEach(response => {
        expect(response).toBeUndefined();
      });
    });
  });
});