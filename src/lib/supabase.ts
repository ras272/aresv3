import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para las tablas de la base de datos
export type Database = {
  public: {
    Tables: {
      cargas_mercaderia: {
        Row: {
          id: string
          codigo_carga: string
          fecha_ingreso: string
          destino: string
          observaciones_generales: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          codigo_carga: string
          fecha_ingreso: string
          destino: string
          observaciones_generales?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          codigo_carga?: string
          fecha_ingreso?: string
          destino?: string
          observaciones_generales?: string | null
          updated_at?: string
        }
      }
      productos_carga: {
        Row: {
          id: string
          carga_id: string
          producto: string
          tipo_producto: 'Insumo' | 'Repuesto' | 'Equipo Médico'
          marca: string
          modelo: string
          numero_serie: string | null
          cantidad: number
          observaciones: string | null
          imagen: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          carga_id: string
          producto: string
          tipo_producto: 'Insumo' | 'Repuesto' | 'Equipo Médico'
          marca: string
          modelo: string
          numero_serie?: string | null
          cantidad: number
          observaciones?: string | null
          imagen?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          carga_id?: string
          producto?: string
          tipo_producto?: 'Insumo' | 'Repuesto' | 'Equipo Médico'
          marca?: string
          modelo?: string
          numero_serie?: string | null
          cantidad?: number
          observaciones?: string | null
          imagen?: string | null
          updated_at?: string
        }
      }
      subitems: {
        Row: {
          id: string
          producto_id: string
          nombre: string
          numero_serie: string
          cantidad: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          producto_id: string
          nombre: string
          numero_serie: string
          cantidad: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          producto_id?: string
          nombre?: string
          numero_serie?: string
          cantidad?: number
          updated_at?: string
        }
      }
      equipos: {
        Row: {
          id: string
          cliente: string
          ubicacion: string
          nombre_equipo: string
          tipo_equipo: string
          marca: string
          modelo: string
          numero_serie_base: string
          accesorios: string
          fecha_entrega: string
          observaciones: string | null
          codigo_carga_origen: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cliente: string
          ubicacion: string
          nombre_equipo: string
          tipo_equipo: string
          marca: string
          modelo: string
          numero_serie_base: string
          accesorios: string
          fecha_entrega: string
          observaciones?: string | null
          codigo_carga_origen?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cliente?: string
          ubicacion?: string
          nombre_equipo?: string
          tipo_equipo?: string
          marca?: string
          modelo?: string
          numero_serie_base?: string
          accesorios?: string
          fecha_entrega?: string
          observaciones?: string | null
          codigo_carga_origen?: string | null
          updated_at?: string
        }
      }
      componentes_equipo: {
        Row: {
          id: string
          equipo_id: string
          nombre: string
          numero_serie: string
          estado: 'Operativo' | 'En reparacion' | 'Fuera de servicio'
          observaciones: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          equipo_id: string
          nombre: string
          numero_serie: string
          estado: 'Operativo' | 'En reparacion' | 'Fuera de servicio'
          observaciones?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          equipo_id?: string
          nombre?: string
          numero_serie?: string
          estado?: 'Operativo' | 'En reparacion' | 'Fuera de servicio'
          observaciones?: string | null
          updated_at?: string
        }
      }
      mantenimientos: {
        Row: {
          id: string
          equipo_id: string
          componente_id: string | null
          fecha: string
          descripcion: string
          estado: 'Pendiente' | 'En proceso' | 'Finalizado'
          comentarios: string | null
          archivo_nombre: string | null
          archivo_tamaño: number | null
          archivo_tipo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          equipo_id: string
          componente_id?: string | null
          fecha: string
          descripcion: string
          estado: 'Pendiente' | 'En proceso' | 'Finalizado'
          comentarios?: string | null
          archivo_nombre?: string | null
          archivo_tamaño?: number | null
          archivo_tipo?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          equipo_id?: string
          componente_id?: string | null
          fecha?: string
          descripcion?: string
          estado?: 'Pendiente' | 'En proceso' | 'Finalizado'
          comentarios?: string | null
          archivo_nombre?: string | null
          archivo_tamaño?: number | null
          archivo_tipo?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      tipo_producto: 'Insumo' | 'Repuesto' | 'Equipo Médico'
      estado_componente: 'Operativo' | 'En reparacion' | 'Fuera de servicio'
      estado_mantenimiento: 'Pendiente' | 'En proceso' | 'Finalizado'
    }
  }
} 