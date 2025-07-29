'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import Image from 'next/image';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const { getCurrentUser, loadUsuarios } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      // Cargar usuarios si no están cargados
      await loadUsuarios();
      
      const currentUser = getCurrentUser();
      
      // Si no hay usuario y no estamos en login, redirigir
      if (!currentUser && pathname !== '/login') {
        router.push('/login');
        return;
      }
      
      // Si hay usuario y estamos en login, redirigir al dashboard
      if (currentUser && pathname === '/login') {
        router.push('/');
        return;
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [getCurrentUser, loadUsuarios, router, pathname]);

  // Mostrar loading mientras verificamos autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white shadow-lg animate-pulse">
              <Image 
                src="/isologo-ares.png" 
                alt="Ares Paraguay Logo" 
                width={48} 
                height={48}
                className="object-contain"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Ares Paraguay</h1>
          <p className="text-muted-foreground">Cargando sistema...</p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}