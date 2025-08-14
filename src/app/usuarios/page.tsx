'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import GestionUsuarios from '@/components/usuarios/GestionUsuarios';
import { useAuth } from '@/components/auth/AuthProvider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

export default function UsuariosPage() {
  const { user, hasRole, isLoading } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 text-sm">Verificando permisos...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Verificar permisos usando el nuevo sistema
  console.log('🔍 UsuariosPage: Checking permissions for user:', user);
  console.log('🔍 UsuariosPage: User role:', user?.rol);
  console.log('🔍 UsuariosPage: hasRole super_admin:', hasRole('super_admin'));
  console.log('🔍 UsuariosPage: hasRole admin:', hasRole('admin'));
  console.log('🔍 UsuariosPage: hasRole array:', hasRole(['super_admin', 'admin']));

  if (!user || !hasRole(['super_admin', 'admin'])) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Alert className="max-w-md">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              No tienes permisos para acceder a la gestión de usuarios.
              Solo administradores pueden gestionar usuarios del sistema.
              {user && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Tu rol actual: {user.rol}
                </div>
              )}
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <GestionUsuarios />
    </DashboardLayout>
  );
}