"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

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
    if (pathname === "/login") {
      setIsLoading(false);
      setIsAuthenticated(true); // Permitir acceso a login
      return;
    }

    // Verificar autenticación
    const checkAuth = () => {
      try {
        const savedUser = localStorage.getItem("ares_current_user");
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
        router.replace("/login");
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsAuthenticated(false);
        setIsLoading(false);
        router.replace("/login");
      }
    };

    // Pequeño delay para evitar flash
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [pathname, router]);

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
