/**
 * Authentication hooks - Modern JWT-based system
 * 
 * This file re-exports the new authentication hooks from AuthProvider.
 * All authentication logic now uses JWT tokens with httpOnly cookies.
 * 
 * @deprecated - Old localStorage-based auth system has been removed
 */

// Export the new authentication hooks from AuthProvider
export { 
  useAuth, 
  useCurrentUser, 
  useIsAuthenticated, 
  usePermissions 
} from '@/components/auth/AuthProvider';