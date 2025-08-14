'use client';

import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UserPayload } from '@/lib/jwt';
import { UserRole, hasPermission as checkPermission, hasRole as checkRole } from '@/types/auth';
import { useOptimizedState, useStableCallback } from '@/lib/react-optimization';

/**
 * Authentication context interface
 */
interface AuthContextType {
  user: UserPayload | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Authentication context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication provider props
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Authentication provider component
 * Manages user authentication state, token refresh, and session persistence
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // Use optimized state management
  const [user, setUser] = useOptimizedState<UserPayload | null>(null);
  const [isLoading, setIsLoading] = useOptimizedState(true);
  const [error, setError] = useOptimizedState<string | null>(null);
  const router = useRouter();
  
  // Refs to prevent multiple simultaneous refresh attempts
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cache user permissions to avoid repeated calculations
  const userPermissionsRef = useRef<{ permissions: string[]; roles: string[] } | null>(null);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Check if user has specific permission (with caching)
   */
  const hasPermission = useStableCallback((permission: string): boolean => {
    if (!user) return false;
    
    // Use cached permissions if available
    if (userPermissionsRef.current) {
      return userPermissionsRef.current.permissions.includes(permission) || 
             userPermissionsRef.current.permissions.includes('*');
    }
    
    // Fallback to direct check
    return checkPermission(user.rol as UserRole, permission);
  }, [user]);

  /**
   * Check if user has specific role(s)
   */
  const hasRole = useCallback((roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return checkRole(user.rol as UserRole, roleArray);
  }, [user]);

  /**
   * Refresh access token using refresh token
   */
  const refreshToken = useCallback(async (): Promise<void> => {
    // If there's already a refresh in progress, wait for it
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const refreshPromise = (async () => {
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Token refresh failed');
        }

        const data = await response.json();
        
        if (data.success && data.user) {
          setUser(data.user);
          setError(null);
          
          // Schedule next refresh
          scheduleTokenRefresh();
        } else {
          throw new Error(data.message || 'Token refresh failed');
        }
      } catch (error) {
        setError('Session expired. Please log in again.');
        setUser(null);
        
        // Clear any scheduled refresh
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
          refreshTimeoutRef.current = null;
        }
        
        // Redirect to login
        router.push('/login');
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = refreshPromise;
    return refreshPromise;
  }, [router]);

  /**
   * Schedule automatic token refresh (12 minutes for 15-minute tokens)
   */
  const scheduleTokenRefresh = useCallback(() => {
    // Clear existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Schedule refresh for 10 minutes (5 minutes before expiration)
    // This gives more buffer time and reduces the chance of conflicts
    refreshTimeoutRef.current = setTimeout(() => {
      if (refreshPromiseRef.current) return; // Prevent multiple refreshes
      
      // Call refresh directly to avoid circular dependency
      const refreshPromise = (async () => {
        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Token refresh failed');
          }

          const data = await response.json();
          
          if (data.success && data.user) {
            setUser(data.user);
            setError(null);
            
            // Schedule next refresh
            scheduleTokenRefresh();
          } else {
            throw new Error(data.message || 'Token refresh failed');
          }
        } catch (error) {
          setError('Session expired. Please log in again.');
          setUser(null);
          
          // Clear any scheduled refresh
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
            refreshTimeoutRef.current = null;
          }
          
          // Redirect to login
          router.push('/login');
        } finally {
          refreshPromiseRef.current = null;
        }
      })();

      refreshPromiseRef.current = refreshPromise;
    }, 10 * 60 * 1000); // 10 minutes in milliseconds
  }, [router]);

  /**
   * Login function
   */
  const login = useCallback(async (email: string, password: string, rememberMe: boolean = false): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.success && data.user) {
        setUser(data.user);
        setError(null);
        
        // Schedule automatic token refresh (temporarily disabled)
        // scheduleTokenRefresh();
        
        // Redirect to dashboard or intended page
        router.push('/');
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  /**
   * Logout function
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Clear scheduled refresh
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      
      // Clear refresh promise
      refreshPromiseRef.current = null;

      // Call logout API to invalidate tokens
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Clear user state
      setUser(null);
      setError(null);
      
      // Redirect to login
      router.push('/login');
    } catch (error) {
      // Even if logout API fails, clear local state
      setUser(null);
      setError(null);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  /**
   * Check current authentication status on mount and page refresh
   */
  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.user) {
          setUser(data.user);
          setError(null);
          
          // Schedule automatic token refresh
          scheduleTokenRefresh();
        } else {
          setUser(null);
        }
      } else {
        // If unauthorized, try to refresh token
        if (response.status === 401) {
          try {
            await refreshToken();
          } catch (refreshError) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [refreshToken]);

  /**
   * Initialize authentication on mount
   */
  useEffect(() => {
    checkAuthStatus();
    
    // Cleanup on unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [checkAuthStatus]);

  /**
   * Handle visibility change to refresh token when tab becomes active
   * Temporarily disabled to prevent refresh loops
   */
  useEffect(() => {
    // Disabled for now to prevent refresh loops
    // const handleVisibilityChange = () => {
    //   if (!document.hidden && user) {
    //     // Check if we need to refresh when tab becomes visible
    //     refreshToken().catch(() => {
    //       // Refresh failed, user will be logged out
    //     });
    //   }
    // };

    // document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // return () => {
    //   document.removeEventListener('visibilitychange', handleVisibilityChange);
    // };
  }, [user, refreshToken]);

  /**
   * Handle storage events for cross-tab logout
   */
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'ares_logout' && event.newValue) {
        // Another tab logged out, clear this tab's state
        setUser(null);
        setError(null);
        
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
          refreshTimeoutRef.current = null;
        }
        
        router.push('/login');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [router]);

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshToken,
    hasPermission,
    hasRole,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 * @returns AuthContextType - Authentication context
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * Hook to get current user
 * @returns UserPayload | null - Current user or null
 */
export function useCurrentUser(): UserPayload | null {
  const { user } = useAuth();
  return user;
}

/**
 * Hook to check if user is authenticated
 * @returns boolean - True if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

/**
 * Hook to check permissions
 * @returns Function to check permissions
 */
export function usePermissions() {
  const { hasPermission, hasRole } = useAuth();
  
  return {
    hasPermission,
    hasRole,
  };
}