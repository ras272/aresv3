import { supabase } from './shared/supabase';
import type { Clinica } from '../../types';

// TypeScript interfaces for the Clinicas module
export interface ClinicaInput {
  nombre: string;
  direccion: string;
  ciudad: string;
  telefono?: string;
  email?: string;
  contactoPrincipal?: string;
  observaciones?: string;
  activa?: boolean;
}

export interface ClinicaUpdate {
  nombre?: string;
  direccion?: string;
  ciudad?: string;
  telefono?: string;
  email?: string;
  contactoPrincipal?: string;
  observaciones?: string;
  activa?: boolean;
}

export interface ClinicasModule {
  getAllClinicas(): Promise<Clinica[]>;
  createClinica(clinicaData: ClinicaInput): Promise<Clinica>;
  updateClinica(clinicaId: string, updates: ClinicaUpdate): Promise<Clinica>;
  deleteClinica(clinicaId: string): Promise<boolean>;
}

/**
 * Get all clinics from the database
 * @returns Promise<Clinica[]> Array of all clinics
 */
export async function getAllClinicas(): Promise<Clinica[]> {
  try {
    const { data, error } = await supabase
      .from('clinicas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((clinica: any) => ({
      id: clinica.id,
      nombre: clinica.nombre,
      direccion: clinica.direccion,
      ciudad: clinica.ciudad,
      telefono: clinica.telefono,
      email: clinica.email,
      contactoPrincipal: clinica.contacto_principal,
      observaciones: clinica.observaciones,
      activa: clinica.activa,
      createdAt: clinica.created_at,
      updatedAt: clinica.updated_at
    }));
  } catch (error) {
    console.error('❌ Error loading clínicas:', error);
    throw error;
  }
}

/**
 * Create a new clinic
 * @param clinicaData - The clinic data to create
 * @returns Promise<Clinica> The created clinic
 */
export async function createClinica(clinicaData: ClinicaInput): Promise<Clinica> {
  try {
    const { data, error } = await supabase
      .from('clinicas')
      .insert({
        nombre: clinicaData.nombre,
        direccion: clinicaData.direccion,
        ciudad: clinicaData.ciudad,
        telefono: clinicaData.telefono,
        email: clinicaData.email,
        contacto_principal: clinicaData.contactoPrincipal,
        observaciones: clinicaData.observaciones,
        activa: clinicaData.activa ?? true
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Clínica creada exitosamente:', data);

    return {
      id: data.id,
      nombre: data.nombre,
      direccion: data.direccion,
      ciudad: data.ciudad,
      telefono: data.telefono,
      email: data.email,
      contactoPrincipal: data.contacto_principal,
      observaciones: data.observaciones,
      activa: data.activa,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('❌ Error creating clínica:', error);
    throw error;
  }
}

/**
 * Update an existing clinic
 * @param clinicaId - The ID of the clinic to update
 * @param updates - The updates to apply
 * @returns Promise<Clinica> The updated clinic
 */
export async function updateClinica(clinicaId: string, updates: ClinicaUpdate): Promise<Clinica> {
  try {
    const { data, error } = await supabase
      .from('clinicas')
      .update({
        nombre: updates.nombre,
        direccion: updates.direccion,
        ciudad: updates.ciudad,
        telefono: updates.telefono,
        email: updates.email,
        contacto_principal: updates.contactoPrincipal,
        observaciones: updates.observaciones,
        activa: updates.activa
      })
      .eq('id', clinicaId)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Clínica actualizada exitosamente:', data);
    
    return {
      id: data.id,
      nombre: data.nombre,
      direccion: data.direccion,
      ciudad: data.ciudad,
      telefono: data.telefono,
      email: data.email,
      contactoPrincipal: data.contacto_principal,
      observaciones: data.observaciones,
      activa: data.activa,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('❌ Error updating clínica:', error);
    throw error;
  }
}

/**
 * Delete a clinic
 * @param clinicaId - The ID of the clinic to delete
 * @returns Promise<boolean> True if deletion was successful
 */
export async function deleteClinica(clinicaId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('clinicas')
      .delete()
      .eq('id', clinicaId);

    if (error) throw error;

    console.log('✅ Clínica eliminada exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error deleting clínica:', error);
    throw error;
  }
}

// ===============================================
// CLIENT COMPREHENSIVE INFORMATION FUNCTIONS
// ===============================================

/**
 * Get comprehensive information for a specific client including equipos and maintenance
 * @param clienteNombre - Name of the client/clinic
 * @returns Promise<ClienteInfoCompleta> - Complete client information
 */
export async function getInfoCompletaCliente(clienteNombre: string): Promise<ClienteInfoCompleta> {
  try {
    console.log('🔍 Fetching complete client information:', clienteNombre);

    // Validate input
    if (!clienteNombre || clienteNombre.trim() === '') {
      throw new Error('Client name is required');
    }

    // Get clinic basic information
    const clinica = await getClinicaByNombre(clienteNombre);
    
    // Import functions from other modules (dynamic import to avoid circular dependencies)
    const { getEquiposByCliente, getEstadisticasEquiposByCliente } = await import('./equipos');
    const { getMantenimientosByCliente, getEstadisticasMantenimientosByCliente } = await import('./mantenimientos');

    // Get equipment and maintenance information in parallel
    const [equipos, equiposStats, mantenimientos, mantenimientosStats] = await Promise.all([
      getEquiposByCliente(clienteNombre),
      getEstadisticasEquiposByCliente(clienteNombre),
      getMantenimientosByCliente(clienteNombre),
      getEstadisticasMantenimientosByCliente(clienteNombre)
    ]);

    const infoCompleta: ClienteInfoCompleta = {
      clinica,
      equipos: {
        lista: equipos,
        estadisticas: equiposStats
      },
      mantenimientos: {
        lista: mantenimientos,
        estadisticas: mantenimientosStats
      },
      resumen: {
        totalEquipos: equipos.length,
        equiposOperativos: equiposStats.equiposPorEstado.operativo,
        totalMantenimientos: mantenimientos.length,
        mantenimientosPendientes: mantenimientosStats.mantenimientosPorEstado.programado,
        ultimaActividad: getUltimaActividad(equipos, mantenimientos),
        estadoGeneral: determinarEstadoGeneral(equiposStats, mantenimientosStats)
      },
      fechaConsulta: new Date().toISOString()
    };

    console.log('✅ Complete client information fetched successfully:', {
      clienteNombre,
      totalEquipos: infoCompleta.resumen.totalEquipos,
      totalMantenimientos: infoCompleta.resumen.totalMantenimientos
    });

    return infoCompleta;
  } catch (error) {
    console.error('❌ Failed to fetch complete client information:', error);
    throw error;
  }
}

/**
 * Get clinic information by name
 * @param nombre - Name of the clinic
 * @returns Promise<Clinica | null> - Clinic information or null if not found
 */
export async function getClinicaByNombre(nombre: string): Promise<Clinica | null> {
  try {
    console.log('🏥 Fetching clinic by name:', nombre);

    const { data, error } = await supabase
      .from('clinicas')
      .select('*')
      .eq('nombre', nombre.trim())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        console.log('ℹ️ Clinic not found:', nombre);
        return null;
      }
      console.error('❌ Error fetching clinic by name:', error);
      throw error;
    }

    console.log('✅ Clinic fetched successfully:', data.nombre);
    return data;
  } catch (error) {
    console.error('❌ Failed to fetch clinic by name:', error);
    throw error;
  }
}

/**
 * Get summary information for multiple clients
 * @param clientesNombres - Array of client names
 * @returns Promise<ClienteResumenInfo[]> - Array of client summaries
 */
export async function getResumenMultiplesClientes(clientesNombres: string[]): Promise<ClienteResumenInfo[]> {
  try {
    console.log('📊 Fetching summary for multiple clients:', { count: clientesNombres.length });

    // Validate input
    if (!Array.isArray(clientesNombres) || clientesNombres.length === 0) {
      return [];
    }

    // Import functions from other modules
    const { getResumenEquiposMultiplesClientes } = await import('./equipos');

    // Get basic clinic information
    const clinicas = await Promise.all(
      clientesNombres.map(nombre => getClinicaByNombre(nombre))
    );

    // Get equipment summaries
    const equiposSummaries = await getResumenEquiposMultiplesClientes(clientesNombres);

    // Combine information
    const resumenClientes: ClienteResumenInfo[] = clientesNombres.map((nombre, index) => {
      const clinica = clinicas[index];
      const equiposSummary = equiposSummaries.find(s => s.clienteNombre === nombre);

      return {
        clienteNombre: nombre,
        clinica,
        totalEquipos: equiposSummary?.totalEquipos || 0,
        equiposOperativos: equiposSummary?.equiposOperativos || 0,
        equiposEnMantenimiento: equiposSummary?.equiposEnMantenimiento || 0,
        tiposEquiposCount: equiposSummary?.tiposEquiposCount || 0,
        ultimaInstalacion: equiposSummary?.ultimaInstalacion || null,
        estado: determinarEstadoCliente(equiposSummary?.totalEquipos || 0, equiposSummary?.equiposOperativos || 0)
      };
    });

    console.log('✅ Multiple clients summary fetched successfully:', {
      clientesProcessed: resumenClientes.length,
      totalEquiposAllClients: resumenClientes.reduce((sum, c) => sum + c.totalEquipos, 0)
    });

    return resumenClientes;
  } catch (error) {
    console.error('❌ Failed to fetch multiple clients summary:', error);
    throw error;
  }
}

// ===============================================
// UTILITY FUNCTIONS
// ===============================================

/**
 * Determine the last activity date from equipment and maintenance
 */
function getUltimaActividad(equipos: any[], mantenimientos: any[]): string | null {
  const fechas: string[] = [];
  
  // Add equipment creation dates
  equipos.forEach(equipo => {
    if (equipo.createdAt) fechas.push(equipo.createdAt);
    if (equipo.fechaEntrega) fechas.push(equipo.fechaEntrega);
  });
  
  // Add maintenance dates
  mantenimientos.forEach(mantenimiento => {
    if (mantenimiento.fechaProgramada) fechas.push(mantenimiento.fechaProgramada);
    if (mantenimiento.createdAt) fechas.push(mantenimiento.createdAt);
  });
  
  if (fechas.length === 0) return null;
  
  // Return the most recent date
  return fechas.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
}

/**
 * Determine general status based on equipment and maintenance statistics
 */
function determinarEstadoGeneral(equiposStats: any, mantenimientosStats: any): 'Excelente' | 'Bueno' | 'Regular' | 'Crítico' {
  const totalEquipos = equiposStats.totalEquipos;
  const equiposOperativos = equiposStats.equiposPorEstado.operativo;
  const equiposFueraServicio = equiposStats.equiposPorEstado.fueraDeServicio;
  const mantenimientosPendientes = mantenimientosStats.mantenimientosPorEstado.programado;
  
  if (totalEquipos === 0) return 'Regular';
  
  const porcentajeOperativo = (equiposOperativos / totalEquipos) * 100;
  const porcentajeFueraServicio = (equiposFueraServicio / totalEquipos) * 100;
  
  if (porcentajeOperativo >= 90 && mantenimientosPendientes === 0) return 'Excelente';
  if (porcentajeOperativo >= 80 && porcentajeFueraServicio < 10) return 'Bueno';
  if (porcentajeOperativo >= 60 && porcentajeFueraServicio < 20) return 'Regular';
  
  return 'Crítico';
}

/**
 * Determine client status based on equipment numbers
 */
function determinarEstadoCliente(totalEquipos: number, equiposOperativos: number): 'Activo' | 'Inactivo' | 'Nuevo' {
  if (totalEquipos === 0) return 'Nuevo';
  if (equiposOperativos === 0) return 'Inactivo';
  return 'Activo';
}

// ===============================================
// CLIENT-SPECIFIC INTERFACES
// ===============================================

export interface ClienteInfoCompleta {
  clinica: Clinica | null;
  equipos: {
    lista: any[];
    estadisticas: any;
  };
  mantenimientos: {
    lista: any[];
    estadisticas: any;
  };
  resumen: {
    totalEquipos: number;
    equiposOperativos: number;
    totalMantenimientos: number;
    mantenimientosPendientes: number;
    ultimaActividad: string | null;
    estadoGeneral: 'Excelente' | 'Bueno' | 'Regular' | 'Crítico';
  };
  fechaConsulta: string;
}

export interface ClienteResumenInfo {
  clienteNombre: string;
  clinica: Clinica | null;
  totalEquipos: number;
  equiposOperativos: number;
  equiposEnMantenimiento: number;
  tiposEquiposCount: number;
  ultimaInstalacion: string | null;
  estado: 'Activo' | 'Inactivo' | 'Nuevo';
}

// Export the module interface implementation
export const clinicasModule: ClinicasModule = {
  getAllClinicas,
  createClinica,
  updateClinica,
  deleteClinica,
  // Client-specific functions
  getInfoCompletaCliente,
  getClinicaByNombre,
  getResumenMultiplesClientes
};