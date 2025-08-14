'use client';

import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserRole } from '@/types/auth';
import { LoadingSpinner } from './LoadingSpinner';
import { UnauthorizedAccess } from './UnauthorizedAccess';

/**
 * Protected route props
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  unauthorizedComponent?: React.ReactNode;
}

/**
 * Basic protected route component
 * Requires user to be authenticated
 */
export function ProtectedRoute({
  children,
  fallback,
  loadingComponent,
  unauthorizedComponent,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {loadingComponent || <LoadingSpinner />}
      </div>
    );
  }

  // Show unauthorized state
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {unauthorizedComponent || fallback || <UnauthorizedAccess />}
      </div>
    );
  }

  // Render protected content
  return <>{children}</>;
}

/**
 * Role guard props
 */
interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  unauthorizedComponent?: React.ReactNode;
}

/**
 * Role-based access control component
 * Requires user to have specific roles
 */
export function RoleGuard({
  children,
  allowedRoles,
  requireAll = false,
  fallback,
  loadingComponent,
  unauthorizedComponent,
}: RoleGuardProps) {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {loadingComponent || <LoadingSpinner />}
      </div>
    );
  }

  // Check authentication first
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {unauthorizedComponent || fallback || <UnauthorizedAccess message="Authentication required" />}
      </div>
    );
  }

  // Check role requirements
  const hasRequiredRole = requireAll
    ? allowedRoles.every(role => hasRole([role]))
    : allowedRoles.some(role => hasRole([role]));

  if (!hasRequiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {unauthorizedComponent || fallback || (
          <UnauthorizedAccess 
            message="You don't have the required permissions to access this page" 
            requiredRoles={allowedRoles}
          />
        )}
      </div>
    );
  }

  // Render protected content
  return <>{children}</>;
}

/**
 * Permission guard props
 */
interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermissions: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  unauthorizedComponent?: React.ReactNode;
}

/**
 * Permission-based access control component
 * Requires user to have specific permissions
 */
export function PermissionGuard({
  children,
  requiredPermissions,
  requireAll = false,
  fallback,
  loadingComponent,
  unauthorizedComponent,
}: PermissionGuardProps) {
  const { isAuthenticated, isLoading, user, hasPermission } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {loadingComponent || <LoadingSpinner />}
      </div>
    );
  }

  // Check authentication first
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {unauthorizedComponent || fallback || <UnauthorizedAccess message="Authentication required" />}
      </div>
    );
  }

  // Check permission requirements
  const hasRequiredPermission = requireAll
    ? requiredPermissions.every(permission => hasPermission(permission))
    : requiredPermissions.some(permission => hasPermission(permission));

  if (!hasRequiredPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {unauthorizedComponent || fallback || (
          <UnauthorizedAccess 
            message="You don't have the required permissions to access this page" 
            requiredPermissions={requiredPermissions}
          />
        )}
      </div>
    );
  }

  // Render protected content
  return <>{children}</>;
}

/**
 * Admin guard component (shorthand for admin roles)
 */
export function AdminGuard({
  children,
  fallback,
  loadingComponent,
  unauthorizedComponent,
}: Omit<RoleGuardProps, 'allowedRoles' | 'requireAll'>) {
  return (
    <RoleGuard
      allowedRoles={['super_admin', 'admin']}
      requireAll={false}
      fallback={fallback}
      loadingComponent={loadingComponent}
      unauthorizedComponent={unauthorizedComponent}
    >
      {children}
    </RoleGuard>
  );
}

/**
 * Super admin guard component (shorthand for super admin role)
 */
export function SuperAdminGuard({
  children,
  fallback,
  loadingComponent,
  unauthorizedComponent,
}: Omit<RoleGuardProps, 'allowedRoles' | 'requireAll'>) {
  return (
    <RoleGuard
      allowedRoles={['super_admin']}
      requireAll={true}
      fallback={fallback}
      loadingComponent={loadingComponent}
      unauthorizedComponent={unauthorizedComponent}
    >
      {children}
    </RoleGuard>
  );
}

/**
 * Conditional render based on authentication status
 */
interface ConditionalRenderProps {
  authenticated?: React.ReactNode;
  unauthenticated?: React.ReactNode;
  loading?: React.ReactNode;
}

export function ConditionalRender({
  authenticated,
  unauthenticated,
  loading,
}: ConditionalRenderProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <>{loading || <LoadingSpinner />}</>;
  }

  if (isAuthenticated) {
    return <>{authenticated}</>;
  }

  return <>{unauthenticated}</>;
}

/**
 * Conditional render based on roles
 */
interface ConditionalRoleRenderProps {
  allowedRoles: UserRole[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ConditionalRoleRender({
  allowedRoles,
  requireAll = false,
  children,
  fallback = null,
}: ConditionalRoleRenderProps) {
  const { hasRole, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  const hasRequiredRole = requireAll
    ? allowedRoles.every(role => hasRole([role]))
    : allowedRoles.some(role => hasRole([role]));

  return hasRequiredRole ? <>{children}</> : <>{fallback}</>;
}

/**
 * Conditional render based on permissions
 */
interface ConditionalPermissionRenderProps {
  requiredPermissions: string[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ConditionalPermissionRender({
  requiredPermissions,
  requireAll = false,
  children,
  fallback = null,
}: ConditionalPermissionRenderProps) {
  const { hasPermission, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  const hasRequiredPermission = requireAll
    ? requiredPermissions.every(permission => hasPermission(permission))
    : requiredPermissions.some(permission => hasPermission(permission));

  return hasRequiredPermission ? <>{children}</> : <>{fallback}</>;
}