// ===============================================
// PERMISOS PARA EL MÓDULO DE REPUESTOS
// ===============================================

export const REPUESOS_PERMISSIONS = {
  // Permisos generales
  VIEW: 'repuestos.view',
  MANAGE: 'repuestos.manage',
  
  // Permisos de creación
  CREATE: 'repuestos.create',
  
  // Permisos de edición
  EDIT: 'repuestos.edit',
  
  // Permisos de eliminación
  DELETE: 'repuestos.delete',
  
  // Permisos de asignación
  ASSIGN: 'repuestos.assign',
  
  // Permisos de movimiento
  MOVE: 'repuestos.move',
};

// Función para verificar si un usuario tiene permisos para ver repuestos
export function canViewRepuestos(userPermissions: string[]): boolean {
  return userPermissions.includes(REPUESOS_PERMISSIONS.VIEW) || 
         userPermissions.includes(REPUESOS_PERMISSIONS.MANAGE);
}

// Función para verificar si un usuario puede crear repuestos
export function canCreateRepuestos(userPermissions: string[]): boolean {
  return userPermissions.includes(REPUESOS_PERMISSIONS.CREATE) || 
         userPermissions.includes(REPUESOS_PERMISSIONS.MANAGE);
}

// Función para verificar si un usuario puede editar repuestos
export function canEditRepuestos(userPermissions: string[]): boolean {
  return userPermissions.includes(REPUESOS_PERMISSIONS.EDIT) || 
         userPermissions.includes(REPUESOS_PERMISSIONS.MANAGE);
}

// Función para verificar si un usuario puede eliminar repuestos
export function canDeleteRepuestos(userPermissions: string[]): boolean {
  return userPermissions.includes(REPUESOS_PERMISSIONS.DELETE) || 
         userPermissions.includes(REPUESOS_PERMISSIONS.MANAGE);
}

// Función para verificar si un usuario puede asignar repuestos a equipos
export function canAssignRepuestos(userPermissions: string[]): boolean {
  return userPermissions.includes(REPUESOS_PERMISSIONS.ASSIGN) || 
         userPermissions.includes(REPUESOS_PERMISSIONS.MANAGE);
}

// Función para verificar si un usuario puede mover repuestos (entradas/salidas)
export function canMoveRepuestos(userPermissions: string[]): boolean {
  return userPermissions.includes(REPUESOS_PERMISSIONS.MOVE) || 
         userPermissions.includes(REPUESOS_PERMISSIONS.MANAGE);
}

// Permisos por rol predeterminados
export const DEFAULT_REPUESOS_PERMISSIONS = {
  // Administradores tienen todos los permisos
  admin: Object.values(REPUESOS_PERMISSIONS),
  
  // Técnicos pueden ver y asignar repuestos
  tecnico: [
    REPUESOS_PERMISSIONS.VIEW,
    REPUESOS_PERMISSIONS.ASSIGN,
  ],
  
  // Supervisores pueden gestionar repuestos
  supervisor: [
    REPUESOS_PERMISSIONS.VIEW,
    REPUESOS_PERMISSIONS.CREATE,
    REPUESOS_PERMISSIONS.EDIT,
    REPUESOS_PERMISSIONS.DELETE,
    REPUESOS_PERMISSIONS.ASSIGN,
    REPUESOS_PERMISSIONS.MOVE,
  ],
  
  // Almaceneros pueden gestionar movimientos
  almacenero: [
    REPUESOS_PERMISSIONS.VIEW,
    REPUESOS_PERMISSIONS.CREATE,
    REPUESOS_PERMISSIONS.EDIT,
    REPUESOS_PERMISSIONS.MOVE,
  ],
};