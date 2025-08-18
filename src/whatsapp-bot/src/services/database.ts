import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import { logger } from '../utils/logger';
import { NumberingService } from '../../../lib/services/numbering-service';

export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

export interface TicketData {
  cliente?: string | undefined;
  descripcion: string;
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  telefono?: string | undefined;
  origen: 'WhatsApp';
  equipoId?: string | undefined;
  equipoInfo?: string | undefined;
  componenteId?: string | undefined;
  componenteInfo?: string | undefined;
}

export interface Ticket {
  id: string;
  cliente: string;
  descripcion: string;
  prioridad: string;
  estado: string;
  tecnico_asignado: string;
  created_at: string;
  telefono?: string | undefined;
  equipo_id?: string | undefined;
}

export class DatabaseService {
  /**
   * Buscar equipo por información del mensaje - BÚSQUEDA INTELIGENTE
   */
  static async findEquipmentByInfo(equipoInfo: string, cliente?: string): Promise<{id: string, cliente: string} | null> {
    try {
      // ESTRATEGIA 1: Búsqueda exacta por equipo
      let query = supabase
        .from('equipos')
        .select('id, cliente, nombre_equipo, marca, modelo')
        .or(`nombre_equipo.ilike.%${equipoInfo}%,marca.ilike.%${equipoInfo}%,modelo.ilike.%${equipoInfo}%`);

      const { data: equipos, error } = await query;

      if (error) {
        logger.error('Error searching equipment', { error, equipoInfo, cliente });
        return null;
      }

      if (equipos && equipos.length > 0) {
        // Si tenemos cliente, buscar coincidencia
        if (cliente) {
          const equipoConCliente = equipos.find(eq => 
            eq.cliente.toLowerCase().includes(cliente.toLowerCase()) ||
            cliente.toLowerCase().includes(eq.cliente.toLowerCase().split(' ')[0]) // Primera palabra del cliente
          );
          
          if (equipoConCliente) {
            logger.info('Equipment found with client match', { 
              equipoInfo, 
              cliente, 
              foundClient: equipoConCliente.cliente 
            });
            return {
              id: equipoConCliente.id,
              cliente: equipoConCliente.cliente.trim()
            };
          }
        }

        // Si no hay cliente específico, tomar el primero
        logger.info('Equipment found without client match', { 
          equipoInfo, 
          foundClient: equipos[0].cliente 
        });
        return {
          id: equipos[0].id,
          cliente: equipos[0].cliente.trim()
        };
      }

      // ESTRATEGIA 2: Si no encuentra por equipo, buscar por cliente solo
      if (cliente) {
        const { data: equiposPorCliente, error: errorCliente } = await supabase
          .from('equipos')
          .select('id, cliente, nombre_equipo')
          .ilike('cliente', `%${cliente}%`)
          .limit(1);

        if (!errorCliente && equiposPorCliente && equiposPorCliente.length > 0) {
          logger.info('Equipment found by client only', { 
            cliente, 
            foundClient: equiposPorCliente[0].cliente,
            equipo: equiposPorCliente[0].nombre_equipo
          });
          return {
            id: equiposPorCliente[0].id,
            cliente: equiposPorCliente[0].cliente.trim()
          };
        }
      }

      return null;
    } catch (error) {
      logger.error('Unexpected error searching equipment', { error, equipoInfo, cliente });
      return null;
    }
  }

  /**
   * Buscar componente específico por información del mensaje
   */
  static async findComponentByInfo(componenteInfo: string, equipoId?: string): Promise<string | null> {
    try {
      let query = supabase
        .from('componentes_equipo')
        .select('id')
        .ilike('nombre', `%${componenteInfo}%`);

      // Si tenemos equipo específico, filtrar por él
      if (equipoId) {
        query = query.eq('equipo_id', equipoId);
      }

      const { data: componentes, error } = await query.limit(1);

      if (error) {
        logger.error('Error searching component', { error, componenteInfo, equipoId });
        return null;
      }

      return componentes && componentes.length > 0 ? componentes[0].id : null;
    } catch (error) {
      logger.error('Unexpected error searching component', { error, componenteInfo, equipoId });
      return null;
    }
  }

  /**
   * Crear ticket desde WhatsApp
   */
  static async createTicketFromWhatsApp(data: TicketData): Promise<Ticket | null> {
    try {
      logger.info('Creating ticket from WhatsApp', { data });

      // 🔢 Generar número de reporte único usando el servicio centralizado
      const numeroReporte = await NumberingService.generateReportNumber();
      logger.info('Generated ticket number for WhatsApp', { numeroReporte });

      // Buscar equipo si tenemos información
      let equipoId = data.equipoId;
      let clienteReal = data.cliente;
      
      if (!equipoId && data.equipoInfo) {
        const foundEquipo = await this.findEquipmentByInfo(data.equipoInfo, data.cliente);
        if (foundEquipo) {
          equipoId = foundEquipo.id;
          clienteReal = foundEquipo.cliente; // Usar el cliente real de la BD
          logger.info('Equipment found automatically', { 
            equipoId, 
            clienteReal, 
            equipoInfo: data.equipoInfo 
          });
        }
      }

      // Buscar componente si tenemos información
      let componenteId = data.componenteId;
      if (!componenteId && data.componenteInfo && equipoId) {
        const foundComponenteId = await this.findComponentByInfo(data.componenteInfo, equipoId);
        if (foundComponenteId) {
          componenteId = foundComponenteId;
          logger.info('Component found automatically', { 
            componenteId, 
            componenteInfo: data.componenteInfo 
          });
        }
      }

      const ticketData = {
        numero_reporte: numeroReporte, // 🆕 Agregar número de reporte
        equipo_id: equipoId || null,
        componente_id: componenteId || null,
        tipo: 'Correctivo',
        descripcion: data.descripcion,
        prioridad: data.prioridad,
        estado: 'Pendiente',
        tecnico_asignado: 'Javier Lopez',
        fecha: new Date().toISOString().split('T')[0],
        comentarios: `Ticket ${numeroReporte} creado automáticamente desde WhatsApp${data.telefono ? ` - Tel: ${data.telefono}` : ''}${clienteReal ? ` - Cliente: ${clienteReal}` : ''}${data.equipoInfo ? ` - Equipo: ${data.equipoInfo}` : ''}${data.componenteInfo ? ` - Componente: ${data.componenteInfo}` : ''}`,
        es_programado: false,
      };

      const { data: ticket, error } = await supabase
        .from('mantenimientos')
        .insert([ticketData])
        .select('*')
        .single();

      if (error) {
        logger.error('Error creating ticket', { error, data });
        return null;
      }

      logger.info('Ticket created successfully', { 
        ticketId: ticket.id, 
        equipoId: ticket.equipo_id,
        componenteId: ticket.componente_id,
        cliente: clienteReal
      });
      
      return {
        id: ticket.id,
        cliente: clienteReal || 'Cliente WhatsApp',
        descripcion: data.descripcion,
        prioridad: data.prioridad,
        estado: ticket.estado,
        tecnico_asignado: ticket.tecnico_asignado,
        created_at: ticket.created_at,
        telefono: data.telefono,
        equipo_id: ticket.equipo_id,
      };
    } catch (error) {
      logger.error('Unexpected error creating ticket', { error, data });
      return null;
    }
  }

  /**
   * Obtener tickets que necesitan recordatorios
   */
  static async getTicketsNeedingReminders(hours: number): Promise<Ticket[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - hours);

      const { data: tickets, error } = await supabase
        .from('mantenimientos')
        .select('*')
        .in('estado', ['Pendiente', 'En proceso']) // Excluir "Esperando repuestos" y "Finalizado"
        .eq('tecnico_asignado', 'Javier Lopez')
        .lt('updated_at', cutoffDate.toISOString()); // Usar updated_at en lugar de created_at

      if (error) {
        logger.error('Error fetching tickets needing reminders', { error, hours });
        return [];
      }

      return tickets.map(ticket => ({
        id: ticket.id,
        cliente: ticket.comentarios?.match(/Cliente: ([^-\n]+)/)?.[1]?.trim() || 'Cliente desconocido',
        descripcion: ticket.descripcion,
        prioridad: ticket.prioridad,
        estado: ticket.estado,
        tecnico_asignado: ticket.tecnico_asignado,
        created_at: ticket.created_at,
        telefono: ticket.comentarios?.match(/Tel: ([^-\n]+)/)?.[1]?.trim(),
        equipo_id: ticket.equipo_id,
      }));
    } catch (error) {
      logger.error('Unexpected error fetching tickets for reminders', { error, hours });
      return [];
    }
  }

  /**
   * Obtener tickets sin actualizar (método legacy - mantener compatibilidad)
   */
  static async getTicketsWithoutUpdate(hours: number): Promise<Ticket[]> {
    return this.getTicketsNeedingReminders(hours);
  }

  /**
   * Actualizar estado de ticket
   */
  static async updateTicketStatus(ticketId: string, estado: string, comentarios?: string): Promise<boolean> {
    try {
      logger.info('Updating ticket status', { ticketId, estado });

      const updateData: any = { estado };
      
      if (comentarios) {
        updateData.comentarios = comentarios;
      }

      const { error } = await supabase
        .from('mantenimientos')
        .update(updateData)
        .eq('id', ticketId);

      if (error) {
        logger.error('Error updating ticket status', { error, ticketId, estado });
        return false;
      }

      logger.info('Ticket status updated successfully', { ticketId, estado });
      return true;
    } catch (error) {
      logger.error('Unexpected error updating ticket', { error, ticketId, estado });
      return false;
    }
  }

  /**
   * Obtener estadísticas diarias mejoradas
   */
  static async getDailyStats(): Promise<{
    completados: number;
    pendientes: number;
    enProceso: number;
    esperandoRepuestos: number;
    criticos: number;
    vencidos: number;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: stats, error } = await supabase
        .from('mantenimientos')
        .select('estado, prioridad, created_at, updated_at')
        .eq('tecnico_asignado', 'Javier Lopez')
        .gte('created_at', today);

      if (error) {
        logger.error('Error fetching daily stats', { error });
        return { completados: 0, pendientes: 0, enProceso: 0, esperandoRepuestos: 0, criticos: 0, vencidos: 0 };
      }

      const completados = stats.filter(s => s.estado === 'Finalizado').length;
      const pendientes = stats.filter(s => s.estado === 'Pendiente').length;
      const enProceso = stats.filter(s => s.estado === 'En proceso').length;
      const esperandoRepuestos = stats.filter(s => s.estado === 'Esperando repuestos').length;
      const criticos = stats.filter(s => s.prioridad === 'Crítica' && s.estado !== 'Finalizado').length;
      const vencidos = stats.filter(s => {
        const updated = new Date(s.updated_at || s.created_at);
        const now = new Date();
        const hoursDiff = (now.getTime() - updated.getTime()) / (1000 * 60 * 60);
        return hoursDiff > 24 && !['Finalizado', 'Esperando repuestos'].includes(s.estado);
      }).length;

      return { completados, pendientes, enProceso, esperandoRepuestos, criticos, vencidos };
    } catch (error) {
      logger.error('Unexpected error fetching stats', { error });
      return { completados: 0, pendientes: 0, enProceso: 0, esperandoRepuestos: 0, criticos: 0, vencidos: 0 };
    }
  }
}