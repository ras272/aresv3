// ===============================================
// TIPOS PARA SISTEMA DE AUTENTICACIÓN
// ===============================================

export type UserRole =
  | "super_admin"
  | "admin"
  | "gerente"
  | "contabilidad"
  | "tecnico"
  | "vendedor"
  | "cliente";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  startDate: string;
  expirationDate: string;
  isActive: boolean;
  ipAddress?: string;
  userAgent?: string;
}

// Permisos por rol
export const ROLE_PERMISSIONS = {
  super_admin: {
    label: "Super Administrador",
    description: "Acceso total al sistema",
    permissions: ["*"], // Todos los permisos
  },
  admin: {
    label: "Administrador",
    description: "Gestión completa excepto configuración del sistema",
    permissions: [
      "users.manage",
      "equipos.manage",
      "inventario.manage",
      "clinicas.manage",
      "reportes.view",
      "documentos.manage",
      "remisiones.manage",
    ],
  },
  gerente: {
    label: "Gerente",
    description: "Supervisión y reportes",
    permissions: [
      "equipos.view",
      "inventario.view",
      "clinicas.view",
      "reportes.view",
      "documentos.view",
      "remisiones.view",
    ],
  },
  contabilidad: {
    label: "Contabilidad",
    description: "Facturación, archivos, documentos, clínicas, tareas",
    permissions: [
      "clinicas.manage",
      "documentos.manage",
      "archivos.manage",
      "tareas.manage",
      "reportes.financial",
    ],
  },
  tecnico: {
    label: "Técnico",
    description: "Dashboard, equipos, inventario, calendario (solo lectura)",
    permissions: [
      "dashboard.view",
      "equipos.view",
      "inventario.view",
      "calendario.view",
    ],
  },
  vendedor: {
    label: "Vendedor",
    description: "Gestión de clientes y ventas",
    permissions: ["clinicas.view", "equipos.view", "reportes.sales"],
  },
  cliente: {
    label: "Cliente",
    description: "Acceso limitado a sus equipos",
    permissions: ["equipos.own.view", "documentos.own.view"],
  },
} as const;

// Helper para verificar permisos
export function hasPermission(userRole: UserRole, permission: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];

  // Super admin tiene todos los permisos
  if (rolePermissions.permissions.includes("*" as any)) {
    return true;
  }

  return rolePermissions.permissions.includes(permission as any);
}

// Helper para verificar si el usuario tiene uno de los roles especificados
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  console.log('🔍 hasRole check:', {
    userRole,
    allowedRoles,
    includes: allowedRoles.includes(userRole),
    userRoleType: typeof userRole,
    allowedRolesTypes: allowedRoles.map(r => typeof r)
  });
  return allowedRoles.includes(userRole);
}
