import { SupabaseClient } from '@supabase/supabase-js';

// Re-export all existing types from the main types file for convenience
export * from '../../../types';

// Module configuration interfaces
export interface ModuleConfig {
  supabaseClient: SupabaseClient;
  enableLogging?: boolean;
  enableErrorReporting?: boolean;
}

// Base interface for all database modules
export interface DatabaseModule {
  initialize(config: ModuleConfig): Promise<void>;
  cleanup?(): Promise<void>;
}

// Error handling types
export interface DatabaseError extends Error {
  code?: string;
  details?: string;
  hint?: string;
  message: string;
}

export interface DatabaseResult<T> {
  data: T | null;
  error: DatabaseError | null;
  success: boolean;
}

// Common operation result types
export interface OperationResult {
  success: boolean;
  error?: string;
  data?: any;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortOptions {
  column: string;
  ascending?: boolean;
}

export interface FilterOptions {
  [key: string]: any;
}

export interface QueryOptions {
  pagination?: PaginationOptions;
  sort?: SortOptions;
  filters?: FilterOptions;
}

// Audit trail types for tracking changes
export interface AuditTrail {
  id: string;
  tableName: string;
  recordId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  userId?: string;
  timestamp: string;
}

// Common input types for CRUD operations
export interface CreateInput<T> {
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
}

export interface UpdateInput<T> {
  id: string;
  data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;
}

export interface DeleteInput {
  id: string;
}

// Validation types
export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'url';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean | string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

// Logging types
export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  module: string;
  function: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Transaction types
export interface TransactionContext {
  id: string;
  startTime: string;
  operations: Array<{
    operation: string;
    table: string;
    recordId?: string;
    status: 'pending' | 'completed' | 'failed';
  }>;
}

// Cache types
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key?: string;
  tags?: string[];
}

export interface CacheEntry<T> {
  data: T;
  timestamp: string;
  ttl: number;
  tags: string[];
}

// Module-specific interfaces that will be implemented by each module
export interface MercaderiasModuleInterface {
  // Will be defined in mercaderias module
}

export interface StockModuleInterface {
  getAllStockItems(): Promise<any[]>;
  updateStockItemDetails(productId: string, updates: { imagen?: string; observaciones?: string }): Promise<boolean>;
  updateComponenteDisponibleDetails(productId: string, updates: { imagen?: string; observaciones?: string }): Promise<boolean>;
  registrarMovimientoStock(movimiento: any): Promise<any>;
  getAllMovimientosStock(): Promise<any[]>;
  getMovimientosByProducto(productoNombre: string, productoMarca?: string): Promise<any[]>;
  getMovimientosByCarpeta(carpeta: string): Promise<any[]>;
  getEstadisticasTrazabilidad(): Promise<any>;
}

export interface EquiposModuleInterface {
  createEquipo(equipoData: any): Promise<any>;
  createEquipoFromMercaderia(producto: any, carga: any, subitems?: Array<any>): Promise<any>;
  getAllEquipos(): Promise<any[]>;
  deleteEquipo(equipoId: string): Promise<boolean>;
  getAllComponentesDisponibles(): Promise<any[]>;
  asignarComponenteAEquipo(
    componenteId: string,
    equipoId: string,
    cantidadAsignada: number,
    motivo?: string,
    tecnicoResponsable?: string,
    observaciones?: string
  ): Promise<any>;
  getHistorialAsignaciones(componenteId?: string, equipoId?: string): Promise<any[]>;
  updateComponente(componenteId: string, updates: {
    estado?: 'Operativo' | 'En reparacion' | 'Fuera de servicio';
    observaciones?: string;
  }): Promise<any>;
  createComponenteInventarioTecnico(producto: any, carga: any): Promise<any>;
  createComponenteInventarioTecnicoReparacion(producto: any, carga: any): Promise<any>;
  createComponenteInventarioTecnicoFromSubitem(subitem: any, producto: any, carga: any): Promise<any>;
}

export interface MantenimientosModuleInterface {
  createMantenimiento(mantenimientoData: {
    equipoId: string;
    componenteId?: string;
    fecha: string;
    descripcion: string;
    estado: 'Pendiente' | 'En proceso' | 'Finalizado';
    comentarios?: string;
    archivo?: {
      nombre: string;
      tamaño: number;
      tipo: string;
    };
    reporteGenerado?: boolean;
    precioServicio?: number;
    repuestosUtilizados?: Array<{
      id: string;
      nombre: string;
      marca: string;
      modelo: string;
      cantidad: number;
      stockAntes: number;
    }>;
    estadoFacturacion?: 'Pendiente' | 'Facturado' | 'Enviado';
    numeroFacturaExterna?: string;
    fechaFacturacion?: string;
    archivoFacturaPDF?: {
      nombre: string;
      url: string;
      tamaño: number;
    };
    tipo: 'Correctivo' | 'Preventivo';
    esProgramado?: boolean;
    fechaProgramada?: string;
    tecnicoAsignado?: string;
    prioridad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
    esRecurrente?: boolean;
    frecuenciaMantenimiento?: 'Mensual' | 'Bimestral' | 'Trimestral' | 'Semestral' | 'Anual';
    proximoMantenimiento?: string;
    diasNotificacionAnticipada?: number;
    notificacionEnviada?: boolean;
    tiempoEstimado?: number;
    tiempoReal?: number;
  }): Promise<any>;

  getAllMantenimientos(): Promise<any[]>;

  updateMantenimiento(mantenimientoId: string, updates: {
    fecha?: string;
    estado?: 'Pendiente' | 'En proceso' | 'Finalizado';
    comentarios?: string;
    archivo?: {
      nombre: string;
      tamaño: number;
      tipo: string;
    };
    reporteGenerado?: boolean;
    precioServicio?: number;
    repuestosUtilizados?: Array<{
      id: string;
      nombre: string;
      marca: string;
      modelo: string;
      cantidad: number;
      stockAntes: number;
    }>;
    estadoFacturacion?: 'Pendiente' | 'Facturado' | 'Enviado';
    numeroFacturaExterna?: string;
    fechaFacturacion?: string;
    archivoFacturaPDF?: {
      nombre: string;
      url: string;
      tamaño: number;
    };
    tecnicoAsignado?: string;
    prioridad?: 'Baja' | 'Media' | 'Alta' | 'Crítica';
    tiempoReal?: number;
    notificacionEnviada?: boolean;
  }): Promise<any>;

  deleteMantenimiento(mantenimientoId: string): Promise<boolean>;
}

export interface ClinicasModuleInterface {
  getAllClinicas(): Promise<any[]>;
  createClinica(clinicaData: {
    nombre: string;
    direccion: string;
    ciudad: string;
    telefono?: string;
    email?: string;
    contactoPrincipal?: string;
    observaciones?: string;
    activa?: boolean;
  }): Promise<any>;
  updateClinica(clinicaId: string, updates: {
    nombre?: string;
    direccion?: string;
    ciudad?: string;
    telefono?: string;
    email?: string;
    contactoPrincipal?: string;
    observaciones?: string;
    activa?: boolean;
  }): Promise<any>;
  deleteClinica(clinicaId: string): Promise<boolean>;
}

export interface RemisionesModuleInterface {
  getAllRemisiones(): Promise<any[]>;
  createRemision(remisionData: {
    numeroFactura?: string;
    fecha: string;
    cliente: string;
    direccionEntrega: string;
    contacto?: string;
    telefono?: string;
    tipoRemision: 'Instalación' | 'Mantenimiento' | 'Reparación' | 'Entrega';
    tecnicoResponsable: string;
    productos: Array<{
      componenteId: string;
      stockItemId?: string;
      nombre: string;
      marca: string;
      modelo: string;
      numeroSerie?: string;
      cantidadSolicitada: number;
      cantidadDisponible: number;
      observaciones?: string;
    }>;
    descripcionGeneral?: string;
    estado: 'Borrador' | 'Confirmada' | 'En tránsito' | 'Entregada' | 'Cancelada';
  }): Promise<any>;
  updateRemision(remisionId: string, updates: {
    numeroFactura?: string;
    estado?: 'Borrador' | 'Confirmada' | 'En tránsito' | 'Entregada' | 'Cancelada';
    fechaEntrega?: string;
    observacionesEntrega?: string;
    descripcionGeneral?: string;
  }): Promise<any>;
  deleteRemision(remisionId: string): Promise<boolean>;
  deleteRemisionConRestauracion(remisionId: string, motivo: string): Promise<{
    success: boolean;
    productosRestaurados: number;
    numeroRemision: string;
  }>;
  generateNumeroRemision(): Promise<string>;
  reducirStockPorRemision(remision: any, productos: any[]): Promise<void>;
}

export interface UsuariosModule {
  getUsuariosReferenciados(): Promise<string[]>;
  getEstadisticasUsuarios(): Promise<Array<{
    usuario: string;
    totalMovimientos: number;
    ultimaActividad: string;
  }>>;
}