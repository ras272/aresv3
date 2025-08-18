import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { config } from '../config';
import { logger } from '../utils/logger';

export class WhatsAppService {
  private client: Client;
  private isReady: boolean = false;
  private servtecGroupId: string | null = null;

  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: './whatsapp-session'
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      }
    });

    this.setupEventHandlers();
  }

  /**
   * Configurar manejadores de eventos
   */
  private setupEventHandlers(): void {
    this.client.on('qr', (qr) => {
      logger.info('QR Code received, scan with WhatsApp');
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', async () => {
      logger.info('WhatsApp client is ready');
      this.isReady = true;
      await this.findServtecGroup();
    });

    this.client.on('authenticated', () => {
      logger.info('WhatsApp client authenticated');
    });

    this.client.on('auth_failure', (msg) => {
      logger.error('WhatsApp authentication failed', { message: msg });
    });

    this.client.on('disconnected', (reason) => {
      logger.warn('WhatsApp client disconnected', { reason });
      this.isReady = false;
      this.servtecGroupId = null;
    });
  }

  /**
   * Inicializar cliente de WhatsApp
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing WhatsApp client');
      await this.client.initialize();
    } catch (error) {
      logger.error('Failed to initialize WhatsApp client', { error });
      throw error;
    }
  }

  /**
   * Encontrar el grupo de ServTec
   */
  private async findServtecGroup(): Promise<void> {
    try {
      const chats = await this.client.getChats();
      const servtecGroup = chats.find(
        chat => chat.isGroup && chat.name === config.whatsapp.groupName
      );

      if (servtecGroup) {
        this.servtecGroupId = servtecGroup.id._serialized;
        logger.info('ServTec group found', { groupId: this.servtecGroupId });
      } else {
        logger.warn('ServTec group not found', { 
          groupName: config.whatsapp.groupName,
          availableGroups: chats.filter(c => c.isGroup).map(c => c.name)
        });
      }
    } catch (error) {
      logger.error('Error finding ServTec group', { error });
    }
  }

  /**
   * Enviar mensaje al grupo de ServTec
   */
  async sendToServtecGroup(message: string): Promise<boolean> {
    if (!this.isReady || !this.servtecGroupId) {
      logger.error('Cannot send to ServTec group - not ready or group not found');
      return false;
    }

    try {
      await this.client.sendMessage(this.servtecGroupId, message);
      logger.info('Message sent to ServTec group');
      return true;
    } catch (error) {
      logger.error('Failed to send message to ServTec group', { error });
      return false;
    }
  }

  /**
   * Enviar mensaje privado a Javier
   */
  async sendToJavier(message: string): Promise<boolean> {
    if (!this.isReady) {
      logger.error('Cannot send to Javier - WhatsApp not ready');
      return false;
    }

    try {
      // Formatear número de teléfono para WhatsApp
      const javierNumber = config.whatsapp.javierPhone.replace(/[^\d]/g, '') + '@c.us';
      await this.client.sendMessage(javierNumber, message);
      logger.info('Message sent to Javier');
      return true;
    } catch (error) {
      logger.error('Failed to send message to Javier', { error });
      return false;
    }
  }

  /**
   * Enviar mensaje a un número específico (texto o media)
   */
  async sendMessage(phone: string, content: string | any, options?: any): Promise<void> {
    try {
      if (!this.isReady) {
        throw new Error('WhatsApp client not ready');
      }

      const chatId = phone.includes('@') ? phone : `${phone}@c.us`;
      
      if (typeof content === 'string') {
        // Mensaje de texto
        await this.client.sendMessage(chatId, content);
      } else {
        // Media (documento, imagen, etc.)
        await this.client.sendMessage(chatId, content, options);
      }
      
      logger.info('Message sent successfully', { 
        phone: phone.substring(0, 8) + '***',
        type: typeof content === 'string' ? 'text' : 'media'
      });
    } catch (error) {
      logger.error('Error sending message', { error, phone: phone?.substring(0, 8) + '***' });
      throw error;
    }
  }

  /**
   * Enviar mensaje privado a la jefa
   */
  async sendToJefa(message: string): Promise<boolean> {
    if (!this.isReady) {
      logger.error('Cannot send to Jefa - WhatsApp not ready');
      return false;
    }

    try {
      // Formatear número de teléfono para WhatsApp
      const jefaNumber = config.whatsapp.jefaPhone.replace(/[^\d]/g, '') + '@c.us';
      await this.client.sendMessage(jefaNumber, message);
      logger.info('Message sent to Jefa');
      return true;
    } catch (error) {
      logger.error('Failed to send message to Jefa', { error });
      return false;
    }
  }

  /**
   * Configurar listener de mensajes
   */
  onMessage(handler: (message: Message) => Promise<void>): void {
    this.client.on('message', async (message) => {
      try {
        await handler(message);
      } catch (error) {
        logger.error('Error in message handler', { error });
      }
    });
  }

  /**
   * Verificar si un mensaje es del grupo ServTec
   */
  async isFromServtecGroup(message: Message): Promise<boolean> {
    if (!this.servtecGroupId) {
      return false;
    }

    const chat = await message.getChat();
    return chat.id._serialized === this.servtecGroupId;
  }

  /**
   * Verificar si el cliente está listo
   */
  isClientReady(): boolean {
    return this.isReady;
  }

  /**
   * Verificar si un mensaje es de Javier
   */
  async isFromJavier(message: Message): Promise<boolean> {
    try {
      const contact = await message.getContact();
      const chat = await message.getChat();
      
      // Verificar que sea mensaje privado (no grupo) y del número de Javier
      if (chat.isGroup) return false;
      
      const javierNumber = config.whatsapp.javierPhone.replace(/[^\d]/g, '');
      const senderNumber = contact.number.replace(/[^\d]/g, '');
      
      return senderNumber === javierNumber;
    } catch (error) {
      logger.error('Error checking if message is from Javier', { error });
      return false;
    }
  }

  /**
   * Obtener información del chat
   */
  async getChatInfo(message: Message): Promise<{ isGroup: boolean; name?: string; phone?: string }> {
    const chat = await message.getChat();
    const contact = await message.getContact();
    
    return {
      isGroup: chat.isGroup,
      name: chat.name,
      phone: contact.number
    };
  }

  /**
   * Cerrar cliente
   */
  async destroy(): Promise<void> {
    try {
      await this.client.destroy();
      logger.info('WhatsApp client destroyed');
    } catch (error) {
      logger.error('Error destroying WhatsApp client', { error });
    }
  }
}