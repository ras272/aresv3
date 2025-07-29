// Tipos para el sistema de archivos

export interface Carpeta {
  id: string;
  nombre: string;
  ruta_completa: string;
  carpeta_padre_id?: string;
  departamento: string;
  descripcion?: string;
  icono: string;
  color: string;
  created_at: Date;
  updated_at: Date;
  subcarpetas?: Carpeta[];
  archivos?: Archivo[];
  total_archivos?: number;
}

export interface Archivo {
  id: string;
  nombre: string;
  nombre_original: string;
  extension: string;
  tamaño: number;
  tipo_mime: string;
  carpeta_id: string;
  ruta_storage: string;
  url_publica?: string;
  es_editable: boolean;
  version: number;
  checksum?: string;
  metadatos: Record<string, any>;
  subido_por?: string;
  created_at: Date;
  updated_at: Date;
  carpeta?: Carpeta;
}

export interface VersionArchivo {
  id: string;
  archivo_id: string;
  version: number;
  nombre: string;
  tamaño: number;
  ruta_storage: string;
  checksum?: string;
  comentario?: string;
  creado_por?: string;
  created_at: Date;
}

export interface PermisoCarpeta {
  id: string;
  carpeta_id: string;
  user_id?: string;
  rol_usuario: string;
  puede_leer: boolean;
  puede_escribir: boolean;
  puede_eliminar: boolean;
  puede_compartir: boolean;
  created_at: Date;
}

export interface ActividadArchivo {
  id: string;
  archivo_id?: string;
  carpeta_id?: string;
  usuario_id?: string;
  accion: 'crear' | 'editar' | 'eliminar' | 'mover' | 'compartir' | 'descargar' | 'subir';
  descripcion: string;
  ip_address?: string;
  user_agent?: string;
  metadatos: Record<string, any>;
  created_at: Date;
}

export interface EstadisticasArchivos {
  total_archivos: number;
  total_carpetas: number;
  tamaño_total: number;
  archivos_recientes: number;
  archivos_editables: number;
}

export interface FiltrosArchivos {
  carpeta_id?: string;
  departamento?: string;
  extension?: string;
  es_editable?: boolean;
  fecha_desde?: Date;
  fecha_hasta?: Date;
  busqueda?: string;
}