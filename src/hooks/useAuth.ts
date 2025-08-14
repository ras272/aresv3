// Re-export the new authentication hooks from AuthProvider
export { 
  useAuth, 
  useCurrentUser, 
  useIsAuthenticated, 
  usePermissions 
} from '@/components/auth/AuthProvider';

// Legacy compatibility - these functions are deprecated
// Use the new AuthProvider context instead
import { UserRole, hasRole as checkRole, hasPermission as checkPermission } from '@/types/auth';

/**
 * @deprecated Use useCurrentUser hook from AuthProvider instead
 */
export function getCurrentUser(): any | null {
  try {
    const userData = localStorage.getItem('ares_current_user');
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
}

/**
 * @deprecated Use usePermissions hook from AuthProvider instead
 */
export function hasRole(allowedRoles: UserRole[]): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return checkRole(user.role, allowedRoles);
}

/**
 * @deprecated Use usePermissions hook from AuthProvider instead
 */
export function hasPermission(permission: string): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return checkPermission(user.role, permission);
}