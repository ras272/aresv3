/**
 * Utility functions to bridge the authentication context with Zustand store
 * This allows store functions to access current user information without directly
 * depending on React context (which would break the store's framework-agnostic nature)
 */

import { UserPayload } from '@/lib/jwt';

/**
 * Interface for user information that can be passed to store functions
 */
export interface StoreUserInfo {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

/**
 * Convert UserPayload from auth context to StoreUserInfo
 */
export function userPayloadToStoreInfo(user: UserPayload | null): StoreUserInfo | null {
  if (!user) return null;
  
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
  };
}

/**
 * Hook to get user info in a format suitable for store functions
 * This should be used in components that need to pass user info to store functions
 */
export function useStoreUserInfo(): StoreUserInfo | null {
  // Note: This function should be called from within a React component
  // that has access to the AuthProvider context
  if (typeof window === 'undefined') return null;
  
  // This is a placeholder - components should use useAuth() directly
  // and call userPayloadToStoreInfo() to convert the user data
  return null;
}