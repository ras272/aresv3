'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Si estamos en login, no verificar auth
    if (pathname === '/login') {
      setIsLoading(false);
      setIsAuthenticated(true); // Permitir acceso a login
      return;
    }

    // Verificar autenticación
    const checkAuth = () => {
      try {
        const savedUser = localStorage.getItem('ares_current_user');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          if (user && user.id) {
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          }
        }
        
        // No hay usuario válido, redirigir a login
        setIsAuthenticated(false);
        setIsLoading(false);
        router.replace('/login');
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
        setIsLoading(false);
        router.replace('/login');
      }
    };

    // Pequeño delay para evitar flash
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [pathname, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado y no estamos en login, no mostrar nada
  if (!isAuthenticated && pathname !== '/login') {
    return null;
  }

  // Mostrar contenido
  return <>{children}</>;
}