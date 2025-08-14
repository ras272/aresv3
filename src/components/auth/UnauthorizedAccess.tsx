'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, ROLE_PERMISSIONS } from '@/types/auth';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft, Home, LogIn, Shield } from 'lucide-react';

/**
 * Unauthorized access props
 */
interface UnauthorizedAccessProps {
  message?: string;
  requiredRoles?: UserRole[];
  requiredPermissions?: string[];
  showBackButton?: boolean;
  showHomeButton?: boolean;
  showLoginButton?: boolean;
  customActions?: React.ReactNode;
}

/**
 * Unauthorized access component
 * Shows when user doesn't have required permissions or roles
 */
export function UnauthorizedAccess({
  message = 'You are not authorized to access this page',
  requiredRoles = [],
  requiredPermissions = [],
  showBackButton = true,
  showHomeButton = true,
  showLoginButton = false,
  customActions,
}: UnauthorizedAccessProps) {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleLogout = async () => {
    await logout();
  };

  // Format required roles for display
  const formatRoles = (roles: UserRole[]): string => {
    return roles
      .map(role => ROLE_PERMISSIONS[role]?.label || role)
      .join(', ');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl font-semibold text-foreground">
            Access Denied
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {message}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* User info */}
          {isAuthenticated && user && (
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center space-x-2 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Logged in as:</span>
              </div>
              <div className="mt-1">
                <p className="font-medium text-foreground">{user.nombre}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <p className="text-sm text-muted-foreground">
                  Role: {ROLE_PERMISSIONS[user.rol as UserRole]?.label || user.rol}
                </p>
              </div>
            </div>
          )}

          {/* Required access info */}
          {(requiredRoles.length > 0 || requiredPermissions.length > 0) && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
              <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                Required Access:
              </h4>
              {requiredRoles.length > 0 && (
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  <strong>Roles:</strong> {formatRoles(requiredRoles)}
                </p>
              )}
              {requiredPermissions.length > 0 && (
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  <strong>Permissions:</strong> {requiredPermissions.join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col space-y-2">
            {customActions}
            
            {showBackButton && (
              <Button
                variant="outline"
                onClick={handleGoBack}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            )}

            {showHomeButton && (
              <Button
                variant="outline"
                onClick={handleGoHome}
                className="w-full"
              >
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            )}

            {!isAuthenticated && showLoginButton && (
              <Button
                onClick={handleLogin}
                className="w-full"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            )}

            {isAuthenticated && (
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Sign Out
              </Button>
            )}
          </div>

          {/* Help text */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              If you believe this is an error, please contact your administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Simple unauthorized message (for inline use)
 */
interface UnauthorizedMessageProps {
  message?: string;
  className?: string;
}

export function UnauthorizedMessage({ 
  message = 'You are not authorized to view this content',
  className = ''
}: UnauthorizedMessageProps) {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Access Denied</h3>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

/**
 * Unauthorized banner (for partial page restrictions)
 */
interface UnauthorizedBannerProps {
  message?: string;
  requiredRoles?: UserRole[];
  requiredPermissions?: string[];
  onDismiss?: () => void;
  className?: string;
}

export function UnauthorizedBanner({
  message = 'You do not have permission to access this feature',
  requiredRoles = [],
  requiredPermissions = [],
  onDismiss,
  className = ''
}: UnauthorizedBannerProps) {
  return (
    <div className={`rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20 ${className}`}>
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">
            Access Restricted
          </h4>
          <p className="text-sm text-red-700 dark:text-red-300 mb-2">
            {message}
          </p>
          {(requiredRoles.length > 0 || requiredPermissions.length > 0) && (
            <div className="text-xs text-red-600 dark:text-red-400">
              {requiredRoles.length > 0 && (
                <p>Required roles: {formatRoles(requiredRoles)}</p>
              )}
              {requiredPermissions.length > 0 && (
                <p>Required permissions: {requiredPermissions.join(', ')}</p>
              )}
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
          >
            <span className="sr-only">Dismiss</span>
            ×
          </button>
        )}
      </div>
    </div>
  );
}

// Helper function for formatting roles
function formatRoles(roles: UserRole[]): string {
  return roles
    .map(role => ROLE_PERMISSIONS[role]?.label || role)
    .join(', ');
}