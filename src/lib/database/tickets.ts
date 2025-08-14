// 🎫 Funciones de base de datos para tickets de ServTec
import { supabase } from './shared/supabase';
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

    // Preparar datos para inserción
    const mantenimientoData = {
      equipo_id: ticketData.equipoId,
      tipo: ticketData.tipo,
      descripcion: `${ticketData.titulo}\n\n${ticketData.descripcion}`, // Combinar título y descripción
      prioridad: ticketData.prioridad,
      estado: 'Pendiente',
      fecha_programada: ticketData.fechaProgramada || null,
      tecnico_asignado: ticketData.tecnicoAsignado || null,
      fecha: new Date().toISOString().split('T')[0], // Solo la fecha, no timestamp
      comentarios: `Ticket creado desde ServTec - Cliente: ${equipo.cliente} - Ubicación: ${equipo.ubicacion}`
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

/**
 * Obtener próximo número de ticket
 */
export async function obtenerProximoNumeroTicket(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('mantenimientos')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error obteniendo último ticket:', error);
      return `TK-${Date.now()}`;
    }

    const ultimoId = data?.[0]?.id || 0;
    const proximoNumero = (parseInt(ultimoId) + 1).toString().padStart(4, '0');
    return `TK-${proximoNumero}`;

  } catch (error) {
    console.error('Error generando número de ticket:', error);
    return `TK-${Date.now()}`;
  }
}