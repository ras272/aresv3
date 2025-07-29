export interface Tarea {
  id: string;
  titulo: string;
  descripcion?: string;
  estado: EstadoTarea;
  prioridad: PrioridadTarea;
  fecha_creacion: Date;
  fecha_limite?: Date;
  fecha_completada?: Date;
  asignado_a: string; // ID del usuario
  creado_por: string; // ID del usuario
  departamento: string;
  categoria: CategoriaTarea;
  etiquetas?: string[];
  comentarios?: ComentarioTarea[];
  archivos_adjuntos?: string[]; // URLs de archivos
  progreso: number; // 0-100
  tiempo_estimado?: number; // en horas
  tiempo_real?: number; // en horas
  updated_at: Date;
}

export interface ComentarioTarea {
  id: string;
  tarea_id: string;
  usuario_id: string;
  usuario_nombre: string;
  comentario: string;
  fecha: Date;
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  departamento: string;
  avatar?: string;
  activo: boolean;
}

export type EstadoTarea = 
  | 'pendiente' 
  | 'en_progreso' 
  | 'en_revision' 
  | 'completada' 
  | 'cancelada';

export type PrioridadTarea = 
  | 'baja' 
  | 'media' 
  | 'alta' 
  | 'urgente';

export type CategoriaTarea = 
  | 'general'
  | 'mantenimiento'
  | 'rrhh'
  | 'contabilidad'
  | 'inventario'
  | 'facturacion'
  | 'servicio_tecnico';

export interface FiltrosTareas {
  estado?: EstadoTarea[];
  prioridad?: PrioridadTarea[];
  asignado_a?: string[];
  departamento?: string[];
  categoria?: CategoriaTarea[];
  fecha_desde?: Date;
  fecha_hasta?: Date;
  busqueda?: string;
}

export interface EstadisticasTareas {
  total_tareas: number;
  pendientes: number;
  en_progreso: number;
  completadas: number;
  vencidas: number;
  por_prioridad: {
    baja: number;
    media: number;
    alta: number;
    urgente: number;
  };
  por_departamento: Record<string, number>;
  productividad_semanal: number;
}