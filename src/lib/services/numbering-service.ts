// 🔢 Servicio Centralizado de Numeración para ARES
// Unifica toda la numeración de reportes, tickets y documentos del sistema

import { supabase } from '@/lib/database/shared/supabase';

/**
 * Tipos de documentos que pueden ser numerados
 */
export type DocumentType = 
  | 'reporte'           // RPT-YYYYMMDD-XXX
  | 'ticket'            // RPT-YYYYMMDD-XXX (mismo formato que reporte)
  | 'formulario'        // FORM-YYYYMMDD-XXX
  | 'factura'           // FACT-YYYYMMDD-XXX
  | 'remision'          // REM-YYYYMMDD-XXX
  | 'orden_trabajo';    // OT-YYYYMMDD-XXX

/**
 * Configuración de prefijos y formatos para cada tipo de documento
 */
const DOCUMENT_CONFIG = {
  reporte: {
    prefix: 'RPT',
    digits: 3,
    table: 'mantenimientos',
    column: 'numero_reporte'
  },
  ticket: {
    prefix: 'RPT',
    digits: 3,
    table: 'mantenimientos',
    column: 'numero_reporte' // Los tickets se convierten en mantenimientos
  },
  formulario: {
    prefix: 'FORM',
    digits: 3,
    table: 'mantenimientos',
    column: 'numero_formulario'
  },
  factura: {
    prefix: 'FACT',
    digits: 4,
    table: 'facturas',
    column: 'numero_factura'
  },
  remision: {
    prefix: 'REM',
    digits: 4,
    table: 'remisiones',
    column: 'numero_remision'
  },
  orden_trabajo: {
    prefix: 'OT',
    digits: 3,
    table: 'mantenimientos',
    column: 'numero_orden_trabajo'
  }
} as const;

/**
 * Servicio centralizado para generar números únicos de documentos
 */
export class NumberingService {
  
  /**
   * Genera un número único para cualquier tipo de documento
   * @param type Tipo de documento
   * @param fecha Fecha opcional (por defecto hoy)
   * @returns Promise<string> Número único generado
   */
  static async generateNumber(type: DocumentType, fecha?: Date): Promise<string> {
    try {
      const config = DOCUMENT_CONFIG[type];
      const targetDate = fecha || new Date();
      const fechaStr = this.formatDateForNumber(targetDate);
      
      console.log(`🔢 Generando número ${type.toUpperCase()}: ${config.prefix}-${fechaStr}-XXX`);
      
      // Buscar el último número del día para este tipo de documento
      const lastNumber = await this.getLastNumberOfDay(type, fechaStr);
      const nextSequential = lastNumber + 1;
      
      // Formatear con ceros a la izquierda
      const sequentialStr = nextSequential.toString().padStart(config.digits, '0');
      const fullNumber = `${config.prefix}-${fechaStr}-${sequentialStr}`;
      
      console.log(`✅ Número ${type} generado: ${fullNumber}`);
      return fullNumber;
      
    } catch (error) {
      console.error(`❌ Error generando número ${type}:`, error);
      return this.generateFallbackNumber(type);
    }
  }

  /**
   * Genera un número de reporte (método de conveniencia)
   */
  static async generateReportNumber(fecha?: Date): Promise<string> {
    return this.generateNumber('reporte', fecha);
  }

  /**
   * Genera un número de ticket (método de conveniencia)
   */
  static async generateTicketNumber(fecha?: Date): Promise<string> {
    return this.generateNumber('ticket', fecha);
  }

  /**
   * Genera un número de formulario (método de conveniencia)
   */
  static async generateFormNumber(fecha?: Date): Promise<string> {
    return this.generateNumber('formulario', fecha);
  }

  /**
   * Valida si un número tiene el formato correcto
   */
  static validateNumber(number: string, type: DocumentType): boolean {
    const config = DOCUMENT_CONFIG[type];
    const pattern = new RegExp(`^${config.prefix}-\\d{8}-\\d{${config.digits}}$`);
    return pattern.test(number);
  }

  /**
   * Extrae información de un número de documento
   */
  static parseNumber(number: string): {
    prefix: string;
    date: string;
    sequential: number;
    isValid: boolean;
  } | null {
    const match = number.match(/^([A-Z]+)-(\d{8})-(\d+)$/);
    
    if (!match) {
      return null;
    }

    const [, prefix, dateStr, sequentialStr] = match;
    
    return {
      prefix,
      date: dateStr,
      sequential: parseInt(sequentialStr),
      isValid: true
    };
  }

  /**
   * Convierte una fecha a formato YYYYMMDD
   */
  private static formatDateForNumber(date: Date): string {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  }

  /**
   * Obtiene el último número secuencial del día para un tipo de documento
   */
  private static async getLastNumberOfDay(type: DocumentType, fechaStr: string): Promise<number> {
    const config = DOCUMENT_CONFIG[type];
    const searchPattern = `${config.prefix}-${fechaStr}-%`;
    
    try {
      const { data, error } = await supabase
        .from(config.table)
        .select(config.column)
        .like(config.column, searchPattern)
        .order(config.column, { ascending: false })
        .limit(1);

      if (error) {
        console.warn(`⚠️ Error buscando últimos números ${type}, usando 0:`, error);
        return 0;
      }

      if (!data || data.length === 0) {
        return 0;
      }

      const lastNumber = data[0][config.column];
      if (!lastNumber) {
        return 0;
      }

      // Extraer el número secuencial
      const match = lastNumber.match(new RegExp(`${config.prefix}-\\d{8}-(\\d{${config.digits}})$`));
      if (match) {
        return parseInt(match[1]);
      }

      return 0;
    } catch (error) {
      console.error(`❌ Error obteniendo último número ${type}:`, error);
      return 0;
    }
  }

  /**
   * Genera un número de fallback en caso de error
   */
  private static generateFallbackNumber(type: DocumentType): string {
    const config = DOCUMENT_CONFIG[type];
    const timestamp = Date.now().toString().slice(-6);
    return `${config.prefix}-FALLBACK-${timestamp}`;
  }

  /**
   * Obtiene estadísticas de numeración para un tipo de documento
   */
  static async getNumberingStats(type: DocumentType, fecha?: Date): Promise<{
    totalToday: number;
    totalThisMonth: number;
    lastNumber: string | null;
  }> {
    const config = DOCUMENT_CONFIG[type];
    const targetDate = fecha || new Date();
    const fechaStr = this.formatDateForNumber(targetDate);
    const monthStr = fechaStr.substring(0, 6); // YYYYMM

    try {
      // Contar documentos de hoy
      const { data: todayData, error: todayError } = await supabase
        .from(config.table)
        .select(config.column)
        .like(config.column, `${config.prefix}-${fechaStr}-%`);

      // Contar documentos del mes
      const { data: monthData, error: monthError } = await supabase
        .from(config.table)
        .select(config.column)
        .like(config.column, `${config.prefix}-${monthStr}%`);

      // Obtener último número
      const { data: lastData, error: lastError } = await supabase
        .from(config.table)
        .select(config.column)
        .like(config.column, `${config.prefix}-%`)
        .order(config.column, { ascending: false })
        .limit(1);

      return {
        totalToday: todayData?.length || 0,
        totalThisMonth: monthData?.length || 0,
        lastNumber: lastData?.[0]?.[config.column] || null
      };

    } catch (error) {
      console.error(`❌ Error obteniendo estadísticas ${type}:`, error);
      return {
        totalToday: 0,
        totalThisMonth: 0,
        lastNumber: null
      };
    }
  }

  /**
   * Reserva un rango de números para uso masivo
   */
  static async reserveNumberRange(
    type: DocumentType, 
    quantity: number, 
    fecha?: Date
  ): Promise<string[]> {
    const numbers: string[] = [];
    
    for (let i = 0; i < quantity; i++) {
      const number = await this.generateNumber(type, fecha);
      numbers.push(number);
    }
    
    return numbers;
  }
}

/**
 * Funciones de conveniencia para mantener compatibilidad con código existente
 */

/**
 * @deprecated Usar NumberingService.generateReportNumber() en su lugar
 */
export async function generateNumeroReporte(): Promise<string> {
  console.warn('⚠️ generateNumeroReporte() está deprecado. Usar NumberingService.generateReportNumber()');
  return NumberingService.generateReportNumber();
}

/**
 * @deprecated Usar NumberingService.generateTicketNumber() en su lugar
 */
export async function obtenerProximoNumeroTicket(): Promise<string> {
  console.warn('⚠️ obtenerProximoNumeroTicket() está deprecado. Usar NumberingService.generateTicketNumber()');
  return NumberingService.generateTicketNumber();
}

// Exportar el servicio como default
export default NumberingService;