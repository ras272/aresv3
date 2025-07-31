'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { User } from '@/types/auth';
import { realLogin, getRealUserById } from '@/lib/auth-real';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 🔐 Hook de autenticación real
 * Maneja el estado de autenticación del usuario actual
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook personalizado para autenticación
 */
export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar usuario desde localStorage al iniciar
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = localStorage.getItem('ares_current_user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          
          // Verificar que el usuario siga activo en la base de datos
          const currentUser = await getRealUserById(userData.id);
          if (currentUser && currentUser.isActive) {
            setUser(currentUser);
          } else {
            // Usuario inactivo o eliminado, limpiar localStorage
            localStorage.removeItem('ares_current_user');
          }
        }
      } catch (error) {
        console.error('Error cargando usuario:', error);
        localStorage.removeItem('ares_current_user');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await realLogin(email, password);
      
      if (result.success && result.user) {
        setUser(result.user);
        localStorage.setItem('ares_current_user', JSON.stringify(result.user));
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, error: 'Error interno del sistema' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ares_current_user');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('ares_current_user', JSON.stringify(updatedUser));
    }
  };

  return {
    user,
    loading,
    login,
    logout,
    updateUser
  };
}

/**
 * Obtener usuario actual de forma síncrona
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const savedUser = localStorage.getItem('ares_current_user');
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
}

/**
 * Verificar si el usuario tiene un rol específico
 */
export function hasRole(requiredRole: string | string[]): boolean {
  const user = getCurrentUser();
  if (!user) return false;

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(user.role);
}

/**
 * Verificar si el usuario puede acceder a una funcionalidad
 */
export function canAccess(feature: string): boolean {
  const user = getCurrentUser();
  if (!user) return false;

  // Super admin puede todo
  if (user.role === 'super_admin') return true;

  // Definir permisos por rol
  const permissions = {
    admin: ['dashboard', 'equipos', 'inventario', 'reportes', 'stock', 'remisiones', 'usuarios', 'calendario', 'inventarioTecnico', 'mercaderias', 'documentos', 'archivos', 'tareas', 'clinicas'],
    gerente: ['dashboard', 'equipos', 'inventario', 'reportes', 'stock', 'remisiones', 'calendario', 'inventarioTecnico', 'mercaderias', 'documentos', 'archivos', 'clinicas'],
    contabilidad: ['dashboard', 'reportes', 'remisiones', 'archivos', 'clinicas', 'documentos', 'tareas'],
    tecnico: ['dashboard', 'equipos', 'inventario', 'calendario', 'inventarioTecnico', 'reportes', 'stock'],
    vendedor: ['dashboard', 'equipos', 'reportes', 'remisiones', 'clinicas', 'mercaderias'],
    cliente: ['dashboard', 'equipos']
  };

  const userPermissions = permissions[user.role as keyof typeof permissions] || [];
  return userPermissions.includes(feature);
}