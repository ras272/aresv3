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

export interface AppState {
  equipos: Equipo[];
  mantenimientos: Mantenimiento[];
  cargasMercaderia: CargaMercaderia[];
  componentesDisponibles: ComponenteDisponible[];
  historialAsignaciones: AsignacionComponente[];
  
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
} 