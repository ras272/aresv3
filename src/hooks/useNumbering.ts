// 🔢 Hook para usar el servicio de numeración en componentes React
import { useState, useCallback } from 'react';
import { NumberingService, DocumentType } from '@/lib/services/numbering-service';

interface UseNumberingReturn {
  generateNumber: (type: DocumentType, fecha?: Date) => Promise<string>;
  generateReportNumber: (fecha?: Date) => Promise<string>;
  generateTicketNumber: (fecha?: Date) => Promise<string>;
  generateFormNumber: (fecha?: Date) => Promise<string>;
  validateNumber: (number: string, type: DocumentType) => boolean;
  parseNumber: (number: string) => ReturnType<typeof NumberingService.parseNumber>;
  getStats: (type: DocumentType, fecha?: Date) => Promise<ReturnType<typeof NumberingService.getNumberingStats>>;
  isGenerating: boolean;
  error: string | null;
}

/**
 * Hook para usar el servicio de numeración de documentos
 */
export function useNumbering(): UseNumberingReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateNumber = useCallback(async (type: DocumentType, fecha?: Date): Promise<string> => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const number = await NumberingService.generateNumber(type, fecha);
      return number;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error generando número';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateReportNumber = useCallback(async (fecha?: Date): Promise<string> => {
    return generateNumber('reporte', fecha);
  }, [generateNumber]);

  const generateTicketNumber = useCallback(async (fecha?: Date): Promise<string> => {
    return generateNumber('ticket', fecha);
  }, [generateNumber]);

  const generateFormNumber = useCallback(async (fecha?: Date): Promise<string> => {
    return generateNumber('formulario', fecha);
  }, [generateNumber]);

  const validateNumber = useCallback((number: string, type: DocumentType): boolean => {
    return NumberingService.validateNumber(number, type);
  }, []);

  const parseNumber = useCallback((number: string) => {
    return NumberingService.parseNumber(number);
  }, []);

  const getStats = useCallback(async (type: DocumentType, fecha?: Date) => {
    setError(null);
    
    try {
      return await NumberingService.getNumberingStats(type, fecha);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error obteniendo estadísticas';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    generateNumber,
    generateReportNumber,
    generateTicketNumber,
    generateFormNumber,
    validateNumber,
    parseNumber,
    getStats,
    isGenerating,
    error
  };
}

/**
 * Hook específico para reportes (conveniencia)
 */
export function useReportNumbering() {
  const { generateReportNumber, validateNumber, parseNumber, getStats, isGenerating, error } = useNumbering();

  const validateReportNumber = useCallback((number: string): boolean => {
    return validateNumber(number, 'reporte');
  }, [validateNumber]);

  const getReportStats = useCallback(async (fecha?: Date) => {
    return getStats('reporte', fecha);
  }, [getStats]);

  return {
    generateReportNumber,
    validateReportNumber,
    parseNumber,
    getReportStats,
    isGenerating,
    error
  };
}

/**
 * Hook específico para tickets (conveniencia)
 */
export function useTicketNumbering() {
  const { generateTicketNumber, validateNumber, parseNumber, getStats, isGenerating, error } = useNumbering();

  const validateTicketNumber = useCallback((number: string): boolean => {
    return validateNumber(number, 'ticket');
  }, [validateNumber]);

  const getTicketStats = useCallback(async (fecha?: Date) => {
    return getStats('ticket', fecha);
  }, [getStats]);

  return {
    generateTicketNumber,
    validateTicketNumber,
    parseNumber,
    getTicketStats,
    isGenerating,
    error
  };
}