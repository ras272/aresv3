'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import GestionUsuarios from '@/components/usuarios/GestionUsuarios';
import { hasRole } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

export default function UsuariosPage() {
  // Verificar permisos
  if (!hasRole(['super_admin', 'admin'])) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Alert className="max-w-md">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              No tienes permisos para acceder a la gestión de usuarios.
              Solo administradores pueden gestionar usuarios del sistema.
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