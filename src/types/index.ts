export interface ComponenteEquipo {
  id: string;
  nombre: string;
  numeroSerie: string;
  estado: 'Operativo' | 'En reparacion' | 'Fuera de servicio';
  observaciones?: string;
}

export interface Equipo {
  id: string;
  cliente: string;
  ubicacion: string;
  nombreEquipo: string;
  tipoEquipo: string;
  marca: string;
  modelo: string;
  numeroSerieBase: string;
  componentes: ComponenteEquipo[];
  accesorios: string;
  fechaEntrega: string;
  observaciones?: string;
  createdAt: string;
}

export interface Mantenimiento {
  id: string;
  numeroReporte?: string; // 🆕 Identificador único del reporte (ej: RPT-20250115-001)
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
  precioServicio?: number; // 💰 Precio del servicio en guaraníes (se completa al generar reporte)
  
  // 🔧 REPUESTOS UTILIZADOS EN EL SERVICIO
  repuestosUtilizados?: Array<{
    id: string;
    nombre: string;
    marca: string;
    modelo: string;
    cantidad: number;
    stockAntes: number;
  }>;
  
  // 📋 TRACKING DE FACTURACIÓN EXTERNA
  estadoFacturacion?: 'Pendiente' | 'Facturado' | 'Enviado'; // Estado del proceso de facturación
  numeroFacturaExterna?: string; // Número de factura del sistema externo
  fechaFacturacion?: string; // Fecha cuando se facturó externamente
  archivoFacturaPDF?: {
    nombre: string;
    url: string;
    tamaño: number;
  }; // PDF de la factura del sistema externo
  
  // 🗓️ NUEVOS CAMPOS PARA CALENDARIO DE MANTENIMIENTOS
  tipo: 'Correctivo' | 'Preventivo'; // Tipo de mantenimiento
  esProgramado?: boolean; // Si es un mantenimiento programado
  fechaProgramada?: string; // Fecha originalmente programada
  tecnicoAsignado?: string; // Técnico responsable
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Crítica'; // Prioridad del mantenimiento
  
  // Para mantenimientos recurrentes
  esRecurrente?: boolean;
  frecuenciaMantenimiento?: 'Mensual' | 'Bimestral' | 'Trimestral' | 'Semestral' | 'Anual';
  proximoMantenimiento?: string; // Fecha del próximo mantenimiento automático
  
  // Para notificaciones
  diasNotificacionAnticipada?: number; // Días antes para notificar
  notificacionEnviada?: boolean;
  
  // Métricas de tiempo
  tiempoEstimado?: number; // Tiempo estimado en horas
  tiempoReal?: number; // Tiempo real trabajado
  
  createdAt: string;
}

// 🆕 NUEVA INTERFAZ: Plan de Mantenimiento para equipos
export interface PlanMantenimiento {
  id: string;
  equipoId: string;
  tipoEquipo: string; // Para aplicar diferentes planes según tipo
  mantenimientosRequeridos: {
    tipo: 'Preventivo';
    descripcion: string;
    frecuencia: 'Mensual' | 'Bimestral' | 'Trimestral' | 'Semestral' | 'Anual';
    tiempoEstimado: number; // en horas
    prioridad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
    instrucciones?: string;
  }[];
  fechaInicioplan: string;
  activo: boolean;
  createdAt: string;
}

// 🆕 NUEVA INTERFAZ: Técnico disponible
export interface Tecnico {
  id: string;
  nombre: string;
  especialidades: string[]; // Tipos de equipos que maneja
  disponibilidad: {
    lunes: { inicio: string; fin: string; disponible: boolean };
    martes: { inicio: string; fin: string; disponible: boolean };
    miercoles: { inicio: string; fin: string; disponible: boolean };
    jueves: { inicio: string; fin: string; disponible: boolean };
    viernes: { inicio: string; fin: string; disponible: boolean };
    sabado: { inicio: string; fin: string; disponible: boolean };
    domingo: { inicio: string; fin: string; disponible: boolean };
  };
  activo: boolean;
}

// Tipos para el módulo de Ingreso de Mercaderías - REDISEÑADO para múltiples productos por carga
export interface SubItem {
  id: string;
  nombre: string;
  numeroSerie?: string; // 🔧 OPCIONAL - No todos los accesorios tienen número de serie
  cantidad: number;
  paraServicioTecnico?: boolean; // 🎯 NUEVO: Control manual para servicio técnico
}

export interface ProductoCarga {
  id: string;
  producto: string;
  tipoProducto: 'Insumo' | 'Repuesto' | 'Equipo Médico';
  marca: string;
  modelo: string;
  numeroSerie?: string;
  cantidad: number;
  observaciones?: string;
  paraServicioTecnico?: boolean; // 🎯 NUEVO: Control manual para servicio técnico
  imagen?: string;
  // Nuevos campos específicos para equipos estéticos
  voltaje?: string;
  frecuencia?: string;
  tipoTratamiento?: string;
  registroSanitario?: string;
  documentosAduaneros?: string;
  subitems?: SubItem[];
}

export interface CargaMercaderia {
  id: string;
  codigoCarga: string;
  fechaIngreso: string;
  tipoCarga: 'stock' | 'cliente' | 'reparacion';
  cliente?: string;
  ubicacionServicio?: string;
  destino: string; // Campo calculado para compatibilidad
  observacionesGenerales?: string;
  numeroCargaPersonalizado?: string; // Número de carga/envío personalizado (AWB, BL, etc.)
  productos: ProductoCarga[];
  createdAt: string;
}

// Tipos para Inventario Técnico
export interface ComponenteDisponible {
  id: string;
  nombre: string;
  marca: string;
  modelo: string;
  numeroSerie?: string;
  tipoComponente: string;
  cantidadDisponible: number;
  cantidadOriginal: number;
  ubicacionFisica?: string;
  estado: 'Disponible' | 'Asignado' | 'En reparación';
  observaciones?: string;
  fechaIngreso: string;
  codigoCargaOrigen?: string;
  imagen?: string; // 🆕 URL de la imagen del producto
  cargaInfo?: {
    codigoCarga: string;
    fechaIngreso: string;
  } | null;
  // 🎯 NUEVA INFORMACIÓN DEL EQUIPO PADRE
  equipoPadre?: {
    equipoId: string;
    nombreEquipo: string;
    cliente: string;
    numeroSerieBase: string;
  } | null;
  createdAt: string;
}

export interface AsignacionComponente {
  id: string;
  componenteId: string;
  equipoId: string;
  cantidadAsignada: number;
  fechaAsignacion: string;
  tecnicoResponsable?: string;
  motivo: string;
  observaciones?: string;
  componente?: {
    nombre: string;
    marca: string;
    modelo: string;
    tipoComponente: string;
  };
  equipo?: {
    nombreEquipo: string;
    cliente: string;
    ubicacion: string;
  };
  createdAt: string;
}

// 🆕 TIPOS PARA CLÍNICAS
export interface Clinica {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  telefono?: string;
  email?: string;
  contactoPrincipal?: string;
  observaciones?: string;
  activa: boolean;
  createdAt: string;
  updatedAt: string;
}

// 🆕 TIPOS PARA SISTEMA DE USUARIOS Y AUTENTICACIÓN
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'super_admin' | 'contabilidad' | 'tecnico';
  activo: boolean;
  ultimoAcceso?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SesionUsuario {
  usuario: Usuario;
  token: string;
  fechaInicio: string;
  activa: boolean;
}

export interface PermisosModulo {
  leer: boolean;
  escribir: boolean;
}

export interface PermisosRol {
  dashboard: PermisosModulo;
  equipos: PermisosModulo;
  inventarioTecnico: PermisosModulo;
  calendario: PermisosModulo;
  mercaderias: PermisosModulo;
  documentos: PermisosModulo;
  remisiones: PermisosModulo;
  facturacion: PermisosModulo;
  archivos: PermisosModulo;
  tareas: PermisosModulo;
  clinicas: PermisosModulo;
  stock: PermisosModulo;
  reportes: PermisosModulo;
  configuracion: PermisosModulo;
}

// 🆕 TIPOS PARA SISTEMA DE STOCK
export interface TransaccionStock {
  id: string;
  componenteId: string;
  tipo: 'ENTRADA' | 'SALIDA' | 'RESERVA' | 'AJUSTE' | 'DEVOLUCION';
  cantidad: number;
  cantidadAnterior: number;
  cantidadNueva: number;
  motivo: string;
  referencia?: string; // REM-20250115-001, CARGA-001, etc.
  numeroFactura?: string;
  cliente?: string;
  tecnicoResponsable?: string;
  observaciones?: string;
  fecha: string;
  createdAt: string;
  // Información del componente para historial
  componente?: {
    nombre: string;
    marca: string;
    modelo: string;
    numeroSerie?: string;
  };
}

export interface EstadisticasStock {
  totalProductos: number;
  valorTotalStock: number;
  productosConStockBajo: number;
  transaccionesHoy: number;
  entradasMes: number;
  salidasMes: number;
}

// 🆕 TIPOS PARA REMISIONES DIGITALES (ACTUALIZADO)
export interface ProductoRemision {
  id: string;
  componenteId: string | null; // null para productos del stock general
  stockItemId?: string | null; // ID del stock general si aplica
  origen?: 'inventario' | 'stock'; // Origen del producto
  nombre: string;
  marca: string;
  modelo: string;
  numeroSerie?: string;
  cantidadSolicitada: number;
  cantidadDisponible: number;
  observaciones?: string;
}

export interface Remision {
  id: string;
  numeroRemision: string;        // AUTO: REM-YYYYMMDD-XXX
  numeroFactura?: string;        // 🆕 NUEVO: Número de factura
  fecha: string;
  cliente: string;               // Hospital/Clínica
  direccionEntrega: string;      // Dirección específica
  contacto?: string;             // Persona de contacto
  telefono?: string;             // Teléfono de contacto
  tipoRemision: 'Instalación' | 'Mantenimiento' | 'Reparación' | 'Entrega';
  tecnicoResponsable: string;    // Siempre "Javier Lopez"
  productos: ProductoRemision[];
  descripcionGeneral?: string;   // Observaciones generales
  estado: 'Borrador' | 'Confirmada' | 'En tránsito' | 'Entregada' | 'Cancelada';
  fechaEntrega?: string;         // Cuando se confirma la entrega
  observacionesEntrega?: string; // Observaciones al entregar
  createdAt: string;
  updatedAt: string;
}

// 🆕 TIPOS PARA GESTIÓN DOCUMENTAL
export interface DocumentoCarga {
  id: string;
  cargaId: string;
  codigoCarga: string;
  nombre: string;
  tipoDocumento: 'Factura Paraguay Box' | 'Documento DHL' | 'Comprobante Pago' | 'Foto Producto' | 'Documento Aduanero' | 'Otro';
  archivo: {
    nombre: string;
    tamaño: number;
    tipo: string;
    url: string;
  };
  observaciones?: string;
  fechaSubida: string;
  subidoPor?: string;
  createdAt: string;
}

export interface CargaConDocumentos extends CargaMercaderia {
  documentos: DocumentoCarga[];
  totalDocumentos: number;
}

export interface AppState {
  // Hydration state
  isHydrated: boolean;
  
  equipos: Equipo[];
  mantenimientos: Mantenimiento[];
  cargasMercaderia: CargaMercaderia[];
  componentesDisponibles: ComponenteDisponible[]; // Para inventario técnico
  stockItems: ComponenteDisponible[]; // 🎯 NUEVO: Para stock general
  historialAsignaciones: AsignacionComponente[];
  remisiones: Remision[];
  clinicas: Clinica[];
  transaccionesStock: TransaccionStock[];
  documentosCarga: DocumentoCarga[];
  movimientosStock: import('@/lib/database').MovimientoStock[];
  
  // 🆕 NUEVOS ARRAYS PARA CALENDARIO
  planesMantenimiento: PlanMantenimiento[];
  tecnicos: Tecnico[];
  
  addEquipo: (equipo: import('@/lib/schemas').EquipoFormData) => Promise<void>;
  addMantenimiento: (mantenimiento: Omit<Mantenimiento, 'id' | 'createdAt'>) => Promise<void>;
  updateMantenimiento: (id: string, updates: Partial<Mantenimiento>) => Promise<void>;
  deleteMantenimiento: (id: string) => Promise<void>;
  updateComponente: (equipoId: string, componenteId: string, updates: Partial<ComponenteEquipo>) => Promise<void>;
  getMantenimientosByEquipo: (equipoId: string) => Mantenimiento[];
  searchEquipos: (term: string) => Equipo[];
  addCargaMercaderia: (carga: import('@/lib/schemas').CargaMercaderiaFormData) => Promise<CargaMercaderia>;
  getCargasMercaderia: () => CargaMercaderia[];
  generateCodigoCarga: () => Promise<string>;
  deleteCarga: (cargaId: string) => Promise<void>;
  deleteEquipo: (equipoId: string) => Promise<void>;
  loadAllData: () => Promise<void>;
  getEstadisticas: () => Promise<{
    totalCargas: number;
    cargasHoy: number;
    totalProductos: number;
    equiposMedicos: number;
  }>;
  
  // Funciones para inventario técnico
  loadInventarioTecnico: () => Promise<void>;
  asignarComponente: (componenteId: string, equipoId: string, cantidadAsignada: number, motivo: string, tecnicoResponsable?: string, observaciones?: string) => Promise<void>;
  getComponentesDisponibles: () => ComponenteDisponible[];
  getHistorialAsignaciones: (componenteId?: string, equipoId?: string) => AsignacionComponente[];

  // 🆕 FUNCIONES PARA STOCK GENERAL
  loadStock: () => Promise<void>;
  updateStockItem: (itemId: string, nuevaCantidad: number, motivo: string) => Promise<void>;
  updateStockItemDetails: (productId: string, updates: { imagen?: string; observaciones?: string }) => Promise<void>;
  getEstadisticasStockGeneral: () => {
    totalProductos: number;
    productosConStockBajo: number;
    entradasMes: number;
    salidasMes: number;
  };

  // 🆕 FUNCIONES PARA TRAZABILIDAD Y MOVIMIENTOS
  movimientosStock: import('@/lib/database').MovimientoStock[];
  loadMovimientosStock: () => Promise<void>;
  getMovimientosByProducto: (productoNombre: string, productoMarca?: string) => Promise<import('@/lib/database').MovimientoStock[]>;
  getMovimientosByCarpeta: (carpeta: string) => Promise<import('@/lib/database').MovimientoStock[]>;
  getEstadisticasTrazabilidad: () => Promise<{
    totalMovimientos: number;
    movimientosHoy: number;
    movimientosMes: number;
    entradas: { total: number; mes: number; valorTotal: number };
    salidas: { total: number; mes: number; valorTotal: number };
    ajustes: { total: number; mes: number };
    productosConMasMovimientos: Array<{ producto: string; cantidad: number }>;
    carpetasConMasActividad: Array<{ carpeta: string; cantidad: number }>;
  }>;
  registrarSalidaStock: (salidaData: {
    itemId: string;
    productoNombre: string;
    productoMarca?: string;
    productoModelo?: string;
    cantidad: number;
    cantidadAnterior: number;
    motivo: string;
    destino: string;
    responsable: string;
    cliente?: string;
    numeroFactura?: string;
    observaciones?: string;
    carpetaOrigen?: string;
  }) => Promise<void>;

  // 🎯 NUEVAS FUNCIONES HÍBRIDAS PARA REPORTES DE SERVICIO TÉCNICO
  registrarSalidaStockReporte: (salidaData: {
    itemId: string;
    productoNombre: string;
    productoMarca?: string;
    productoModelo?: string;
    cantidad: number;
    cantidadAnterior: number;
    mantenimientoId?: string;
    equipoId?: string;
    tecnicoResponsable?: string;
    observaciones?: string;
  }) => Promise<void>;

  devolverRepuestosAlStockReporte: (devolucionData: {
    itemId: string;
    productoNombre: string;
    productoMarca?: string;
    productoModelo?: string;
    cantidad: number;
    cantidadAnterior: number;
    mantenimientoId?: string;
    equipoId?: string;
    tecnicoResponsable?: string;
    observaciones?: string;
  }) => Promise<void>;
  getEstadisticasPorCarpeta: (carpeta: string) => {
    totalMovimientos: number;
    entradas: { total: number; cantidad: number; valorTotal: number };
    salidas: { total: number; cantidad: number; valorTotal: number };
    productosUnicos: number;
    ultimoMovimiento: string | null;
  };

  // 🆕 NUEVAS FUNCIONES PARA CALENDARIO
  loadTecnicos: () => Promise<void>;
  addTecnico: (tecnico: Omit<Tecnico, 'id'>) => Promise<void>;
  updateTecnico: (id: string, updates: Partial<Tecnico>) => Promise<void>;
  getTecnicosDisponibles: () => Tecnico[];
  
  loadPlanesMantenimiento: () => Promise<void>;
  addPlanMantenimiento: (plan: Omit<PlanMantenimiento, 'id' | 'createdAt'>) => Promise<void>;
  
  // Funciones para mantenimientos programados
  addMantenimientoProgramado: (mantenimiento: {
    equipoId: string;
    fechaProgramada: string;
    descripcion: string;
    tipo: 'Preventivo';
    tecnicoAsignado?: string;
    prioridad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
    tiempoEstimado?: number;
    esRecurrente?: boolean;
    frecuenciaMantenimiento?: 'Mensual' | 'Bimestral' | 'Trimestral' | 'Semestral' | 'Anual';
    diasNotificacionAnticipada?: number;
  }) => Promise<void>;
  
  getMantenimientosProgramados: () => Mantenimiento[];
  getMantenimientosByTecnico: (tecnico: string) => Mantenimiento[];
  getMantenimientosVencidos: () => Mantenimiento[];

  // 🆕 FUNCIONES PARA CLÍNICAS
  loadClinicas: () => Promise<void>;
  addClinica: (clinica: Omit<Clinica, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Clinica>;
  updateClinica: (id: string, updates: Partial<Clinica>) => Promise<void>;
  deleteClinica: (id: string) => Promise<void>;
  getClinicas: () => Clinica[];
  getClinicasActivas: () => Clinica[];

  // 🆕 FUNCIONES PARA SISTEMA DE STOCK
  loadTransaccionesStock: () => Promise<void>;
  addTransaccionStock: (transaccion: Omit<TransaccionStock, 'id' | 'createdAt'>) => Promise<void>;
  getTransaccionesStock: () => TransaccionStock[];
  getTransaccionesByComponente: (componenteId: string) => TransaccionStock[];
  getEstadisticasStock: () => EstadisticasStock;
  procesarSalidaStock: (componenteId: string, cantidad: number, motivo: string, referencia?: string, numeroFactura?: string, cliente?: string) => Promise<void>;

  // 🆕 FUNCIONES PARA SISTEMA DE USUARIOS
  usuarios: Usuario[];
  sesionActual: SesionUsuario | null;
  loadUsuarios: () => Promise<void>;
  login: (email: string, password: string) => Promise<SesionUsuario>;
  logout: () => void;
  getCurrentUser: () => Usuario | null;
  getUserPermissions: (rol: Usuario['rol']) => PermisosRol;
  hasPermission: (modulo: keyof PermisosRol) => boolean;
  hasWritePermission: (modulo: keyof PermisosRol) => boolean;

  // 🆕 FUNCIONES PARA REMISIONES DIGITALES
  loadRemisiones: () => Promise<void>;
  addRemision: (remision: Omit<Remision, 'id' | 'numeroRemision' | 'createdAt' | 'updatedAt'>) => Promise<Remision>;
  updateRemision: (id: string, updates: Partial<Remision>) => Promise<void>;
  deleteRemision: (id: string) => Promise<void>;
  getRemisiones: () => Remision[];
  getRemisionesByCliente: (cliente: string) => Remision[];
  generateNumeroRemision: () => Promise<string>;

  // 🆕 FUNCIONES PARA GESTIÓN DOCUMENTAL
  loadDocumentosCarga: () => Promise<void>;
  addDocumentoCarga: (documento: Omit<DocumentoCarga, 'id' | 'createdAt'>) => Promise<DocumentoCarga>;
  deleteDocumentoCarga: (id: string) => Promise<void>;
  getDocumentosByCarga: (cargaId: string) => DocumentoCarga[];
  getCargasConDocumentos: () => CargaConDocumentos[];

  // Hydration functions
  setHydrated: () => void;
} 