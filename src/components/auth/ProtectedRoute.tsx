"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    // Si estamos en login, no hacer nada
    if (pathname === "/login") {
      return;
    }

    // Si no está cargando y no está autenticado, redirigir a login
    if (!isLoading && !isAuthenticated) {
      console.log('🔄 User not authenticated, redirecting to login');
      router.replace("/login");
    }
  }, [pathname, router, isLoading, isAuthenticated]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          {/* Logo de Ares */}
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <img
                src="/isologo-ares.png"
                alt="ARES Paraguay"
                className="w-full h-full object-contain opacity-90"
              />
            </div>
          </div>

          {/* Spinner simple */}
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin mx-auto mb-4"></div>

          <p className="text-gray-500 text-sm">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado y no estamos en login, no mostrar nada
  if (!isAuthenticated && pathname !== "/login") {
    return null;
  }

  // Mostrar contenido
  return <>{children}</>;
}
