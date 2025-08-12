import { supabase } from './shared/supabase';
import type { Mantenimiento } from './shared/types';

/**
 * Genera un número de reporte único para mantenimientos
 * Formato: RPT-YYYYMMDD-XXX
 * @returns Promise<string> Número de reporte único
 */
export async function generateNumeroReporte(): Promise<string> {
  try {
    const hoy = new Date();
    const fechaStr = hoy.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
    
    // Buscar el último número de reporte del día
    const { data: ultimosReportes, error } = await supabase
      .from('mantenimientos')
      .select('numero_reporte')
      .like('numero_reporte', `RPT-${fechaStr}-%`)
      .order('numero_reporte', { ascending: false })
      .limit(1);

    if (error) {
      console.warn('Error buscando últimos reportes, usando secuencial 001:', error);
      return `RPT-${fechaStr}-001`;
    }

    let siguienteNumero = 1;
    
    if (ultimosReportes && ultimosReportes.length > 0) {
      const ultimoReporte = ultimosReportes[0].numero_reporte;
      if (ultimoReporte) {
        // Extraer el número secuencial del último reporte
        const match = ultimoReporte.match(/RPT-\d{8}-(\d{3})$/);
        if (match) {
          siguienteNumero = parseInt(match[1]) + 1;
        }
      }
    }

    // Formatear con ceros a la izquierda (001, 002, etc.)
    const numeroSecuencial = siguienteNumero.toString().padStart(3, '0');
    const numeroReporte = `RPT-${fechaStr}-${numeroSecuencial}`;

    console.log(`✅ Número de reporte generado: ${numeroReporte}`);
    return numeroReporte;
  } catch (error) {
    console.error('❌ Error generando número de reporte:', error);
    // Fallback con timestamp
    const timestamp = Date.now().toString().slice(-6);
    return `RPT-FALLBACK-${timestamp}`;
  }
}

/**
 * Mantenimientos Module
 * 
 * This module handles all maintenance-related operations including:
 * - Creating new maintenance records
 * - Retrieving maintenance data
 * - Updating maintenance status and details
 * - Deleting maintenance records
 * 
 * All functions maintain backward compatibility with existing function signatures.
 */

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
  }): Promise<Mantenimiento>;

  getAllMantenimientos(): Promise<Mantenimiento[]>;

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
  }): Promise<Mantenimiento>;

  deleteMantenimiento(mantenimientoId: string): Promise<boolean>;
}

/**
 * Creates a new maintenance record
 * @param mantenimientoData - The maintenance data to create
 * @returns Promise<Mantenimiento> - The created maintenance record
 */
export async function createMantenimiento(mantenimientoData: {
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
}): Promise<Mantenimiento> {
  try {
    // 🆕 Generar número de reporte único automáticamente
    const numeroReporte = await generateNumeroReporte();
    
    const { data, error } = await supabase
      .from('mantenimientos')
      .insert({
        numero_reporte: numeroReporte, // 🆕 Agregar número de reporte
        equipo_id: mantenimientoData.equipoId,
        componente_id: mantenimientoData.componenteId,
        fecha: mantenimientoData.fecha,
        descripcion: mantenimientoData.descripcion,
        estado: mantenimientoData.estado,
        comentarios: mantenimientoData.comentarios,
        archivo_nombre: mantenimientoData.archivo?.nombre,
        archivo_tamaño: mantenimientoData.archivo?.tamaño,
        archivo_tipo: mantenimientoData.archivo?.tipo,
        reporte_generado: mantenimientoData.reporteGenerado,
        precio_servicio: mantenimientoData.precioServicio,
        repuestos_utilizados: mantenimientoData.repuestosUtilizados ? JSON.stringify(mantenimientoData.repuestosUtilizados) : null,
        estado_facturacion: mantenimientoData.estadoFacturacion,
        numero_factura_externa: mantenimientoData.numeroFacturaExterna,
        fecha_facturacion: mantenimientoData.fechaFacturacion,
        archivo_factura_pdf: mantenimientoData.archivoFacturaPDF ? JSON.stringify(mantenimientoData.archivoFacturaPDF) : null,
        tipo: mantenimientoData.tipo,
        es_programado: mantenimientoData.esProgramado,
        fecha_programada: mantenimientoData.fechaProgramada,
        tecnico_asignado: mantenimientoData.tecnicoAsignado,
        prioridad: mantenimientoData.prioridad,
        es_recurrente: mantenimientoData.esRecurrente,
        frecuencia_mantenimiento: mantenimientoData.frecuenciaMantenimiento,
        proximo_mantenimiento: mantenimientoData.proximoMantenimiento,
        dias_notificacion_anticipada: mantenimientoData.diasNotificacionAnticipada,
        notificacion_enviada: mantenimientoData.notificacionEnviada,
        tiempo_estimado: mantenimientoData.tiempoEstimado,
        tiempo_real: mantenimientoData.tiempoReal
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Mantenimiento creado exitosamente con número de reporte:', numeroReporte, data);
    return data as Mantenimiento;
  } catch (error) {
    console.error('❌ Error creating mantenimiento:', error);
    throw error;
  }
}

/**
 * Retrieves all maintenance records
 * @returns Promise<Mantenimiento[]> - Array of all maintenance records
 */
export async function getAllMantenimientos(): Promise<Mantenimiento[]> {
  try {
    const { data, error } = await supabase
      .from('mantenimientos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform database fields to match TypeScript interface
    const mantenimientos = data.map((m: any) => ({
      id: m.id,
      numeroReporte: m.numero_reporte, // 🆕 Incluir número de reporte
      equipoId: m.equipo_id,
      componenteId: m.componente_id,
      fecha: m.fecha,
      descripcion: m.descripcion,
      estado: m.estado,
      comentarios: m.comentarios,
      archivo: m.archivo_nombre ? {
        nombre: m.archivo_nombre,
        tamaño: m.archivo_tamaño,
        tipo: m.archivo_tipo
      } : undefined,
      reporteGenerado: m.reporte_generado,
      precioServicio: m.precio_servicio,
      repuestosUtilizados: (() => {
        try {
          return m.repuestos_utilizados ? JSON.parse(m.repuestos_utilizados) : [];
        } catch (error) {
          console.warn('Error parsing repuestos_utilizados for mantenimiento:', m.id, error);
          return [];
        }
      })(),
      estadoFacturacion: m.estado_facturacion,
      numeroFacturaExterna: m.numero_factura_externa,
      fechaFacturacion: m.fecha_facturacion,
      archivoFacturaPDF: (() => {
        try {
          return m.archivo_factura_pdf ? JSON.parse(m.archivo_factura_pdf) : undefined;
        } catch (error) {
          console.warn('Error parsing archivo_factura_pdf for mantenimiento:', m.id, error);
          return undefined;
        }
      })(),
      tipo: m.tipo,
      esProgramado: m.es_programado,
      fechaProgramada: m.fecha_programada,
      tecnicoAsignado: m.tecnico_asignado,
      prioridad: m.prioridad,
      esRecurrente: m.es_recurrente,
      frecuenciaMantenimiento: m.frecuencia_mantenimiento,
      proximoMantenimiento: m.proximo_mantenimiento,
      diasNotificacionAnticipada: m.dias_notificacion_anticipada,
      notificacionEnviada: m.notificacion_enviada,
      tiempoEstimado: m.tiempo_estimado,
      tiempoReal: m.tiempo_real,
      createdAt: m.created_at
    }));

    console.log('✅ Mantenimientos obtenidos exitosamente:', mantenimientos.length);
    return mantenimientos;
  } catch (error) {
    console.error('❌ Error fetching mantenimientos:', error);
    throw error;
  }
}

/**
 * Updates an existing maintenance record
 * @param mantenimientoId - The ID of the maintenance record to update
 * @param updates - The fields to update
 * @returns Promise<Mantenimiento> - The updated maintenance record
 */
export async function updateMantenimiento(mantenimientoId: string, updates: {
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
}): Promise<Mantenimiento> {
  try {
    const { data, error } = await supabase
      .from('mantenimientos')
      .update({
        fecha: updates.fecha,
        estado: updates.estado,
        comentarios: updates.comentarios,
        archivo_nombre: updates.archivo?.nombre,
        archivo_tamaño: updates.archivo?.tamaño,
        archivo_tipo: updates.archivo?.tipo,
        reporte_generado: updates.reporteGenerado,
        precio_servicio: updates.precioServicio,
        repuestos_utilizados: updates.repuestosUtilizados ? JSON.stringify(updates.repuestosUtilizados) : undefined,
        estado_facturacion: updates.estadoFacturacion,
        numero_factura_externa: updates.numeroFacturaExterna,
        fecha_facturacion: updates.fechaFacturacion,
        archivo_factura_pdf: updates.archivoFacturaPDF ? JSON.stringify(updates.archivoFacturaPDF) : undefined,
        tecnico_asignado: updates.tecnicoAsignado,
        prioridad: updates.prioridad,
        tiempo_real: updates.tiempoReal,
        notificacion_enviada: updates.notificacionEnviada,
        updated_at: new Date().toISOString()
      })
      .eq('id', mantenimientoId)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Mantenimiento actualizado en Supabase:', data);
    return data as Mantenimiento;
  } catch (error) {
    console.error('❌ Error updating mantenimiento:', error);
    throw error;
  }
}

/**
 * Deletes a maintenance record
 * @param mantenimientoId - The ID of the maintenance record to delete
 * @returns Promise<boolean> - True if deletion was successful
 */
export async function deleteMantenimiento(mantenimientoId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('mantenimientos')
      .delete()
      .eq('id', mantenimientoId);

    if (error) throw error;

    console.log('✅ Mantenimiento eliminado exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error deleting mantenimiento:', error);
    throw error;
  }
}

// ===============================================
// CLIENT-SPECIFIC MAINTENANCE QUERIES
// ===============================================

/**
 * Get all maintenance records for a specific client
 * @param clienteNombre - Name of the client/clinic
 * @returns Promise<Mantenimiento[]> - Array of maintenance records for the client
 */
export async function getMantenimientosByCliente(clienteNombre: string): Promise<Mantenimiento[]> {
  try {
    console.log('🔍 Fetching maintenance records by client:', clienteNombre);

    // Validate input
    if (!clienteNombre || clienteNombre.trim() === '') {
      throw new Error('Client name is required');
    }

    // Get maintenance records by joining with equipos table
    const { data, error } = await supabase
      .from('mantenimientos')
      .select(`
        *,
        equipos!inner (
          id,
          nombre_equipo,
          cliente,
          ubicacion,
          marca,
          modelo,
          numero_serie_base
        )
      `)
      .eq('equipos.cliente', clienteNombre.trim())
      .order('fecha_programada', { ascending: false });

    if (error) {
      console.error('❌ Error fetching maintenance by client:', error);
      throw error;
    }

    // Transform database fields to match TypeScript interface
    const mantenimientos = (data || []).map((m: any) => ({
      id: m.id,
      equipoId: m.equipo_id,
      componenteId: m.componente_id,
      fecha: m.fecha,
      descripcion: m.descripcion,
      estado: m.estado,
      comentarios: m.comentarios,
      archivo: m.archivo_nombre ? {
        nombre: m.archivo_nombre,
        tamaño: m.archivo_tamaño,
        tipo: m.archivo_tipo
      } : undefined,
      reporteGenerado: m.reporte_generado,
      precioServicio: m.precio_servicio,
      repuestosUtilizados: (() => {
        try {
          return m.repuestos_utilizados ? JSON.parse(m.repuestos_utilizados) : [];
        } catch (error) {
          console.warn('Error parsing repuestos_utilizados for mantenimiento:', m.id, error);
          return [];
        }
      })(),
      estadoFacturacion: m.estado_facturacion,
      numeroFacturaExterna: m.numero_factura_externa,
      fechaFacturacion: m.fecha_facturacion,
      archivoFacturaPDF: (() => {
        try {
          return m.archivo_factura_pdf ? JSON.parse(m.archivo_factura_pdf) : undefined;
        } catch (error) {
          console.warn('Error parsing archivo_factura_pdf for mantenimiento:', m.id, error);
          return undefined;
        }
      })(),
      tipo: m.tipo,
      esProgramado: m.es_programado,
      fechaProgramada: m.fecha_programada,
      tecnicoAsignado: m.tecnico_asignado,
      prioridad: m.prioridad,
      esRecurrente: m.es_recurrente,
      frecuenciaMantenimiento: m.frecuencia_mantenimiento,
      proximoMantenimiento: m.proximo_mantenimiento,
      diasNotificacionAnticipada: m.dias_notificacion_anticipada,
      notificacionEnviada: m.notificacion_enviada,
      tiempoEstimado: m.tiempo_estimado,
      tiempoReal: m.tiempo_real,
      createdAt: m.created_at,
      equipos: m.equipos ? {
        id: m.equipos.id,
        nombreEquipo: m.equipos.nombre_equipo,
        cliente: m.equipos.cliente,
        ubicacion: m.equipos.ubicacion,
        marca: m.equipos.marca,
        modelo: m.equipos.modelo,
        numeroSerieBase: m.equipos.numero_serie_base
      } : undefined
    }));
    
    console.log('✅ Maintenance records fetched successfully:', {
      clienteNombre,
      mantenimientosCount: mantenimientos.length
    });
    
    return mantenimientos;
  } catch (error) {
    console.error('❌ Failed to fetch maintenance by client:', error);
    throw error;
  }
}

/**
 * Get maintenance statistics for a specific client
 * @param clienteNombre - Name of the client/clinic
 * @returns Promise<MantenimientoClienteStats> - Statistics object
 */
export async function getEstadisticasMantenimientosByCliente(clienteNombre: string): Promise<MantenimientoClienteStats> {
  try {
    console.log('📊 Calculating maintenance statistics by client:', clienteNombre);

    // Get all maintenance records for the client
    const mantenimientos = await getMantenimientosByCliente(clienteNombre);

    // Calculate statistics
    const estadisticas: MantenimientoClienteStats = {
      clienteNombre,
      totalMantenimientos: mantenimientos.length,
      mantenimientosPorEstado: {
        pendiente: mantenimientos.filter(m => m.estado === 'Pendiente').length,
        enProceso: mantenimientos.filter(m => m.estado === 'En proceso').length,
        finalizado: mantenimientos.filter(m => m.estado === 'Finalizado').length,
        total: mantenimientos.length
      },
      mantenimientosPorTipo: {
        preventivo: mantenimientos.filter(m => m.tipo === 'Preventivo').length,
        correctivo: mantenimientos.filter(m => m.tipo === 'Correctivo').length
      },
      proximosMantenimientos: mantenimientos
        .filter(m => m.estado === 'Pendiente' && m.fechaProgramada && new Date(m.fechaProgramada) > new Date())
        .slice(0, 5)
        .map(m => ({
          id: m.id,
          equipoNombre: m.equipos?.nombre_equipo || 'N/A',
          fechaProgramada: m.fechaProgramada,
          tipoMantenimiento: m.tipo
        })),
      ultimoMantenimiento: mantenimientos.length > 0 ? {
        id: mantenimientos[0].id,
        equipoNombre: mantenimientos[0].equipos?.nombre_equipo || 'N/A',
        fecha: mantenimientos[0].fechaProgramada || mantenimientos[0].fecha,
        estado: mantenimientos[0].estado
      } : null,
      equiposConMantenimiento: [...new Set(mantenimientos.map(m => m.equipoId))].length,
      fechaConsulta: new Date().toISOString()
    };

    console.log('✅ Maintenance statistics calculated successfully:', {
      clienteNombre,
      totalMantenimientos: estadisticas.totalMantenimientos,
      pendientes: estadisticas.mantenimientosPorEstado.pendiente
    });

    return estadisticas;
  } catch (error) {
    console.error('❌ Failed to calculate maintenance statistics by client:', error);
    throw error;
  }
}

/**
 * Get upcoming maintenance for a specific client
 * @param clienteNombre - Name of the client/clinic
 * @param diasAdelante - Number of days ahead to look for maintenance (default: 30)
 * @returns Promise<Mantenimiento[]> - Array of upcoming maintenance records
 */
export async function getProximosMantenimientosByCliente(
  clienteNombre: string, 
  diasAdelante: number = 30
): Promise<Mantenimiento[]> {
  try {
    console.log('📅 Fetching upcoming maintenance by client:', { clienteNombre, diasAdelante });

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + diasAdelante);

    const { data, error } = await supabase
      .from('mantenimientos')
      .select(`
        *,
        equipos!inner (
          id,
          nombre_equipo,
          cliente,
          ubicacion,
          marca,
          modelo
        )
      `)
      .eq('equipos.cliente', clienteNombre.trim())
      .eq('estado', 'Pendiente')
      .gte('fecha_programada', new Date().toISOString().split('T')[0])
      .lte('fecha_programada', fechaLimite.toISOString().split('T')[0])
      .order('fecha_programada', { ascending: true });

    if (error) {
      console.error('❌ Error fetching upcoming maintenance:', error);
      throw error;
    }

    // Transform database fields to match TypeScript interface
    const proximosMantenimientos = (data || []).map((m: any) => ({
      id: m.id,
      equipoId: m.equipo_id,
      componenteId: m.componente_id,
      fecha: m.fecha,
      descripcion: m.descripcion,
      estado: m.estado,
      comentarios: m.comentarios,
      archivo: m.archivo_nombre ? {
        nombre: m.archivo_nombre,
        tamaño: m.archivo_tamaño,
        tipo: m.archivo_tipo
      } : undefined,
      reporteGenerado: m.reporte_generado,
      precioServicio: m.precio_servicio,
      repuestosUtilizados: (() => {
        try {
          return m.repuestos_utilizados ? JSON.parse(m.repuestos_utilizados) : [];
        } catch (error) {
          console.warn('Error parsing repuestos_utilizados for mantenimiento:', m.id, error);
          return [];
        }
      })(),
      estadoFacturacion: m.estado_facturacion,
      numeroFacturaExterna: m.numero_factura_externa,
      fechaFacturacion: m.fecha_facturacion,
      archivoFacturaPDF: (() => {
        try {
          return m.archivo_factura_pdf ? JSON.parse(m.archivo_factura_pdf) : undefined;
        } catch (error) {
          console.warn('Error parsing archivo_factura_pdf for mantenimiento:', m.id, error);
          return undefined;
        }
      })(),
      tipo: m.tipo,
      esProgramado: m.es_programado,
      fechaProgramada: m.fecha_programada,
      tecnicoAsignado: m.tecnico_asignado,
      prioridad: m.prioridad,
      esRecurrente: m.es_recurrente,
      frecuenciaMantenimiento: m.frecuencia_mantenimiento,
      proximoMantenimiento: m.proximo_mantenimiento,
      diasNotificacionAnticipada: m.dias_notificacion_anticipada,
      notificacionEnviada: m.notificacion_enviada,
      tiempoEstimado: m.tiempo_estimado,
      tiempoReal: m.tiempo_real,
      createdAt: m.created_at,
      equipos: m.equipos ? {
        id: m.equipos.id,
        nombreEquipo: m.equipos.nombre_equipo,
        cliente: m.equipos.cliente,
        ubicacion: m.equipos.ubicacion,
        marca: m.equipos.marca,
        modelo: m.equipos.modelo
      } : undefined
    }));
    
    console.log('✅ Upcoming maintenance fetched successfully:', {
      clienteNombre,
      proximosCount: proximosMantenimientos.length,
      diasAdelante
    });
    
    return proximosMantenimientos;
  } catch (error) {
    console.error('❌ Failed to fetch upcoming maintenance by client:', error);
    throw error;
  }
}

// ===============================================
// CLIENT-SPECIFIC INTERFACES
// ===============================================

export interface MantenimientoClienteStats {
  clienteNombre: string;
  totalMantenimientos: number;
  mantenimientosPorEstado: {
    pendiente: number;
    enProceso: number;
    finalizado: number;
    total: number;
  };
  mantenimientosPorTipo: {
    preventivo: number;
    correctivo: number;
  };
  proximosMantenimientos: Array<{
    id: string;
    equipoNombre: string;
    fechaProgramada: string;
    tipoMantenimiento: string;
  }>;
  ultimoMantenimiento: {
    id: string;
    equipoNombre: string;
    fecha: string;
    estado: string;
  } | null;
  equiposConMantenimiento: number;
  fechaConsulta: string;
}

// Export the module interface for type checking
export type { MantenimientosModuleInterface };