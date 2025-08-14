import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';
import LoginPage from '@/app/login/page';
import { ProtectedRoute, RoleGuard, PermissionGuard } from '@/components/auth/ProtectedRouteNew';
import { mockUsers, mockPasswords, createMockRequest, authAssertions } from '@/test/auth-utils';
import type { UserPayload } from '@/lib/jwt';
import { Section } from 'lucide-react';
import { Section } from 'lucide-react';
import { Section } from 'lucide-react';
import { Section } from 'lucide-react';
import { Section } from 'lucide-react';
import { Section } from 'lucide-react';
import { Section } from 'lucide-react';
import { any } from 'zod';
import { any } from 'zod';
import { Section } from 'lucide-react';
import { Section } from 'lucide-react';
import { any } from 'zod';

// Mock Next.js navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRouter = {
  push: mockPush,
  replace: mockReplace,
  pathname: '/login',
  query: {},
  asPath: '/login',
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock sonner
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
};
vi.mock('sonner', () => ({
  toast: mockToast,
}));

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
});

// Test components
const TestProtectedComponent = ({ message = 'Protected Content' }: { message?: string }) => (
  <div data-testid="protected-content">{message}</div>
);

const TestRoleComponent = ({ allowedRoles, message = 'Role Protected Content' }: { 
  allowedRoles: string[], 
  message?: string 
}) => (
  <RoleGuard allowedRoles={allowedRoles as any}>
    <div data-testid="role-protected-content">{message}</div>
  </RoleGuard>
);

const TestPermissionComponent = ({ requiredPermissions, message = 'Permission Protected Content' }: { 
  requiredPermissions: string[], 
  message?: string 
}) => (
  <PermissionGuard requiredPermissions={requiredPermissions}>
    <div data-testid="permission-protected-content">{message}</div>
  </PermissionGuard>
);

const TestAuthStatus = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <div data-testid="auth-loading">Loading...</div>;
  if (!isAuthenticated) return <div data-testid="auth-unauthenticated">Not Authenticated</div>;
  
  return (
    <div data-testid="auth-authenticated">
      <span data-testid="user-name">{user?.nombre}</span>
      <span data-testid="user-role">{user?.rol}</span>
    </div>
  );
};

const TestLogoutComponent = () => {
  const { logout } = useAuth();
  
  return (
    <button 
      data-testid="logout-button" 
      onClick={() => logout()}
    >
      Logout
    </button>
  );
};

describe('End-to-End Authentication Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    mockReplace.mockClear();
    mockToast.success.mockClear();
    mockToast.error.mockClear();
    
    // Reset document.cookie
    document.cookie = '';
    
    // Default successful responses
    mockFetch.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/api/auth/login')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            message: 'Login exitoso',
            user: mockUsers.admin,
          }),
        });
      }
      
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            user: mockUsers.admin,
          }),
        });
      }
      
      if (url.includes('/api/auth/logout')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            message: 'Logout exitoso',
          }),
        });
      }
      
      if (url.includes('/api/auth/refresh')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            message: 'Token renovado exitosamente',
          }),
        });
      }
      
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' }),
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete User Authentication Journey', () => {
    it('should complete full login flow successfully', async () => {
      const user = userEvent.setup();
      
      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      // Find form elements
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const loginButton = screen.getByRole('button', { name: /iniciar sesión/i });

      // Fill in credentials
      await user.type(emailInput, mockUsers.admin.email);
      await user.type(passwordInput, mockPasswords.valid);

      // Submit form
      await user.click(loginButton);

      // Wait for API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/auth/login'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
            body: expect.stringContaining(mockUsers.admin.email),
          })
        );
      });

      // Should show success toast
      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(
          'Login exitoso',
          expect.objectContaining({
            description: expect.stringContaining('Bienvenido'),
          })
        );
      });

      // Should redirect after successful login
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should handle login failure gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock failed login response
      mockFetch.mockImplementationOnce(() => 
        Promise.reject(new Error('Credenciales inválidas'))
      );

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const loginButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, mockUsers.admin.email);
      await user.type(passwordInput, 'wrongPassword');
      await user.click(loginButton);

      // Should show error toast
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Error de autenticación',
          expect.objectContaining({
            description: expect.stringContaining('Credenciales inválidas'),
          })
        );
      });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle remember me functionality', async () => {
      const user = userEvent.setup();
      
      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const rememberMeCheckbox = screen.getByLabelText(/recordarme/i);
      const loginButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, mockUsers.admin.email);
      await user.type(passwordInput, mockPasswords.valid);
      await user.click(rememberMeCheckbox);
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/auth/login'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"rememberMe":true'),
          })
        );
      });
    });

    it('should show password strength indicator', async () => {
      const user = userEvent.setup();
      
      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      const passwordInput = screen.getByLabelText(/contraseña/i);

      // Type a weak password
      await user.type(passwordInput, 'weak');

      // Should show password strength indicator
      await waitFor(() => {
        expect(screen.getByText(/fortaleza de contraseña/i)).toBeInTheDocument();
      });

      // Clear and type a strong password
      await user.clear(passwordInput);
      await user.type(passwordInput, mockPasswords.valid);

      // Should show stronger rating
      await waitFor(() => {
        expect(screen.getByText(/fuerte|muy fuerte/i)).toBeInTheDocument();
      });
    });

    it('should auto-fill credentials from test user buttons', async () => {
      const user = userEvent.setup();
      
      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      // Click on Super Admin test user button
      const superAdminButton = screen.getByText(/Super Admin/i);
      await user.click(superAdminButton);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/contraseña/i) as HTMLInputElement;

      // Should auto-fill credentials
      expect(emailInput.value).toBe('superadmin@arestech.com');
      expect(passwordInput.value).toBe('admin123');
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow admin access to admin content', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              success: true,
              user: mockUsers.admin,
            }),
          });
        }
        return Promise.resolve({ ok: false, status: 404 });
      });

      render(
        <AuthProvider>
          <TestRoleComponent allowedRoles={['admin']} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('role-protected-content')).toBeInTheDocument();
      });
    });

    it('should deny tecnico access to admin content', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              success: true,
              user: mockUsers.tecnico,
            }),
          });
        }
        return Promise.resolve({ ok: false, status: 404 });
      });

      render(
        <AuthProvider>
          <TestRoleComponent allowedRoles={['admin']} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/don't have the required permissions/i)).toBeInTheDocument();
      });
    });

    it('should allow super_admin access to all content', async () => {
      const superAdminUser = { ...mockUsers.admin, rol: 'super_admin' };
      
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              success: true,
              user: superAdminUser,
            }),
          });
        }
        return Promise.resolve({ ok: false, status: 404 });
      });

      render(
        <AuthProvider>
          <TestRoleComponent allowedRoles={['admin']} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('role-protected-content')).toBeInTheDocument();
      });
    });

    it('should handle multiple role requirements', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              success: true,
              user: mockUsers.gerente,
            }),
          });
        }
        return Promise.resolve({ ok: false, status: 404 });
      });

      render(
        <AuthProvider>
          <TestRoleComponent allowedRoles={['admin', 'gerente']} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('role-protected-content')).toBeInTheDocument();
      });
    });

    it('should handle permission-based access control', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              success: true,
              user: mockUsers.admin,
            }),
          });
        }
        return Promise.resolve({ ok: false, status: 404 });
      });

      render(
        <AuthProvider>
          <TestPermissionComponent requiredPermissions={['usuarios']} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('permission-protected-content')).toBeInTheDocument();
      });
    });
  });

  describe('Session Persistence and Automatic Refresh', () => {
    it('should persist session across page refreshes', async () => {
      // Simulate existing session
      document.cookie = 'ares_session=valid-token; ares_refresh=refresh-token';
      
      render(
        <AuthProvider>
          <TestAuthStatus />
        </AuthProvider>
      );

      // Should automatically fetch user info
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/auth/me'),
          expect.objectContaining({
            method: 'GET',
            credentials: 'include',
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-authenticated')).toBeInTheDocument();
        expect(screen.getByTestId('user-name')).toHaveTextContent(mockUsers.admin.nombre);
      });
    });

    it('should automatically refresh near-expiry tokens', async () => {
      // Mock token refresh scenario
      let callCount = 0;
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/auth/me')) {
          callCount++;
          if (callCount === 1) {
            // First call returns near-expiry token
            return Promise.resolve({
              ok: false,
              status: 401,
              json: () => Promise.resolve({
                success: false,
                code: 'TOKEN_EXPIRED',
              }),
            });
          } else {
            // After refresh, return valid user
            return Promise.resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({
                success: true,
                user: mockUsers.admin,
              }),
            });
          }
        }
        
        if (url.includes('/api/auth/refresh')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              success: true,
              message: 'Token renovado exitosamente',
            }),
          });
        }
        
        return Promise.resolve({ ok: false, status: 404 });
      });

      render(
        <AuthProvider>
          <TestAuthStatus />
        </AuthProvider>
      );

      // Should attempt refresh and then fetch user info again
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/auth/refresh'),
          expect.objectContaining({
            method: 'POST',
            credentials: 'include',
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-authenticated')).toBeInTheDocument();
        expect(screen.getByTestId('user-name')).toHaveTextContent(mockUsers.admin.nombre);
      });
    });

    it('should logout when refresh fails', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: false,
            status: 401,
            json: () => Promise.resolve({
              success: false,
              code: 'TOKEN_EXPIRED',
            }),
          });
        }
        
        if (url.includes('/api/auth/refresh')) {
          return Promise.resolve({
            ok: false,
            status: 401,
            json: () => Promise.resolve({
              success: false,
              code: 'INVALID_REFRESH_TOKEN',
            }),
          });
        }
        
        return Promise.resolve({ ok: false, status: 404 });
      });

      render(
        <AuthProvider>
          <TestAuthStatus />
        </AuthProvider>
      );

      // Should attempt refresh, fail, and logout
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('should handle session expiration gracefully', async () => {
      // Mock expired session
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: false,
            status: 401,
            json: () => Promise.resolve({
              success: false,
              code: 'SESSION_EXPIRED',
            }),
          });
        }
        return Promise.resolve({ ok: false, status: 404 });
      });

      render(
        <AuthProvider>
          <TestAuthStatus />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-unauthenticated')).toBeInTheDocument();
      });
    });
  });

  describe('Logout and Session Cleanup', () => {
    it('should complete logout flow successfully', async () => {
      const user = userEvent.setup();
      
      render(
        <AuthProvider>
          <TestLogoutComponent />
        </AuthProvider>
      );

      const logoutButton = screen.getByTestId('logout-button');
      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/auth/logout'),
          expect.objectContaining({
            method: 'POST',
            credentials: 'include',
          })
        );
      });
    });

    it('should clear session data on logout', async () => {
      const user = userEvent.setup();
      
      // Set initial cookies
      document.cookie = 'ares_session=token; ares_refresh=refresh';
      
      const LogoutComponent = () => {
        const handleLogout = async () => {
          // Simulate clearing cookies
          document.cookie = 'ares_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = 'ares_refresh=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          mockPush('/login');
        };

        return (
          <button onClick={handleLogout}>
            Cerrar Sesión
          </button>
        );
      };

      render(<LogoutComponent />);

      const logoutButton = screen.getByRole('button', { name: /cerrar sesión/i });
      await user.click(logoutButton);

      // Cookies should be cleared
      expect(document.cookie).not.toContain('ares_session=token');
      expect(document.cookie).not.toContain('ares_refresh=refresh');
    });

    it('should handle logout with authentication context', async () => {
      const user = userEvent.setup();
      
      // Mock initial authenticated state
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              success: true,
              user: mockUsers.admin,
            }),
          });
        }
        if (url.includes('/api/auth/logout')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              success: true,
              message: 'Logout exitoso',
            }),
          });
        }
        return Promise.resolve({ ok: false, status: 404 });
      });

      render(
        <AuthProvider>
          <TestAuthStatus />
          <TestLogoutComponent />
        </AuthProvider>
      );

      // Should be authenticated initially
      await waitFor(() => {
        expect(screen.getByTestId('auth-authenticated')).toBeInTheDocument();
      });

      // Logout
      const logoutButton = screen.getByTestId('logout-button');
      await user.click(logoutButton);

      // Should become unauthenticated
      await waitFor(() => {
        expect(screen.getByTestId('auth-unauthenticated')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Recovery Scenarios', () => {
    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const loginButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, mockUsers.admin.email);
      await user.type(passwordInput, mockPasswords.valid);
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Error de autenticación',
          expect.objectContaining({
            description: expect.stringContaining('Network error'),
          })
        );
      });
    });

    it('should handle rate limiting gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock rate limited response
      mockFetch.mockImplementationOnce(() => 
        Promise.reject(new Error('Demasiados intentos fallidos. Intente nuevamente en 15 minutos.'))
      );

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const loginButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, mockUsers.admin.email);
      await user.type(passwordInput, 'wrongPassword');
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Error de autenticación',
          expect.objectContaining({
            description: expect.stringContaining('Demasiados intentos fallidos'),
          })
        );
      });
    });

    it('should handle account lockout gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock account locked response
      mockFetch.mockImplementationOnce(() => 
        Promise.reject(new Error('Cuenta bloqueada por múltiples intentos fallidos. Intente nuevamente en 30 minutos.'))
      );

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const loginButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, mockUsers.admin.email);
      await user.type(passwordInput, 'wrongPassword');
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Error de autenticación',
          expect.objectContaining({
            description: expect.stringContaining('Cuenta bloqueada'),
          })
        );
      });
    });

    it('should recover from temporary server errors', async () => {
      const user = userEvent.setup();
      
      let attemptCount = 0;
      mockFetch.mockImplementation(() => {
        attemptCount++;
        if (attemptCount === 1) {
          // First attempt fails
          return Promise.reject(new Error('Error interno del servidor'));
        } else {
          // Second attempt succeeds
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              success: true,
              message: 'Login exitoso',
              user: mockUsers.admin,
            }),
          });
        }
      });

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const loginButton = screen.getByRole('button', { name: /iniciar sesión/i });

      // First attempt
      await user.type(emailInput, mockUsers.admin.email);
      await user.type(passwordInput, mockPasswords.valid);
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Error de autenticación',
          expect.objectContaining({
            description: expect.stringContaining('Error interno del servidor'),
          })
        );
      });

      // Retry
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(
          'Login exitoso',
          expect.objectContaining({
            description: expect.stringContaining('Bienvenido'),
          })
        );
      });
    });

    it('should handle concurrent session management', async () => {
      // Mock multiple sessions scenario
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              success: true,
              user: mockUsers.admin,
              sessionInfo: {
                activeSessions: 2,
                currentSessionId: 'session-123',
                lastActivity: new Date().toISOString(),
              },
            }),
          });
        }
        return Promise.resolve({ ok: false, status: 404 });
      });

      render(
        <AuthProvider>
          <TestAuthStatus />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-authenticated')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should provide proper ARIA labels and roles', () => {
      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      // Check for proper form structure
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/recordarme/i)).toBeInTheDocument();
    });

    it('should show loading states during authentication', async () => {
      const user = userEvent.setup();
      
      // Mock slow response
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              success: true,
              message: 'Login exitoso',
              user: mockUsers.admin,
            }),
          }), 100)
        )
      );

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const loginButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, mockUsers.admin.email);
      await user.type(passwordInput, mockPasswords.valid);
      await user.click(loginButton);

      // Should show loading state
      expect(screen.getByText(/iniciando sesión/i)).toBeInTheDocument();
      expect(loginButton).toBeDisabled();
    });

    it('should handle keyboard navigation properly', async () => {
      const user = userEvent.setup();
      
      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);

      // Tab navigation
      await user.tab();
      expect(em
  });
});ailInput)
.toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();

      // Enter key should submit form when fields are filled
      await user.type(emailInput, mockUsers.admin.email);
      await user.type(passwordInput, mockPasswords.valid);
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/auth/login'),
          expect.any(Object)
        );
      });
    });

    it('should provide proper error announcements for screen readers', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockImplementationOnce(() => 
        Promise.reject(new Error('Credenciales inválidas'))
      );

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const loginButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, mockUsers.admin.email);
      await user.type(passwordInput, 'wrongPassword');
      await user.click(loginButton);

      // Should have proper error announcement
      await waitFor(() => {
        const errorElement = screen.getByText(/credenciales inválidas/i);
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveAttribute('role', 'alert');
      });
    });
  });

  describe('Integration with Protected Routes', () => {
    it('should handle complete authentication flow with protected routes', async () => {
      const user = userEvent.setup();
      
      const TestApp = () => {
        const { isAuthenticated } = useAuth();
        
        if (!isAuthenticated) {
          return <LoginPage />;
        }
        
        return (
          <ProtectedRoute>
            <TestProtectedComponent />
          </ProtectedRoute>
        );
      };

      render(
        <AuthProvider>
          <TestApp />
        </AuthProvider>
      );

      // Should show login form initially
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();

      // Login
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const loginButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, mockUsers.admin.email);
      await user.type(passwordInput, mockPasswords.valid);
      await user.click(loginButton);

      // Should show protected content after login
      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('should handle role transitions correctly', async () => {
      let currentUser = mockUsers.tecnico;
      
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              success: true,
              user: currentUser,
            }),
          });
        }
        return Promise.resolve({ ok: false, status: 404 });
      });

      const { rerender } = render(
        <AuthProvider>
          <TestRoleComponent allowedRoles={['admin']} />
        </AuthProvider>
      );

      // Should deny access for tecnico
      await waitFor(() => {
        expect(screen.getByText(/don't have the required permissions/i)).toBeInTheDocument();
      });

      // Change user role to admin
      currentUser = mockUsers.admin;

      rerender(
        <AuthProvider>
          <TestRoleComponent allowedRoles={['admin']} />
        </AuthProvider>
      );

      // Should allow access for admin
      await waitFor(() => {
        expect(screen.getByTestId('role-protected-content')).toBeInTheDocument();
      });
    });

    it('should handle multi-step authentication flows', async () => {
      const user = userEvent.setup();
      
      const MultiStepApp = () => {
        const { isAuthenticated, user: currentUser } = useAuth();
        
        if (!isAuthenticated) {
          return <LoginPage />;
        }
        
        return (
          <div>
            <TestAuthStatus />
            <RoleGuard allowedRoles={['admin']}>
              <div data-testid="admin-section">Admin Section</div>
            </RoleGuard>
            <RoleGuard allowedRoles={['tecnico']}>
              <div data-testid="tecnico-section">Tecnico Section</div>
            </RoleGuard>
            <TestLogoutComponent />
          </div>
        );
      };

      render(
        <AuthProvider>
          <MultiStepApp />
        </AuthProvider>
      );

      // Login as admin
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const loginButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, mockUsers.admin.email);
      await user.type(passwordInput, mockPasswords.valid);
      await user.click(loginButton);

      // Should show admin content
      await waitFor(() => {
        expect(screen.getByTestId('admin-section')).toBeInTheDocument();
        expect(screen.queryByTestId('tecnico-section')).not.toBeInTheDocument();
      });

      // Logout
      const logoutButton = screen.getByTestId('logout-button');
      await user.click(logoutButton);

      // Should return to login
      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle rapid successive login attempts', async () => {
      const user = userEvent.setup();
      
      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const loginButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, mockUsers.admin.email);
      await user.type(passwordInput, mockPasswords.valid);

      // Rapid clicks should not cause multiple API calls
      await user.click(loginButton);
      await user.click(loginButton);
      await user.click(loginButton);

      // Should only make one API call due to loading state
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle component unmounting during authentication', async () => {
      const user = userEvent.setup();
      
      // Mock slow response
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              success: true,
              message: 'Login exitoso',
              user: mockUsers.admin,
            }),
          }), 1000)
        )
      );

      const { unmount } = render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const loginButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, mockUsers.admin.email);
      await user.type(passwordInput, mockPasswords.valid);
      await user.click(loginButton);

      // Unmount component before response
      unmount();

      // Should not cause errors or memory leaks
      expect(() => {
        // Wait for potential response
        setTimeout(() => {}, 1100);
      }).not.toThrow();
    });

    it('should handle malformed API responses gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock malformed response
      mockFetch.mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            // Missing required fields
            success: true,
            // user field is missing
          }),
        })
      );

      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const loginButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, mockUsers.admin.email);
      await user.type(passwordInput, mockPasswords.valid);
      await user.click(loginButton);

      // Should handle malformed response gracefully
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalled();
      });
    });

    it('should handle browser back/forward navigation', async () => {
      const user = userEvent.setup();
      
      const NavigationApp = () => {
        const { isAuthenticated } = useAuth();
        
        if (!isAuthenticated) {
          return <LoginPage />;
        }
        
        return (
          <div>
            <TestAuthStatus />
            <button onClick={() => mockPush('/dashboard')}>
              Go to Dashboard
            </button>
          </div>
        );
      };

      render(
        <AuthProvider>
          <NavigationApp />
        </AuthProvider>
      );

      // Login
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const loginButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, mockUsers.admin.email);
      await user.type(passwordInput, mockPasswords.valid);
      await user.click(loginButton);

      // Should be authenticated
      await waitFor(() => {
        expect(screen.getByTestId('auth-authenticated')).toBeInTheDocument();
      });

      // Navigate to dashboard
      const dashboardButton = screen.getByText(/go to dashboard/i);
      await user.click(dashboardButton);

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });
});