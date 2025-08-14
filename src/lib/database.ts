// Cleaned up database.ts - Contains only non-extracted functions
// This file contains functions that haven't been moved to specific modules yet

import { supabase } from './database/shared/supabase'
import type { DocumentoCarga } from '@/types'

// ===============================================
// DOCUMENTOS MODULE FUNCTIONS
// These functions will eventually be moved to a documentos.ts module
// ===============================================

export async function createDocumentoCarga(documentoData: {
  cargaId: string;
  codigoCarga: string;
  nombreArchivo: string;
  tipoArchivo: string;
  urlArchivo: string;
  tamanoArchivo: number;
  descripcion?: string;
}): Promise<DocumentoCarga> {
  try {
    console.log('📄 Creando documento para carga:', documentoData.codigoCarga);

    const { data, error } = await supabase
      .from('documentos_carga')
      .insert({
        carga_id: documentoData.cargaId,
        codigo_carga: documentoData.codigoCarga,
        nombre_archivo: documentoData.nombreArchivo,
        tipo_archivo: documentoData.tipoArchivo,
        url_archivo: documentoData.urlArchivo,
        tamano_archivo: documentoData.tamanoArchivo,
        descripcion: documentoData.descripcion,
        fecha_subida: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error al crear documento:', error);
      throw error;
    }

    console.log('✅ Documento creado exitosamente');
    return data as DocumentoCarga;
  } catch (error) {
    console.error('❌ Error en createDocumentoCarga:', error);
    throw error;
  }
}

export async function getAllDocumentosCarga(): Promise<DocumentoCarga[]> {
  try {
    const { data, error } = await supabase
      .from('documentos_carga')
      .select(`
        *,
        cargas_mercaderia!inner(
          codigo_carga,
          destino,
          fecha_carga
        )
      `)
      .order('fecha_subida', { ascending: false });

    if (error) {
      console.error('❌ Error al obtener documentos:', error);
      throw error;
    }

    return data as DocumentoCarga[];
  } catch (error) {
    console.error('❌ Error en getAllDocumentosCarga:', error);
    throw error;
  }
}

export async function getDocumentosByCarga(cargaId: string): Promise<DocumentoCarga[]> {
  try {
    const { data, error } = await supabase
      .from('documentos_carga')
      .select(`
        *,
        cargas_mercaderia!inner(
          codigo_carga,
          destino,
          fecha_carga
        )
      `)
      .eq('carga_id', cargaId)
      .order('fecha_subida', { ascending: false });

    if (error) {
      console.error('❌ Error al obtener documentos de la carga:', error);
      throw error;
    }

    return data as DocumentoCarga[];
  } catch (error) {
    console.error('❌ Error en getDocumentosByCarga:', error);
    throw error;
  }
}

export async function deleteDocumentoCarga(documentoId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('documentos_carga')
      .delete()
      .eq('id', documentoId);

    if (error) {
      console.error('❌ Error al eliminar documento:', error);
      throw error;
    }

    console.log('✅ Documento eliminado exitosamente');
  } catch (error) {
    console.error('❌ Error en deleteDocumentoCarga:', error);
    throw error;
  }
}

// ===============================================
// DASHBOARD AND STATISTICS FUNCTIONS
// These functions provide dashboard statistics and will eventually be moved to a dashboard.ts module
// ===============================================

export async function getEstadisticasDashboard() {
  try {
    // Cargas totales
    const { count: totalCargas } = await supabase
      .from('cargas_mercaderia')
      .select('*', { count: 'exact', head: true });

    // Equipos totales
    const { count: totalEquipos } = await supabase
      .from('equipos')
      .select('*', { count: 'exact', head: true });

    // Mantenimientos pendientes
    const { count: mantenimientosPendientes } = await supabase
      .from('mantenimientos')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'Pendiente');

    // Stock items
    const { count: stockItems } = await supabase
      .from('stock_items')
      .select('*', { count: 'exact', head: true });

    return {
      totalCargas: totalCargas || 0,
      totalEquipos: totalEquipos || 0,
      mantenimientosPendientes: mantenimientosPendientes || 0,
      stockItems: stockItems || 0,
    };
  } catch (error) {
    console.error('❌ Error al obtener estadísticas del dashboard:', error);
    throw error;
  }
}

// ===============================================
// FILE DOCUMENTATION
// ===============================================

/**
 * This file contains database functions that haven't been extracted to specific modules yet.
 * 
 * Current functions:
 * - Document management functions (createDocumentoCarga, getAllDocumentosCarga, etc.)
 * - Dashboard statistics functions (getEstadisticasDashboard)
 * 
 * Future refactoring:
 * - Document functions should be moved to a documentos.ts module
 * - Dashboard functions should be moved to a dashboard.ts module
 * 
 * This file serves as a temporary location for these functions during the refactoring process.
 */