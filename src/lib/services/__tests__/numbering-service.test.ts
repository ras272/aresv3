// 🧪 Tests para el Servicio de Numeración Unificado
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock del módulo de Supabase antes de importar el servicio
vi.mock('@/lib/database/shared/supabase', () => {
  const mockSupabase = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        like: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              data: [],
              error: null
            }))
          }))
        }))
      }))
    }))
  };
  
  return {
    supabase: mockSupabase
  };
});

import { NumberingService, DocumentType } from '../numbering-service';

describe('NumberingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateNumber', () => {
    it('debe generar un número de reporte con formato correcto', async () => {
      const fecha = new Date('2025-01-15');
      const numero = await NumberingService.generateNumber('reporte', fecha);
      
      expect(numero).toMatch(/^RPT-20250115-\d{3}$/);
    });

    it('debe generar un número de ticket con formato correcto', async () => {
      const fecha = new Date('2025-01-15');
      const numero = await NumberingService.generateNumber('ticket', fecha);
      
      expect(numero).toMatch(/^TK-20250115-\d{3}$/);
    });

    it('debe generar un número de formulario con formato correcto', async () => {
      const fecha = new Date('2025-01-15');
      const numero = await NumberingService.generateNumber('formulario', fecha);
      
      expect(numero).toMatch(/^FORM-20250115-\d{3}$/);
    });

    it('debe generar un número de factura con formato correcto', async () => {
      const fecha = new Date('2025-01-15');
      const numero = await NumberingService.generateNumber('factura', fecha);
      
      expect(numero).toMatch(/^FACT-20250115-\d{4}$/);
    });

    it('debe usar la fecha actual si no se proporciona fecha', async () => {
      const hoy = new Date();
      const fechaStr = hoy.toISOString().split('T')[0].replace(/-/g, '');
      
      const numero = await NumberingService.generateNumber('reporte');
      
      expect(numero).toMatch(new RegExp(`^RPT-${fechaStr}-\\d{3}$`));
    });

    it('debe incrementar el número secuencial cuando ya existen números del día', async () => {
      // Reimportar el mock para esta prueba específica
      const { supabase } = await import('@/lib/database/shared/supabase');
      
      // Mock para simular que ya existe RPT-20250115-001
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          like: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                data: [{ numero_reporte: 'RPT-20250115-001' }],
                error: null
              }))
            }))
          }))
        }))
      } as any);

      const fecha = new Date('2025-01-15');
      const numero = await NumberingService.generateNumber('reporte', fecha);
      
      expect(numero).toBe('RPT-20250115-002');
    });

    it('debe generar número de fallback en caso de error', async () => {
      // Reimportar el mock para esta prueba específica
      const { supabase } = await import('@/lib/database/shared/supabase');
      
      // Mock para simular error en la base de datos
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          like: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => {
                throw new Error('Database error');
              })
            }))
          }))
        }))
      } as any);

      const numero = await NumberingService.generateNumber('reporte');
      
      expect(numero).toMatch(/^RPT-FALLBACK-\d{6}$/);
    });
  });

  describe('validateNumber', () => {
    it('debe validar números de reporte correctos', () => {
      expect(NumberingService.validateNumber('RPT-20250115-001', 'reporte')).toBe(true);
      expect(NumberingService.validateNumber('RPT-20250115-999', 'reporte')).toBe(true);
    });

    it('debe rechazar números de reporte incorrectos', () => {
      expect(NumberingService.validateNumber('RPT-2025115-001', 'reporte')).toBe(false); // Fecha mal formateada
      expect(NumberingService.validateNumber('RPT-20250115-01', 'reporte')).toBe(false); // Secuencial muy corto
      expect(NumberingService.validateNumber('TK-20250115-001', 'reporte')).toBe(false); // Prefijo incorrecto
      expect(NumberingService.validateNumber('RPT-20250115-1234', 'reporte')).toBe(false); // Secuencial muy largo
    });

    it('debe validar números de ticket correctos', () => {
      expect(NumberingService.validateNumber('TK-20250115-001', 'ticket')).toBe(true);
      expect(NumberingService.validateNumber('TK-20250115-999', 'ticket')).toBe(true);
    });

    it('debe validar números de factura correctos (4 dígitos)', () => {
      expect(NumberingService.validateNumber('FACT-20250115-0001', 'factura')).toBe(true);
      expect(NumberingService.validateNumber('FACT-20250115-9999', 'factura')).toBe(true);
    });

    it('debe rechazar números de factura con 3 dígitos', () => {
      expect(NumberingService.validateNumber('FACT-20250115-001', 'factura')).toBe(false);
    });
  });

  describe('parseNumber', () => {
    it('debe parsear correctamente un número válido', () => {
      const resultado = NumberingService.parseNumber('RPT-20250115-001');
      
      expect(resultado).toEqual({
        prefix: 'RPT',
        date: '20250115',
        sequential: 1,
        isValid: true
      });
    });

    it('debe parsear correctamente números con secuenciales más altos', () => {
      const resultado = NumberingService.parseNumber('FACT-20250115-1234');
      
      expect(resultado).toEqual({
        prefix: 'FACT',
        date: '20250115',
        sequential: 1234,
        isValid: true
      });
    });

    it('debe retornar null para números inválidos', () => {
      expect(NumberingService.parseNumber('INVALID-FORMAT')).toBeNull();
      expect(NumberingService.parseNumber('RPT-2025115-001')).toBeNull(); // Fecha mal formateada
      expect(NumberingService.parseNumber('')).toBeNull();
    });
  });

  describe('métodos de conveniencia', () => {
    it('generateReportNumber debe generar número de reporte', async () => {
      const numero = await NumberingService.generateReportNumber();
      expect(numero).toMatch(/^RPT-\d{8}-\d{3}$/);
    });

    it('generateTicketNumber debe generar número de ticket', async () => {
      const numero = await NumberingService.generateTicketNumber();
      expect(numero).toMatch(/^TK-\d{8}-\d{3}$/);
    });

    it('generateFormNumber debe generar número de formulario', async () => {
      const numero = await NumberingService.generateFormNumber();
      expect(numero).toMatch(/^FORM-\d{8}-\d{3}$/);
    });
  });

  describe('getNumberingStats', () => {
    it('debe retornar estadísticas por defecto cuando no hay datos', async () => {
      // Reimportar el mock para esta prueba específica
      const { supabase } = await import('@/lib/database/shared/supabase');
      
      // Mock para simular que no hay datos
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          like: vi.fn(() => ({
            data: [],
            error: null
          }))
        }))
      } as any);

      const stats = await NumberingService.getNumberingStats('reporte');
      
      expect(stats).toEqual({
        totalToday: 0,
        totalThisMonth: 0,
        lastNumber: null
      });
    });
  });

  describe('reserveNumberRange', () => {
    it('debe reservar múltiples números consecutivos', async () => {
      const fecha = new Date('2025-01-15');
      const numeros = await NumberingService.reserveNumberRange('reporte', 3, fecha);
      
      expect(numeros).toHaveLength(3);
      expect(numeros[0]).toMatch(/^RPT-20250115-\d{3}$/);
      expect(numeros[1]).toMatch(/^RPT-20250115-\d{3}$/);
      expect(numeros[2]).toMatch(/^RPT-20250115-\d{3}$/);
      
      // Los números deben ser consecutivos
      const parsed1 = NumberingService.parseNumber(numeros[0]);
      const parsed2 = NumberingService.parseNumber(numeros[1]);
      const parsed3 = NumberingService.parseNumber(numeros[2]);
      
      expect(parsed2?.sequential).toBe((parsed1?.sequential || 0) + 1);
      expect(parsed3?.sequential).toBe((parsed2?.sequential || 0) + 1);
    });
  });
});

describe('Funciones de compatibilidad', () => {
  it('generateNumeroReporte debe funcionar pero mostrar warning', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const { generateNumeroReporte } = await import('../numbering-service');
    const numero = await generateNumeroReporte();
    
    expect(numero).toMatch(/^RPT-\d{8}-\d{3}$/);
    expect(consoleSpy).toHaveBeenCalledWith(
      '⚠️ generateNumeroReporte() está deprecado. Usar NumberingService.generateReportNumber()'
    );
    
    consoleSpy.mockRestore();
  });

  it('obtenerProximoNumeroTicket debe funcionar pero mostrar warning', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const { obtenerProximoNumeroTicket } = await import('../numbering-service');
    const numero = await obtenerProximoNumeroTicket();
    
    expect(numero).toMatch(/^TK-\d{8}-\d{3}$/);
    expect(consoleSpy).toHaveBeenCalledWith(
      '⚠️ obtenerProximoNumeroTicket() está deprecado. Usar NumberingService.generateTicketNumber()'
    );
    
    consoleSpy.mockRestore();
  });
});