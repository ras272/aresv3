// 🎫 Funciones de base de datos para tickets de ServTec
import { supabase } from './shared/supabase';
import { TECNICO_PRINCIPAL } from '@/lib/constants/technician';
import type { TicketFormData, TicketCreationResponse } from '@/components/servtec/types';

/**
 * Crear un nuevo ticket de mantenimiento
 */
export async function crearTicket(ticketData: TicketFormData): Promise<TicketCreationResponse> {
  try {
    // Validar datos requeridos
    if (!ticketData.equipoId || !ticketData.titulo || !ticketData.descripcion) {
      return {
        success: false,
        message: 'Faltan datos requeridos: equipo, título y descripción son obligatorios'
      };
    }

    // Obtener información del equipo
    const { data: equipo, error: equipoError } = await supabase
      .from('equipos')
      .select('cliente, ubicacion')
      .eq('id', ticketData.equipoId)
      .single();

    if (equipoError) {
      console.error('Error obteniendo equipo:', equipoError);
      return {
        success: false,
        message: 'Error al obtener información del equipo'
      };
    }

    // 🔢 Generar número de reporte único usando el servicio centralizado
    const numeroReporte = await NumberingService.generateReportNumber();

    // Preparar datos para inserción
    const mantenimientoData = {
      numero_reporte: numeroReporte, // 🆕 Agregar número de reporte
      equipo_id: ticketData.equipoId,
      tipo: ticketData.tipo,
      descripcion: `${ticketData.titulo}\n\n${ticketData.descripcion}`, // Combinar título y descripción
      prioridad: ticketData.prioridad,
      estado: 'Pendiente',
      fecha_programada: ticketData.fechaProgramada || null,
      tecnico_asignado: TECNICO_PRINCIPAL.nombre, // 🔧 Auto-asignado al ingeniero principal
      fecha: new Date().toISOString().split('T')[0], // Solo la fecha, no timestamp
      comentarios: `Ticket ${numeroReporte} creado desde ServTec - Cliente: ${equipo.cliente} - Ubicación: ${equipo.ubicacion} - Auto-asignado a ${TECNICO_PRINCIPAL.nombre}`
    };

    // Insertar en la base de datos
    const { data, error } = await supabase
      .from('mantenimientos')
      .insert([mantenimientoData])
      .select('id')
      .single();

    if (error) {
      console.error('Error creando ticket:', error);
      return {
        success: false,
        message: 'Error al crear el ticket en la base de datos'
      };
    }

    return {
      success: true,
      ticketId: data.id,
      message: 'Ticket creado exitosamente'
    };

  } catch (error) {
    console.error('Error inesperado creando ticket:', error);
    return {
      success: false,
      message: 'Error inesperado al crear el ticket'
    };
  }
}

/**
 * Obtener lista de técnicos disponibles
 */
export async function obtenerTecnicosDisponibles() {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, name, email, role')
      .eq('role', 'tecnico')
      .eq('is_active', true);

    if (error) {
      console.error('Error obteniendo técnicos:', error);
      return [];
    }

    return data.map(tecnico => ({
      id: tecnico.id,
      nombre: tecnico.name,
      email: tecnico.email,
      disponible: true // TODO: Implementar lógica de disponibilidad real
    }));

  } catch (error) {
    console.error('Error inesperado obteniendo técnicos:', error);
    return [];
  }
}

// Importar el nuevo servicio de numeración
import { NumberingService } from '@/lib/services/numbering-service';

/**
 * @deprecated Usar NumberingService.generateTicketNumber() en su lugar
 * Mantenido para compatibilidad con código existente
 */
export async function obtenerProximoNumeroTicket(): Promise<string> {
  console.warn('⚠️ obtenerProximoNumeroTicket() está deprecado. Usar NumberingService.generateTicketNumber()');
  return NumberingService.generateTicketNumber();
}