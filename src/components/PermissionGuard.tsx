'use client';

import { useAppStore } from '@/store/useAppStore';
import { PermisosRol } from '@/types';
import { Shield, Lock } from 'lucide-react';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission: keyof PermisosRol;
  requireWrite?: boolean;
  fallback?: React.ReactNode;
}

export function PermissionGuard({ 
  children, 
  permission, 
  requireWrite = false, 
  fallback 
}: PermissionGuardProps) {
  const { hasPermission, hasWritePermission, getCurrentUser } = useAppStore();
  
  const currentUser = getCurrentUser();
  
  // Verificar permiso de lectura
  if (!hasPermission(permission)) {
    return fallback || (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
        <Shield className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Acceso Restringido
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          No tienes permisos para acceder a esta sección.
        </p>
        {currentUser && (
          <div className="text-sm text-gray-500 dark:text-gray-500">
            <p>Usuario: <span className="font-medium">{currentUser.nombre}</span></p>
            <p>Rol: <span className="font-medium capitalize">{currentUser.rol.replace('_', ' ')}</span></p>
          </div>
        )}
      </div>
    );
  }
  
  // Verificar permiso de escritura si es requerido
  if (requireWrite && !hasWritePermission(permission)) {
    return fallback || (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-dashed border-yellow-300 dark:border-yellow-600">
        <Lock className="h-12 w-12 text-yellow-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Solo Lectura
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Puedes ver esta información pero no modificarla.
        </p>
        {currentUser && (
          <div className="text-sm text-gray-500 dark:text-gray-500">
            <p>Tu rol <span className="font-medium capitalize">{currentUser.rol.replace('_', ' ')}</span> tiene permisos de solo lectura</p>
          </div>
        )}
      </div>
    );
  }
  
  return <>{children}</>;
}

// Hook para usar en componentes
export function usePermissions() {
  const { hasPermission, hasWritePermission, getCurrentUser } = useAppStore();
  
  return {
    hasPermission,
    hasWritePermission,
    getCurrentUser,
    canRead: (permission: keyof PermisosRol) => hasPermission(permission),
    canWrite: (permission: keyof PermisosRol) => hasWritePermission(permission),
  };
}