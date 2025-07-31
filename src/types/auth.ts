/**
 * 🔐 TIPOS DE AUTENTICACIÓN
 * Definiciones de tipos para el sistema de usuarios real
 */

export type UserRole = 
  | 'super_admin'
  | 'admin' 
  | 'gerente'
  | 'contabilidad'
  | 'tecnico'
  | 'vendedor'
  | 'cliente';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  empresa: string;
  telefono: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface CreateUserData {
  nombre: string;
  email: string;
  rol: UserRole;
  password?: string;
}

export interface UpdateUserData {
  nombre?: string;
  email?: string;
  rol?: UserRole;
  activo?: boolean;
}

// Permisos por rol
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: ['*'], // Acceso total
  admin: [
    'dashboard', 'equipos', 'inventario', 'reportes', 'stock', 
    'remisiones', 'usuarios', 'calendario', 'inventarioTecnico', 
    'mercaderias', 'documentos', 'archivos', 'tareas', 'clinicas'
  ],
  gerente: [
    'dashboard', 'equipos', 'inventario', 'reportes', 'stock', 
    'remisiones', 'calendario', 'inventarioTecnico', 'mercaderias', 
    'documentos', 'archivos', 'clinicas'
  ],
  contabilidad: [
    'dashboard', 'reportes', 'remisiones', 'archivos', 
    'clinicas', 'documentos', 'tareas'
  ],
  tecnico: [
    'dashboard', 'equipos', 'inventario', 'calendario', 
    'inventarioTecnico', 'reportes', 'stock'
  ],
  vendedor: [
    'dashboard', 'equipos', 'reportes', 'remisiones', 
    'clinicas', 'mercaderias'
  ],
  cliente: ['dashboard', 'equipos']
};

// Información de roles para UI
export const ROLE_INFO: Record<UserRole, { label: string; color: string; description: string }> = {
  super_admin: {
    label: 'Super Administrador',
    color: 'bg-red-100 text-red-800',
    description: 'Acceso completo al sistema'
  },
  admin: {
    label: 'Administrador',
    color: 'bg-purple-100 text-purple-800',
    description: 'Gestión completa excepto usuarios'
  },
  gerente: {
    label: 'Gerente',
    color: 'bg-blue-100 text-blue-800',
    description: 'Supervisión y reportes'
  },
  contabilidad: {
    label: 'Contabilidad',
    color: 'bg-green-100 text-green-800',
    description: 'Facturación y documentos'
  },
  tecnico: {
    label: 'Técnico',
    color: 'bg-orange-100 text-orange-800',
    description: 'Servicio técnico y equipos'
  },
  vendedor: {
    label: 'Vendedor',
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Ventas y clientes'
  },
  cliente: {
    label: 'Cliente',
    color: 'bg-gray-100 text-gray-800',
    description: 'Acceso limitado a equipos'
  }
};