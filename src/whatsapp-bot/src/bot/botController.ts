import { Message } from 'whatsapp-web.js';
import { WhatsAppService } from '../services/whatsappService';
import { MessageProcessor } from '../services/messageProcessor';
import { SmartProcessor } from '../services/smartProcessor';
import { DatabaseService, supabase, Ticket } from '../services/database';
import { logger } from '../utils/logger';

export class BotController {
  private whatsappService: WhatsAppService;

  constructor(whatsappService: WhatsAppService) {
    this.whatsappService = whatsappService;
  }

  /**
   * Obtener información del equipo por ID
   */
  private async getEquipmentInfo(equipoId: string): Promise<string | undefined> {
    try {
      const { data: equipo, error } = await supabase
        .from('equipos')
        .select('nombre_equipo, marca, modelo, cliente')
        .eq('id', equipoId)
        .single();

      if (error || !equipo) {
        return undefined;
      }

      // Evitar duplicación si marca y modelo son iguales
      if (equipo.marca.toLowerCase() === equipo.modelo.toLowerCase()) {
        return equipo.marca;
      }
      return `${equipo.marca} ${equipo.modelo}`.trim();
    } catch (error) {
      logger.error('Error getting equipment info', { error, equipoId });
      return undefined;
    }
  }

  /**
   * Procesar mensaje recibido
   */
  async processMessage(message: Message): Promise<void> {
    try {
      // Ignorar mensajes propios
      if (message.fromMe) {
        return;
      }

      // Obtener información del chat
      const chatInfo = await this.whatsappService.getChatInfo(message);
      
      // Verificar si es un comando de Javier (mensaje privado)
      const isFromServtecGroup = await this.whatsappService.isFromServtecGroup(message);
      const isFromJavier = await this.whatsappService.isFromJavier(message);

      if (isFromJavier) {
        // Procesar comandos de Javier
        await this.processJavierCommand(message);
        return;
      }

      // Solo procesar mensajes del grupo ServTec para crear tickets
      if (!isFromServtecGroup) {
        return;
      }

      logger.info('Processing message from ServTec group', {
        messageId: message.id.id,
        hasMedia: message.hasMedia,
        messageLength: message.body.length
      });

      // Procesar el contenido del mensaje con IA inteligente
      const messageInfo = await SmartProcessor.processMessageSmart(
        message.body,
        chatInfo.phone
      );

      // Si no es una solicitud de servicio, ignorar
      if (!messageInfo.isServiceRequest) {
        logger.debug('Message is not a service request, ignoring');
        return;
      }

      // Crear ticket en la base de datos usando información inteligente
      const ticket = await DatabaseService.createTicketFromWhatsApp({
        cliente: messageInfo.clienteReal || messageInfo.cliente,
        descripcion: messageInfo.problema || message.body,
        prioridad: messageInfo.prioridad,
        telefono: messageInfo.telefono,
        equipoId: messageInfo.equipoId,
        equipoInfo: messageInfo.equipoInfo,
        origen: 'WhatsApp'
      });

      if (!ticket) {
        logger.error('Failed to create ticket from WhatsApp message');
        await this.whatsappService.sendToServtecGroup(
          '❌ Error: No se pudo crear el ticket automáticamente. Por favor, crear manualmente.'
        );
        return;
      }

      // Obtener información del equipo si se encontró uno
      let equipoEncontrado: string | undefined;
      if (ticket.equipo_id) {
        // Buscar el nombre del equipo encontrado
        const equipoInfo = await this.getEquipmentInfo(ticket.equipo_id);
        equipoEncontrado = equipoInfo;
      }

      // Enviar confirmación al grupo
      const groupResponse = MessageProcessor.generateGroupResponse(ticket.id, messageInfo, equipoEncontrado);
      await this.whatsappService.sendToServtecGroup(groupResponse);

      // Notificar a Javier
      const javierNotification = MessageProcessor.generateJavierNotification(ticket.id, messageInfo, equipoEncontrado);
      await this.whatsappService.sendToJavier(javierNotification);

      // Si es crítico, también notificar a la jefa
      if (messageInfo.prioridad === 'Crítica') {
        const jefaNotification = `🚨 TICKET CRÍTICO CREADO:

🎫 #${ticket.id}
🏢 Cliente: ${messageInfo.cliente || 'Cliente WhatsApp'}
🔧 Problema: ${messageInfo.problema}

Javier ha sido notificado automáticamente.`;

        await this.whatsappService.sendToJefa(jefaNotification);
      }

      logger.info('Ticket created and notifications sent', {
        ticketId: ticket.id,
        prioridad: messageInfo.prioridad,
        cliente: messageInfo.cliente
      });

    } catch (error) {
      logger.error('Error processing message', { error });
    }
  }

  /**
   * Procesar seguimiento de tickets pendientes con lógica inteligente
   */
  async processFollowUp(): Promise<void> {
    try {
      logger.info('Processing intelligent follow-up for tickets');

      // Obtener tickets críticos (2 horas sin actualizar)
      const criticalTickets = await DatabaseService.getTicketsNeedingReminders(2);
      const criticalOnly = criticalTickets.filter(t => t.prioridad === 'Crítica');

      // Obtener tickets normales (4 horas sin actualizar)
      const normalTickets = await DatabaseService.getTicketsNeedingReminders(4);
      const normalOnly = normalTickets.filter(t => t.prioridad !== 'Crítica');

      const allTicketsToRemind = [...criticalOnly, ...normalOnly];

      if (allTicketsToRemind.length === 0) {
        logger.info('No tickets need reminders at this time');
        return;
      }

      logger.info(`Found ${allTicketsToRemind.length} tickets needing reminders (${criticalOnly.length} critical, ${normalOnly.length} normal)`);

      for (const ticket of allTicketsToRemind) {
        await this.sendTicketReminder(ticket);
        // Esperar entre mensajes para no saturar
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

    } catch (error) {
      logger.error('Error processing intelligent follow-up', { error });
    }
  }

  /**
   * Enviar recordatorio de un ticket específico
   */
  private async sendTicketReminder(ticket: Ticket): Promise<void> {
    try {
      const hoursAgo = Math.floor(
        (new Date().getTime() - new Date(ticket.created_at).getTime()) / (1000 * 60 * 60)
      );

      const ticketNumber = MessageProcessor.generateTicketNumber(ticket.id);
      const urgencyIcon = ticket.prioridad === 'Crítica' ? '🚨' : '⏰';
      
      // Mensaje privado para Javier (más discreto)
      const javierMessage = `${urgencyIcon} Recordatorio ${ticketNumber}

🏢 Cliente: ${ticket.cliente}
⚠️ Estado: ${ticket.estado} (${hoursAgo}h sin actualizar)
${ticket.telefono ? `📱 Teléfono: ${ticket.telefono}` : ''}

${ticket.prioridad === 'Crítica' ? '🚨 CRÍTICO - Requiere atención inmediata' : '📋 Pendiente de atención'}

Responde:
✅ "Listo ${ticketNumber}" - Completado
🔧 "Proceso ${ticketNumber}" - En proceso  
⏸️ "Repuesto ${ticketNumber}" - Esperando repuestos
❌ "Problema ${ticketNumber} [motivo]" - Hay inconveniente`;

      await this.whatsappService.sendToJavier(javierMessage);

      // Solo notificar al grupo si es crítico y lleva más de 6 horas
      if (ticket.prioridad === 'Crítica' && hoursAgo >= 6) {
        const groupMessage = `🚨 ATENCIÓN: Ticket crítico ${ticketNumber} lleva ${hoursAgo}h sin actualizar

🏢 Cliente: ${ticket.cliente}
👨‍🔧 @Javier Lopez ¿necesitas apoyo con este caso?`;

        await this.whatsappService.sendToServtecGroup(groupMessage);
      }

      logger.info('Reminder sent', { 
        ticketId: ticket.id, 
        ticketNumber, 
        prioridad: ticket.prioridad, 
        hoursAgo 
      });

    } catch (error) {
      logger.error('Error sending ticket reminder', { error, ticketId: ticket.id });
    }
  }

  /**
   * Generar reporte diario para la jefa
   */
  async generateDailyReport(): Promise<void> {
    try {
      logger.info('Generating daily report');

      const stats = await DatabaseService.getDailyStats();

      const report = `📊 REPORTE DIARIO ServTec:

✅ Completados hoy: ${stats.completados}
⏳ Pendientes: ${stats.pendientes}
🚨 Críticos sin atender: ${stats.criticos}
⚠️ Vencidos (+24h): ${stats.vencidos}

${stats.vencidos > 0 ? `🔥 ATENCIÓN: ${stats.vencidos} tickets vencidos requieren seguimiento urgente` : ''}
${stats.criticos > 0 ? `🚨 HAY ${stats.criticos} TICKETS CRÍTICOS PENDIENTES` : ''}

Sistema funcionando correctamente ✅`;

      await this.whatsappService.sendToJefa(report);

      logger.info('Daily report sent to Jefa', { stats });

    } catch (error) {
      logger.error('Error generating daily report', { error });
    }
  }

  /**
   * Procesar comandos de Javier
   */
  private async processJavierCommand(message: Message): Promise<void> {
    try {
      const command = message.body.trim().toLowerCase();
      
      // Detectar comandos con formato: "listo TKT-1234"
      const commandPatterns = {
        listo: /^listo\s+(tkt-\d+)/i,
        proceso: /^proceso\s+(tkt-\d+)/i,
        repuesto: /^repuesto\s+(tkt-\d+)/i,
        problema: /^problema\s+(tkt-\d+)\s*(.*)$/i,
        estado: /^estado$/i
      };

      // Procesar comando "Listo"
      if (commandPatterns.listo.test(command)) {
        const match = command.match(commandPatterns.listo);
        if (match) {
          await this.handleTicketCompletion(match[1]);
        }
        return;
      }

      // Procesar comando "Proceso"
      if (commandPatterns.proceso.test(command)) {
        const match = command.match(commandPatterns.proceso);
        if (match) {
          await this.handleTicketInProgress(match[1]);
        }
        return;
      }

      // Procesar comando "Repuesto"
      if (commandPatterns.repuesto.test(command)) {
        const match = command.match(commandPatterns.repuesto);
        if (match) {
          await this.handleTicketWaitingParts(match[1]);
        }
        return;
      }

      // Procesar comando "Problema"
      if (commandPatterns.problema.test(command)) {
        const match = command.match(commandPatterns.problema);
        if (match) {
          await this.handleTicketProblem(match[1], match[2] || 'Sin detalles');
        }
        return;
      }

      // Procesar comando "Estado"
      if (commandPatterns.estado.test(command)) {
        await this.handleStatusRequest();
        return;
      }

      logger.debug('Unrecognized command from Javier', { command });

    } catch (error) {
      logger.error('Error processing Javier command', { error, messageBody: message.body });
    }
  }

  /**
   * Manejar finalización de ticket
   */
  private async handleTicketCompletion(ticketNumber: string): Promise<void> {
    const ticketId = await this.getTicketIdFromNumber(ticketNumber);
    if (!ticketId) {
      await this.whatsappService.sendToJavier(`❌ No encontré el ticket ${ticketNumber}`);
      return;
    }

    const success = await DatabaseService.updateTicketStatus(ticketId, 'Finalizado', 'Completado por Javier via WhatsApp');
    
    if (success) {
      await this.whatsappService.sendToJavier(`✅ Ticket ${ticketNumber} marcado como completado`);
      await this.whatsappService.sendToServtecGroup(`✅ Ticket ${ticketNumber} completado por Javier Lopez`);
    } else {
      await this.whatsappService.sendToJavier(`❌ Error al actualizar ticket ${ticketNumber}`);
    }
  }

  /**
   * Manejar ticket en proceso
   */
  private async handleTicketInProgress(ticketNumber: string): Promise<void> {
    const ticketId = await this.getTicketIdFromNumber(ticketNumber);
    if (!ticketId) {
      await this.whatsappService.sendToJavier(`❌ No encontré el ticket ${ticketNumber}`);
      return;
    }

    const success = await DatabaseService.updateTicketStatus(ticketId, 'En proceso', 'Javier está trabajando en el ticket');
    
    if (success) {
      await this.whatsappService.sendToJavier(`🔧 Ticket ${ticketNumber} marcado como "En proceso"`);
    } else {
      await this.whatsappService.sendToJavier(`❌ Error al actualizar ticket ${ticketNumber}`);
    }
  }

  /**
   * Manejar ticket esperando repuestos
   */
  private async handleTicketWaitingParts(ticketNumber: string): Promise<void> {
    const ticketId = await this.getTicketIdFromNumber(ticketNumber);
    if (!ticketId) {
      await this.whatsappService.sendToJavier(`❌ No encontré el ticket ${ticketNumber}`);
      return;
    }

    const success = await DatabaseService.updateTicketStatus(ticketId, 'Esperando repuestos', 'Pausado - esperando repuestos');
    
    if (success) {
      await this.whatsappService.sendToJavier(`⏸️ Ticket ${ticketNumber} pausado - esperando repuestos. No recibirás más recordatorios hasta que cambies el estado.`);
    } else {
      await this.whatsappService.sendToJavier(`❌ Error al actualizar ticket ${ticketNumber}`);
    }
  }

  /**
   * Manejar problema con ticket
   */
  private async handleTicketProblem(ticketNumber: string, details: string): Promise<void> {
    const ticketId = await this.getTicketIdFromNumber(ticketNumber);
    if (!ticketId) {
      await this.whatsappService.sendToJavier(`❌ No encontré el ticket ${ticketNumber}`);
      return;
    }

    const success = await DatabaseService.updateTicketStatus(ticketId, 'Pendiente', `Problema reportado por Javier: ${details}`);
    
    if (success) {
      await this.whatsappService.sendToJavier(`❌ Ticket ${ticketNumber} marcado con problema. Gerencia será notificada.`);
      await this.whatsappService.sendToJefa(`🚨 PROBLEMA con ticket ${ticketNumber}\n\nJavier reporta: ${details}\n\nRequiere atención de gerencia.`);
    } else {
      await this.whatsappService.sendToJavier(`❌ Error al actualizar ticket ${ticketNumber}`);
    }
  }

  /**
   * Manejar solicitud de estado
   */
  private async handleStatusRequest(): Promise<void> {
    const stats = await DatabaseService.getDailyStats();
    
    const statusMessage = `📊 Tu estado actual:

⏳ Pendientes: ${stats.pendientes}
🔧 En proceso: ${stats.enProceso || 0}
⏸️ Esperando repuestos: ${stats.esperandoRepuestos || 0}
🚨 Críticos: ${stats.criticos}

${stats.criticos > 0 ? '⚡ Hay tickets críticos que requieren atención' : '✅ Todo bajo control'}`;

    await this.whatsappService.sendToJavier(statusMessage);
  }

  /**
   * Obtener ID de ticket desde número TKT-XXXX
   */
  private async getTicketIdFromNumber(ticketNumber: string): Promise<string | null> {
    try {
      // Extraer número del formato TKT-1234
      const numMatch = ticketNumber.match(/tkt-(\d+)/i);
      if (!numMatch) return null;

      // const shortNum = parseInt(numMatch[1]); // No necesario por ahora
      
      // Buscar ticket que genere este número
      const { data: tickets, error } = await supabase
        .from('mantenimientos')
        .select('id')
        .eq('tecnico_asignado', 'Javier Lopez')
        .in('estado', ['Pendiente', 'En proceso', 'Esperando repuestos']);

      if (error || !tickets) return null;

      // Encontrar el ticket que coincida con el número generado
      for (const ticket of tickets) {
        const generatedNumber = MessageProcessor.generateTicketNumber(ticket.id);
        if (generatedNumber.toLowerCase() === ticketNumber.toLowerCase()) {
          return ticket.id;
        }
      }

      return null;
    } catch (error) {
      logger.error('Error getting ticket ID from number', { error, ticketNumber });
      return null;
    }
  }
}