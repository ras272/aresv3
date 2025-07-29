'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { getCurrentUser, hasPermission } = useAppStore();
  
  const currentUser = getCurrentUser();
  
  useEffect(() => {
    // Si no hay usuario logueado y no está en login, redirigir a login
    if (!currentUser && pathname !== '/login') {
      router.push('/login');
      return;
    }
    
    // Si está logueado y está en login, redirigir según rol
    if (currentUser && pathname === '/login') {
      if (currentUser.rol === 'admin') {
        router.push('/dashboard');
      } else {
        router.push('/equipos');
      }
      return;
    }
    
    // Verificar permisos para la ruta actual
    if (currentUser && pathname !== '/login') {
      const routePermissions: Record<string, keyof typeof import('@/types').PermisosRol> = {
        '/': 'dashboard',
        '/dashboard': 'dashboard',
        '/equipos': 'equipos',
        '/equipos/nuevo': 'equipos',
        '/mantenimientos': 'mantenimientos',
        '/calendario': 'calendario',
        '/mercaderias': 'mercaderias',
        '/inventario-tecnico': 'inventarioTecnico',
        '/remisiones': 'remisiones',
        '/facturacion': 'facturacion',
        '/clinicas': 'clinicas',
        '/stock': 'stock',
        '/reportes': 'reportes',
      };
      
      // Encontrar el permiso necesario para la ruta actual
      const requiredPermission = Object.entries(routePermissions).find(([route]) => 
        pathname === route || (route !== '/' && pathname.startsWith(route))
      )?.[1];
      
      // Si la ruta requiere un permiso específico y el usuario no lo tiene
      if (requiredPermission && !hasPermission(requiredPermission)) {
        // Redirigir a la primera página que tenga permisos
        if (hasPermission('equipos')) {
          router.push('/equipos');
        } else if (hasPermission('calendario')) {
          router.push('/calendario');
        } else if (hasPermission('inventarioTecnico')) {
          router.push('/inventario-tecnico');
        } else if (hasPermission('reportes')) {
          router.push('/reportes');
        } else {
          router.push('/login');
        }
        return;
      }
    }
  }, [currentUser, pathname, router, hasPermission]);
  
  // Si no hay usuario y no está en login, no mostrar nada (se está redirigiendo)
  if (!currentUser && pathname !== '/login') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}