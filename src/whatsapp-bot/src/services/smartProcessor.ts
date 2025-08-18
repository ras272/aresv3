import { supabase } from './database';
import { logger } from '../utils/logger';

export interface SmartMessageInfo {
  isServiceRequest: boolean;
  cliente?: string | undefined;
  problema?: string | undefined;
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  telefono?: string | undefined;
  equipoInfo?: string | undefined;
  componenteInfo?: string | undefined;
  equipoId?: string | undefined;
  clienteReal?: string | undefined;
}

export class SmartProcessor {
  /**
   * Procesar mensaje de forma inteligente usando la base de datos
   */
  static async processMessageSmart(messageText: string, senderPhone?: string): Promise<SmartMessageInfo> {
    const text = messageText.toLowerCase().trim();
    
    // 1. Verificar si es solicitud de servicio
    if (!this.isServiceRequest(text)) {
      return {
        isServiceRequest: false,
        prioridad: 'Baja'
      };
    }

    // 2. Extraer información básica
    const prioridad = this.determinePriority(text);
    const problema = messageText.trim();

    // 3. Buscar equipos y clientes en la base de datos
    const { equipoInfo, clienteInfo } = await this.findEquipmentAndClientInDB(messageText);

    logger.info('Smart processing completed', {
      equipoInfo: equipoInfo?.nombre || 'No encontrado',
      clienteInfo: clienteInfo?.nombre || 'No encontrado',
      prioridad
    });

    return {
      isServiceRequest: true,
      cliente: clienteInfo?.nombre,
      problema,
      prioridad,
      telefono: senderPhone,
      equipoInfo: equipoInfo?.nombre,
      equipoId: equipoInfo?.id,
      clienteReal: clienteInfo?.nombreCompleto
    };
  }

  /**
   * Buscar equipos y clientes en la base de datos de forma inteligente
   */
  private static async findEquipmentAndClientInDB(text: string): Promise<{
    equipoInfo?: { id: string, nombre: string },
    clienteInfo?: { nombre: string, nombreCompleto: string }
  }> {
    try {
      // Obtener todos los equipos y clientes de la BD
      const { data: equipos, error } = await supabase
        .from('equipos')
        .select('id, cliente, nombre_equipo, marca, modelo');

      if (error || !equipos) {
        logger.error('Error fetching equipment data', { error });
        return {};
      }

      const textLower = text.toLowerCase();
      let bestEquipo: { id: string, nombre: string } | undefined;
      let bestCliente: { nombre: string, nombreCompleto: string } | undefined;
      let bestScore = 0;

      // Buscar coincidencias inteligentes
      for (const equipo of equipos) {
        let score = 0;
        let equipoMatch = false;
        let clienteMatch = false;

        // Verificar coincidencias de equipo
        const equipoTerms = [
          equipo.nombre_equipo.toLowerCase(),
          equipo.marca.toLowerCase(),
          equipo.modelo.toLowerCase()
        ];

        for (const term of equipoTerms) {
          if (term && textLower.includes(term)) {
            score += 10;
            equipoMatch = true;
            break;
          }
          
          // Búsqueda parcial (palabras clave)
          const words = term.split(/\s+/);
          for (const word of words) {
            if (word.length > 3 && textLower.includes(word)) {
              score += 5;
              equipoMatch = true;
            }
          }
        }

        // Verificar coincidencias de cliente
        const clienteWords = equipo.cliente.toLowerCase().split(/\s+/);
        for (const word of clienteWords) {
          if (word.length > 2 && textLower.includes(word)) {
            score += 8;
            clienteMatch = true;
          }
        }

        // Si encontramos una buena coincidencia
        if (score > bestScore && (equipoMatch || clienteMatch)) {
          bestScore = score;
          
          if (equipoMatch) {
            bestEquipo = {
              id: equipo.id,
              nombre: equipo.nombre_equipo
            };
          }
          
          if (clienteMatch) {
            bestCliente = {
              nombre: this.extractShortClientName(equipo.cliente),
              nombreCompleto: equipo.cliente
            };
          }
        }
      }

      const result: {
        equipoInfo?: { id: string, nombre: string },
        clienteInfo?: { nombre: string, nombreCompleto: string }
      } = {};
      
      if (bestEquipo) result.equipoInfo = bestEquipo;
      if (bestCliente) result.clienteInfo = bestCliente;
      
      return result;

    } catch (error) {
      logger.error('Error in smart equipment/client search', { error });
      return {};
    }
  }

  /**
   * Extraer nombre corto del cliente (primera palabra significativa)
   */
  private static extractShortClientName(fullName: string): string {
    const words = fullName.trim().split(/\s+/);
    
    // Buscar la primera palabra significativa
    for (const word of words) {
      if (word.length > 2 && !['srl', 'sa', 'ltda', 'inc', 'corp'].includes(word.toLowerCase())) {
        return word;
      }
    }
    
    return words[0] || fullName;
  }

  /**
   * Verificar si es solicitud de servicio
   */
  private static isServiceRequest(text: string): boolean {
    const problemKeywords = [
      'problema', 'falla', 'error', 'no funciona', 'no enciende', 'roto', 'dañado',
      'urgente', 'ayuda', 'emergencia', 'crítico', 'parado', 'revisar',
      'importante', 'necesito', 'requiere', 'favor', 'pronto', 'rápido',
      'no prende', 'no arranca', 'no responde', 'descompuesto',
      'se jodio', 'se cago', 'kaput', 'jodido', 'no pyta', 'no da mas'
    ];

    return problemKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Determinar prioridad
   */
  private static determinePriority(text: string): 'Baja' | 'Media' | 'Alta' | 'Crítica' {
    // Crítica
    const criticalKeywords = [
      'urgente', 'crítico', 'emergencia', 'parado', 'no funciona', 'no enciende',
      'roto', 'dañado', 'inmediato', 'ya', 'se jodio', 'se cago', 'kaput'
    ];
    
    if (criticalKeywords.some(keyword => text.includes(keyword))) {
      return 'Crítica';
    }

    // Alta
    const highKeywords = [
      'importante', 'pronto', 'rápido', 'necesito', 'requiere', 'favor', 'ayuda'
    ];
    
    if (highKeywords.some(keyword => text.includes(keyword))) {
      return 'Alta';
    }

    // Baja
    const lowKeywords = [
      'cuando puedas', 'no es urgente', 'sin apuro', 'consulta', 'pregunta'
    ];
    
    if (lowKeywords.some(keyword => text.includes(keyword))) {
      return 'Baja';
    }

    // Por defecto: Media
    return 'Media';
  }
}