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

// ===============================================
// DEFINICIÓN COMPLETA DE PERMISOS POR ROL
// ===============================================

/**
 * Permisos disponibles en el sistema
 */
export type Permission =
  // Dashboard y navegación
  | 'dashboard.view'
  
  // Gestión de usuarios
  | 'usuarios.view'
  | 'usuarios.create'
  | 'usuarios.edit'
  | 'usuarios.delete'
  | 'usuarios.activate'
  
  // Gestión de equipos
  | 'equipos.view'
  | 'equipos.create'
  | 'equipos.edit'
  | 'equipos.delete'
  | 'equipos.export'
  | 'equipos.own.view' // Solo sus propios equipos (para clientes)
  
  // Mantenimientos
  | 'mantenimientos.view'
  | 'mantenimientos.create'
  | 'mantenimientos.edit'
  | 'mantenimientos.delete'
  | 'mantenimientos.generate_report'
  
  // Inventario y stock
  | 'inventario.view'
  | 'inventario.create'
  | 'inventario.edit'
  | 'inventario.delete'
  | 'inventario.transfer'
  | 'stock.view'
  | 'stock.manage'
  | 'stock.export'
  
  // Mercaderías
  | 'mercaderias.view'
  | 'mercaderias.create'
  | 'mercaderias.edit'
  | 'mercaderias.delete'
  
  // Clínicas
  | 'clinicas.view'
  | 'clinicas.create'
  | 'clinicas.edit'
  | 'clinicas.delete'
  
  // Documentos
  | 'documentos.view'
  | 'documentos.create'
  | 'documentos.edit'
  | 'documentos.delete'
  | 'documentos.own.view' // Solo sus propios documentos
  
  // Archivos
  | 'archivos.view'
  | 'archivos.upload'
  | 'archivos.download'
  | 'archivos.delete'
  | 'archivos.manage_folders'
  
  // Remisiones
  | 'remisiones.view'
  | 'remisiones.create'
  | 'remisiones.edit'
  | 'remisiones.delete'
  | 'remisiones.approve'
  
  // Reportes
  | 'reportes.view'
  | 'reportes.financial'
  | 'reportes.technical'
  | 'reportes.sales'
  | 'reportes.export'
  
  // Calendario
  | 'calendario.view'
  | 'calendario.create_event'
  | 'calendario.edit_event'
  | 'calendario.delete_event'
  
  // Servicio técnico
  | 'servtec.view'
  | 'servtec.create'
  | 'servtec.edit'
  | 'servtec.assign'
  
  // Productos
  | 'productos.view'
  | 'productos.create'
  | 'productos.edit'
  | 'productos.delete'
  
  // Configuración y administración
  | 'admin.view'
  | 'admin.system_config'
  | 'admin.security'
  | 'admin.backup'
  | 'admin.logs'
  
  // Permisos especiales
  | '*'; // Todos los permisos (solo super_admin)

// Permisos detallados por rol
export const ROLE_PERMISSIONS = {
  super_admin: {
    label: "Super Administrador",
    description: "Acceso total al sistema, configuración y administración",
    color: "bg-red-100 text-red-800",
    permissions: ["*"] as Permission[], // Todos los permisos
    routes: ["*"], // Todas las rutas
    features: {
      dashboard: { view: true },
      usuarios: { view: true, create: true, edit: true, delete: true, activate: true },
      equipos: { view: true, create: true, edit: true, delete: true, export: true },
      mantenimientos: { view: true, create: true, edit: true, delete: true, generate_report: true },
      inventario: { view: true, create: true, edit: true, delete: true, transfer: true },
      stock: { view: true, manage: true, export: true },
      mercaderias: { view: true, create: true, edit: true, delete: true },
      clinicas: { view: true, create: true, edit: true, delete: true },
      documentos: { view: true, create: true, edit: true, delete: true },
      archivos: { view: true, upload: true, download: true, delete: true, manage_folders: true },
      remisiones: { view: true, create: true, edit: true, delete: true, approve: true },
      reportes: { view: true, financial: true, technical: true, sales: true, export: true },
      calendario: { view: true, create_event: true, edit_event: true, delete_event: true },
      servtec: { view: true, create: true, edit: true, assign: true },
      productos: { view: true, create: true, edit: true, delete: true },
      admin: { view: true, system_config: true, security: true, backup: true, logs: true },
    },
  },
  
  admin: {
    label: "Administrador",
    description: "Gestión completa del sistema excepto configuración crítica",
    color: "bg-purple-100 text-purple-800",
    permissions: [
      "dashboard.view",
      "usuarios.view", "usuarios.create", "usuarios.edit", "usuarios.activate",
      "equipos.view", "equipos.create", "equipos.edit", "equipos.delete", "equipos.export",
      "mantenimientos.view", "mantenimientos.create", "mantenimientos.edit", "mantenimientos.delete", "mantenimientos.generate_report",
      "inventario.view", "inventario.create", "inventario.edit", "inventario.delete", "inventario.transfer",
      "stock.view", "stock.manage", "stock.export",
      "mercaderias.view", "mercaderias.create", "mercaderias.edit", "mercaderias.delete",
      "clinicas.view", "clinicas.create", "clinicas.edit", "clinicas.delete",
      "documentos.view", "documentos.create", "documentos.edit", "documentos.delete",
      "archivos.view", "archivos.upload", "archivos.download", "archivos.delete", "archivos.manage_folders",
      "remisiones.view", "remisiones.create", "remisiones.edit", "remisiones.delete", "remisiones.approve",
      "reportes.view", "reportes.financial", "reportes.technical", "reportes.sales", "reportes.export",
      "calendario.view", "calendario.create_event", "calendario.edit_event", "calendario.delete_event",
      "servtec.view", "servtec.create", "servtec.edit", "servtec.assign",
      "productos.view", "productos.create", "productos.edit", "productos.delete",
    ] as Permission[],
    routes: ["/", "/usuarios", "/equipos", "/inventario-tecnico", "/stock", "/mercaderias", "/clinicas", "/documentos", "/archivos", "/remisiones", "/reportes", "/calendario", "/servtec", "/productos"],
    features: {
      dashboard: { view: true },
      usuarios: { view: true, create: true, edit: true, delete: false, activate: true },
      equipos: { view: true, create: true, edit: true, delete: true, export: true },
      mantenimientos: { view: true, create: true, edit: true, delete: true, generate_report: true },
      inventario: { view: true, create: true, edit: true, delete: true, transfer: true },
      stock: { view: true, manage: true, export: true },
      mercaderias: { view: true, create: true, edit: true, delete: true },
      clinicas: { view: true, create: true, edit: true, delete: true },
      documentos: { view: true, create: true, edit: true, delete: true },
      archivos: { view: true, upload: true, download: true, delete: true, manage_folders: true },
      remisiones: { view: true, create: true, edit: true, delete: true, approve: true },
      reportes: { view: true, financial: true, technical: true, sales: true, export: true },
      calendario: { view: true, create_event: true, edit_event: true, delete_event: true },
      servtec: { view: true, create: true, edit: true, assign: true },
      productos: { view: true, create: true, edit: true, delete: true },
      admin: { view: false, system_config: false, security: false, backup: false, logs: false },
    },
  },
  
  gerente: {
    label: "Gerente",
    description: "Supervisión, reportes y gestión operativa",
    color: "bg-blue-100 text-blue-800",
    permissions: [
      "dashboard.view",
      "equipos.view", "equipos.export",
      "mantenimientos.view", "mantenimientos.generate_report",
      "inventario.view",
      "stock.view", "stock.export",
      "mercaderias.view",
      "clinicas.view", "clinicas.edit",
      "documentos.view", "documentos.create", "documentos.edit",
      "archivos.view", "archivos.upload", "archivos.download",
      "remisiones.view", "remisiones.approve",
      "reportes.view", "reportes.financial", "reportes.technical", "reportes.sales", "reportes.export",
      "calendario.view", "calendario.create_event", "calendario.edit_event",
      "servtec.view", "servtec.assign",
      "productos.view",
    ] as Permission[],
    routes: ["/", "/equipos", "/inventario-tecnico", "/stock", "/mercaderias", "/clinicas", "/documentos", "/archivos", "/remisiones", "/reportes", "/calendario", "/servtec", "/productos"],
    features: {
      dashboard: { view: true },
      usuarios: { view: false, create: false, edit: false, delete: false, activate: false },
      equipos: { view: true, create: false, edit: false, delete: false, export: true },
      mantenimientos: { view: true, create: false, edit: false, delete: false, generate_report: true },
      inventario: { view: true, create: false, edit: false, delete: false, transfer: false },
      stock: { view: true, manage: false, export: true },
      mercaderias: { view: true, create: false, edit: false, delete: false },
      clinicas: { view: true, create: false, edit: true, delete: false },
      documentos: { view: true, create: true, edit: true, delete: false },
      archivos: { view: true, upload: true, download: true, delete: false, manage_folders: false },
      remisiones: { view: true, create: false, edit: false, delete: false, approve: true },
      reportes: { view: true, financial: true, technical: true, sales: true, export: true },
      calendario: { view: true, create_event: true, edit_event: true, delete_event: false },
      servtec: { view: true, create: false, edit: false, assign: true },
      productos: { view: true, create: false, edit: false, delete: false },
      admin: { view: false, system_config: false, security: false, backup: false, logs: false },
    },
  },
  contabilidad: {
    label: "Contabilidad",
    description: "Gestión financiera, facturación y reportes económicos",
    color: "bg-green-100 text-green-800",
    permissions: [
      "dashboard.view",
      "clinicas.view", "clinicas.edit",
      "documentos.view", "documentos.create", "documentos.edit", "documentos.delete",
      "archivos.view", "archivos.upload", "archivos.download", "archivos.manage_folders",
      "remisiones.view", "remisiones.create", "remisiones.edit",
      "reportes.view", "reportes.financial", "reportes.export",
      "mercaderias.view", "mercaderias.create", "mercaderias.edit",
      "productos.view", "productos.create", "productos.edit",
      "stock.view", "stock.manage", "stock.export",
    ] as Permission[],
    routes: ["/", "/clinicas", "/documentos", "/archivos", "/remisiones", "/reportes", "/mercaderias", "/productos", "/stock"],
    features: {
      dashboard: { view: true },
      usuarios: { view: false, create: false, edit: false, delete: false, activate: false },
      equipos: { view: false, create: false, edit: false, delete: false, export: false },
      mantenimientos: { view: false, create: false, edit: false, delete: false, generate_report: false },
      inventario: { view: false, create: false, edit: false, delete: false, transfer: false },
      stock: { view: true, manage: true, export: true },
      mercaderias: { view: true, create: true, edit: true, delete: false },
      clinicas: { view: true, create: false, edit: true, delete: false },
      documentos: { view: true, create: true, edit: true, delete: true },
      archivos: { view: true, upload: true, download: true, delete: false, manage_folders: true },
      remisiones: { view: true, create: true, edit: true, delete: false, approve: false },
      reportes: { view: true, financial: true, technical: false, sales: false, export: true },
      calendario: { view: false, create_event: false, edit_event: false, delete_event: false },
      servtec: { view: false, create: false, edit: false, assign: false },
      productos: { view: true, create: true, edit: true, delete: false },
      admin: { view: false, system_config: false, security: false, backup: false, logs: false },
    },
  },
  
  tecnico: {
    label: "Técnico",
    description: "Gestión técnica de equipos, mantenimientos y servicio técnico",
    color: "bg-orange-100 text-orange-800",
    permissions: [
      "dashboard.view",
      "equipos.view", "equipos.create", "equipos.edit",
      "mantenimientos.view", "mantenimientos.create", "mantenimientos.edit", "mantenimientos.generate_report",
      "inventario.view", "inventario.create", "inventario.edit", "inventario.transfer",
      "calendario.view", "calendario.create_event", "calendario.edit_event",
      "servtec.view", "servtec.create", "servtec.edit",
      "reportes.view", "reportes.technical",
      "repuestos.view", "repuestos.assign", // Agregar permisos de repuestos
    ] as Permission[],
    routes: ["/", "/equipos", "/inventario-tecnico", "/calendario", "/servtec", "/reportes", "/repuestos"], // Agregar ruta de repuestos
    features: {
      dashboard: { view: true },
      usuarios: { view: false, create: false, edit: false, delete: false, activate: false },
      equipos: { view: true, create: true, edit: true, delete: false, export: false },
      mantenimientos: { view: true, create: true, edit: true, delete: false, generate_report: true },
      inventario: { view: true, create: true, edit: true, delete: false, transfer: true },
      stock: { view: false, manage: false, export: false },
      mercaderias: { view: false, create: false, edit: false, delete: false },
      clinicas: { view: false, create: false, edit: false, delete: false },
      documentos: { view: false, create: false, edit: false, delete: false },
      archivos: { view: false, upload: false, download: false, delete: false, manage_folders: false },
      remisiones: { view: false, create: false, edit: false, delete: false, approve: false },
      reportes: { view: true, financial: false, technical: true, sales: false, export: false },
      calendario: { view: true, create_event: true, edit_event: true, delete_event: false },
      servtec: { view: true, create: true, edit: true, assign: false },
      productos: { view: false, create: false, edit: false, delete: false },
      admin: { view: false, system_config: false, security: false, backup: false, logs: false },
    },
  },
  
  vendedor: {
    label: "Vendedor",
    description: "Gestión de ventas, clientes y relaciones comerciales",
    color: "bg-yellow-100 text-yellow-800",
    permissions: [
      "dashboard.view",
      "equipos.view", "equipos.create", "equipos.edit",
      "clinicas.view", "clinicas.create", "clinicas.edit",
      "documentos.view", "documentos.create", "documentos.edit",
      "archivos.view", "archivos.upload", "archivos.download",
      "remisiones.view", "remisiones.create", "remisiones.edit",
      "reportes.view", "reportes.sales", "reportes.export",
      "calendario.view", "calendario.create_event", "calendario.edit_event",
      "productos.view", "productos.create", "productos.edit",
      "mercaderias.view",
    ] as Permission[],
    routes: ["/", "/equipos", "/clinicas", "/documentos", "/archivos", "/remisiones", "/reportes", "/calendario", "/productos", "/mercaderias"],
    features: {
      dashboard: { view: true },
      usuarios: { view: false, create: false, edit: false, delete: false, activate: false },
      equipos: { view: true, create: true, edit: true, delete: false, export: false },
      mantenimientos: { view: false, create: false, edit: false, delete: false, generate_report: false },
      inventario: { view: false, create: false, edit: false, delete: false, transfer: false },
      stock: { view: false, manage: false, export: false },
      mercaderias: { view: true, create: false, edit: false, delete: false },
      clinicas: { view: true, create: true, edit: true, delete: false },
      documentos: { view: true, create: true, edit: true, delete: false },
      archivos: { view: true, upload: true, download: true, delete: false, manage_folders: false },
      remisiones: { view: true, create: true, edit: true, delete: false, approve: false },
      reportes: { view: true, financial: false, technical: false, sales: true, export: true },
      calendario: { view: true, create_event: true, edit_event: true, delete_event: false },
      servtec: { view: false, create: false, edit: false, assign: false },
      productos: { view: true, create: true, edit: true, delete: false },
      admin: { view: false, system_config: false, security: false, backup: false, logs: false },
    },
  },
  
  cliente: {
    label: "Cliente",
    description: "Acceso limitado a información de sus propios equipos y documentos",
    color: "bg-gray-100 text-gray-800",
    permissions: [
      "dashboard.view",
      "equipos.own.view",
      "documentos.own.view",
      "archivos.view", "archivos.download",
      "calendario.view",
    ] as Permission[],
    routes: ["/", "/equipos", "/documentos", "/archivos", "/calendario"],
    features: {
      dashboard: { view: true },
      usuarios: { view: false, create: false, edit: false, delete: false, activate: false },
      equipos: { view: true, create: false, edit: false, delete: false, export: false }, // Solo sus equipos
      mantenimientos: { view: false, create: false, edit: false, delete: false, generate_report: false },
      inventario: { view: false, create: false, edit: false, delete: false, transfer: false },
      stock: { view: false, manage: false, export: false },
      mercaderias: { view: false, create: false, edit: false, delete: false },
      clinicas: { view: false, create: false, edit: false, delete: false },
      documentos: { view: true, create: false, edit: false, delete: false }, // Solo sus documentos
      archivos: { view: true, upload: false, download: true, delete: false, manage_folders: false },
      remisiones: { view: false, create: false, edit: false, delete: false, approve: false },
      reportes: { view: false, financial: false, technical: false, sales: false, export: false },
      calendario: { view: true, create_event: false, edit_event: false, delete_event: false },
      servtec: { view: false, create: false, edit: false, assign: false },
      productos: { view: false, create: false, edit: false, delete: false },
      admin: { view: false, system_config: false, security: false, backup: false, logs: false },
    },
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
