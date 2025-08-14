'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserRole } from '@/types/auth';

/**
 * Secure route configuration
 */
interface SecureRouteConfig {
  requiredRoles?: UserRole[];
  requiredPermissions?: string[];
  requireAll?: boolean; // If true, user must have ALL permissions/roles, if false, ANY
  redirectTo?: string;
  allowUnauthenticated?: boolean;
}

/**
 * Secure route return interface
 */
interface UseSecureRouteReturn {
  isAuthorized: boolean;
  isLoading: boolean;
  redirectToLogin: () => void;
  redirectTo: (path: string) => void;
  error: string | null;
}

/**
 * Hook for component-level route protection
 * Provides authorization checking and automatic redirection
 */
export function useSecureRoute(config: SecureRouteConfig = {}): UseSecureRouteReturn {
  const {
    requiredRoles = [],
    requiredPermissions = [],
    requireAll = false,
    redirectTo = '/login',
    allowUnauthenticated = false,
  } = config;

  const { user, isLoading: authLoading, hasPermission, hasRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Redirect to login page
   */
  const redirectToLogin = useCallback(() => {
    const currentPath = encodeURIComponent(pathname);
    router.push(`/login?redirect=${currentPath}`);
  }, [router, pathname]);

  /**
   * Redirect to specific path
   */
  const redirectToPath = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  /**
   * Check if user meets role requirements
   */
  const checkRoleRequirements = useCallback((): boolean => {
    if (requiredRoles.length === 0) return true;
    
    if (requireAll) {
      // User must have ALL required roles
      return requiredRoles.every(role => hasRole([role]));
    } else {
      // User must have ANY of the required roles
      return requiredRoles.some(role => hasRole([role]));
    }
  }, [requiredRoles, requireAll, hasRole]);

  /**
   * Check if user meets permission requirements
   */
  const checkPermissionRequirements = useCallback((): boolean => {
    if (requiredPermissions.length === 0) return true;
    
    if (requireAll) {
      // User must have ALL required permissions
      return requiredPermissions.every(permission => hasPermission(permission));
    } else {
      // User must have ANY of the required permissions
      return requiredPermissions.some(permission => hasPermission(permission));
    }
  }, [requiredPermissions, requireAll, hasPermission]);

  /**
   * Perform authorization check
   */
  const checkAuthorization = useCallback(() => {
    setIsLoading(true);
    setError(null);

    try {
      // If unauthenticated access is allowed and no user, allow access
      if (allowUnauthenticated && !user) {
        setIsAuthorized(true);
        setIsLoading(false);
        return;
      }

      // If user is required but not present, deny access
      if (!user && !allowUnauthenticated) {
        setIsAuthorized(false);
        setError('Authentication required');
        setIsLoading(false);
        return;
      }

      // If user is present, check role and permission requirements
      if (user) {
        const hasRequiredRoles = checkRoleRequirements();
        const hasRequiredPermissions = checkPermissionRequirements();

        if (hasRequiredRoles && hasRequiredPermissions) {
          setIsAuthorized(true);
          setError(null);
        } else {
          setIsAuthorized(false);
          setError('Insufficient permissions');
        }
      }
    } catch (err) {
      console.error('Authorization check error:', err);
      setIsAuthorized(false);
      setError('Authorization check failed');
    } finally {
      setIsLoading(false);
    }
  }, [
    user,
    allowUnauthenticated,
    checkRoleRequirements,
    checkPermissionRequirements,
  ]);

  /**
   * Run authorization check when dependencies change
   */
  useEffect(() => {
    if (!authLoading) {
      checkAuthorization();
    }
  }, [authLoading, checkAuthorization]);

  /**
   * Handle automatic redirection for unauthorized access
   */
  useEffect(() => {
    if (!isLoading && !isAuthorized && !allowUnauthenticated) {
      if (!user) {
        // No user, redirect to login
        redirectToLogin();
      } else {
        // User exists but lacks permissions, redirect to specified path
        redirectToPath(redirectTo);
      }
    }
  }, [isLoading, isAuthorized, user, allowUnauthenticated, redirectToLogin, redirectToPath, redirectTo]);

  return {
    isAuthorized,
    isLoading: authLoading || isLoading,
    redirectToLogin,
    redirectTo: redirectToPath,
    error,
  };
}

/**
 * Hook for protecting routes that require authentication
 * @param redirectTo - Path to redirect to if not authenticated
 */
export function useRequireAuth(redirectTo: string = '/login'): UseSecureRouteReturn {
  return useSecureRoute({
    allowUnauthenticated: false,
    redirectTo,
  });
}

/**
 * Hook for protecting routes that require specific roles
 * @param roles - Required roles
 * @param requireAll - If true, user must have ALL roles
 * @param redirectTo - Path to redirect to if unauthorized
 */
export function useRequireRoles(
  roles: UserRole[],
  requireAll: boolean = false,
  redirectTo: string = '/unauthorized'
): UseSecureRouteReturn {
  return useSecureRoute({
    requiredRoles: roles,
    requireAll,
    redirectTo,
  });
}

/**
 * Hook for protecting routes that require specific permissions
 * @param permissions - Required permissions
 * @param requireAll - If true, user must have ALL permissions
 * @param redirectTo - Path to redirect to if unauthorized
 */
export function useRequirePermissions(
  permissions: string[],
  requireAll: boolean = false,
  redirectTo: string = '/unauthorized'
): UseSecureRouteReturn {
  return useSecureRoute({
    requiredPermissions: permissions,
    requireAll,
    redirectTo,
  });
}

/**
 * Hook for admin-only routes
 * @param redirectTo - Path to redirect to if not admin
 */
export function useRequireAdmin(redirectTo: string = '/unauthorized'): UseSecureRouteReturn {
  return useSecureRoute({
    requiredRoles: ['super_admin', 'admin'],
    requireAll: false,
    redirectTo,
  });
}

/**
 * Hook for super admin-only routes
 * @param redirectTo - Path to redirect to if not super admin
 */
export function useRequireSuperAdmin(redirectTo: string = '/unauthorized'): UseSecureRouteReturn {
  return useSecureRoute({
    requiredRoles: ['super_admin'],
    requireAll: true,
    redirectTo,
  });
}

/**
 * Hook for routes that allow both authenticated and unauthenticated access
 * but provide different behavior based on auth status
 */
export function useOptionalAuth(): {
  isAuthenticated: boolean;
  user: any;
  isLoading: boolean;
} {
  const { user, isLoading } = useAuth();
  
  return {
    isAuthenticated: !!user,
    user,
    isLoading,
  };
}