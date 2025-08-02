import { useState, useEffect } from 'react';
import { User, UserRole, hasRole as checkRole, hasPermission as checkPermission } from '@/types/auth';

// ===============================================
// HOOK DE AUTENTICACIÓN
// ===============================================

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar usuario desde localStorage
    const loadUser = () => {
      try {
        const userData = localStorage.getItem('ares_current_user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error cargando usuario:', error);
        localStorage.removeItem('ares_current_user');
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // Escuchar cambios en el usuario
    const handleUserUpdate = () => {
      loadUser();
    };

    window.addEventListener('user-updated', handleUserUpdate);
    
    return () => {
      window.removeEventListener('user-updated', handleUserUpdate);
    };
  }, []);

  const login = (userData: User) => {
    localStorage.setItem('ares_current_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('ares_current_user');
    setUser(null);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return checkPermission(user.role, permission);
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return checkRole(user.role, roles);
  };

  return {
    user,
    loading,
    login,
    logout,
    hasPermission,
    hasRole,
    isAuthenticated: !!user
  };
}

// ===============================================
// FUNCIONES HELPER PARA USAR SIN HOOK
// ===============================================

export function getCurrentUser(): User | null {
  try {
    const userData = localStorage.getItem('ares_current_user');
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
}

export function hasRole(allowedRoles: UserRole[]): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return checkRole(user.role, allowedRoles);
}

export function hasPermission(permission: string): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return checkPermission(user.role, permission);
}