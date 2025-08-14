'use client';

import { useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserRole, ROLE_PERMISSIONS } from '@/types/auth';

/**
 * Permission checking interface
 */
interface UsePermissionsReturn {
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  hasAllRoles: (roles: UserRole[]) => boolean;
  userPermissions: string[];
  userRole: UserRole | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  canManageUsers: boolean;
  canViewReports: boolean;
  canManageEquipos: boolean;
  canManageInventario: boolean;
  canManageClinicas: boolean;
  canManageDocumentos: boolean;
  canManageRemisiones: boolean;
  canManageArchivos: boolean;
  canManageTareas: boolean;
}

/**
 * Hook for checking user permissions and roles
 * Provides comprehensive permission checking utilities
 */
export function usePermissions(): UsePermissionsReturn {
  const { user, hasPermission: contextHasPermission, hasRole: contextHasRole } = useAuth();

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback((permission: string): boolean => {
    return contextHasPermission(permission);
  }, [contextHasPermission]);

  /**
   * Check if user has specific role(s)
   */
  const hasRole = useCallback((roles: UserRole | UserRole[]): boolean => {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return contextHasRole(roleArray);
  }, [contextHasRole]);

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.some(role => contextHasRole([role]));
  }, [user, contextHasRole]);

  /**
   * Check if user has all of the specified roles (usually not applicable, but useful for complex scenarios)
   */
  const hasAllRoles = useCallback((roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.every(role => contextHasRole([role]));
  }, [user, contextHasRole]);

  /**
   * Get all permissions for current user
   */
  const userPermissions = useCallback((): string[] => {
    if (!user) return [];
    
    const rolePermissions = ROLE_PERMISSIONS[user.rol as UserRole];
    if (!rolePermissions) return [];
    
    // If user is super admin, return all permissions
    if (rolePermissions.permissions.includes('*' as any)) {
      return ['*'];
    }
    
    return rolePermissions.permissions as string[];
  }, [user])();

  /**
   * Get current user role
   */
  const userRole = user?.rol as UserRole || null;

  /**
   * Common permission checks as computed properties
   */
  const isSuperAdmin = hasRole('super_admin');
  const isAdmin = hasAnyRole(['super_admin', 'admin']);
  const canManageUsers = hasPermission('users.manage');
  const canViewReports = hasPermission('reportes.view');
  const canManageEquipos = hasPermission('equipos.manage') || hasPermission('equipos.view');
  const canManageInventario = hasPermission('inventario.manage') || hasPermission('inventario.view');
  const canManageClinicas = hasPermission('clinicas.manage') || hasPermission('clinicas.view');
  const canManageDocumentos = hasPermission('documentos.manage') || hasPermission('documentos.view');
  const canManageRemisiones = hasPermission('remisiones.manage') || hasPermission('remisiones.view');
  const canManageArchivos = hasPermission('archivos.manage');
  const canManageTareas = hasPermission('tareas.manage');

  return {
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    userPermissions,
    userRole,
    isSuperAdmin,
    isAdmin,
    canManageUsers,
    canViewReports,
    canManageEquipos,
    canManageInventario,
    canManageClinicas,
    canManageDocumentos,
    canManageRemisiones,
    canManageArchivos,
    canManageTareas,
  };
}

/**
 * Hook for checking specific permission (shorthand)
 * @param permission - Permission to check
 * @returns boolean - True if user has permission
 */
export function useHasPermission(permission: string): boolean {
  const { hasPermission } = usePermissions();
  return hasPermission(permission);
}

/**
 * Hook for checking specific role (shorthand)
 * @param roles - Role(s) to check
 * @returns boolean - True if user has role
 */
export function useHasRole(roles: UserRole | UserRole[]): boolean {
  const { hasRole } = usePermissions();
  return hasRole(roles);
}

/**
 * Hook for admin-level access checking
 * @returns boolean - True if user is admin or super admin
 */
export function useIsAdmin(): boolean {
  const { isAdmin } = usePermissions();
  return isAdmin;
}

/**
 * Hook for super admin access checking
 * @returns boolean - True if user is super admin
 */
export function useIsSuperAdmin(): boolean {
  const { isSuperAdmin } = usePermissions();
  return isSuperAdmin;
}