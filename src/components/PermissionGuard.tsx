'use client';

import { useAuth } from '@/hooks/useAuth';
import { Shield, Lock } from 'lucide-react';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission: string;
  requireWrite?: boolean;
  fallback?: React.ReactNode;
}

export function PermissionGuard({ 
  children, 
  permission, 
  requireWrite = false, 
  fallback 
}: PermissionGuardProps) {
  const { user, hasPermission } = useAuth();
  
  // Verificar permiso de lectura
  if (!hasPermission(permission)) {
    return fallback || (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
        <img 
          src="/404.png" 
          alt="Acceso Restringido"
          className="h-24 w-auto object-contain mb-6"
        />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Acceso Restringido
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          No tienes permisos para acceder a esta sección.
        </p>
        {user && (
          <div className="text-sm text-gray-500 dark:text-gray-500">
            <p>Usuario: <span className="font-medium">{user.nombre}</span></p>
            <p>Rol: <span className="font-medium capitalize">{user.rol.replace('_', ' ')}</span></p>
          </div>
        )}
      </div>
    );
  }
  
  // TODO: Implementar verificación de permisos de escritura en el sistema JWT
  // Por ahora, si requireWrite es true y no es super_admin, mostrar solo lectura
  if (requireWrite && user?.rol !== 'super_admin') {
    return fallback || (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-dashed border-yellow-300 dark:border-yellow-600">
        <Lock className="h-12 w-12 text-yellow-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Solo Lectura
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Puedes ver esta información pero no modificarla.
        </p>
        {user && (
          <div className="text-sm text-gray-500 dark:text-gray-500">
            <p>Tu rol <span className="font-medium capitalize">{user.rol.replace('_', ' ')}</span> tiene permisos de solo lectura</p>
          </div>
        )}
      </div>
    );
  }
  
  return <>{children}</>;
}