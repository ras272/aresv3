// Central database module index with backward compatibility and performance optimization
// This file maintains backward compatibility while providing the new modular structure
// with lazy loading and performance monitoring capabilities

// Re-export shared utilities and types
export * from './shared/types';
export * from './shared/utils';
export { supabase, createSupabaseClient } from './shared/supabase';
export { performanceMonitor, withPerformanceMonitoring } from './shared/performance';
export { preloadCriticalModules, preloadAllModules, getModuleStatus } from './shared/lazy-loader';
export { 
  codeSplittingConfig, 
  dynamicImportWithRetry, 
  optimizeMemoryUsage,
  reportBundleSize 
} from './shared/bundle-optimization';

// Export MovimientoStock interface from the stock module
export type { MovimientoStock } from './stock';

// ===============================================
// MODULE EXPORTS - All functions from extracted modules
// ===============================================

// Mercaderias module functions (extracted in task 2)
export {
  createCargaMercaderia,
  getCargaCompleta,
  getAllCargas,
  generateCodigoCarga,
  deleteCargaMercaderia,
  createOrUpdateStockFromProduct,
  createOrUpdateStockFromSubitem,
} from './mercaderias';

// Stock module functions (extracted in task 3)
export {
  getAllStockItems,
  updateStockItemDetails,
  updateComponenteDisponibleDetails,
  registrarMovimientoStock,
  getAllMovimientosStock,
  getMovimientosByProducto,
  getMovimientosByCarpeta,
  getEstadisticasTrazabilidad,
  registrarSalidaStock,
  registrarSalidaStockReporte,
  devolverRepuestosAlStockReporte,
  getAllTransaccionesStock,
  createTransaccionStock,
  procesarSalidaStock,
} from './stock';

// Equipos module functions (extracted in task 4)
export {
  createEquipo,
  createEquipoFromMercaderia,
  getAllEquipos,
  deleteEquipo,
  getAllComponentesDisponibles,
  asignarComponenteAEquipo,
  getHistorialAsignaciones,
  updateComponente,
  createComponenteInventarioTecnico,
  createComponenteInventarioTecnicoReparacion,
  createComponenteInventarioTecnicoFromSubitem,
  // Client-specific equipment functions
  getEquiposByCliente,
  getEstadisticasEquiposByCliente,
  getResumenEquiposMultiplesClientes,
} from './equipos';

// Export client-specific types
export type { 
  EquipoClienteStats, 
  ClienteEquipoSummary 
} from './equipos';

// Mantenimientos module functions (extracted in task 5)
export {
  createMantenimiento,
  getAllMantenimientos,
  updateMantenimiento,
  deleteMantenimiento,
  // Client-specific maintenance functions
  getMantenimientosByCliente,
  getEstadisticasMantenimientosByCliente,
  getProximosMantenimientosByCliente,
} from './mantenimientos';

// Export maintenance client-specific types
export type { 
  MantenimientoClienteStats 
} from './mantenimientos';

// Clinicas module functions (extracted in task 6)
export {
  getAllClinicas,
  createClinica,
  updateClinica,
  deleteClinica,
  // Client comprehensive information functions
  getInfoCompletaCliente,
  getClinicaByNombre,
  getResumenMultiplesClientes,
} from './clinicas';

// Export clinicas client-specific types
export type { 
  ClienteInfoCompleta,
  ClienteResumenInfo 
} from './clinicas';

// Remisiones module functions (extracted in task 7)
export {
  getAllRemisiones,
  createRemision,
  updateRemision,
  deleteRemision,
  deleteRemisionConRestauracion,
  generateNumeroRemision,
  reducirStockPorRemision,
} from './remisiones';

// Usuarios module functions (extracted in task 8)
export {
  getUsuariosReferenciados,
  getEstadisticasUsuarios,
} from './usuarios';

// ===============================================
// REMAINING FUNCTIONS FROM ORIGINAL DATABASE.TS
// These functions haven't been extracted to modules yet
// ===============================================

// Documentos module functions
export {
  createDocumentoCarga,
  getAllDocumentosCarga,
  getDocumentosByCarga,
  deleteDocumentoCarga,
} from '../database';

// Dashboard and statistics functions
export {
  getEstadisticasDashboard,
} from '../database';

// Storage helper functions (re-exported from shared/supabase)
export {
  uploadFile,
  getPublicUrl,
  downloadFile,
  deleteFile,
  listFiles,
} from './shared/supabase';

// Module interfaces for future implementation
// These will be properly defined as modules are extracted

/**
 * @deprecated This interface will be replaced by individual module interfaces
 * Use specific module interfaces instead
 */
export interface DatabaseModules {
  mercaderias: any; // Will be MercaderiasModule
  stock: any; // Will be StockModule
  equipos: any; // Will be EquiposModule
  mantenimientos: any; // Will be MantenimientosModule
  clinicas: any; // Will be ClinicasModule
  remisiones: any; // Will be RemisionesModule
  usuarios: any; // Will be UsuariosModule
}

// Backward compatibility type exports
// Re-export all types from the main types file
export type {
  CargaMercaderia,
  ProductoCarga,
  SubItem,
  Equipo,
  ComponenteEquipo,
  Mantenimiento,
  ComponenteDisponible,
  AsignacionComponente,
  Clinica,
  Usuario,
  SesionUsuario,
  PermisosModulo,
  PermisosRol,
  TransaccionStock,
  EstadisticasStock,
  ProductoRemision,
  Remision,
  DocumentoCarga,
  CargaConDocumentos,
  AppState,
} from '../../types';

// Module configuration and initialization
// This will be used when modules are fully extracted
export interface DatabaseConfig {
  enableLogging?: boolean;
  enableErrorReporting?: boolean;
  enableCaching?: boolean;
  cacheOptions?: {
    ttl?: number;
    maxSize?: number;
  };
}

/**
 * Initialize the database modules with configuration
 * This function will be implemented once modules are extracted
 * 
 * @param config - Configuration options for the database modules
 */
export const initializeDatabase = async (config?: DatabaseConfig): Promise<void> => {
  // TODO: Initialize individual modules once they are extracted
  // For now, this is a placeholder
  console.log('Database modules initialized with config:', config);
};

/**
 * Cleanup database resources
 * This function will be implemented once modules are extracted
 */
export const cleanupDatabase = async (): Promise<void> => {
  // TODO: Cleanup individual modules once they are extracted
  // For now, this is a placeholder
  console.log('Database modules cleaned up');
};

// ===============================================
// BACKWARD COMPATIBILITY NOTES
// ===============================================
// All functions are now available as named exports from this index file.
// Existing imports like `import { functionName } from '@/lib/database'` will continue to work.
// New modular imports like `import { functionName } from '@/lib/database/moduleName'` are also available.