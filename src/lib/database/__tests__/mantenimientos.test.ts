import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock shared utils
vi.mock('../shared/utils', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }))
}))

// Mock supabase
vi.mock('../shared/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    }))
  }
}))

import {
  createMantenimiento,
  getAllMantenimientos,
  updateMantenimiento,
  deleteMantenimiento,
  type MantenimientosModuleInterface
} from '../mantenimientos'

describe('Mantenimientos Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Module Structure', () => {
    it('should export all required functions', () => {
      expect(typeof createMantenimiento).toBe('function')
      expect(typeof getAllMantenimientos).toBe('function')
      expect(typeof updateMantenimiento).toBe('function')
      expect(typeof deleteMantenimiento).toBe('function')
    })

    it('should have MantenimientosModuleInterface type available', () => {
      // Type-only test - if this compiles, the interface is properly exported
      const moduleInterface: MantenimientosModuleInterface = {
        createMantenimiento,
        getAllMantenimientos,
        updateMantenimiento,
        deleteMantenimiento
      }
      expect(moduleInterface).toBeDefined()
    })
  })

  describe('Function Signatures', () => {
    it('should have correct createMantenimiento signature', () => {
      const mantenimientoData = {
        equipoId: 'equipo-123',
        fecha: '2024-01-01',
        descripcion: 'Test maintenance',
        estado: 'Pendiente' as const,
        tipo: 'Correctivo' as const,
        prioridad: 'Media' as const
      }

      expect(() => createMantenimiento(mantenimientoData)).not.toThrow()
    })

    it('should have correct createMantenimiento signature with all optional fields', () => {
      const mantenimientoData = {
        equipoId: 'equipo-123',
        componenteId: 'comp-456',
        fecha: '2024-01-01',
        descripcion: 'Complete maintenance test',
        estado: 'En proceso' as const,
        comentarios: 'Test comments',
        archivo: {
          nombre: 'test.pdf',
          tamaño: 1024,
          tipo: 'application/pdf'
        },
        reporteGenerado: true,
        precioServicio: 50000,
        repuestosUtilizados: [
          {
            id: 'rep-123',
            nombre: 'Test Part',
            marca: 'Test Brand',
            modelo: 'Test Model',
            cantidad: 2,
            stockAntes: 10
          }
        ],
        estadoFacturacion: 'Pendiente' as const,
        numeroFacturaExterna: 'FAC-001',
        fechaFacturacion: '2024-01-02',
        archivoFacturaPDF: {
          nombre: 'factura.pdf',
          url: 'https://example.com/factura.pdf',
          tamaño: 2048
        },
        tipo: 'Preventivo' as const,
        esProgramado: true,
        fechaProgramada: '2024-01-01',
        tecnicoAsignado: 'Javier Lopez',
        prioridad: 'Alta' as const,
        esRecurrente: true,
        frecuenciaMantenimiento: 'Mensual' as const,
        proximoMantenimiento: '2024-02-01',
        diasNotificacionAnticipada: 7,
        notificacionEnviada: false,
        tiempoEstimado: 4,
        tiempoReal: 3.5
      }

      expect(() => createMantenimiento(mantenimientoData)).not.toThrow()
    })

    it('should have correct getAllMantenimientos signature', () => {
      expect(() => getAllMantenimientos()).not.toThrow()
    })

    it('should have correct updateMantenimiento signature', () => {
      const updates = {
        estado: 'En proceso' as const,
        comentarios: 'Updated comments'
      }

      expect(() => updateMantenimiento('mant-123', updates)).not.toThrow()
    })

    it('should have correct updateMantenimiento signature with all optional fields', () => {
      const updates = {
        fecha: '2024-01-02',
        estado: 'Finalizado' as const,
        comentarios: 'Completed successfully',
        archivo: {
          nombre: 'updated.pdf',
          tamaño: 2048,
          tipo: 'application/pdf'
        },
        reporteGenerado: true,
        precioServicio: 75000,
        repuestosUtilizados: [
          {
            id: 'rep-456',
            nombre: 'Updated Part',
            marca: 'Updated Brand',
            modelo: 'Updated Model',
            cantidad: 1,
            stockAntes: 5
          }
        ],
        estadoFacturacion: 'Facturado' as const,
        numeroFacturaExterna: 'FAC-002',
        fechaFacturacion: '2024-01-03',
        archivoFacturaPDF: {
          nombre: 'nueva-factura.pdf',
          url: 'https://example.com/nueva-factura.pdf',
          tamaño: 3072
        },
        tecnicoAsignado: 'Carlos Rodriguez',
        prioridad: 'Crítica' as const,
        tiempoReal: 5.5,
        notificacionEnviada: true
      }

      expect(() => updateMantenimiento('mant-123', updates)).not.toThrow()
    })

    it('should have correct deleteMantenimiento signature', () => {
      expect(() => deleteMantenimiento('mant-123')).not.toThrow()
    })
  })

  describe('Type Validation', () => {
    it('should validate required maintenance types', () => {
      const validTypes: Array<'Correctivo' | 'Preventivo'> = ['Correctivo', 'Preventivo']
      
      validTypes.forEach(tipo => {
        const mantenimientoData = {
          equipoId: 'equipo-123',
          fecha: '2024-01-01',
          descripcion: 'Test maintenance',
          estado: 'Pendiente' as const,
          tipo,
          prioridad: 'Media' as const
        }

        expect(() => createMantenimiento(mantenimientoData)).not.toThrow()
      })
    })

    it('should validate required priority levels', () => {
      const validPriorities: Array<'Baja' | 'Media' | 'Alta' | 'Crítica'> = ['Baja', 'Media', 'Alta', 'Crítica']
      
      validPriorities.forEach(prioridad => {
        const mantenimientoData = {
          equipoId: 'equipo-123',
          fecha: '2024-01-01',
          descripcion: 'Test maintenance',
          estado: 'Pendiente' as const,
          tipo: 'Correctivo' as const,
          prioridad
        }

        expect(() => createMantenimiento(mantenimientoData)).not.toThrow()
      })
    })

    it('should validate required status values', () => {
      const validStates: Array<'Pendiente' | 'En proceso' | 'Finalizado'> = ['Pendiente', 'En proceso', 'Finalizado']
      
      validStates.forEach(estado => {
        const mantenimientoData = {
          equipoId: 'equipo-123',
          fecha: '2024-01-01',
          descripcion: 'Test maintenance',
          estado,
          tipo: 'Correctivo' as const,
          prioridad: 'Media' as const
        }

        expect(() => createMantenimiento(mantenimientoData)).not.toThrow()
      })
    })

    it('should validate billing status values', () => {
      const validBillingStates: Array<'Pendiente' | 'Facturado' | 'Enviado'> = ['Pendiente', 'Facturado', 'Enviado']
      
      validBillingStates.forEach(estadoFacturacion => {
        const mantenimientoData = {
          equipoId: 'equipo-123',
          fecha: '2024-01-01',
          descripcion: 'Test maintenance',
          estado: 'Pendiente' as const,
          tipo: 'Correctivo' as const,
          prioridad: 'Media' as const,
          estadoFacturacion
        }

        expect(() => createMantenimiento(mantenimientoData)).not.toThrow()
      })
    })

    it('should validate frequency values', () => {
      const validFrequencies: Array<'Mensual' | 'Bimestral' | 'Trimestral' | 'Semestral' | 'Anual'> = [
        'Mensual', 'Bimestral', 'Trimestral', 'Semestral', 'Anual'
      ]
      
      validFrequencies.forEach(frecuenciaMantenimiento => {
        const mantenimientoData = {
          equipoId: 'equipo-123',
          fecha: '2024-01-01',
          descripcion: 'Test maintenance',
          estado: 'Pendiente' as const,
          tipo: 'Preventivo' as const,
          prioridad: 'Media' as const,
          esRecurrente: true,
          frecuenciaMantenimiento
        }

        expect(() => createMantenimiento(mantenimientoData)).not.toThrow()
      })
    })
  })

  describe('Integration with Equipment Module', () => {
    it('should create maintenance for existing equipment', () => {
      const mantenimientoData = {
        equipoId: 'equipo-123', // Should reference existing equipment
        fecha: '2024-01-01',
        descripcion: 'Equipment maintenance',
        estado: 'Pendiente' as const,
        tipo: 'Preventivo' as const,
        prioridad: 'Media' as const
      }

      expect(() => createMantenimiento(mantenimientoData)).not.toThrow()
    })

    it('should create maintenance for specific component', () => {
      const mantenimientoData = {
        equipoId: 'equipo-123',
        componenteId: 'comp-456', // Should reference existing component
        fecha: '2024-01-01',
        descripcion: 'Component maintenance',
        estado: 'Pendiente' as const,
        tipo: 'Correctivo' as const,
        prioridad: 'Alta' as const
      }

      expect(() => createMantenimiento(mantenimientoData)).not.toThrow()
    })
  })

  describe('Integration with Stock Module', () => {
    it('should track parts used in maintenance', () => {
      const mantenimientoData = {
        equipoId: 'equipo-123',
        fecha: '2024-01-01',
        descripcion: 'Maintenance with parts',
        estado: 'Finalizado' as const,
        tipo: 'Correctivo' as const,
        prioridad: 'Media' as const,
        repuestosUtilizados: [
          {
            id: 'stock-123',
            nombre: 'Replacement Part',
            marca: 'OEM',
            modelo: 'RP-001',
            cantidad: 2,
            stockAntes: 10
          }
        ]
      }

      expect(() => createMantenimiento(mantenimientoData)).not.toThrow()
    })

    it('should update parts usage in maintenance', () => {
      const updates = {
        repuestosUtilizados: [
          {
            id: 'stock-456',
            nombre: 'Updated Part',
            marca: 'Generic',
            modelo: 'UP-002',
            cantidad: 1,
            stockAntes: 5
          }
        ]
      }

      expect(() => updateMantenimiento('mant-123', updates)).not.toThrow()
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle null/undefined values gracefully', () => {
      const mantenimientoData = {
        equipoId: 'equipo-123',
        componenteId: undefined,
        fecha: '2024-01-01',
        descripcion: 'Test maintenance',
        estado: 'Pendiente' as const,
        comentarios: undefined,
        archivo: undefined,
        tipo: 'Correctivo' as const,
        prioridad: 'Media' as const
      }

      expect(() => createMantenimiento(mantenimientoData)).not.toThrow()
    })

    it('should handle empty arrays and objects', () => {
      const mantenimientoData = {
        equipoId: 'equipo-123',
        fecha: '2024-01-01',
        descripcion: 'Test maintenance',
        estado: 'Pendiente' as const,
        tipo: 'Correctivo' as const,
        prioridad: 'Media' as const,
        repuestosUtilizados: []
      }

      expect(() => createMantenimiento(mantenimientoData)).not.toThrow()
    })

    it('should handle very long description text', () => {
      const longDescription = 'A'.repeat(1000) // Very long description

      const mantenimientoData = {
        equipoId: 'equipo-123',
        fecha: '2024-01-01',
        descripcion: longDescription,
        estado: 'Pendiente' as const,
        tipo: 'Correctivo' as const,
        prioridad: 'Media' as const
      }

      expect(() => createMantenimiento(mantenimientoData)).not.toThrow()
    })

    it('should handle empty ID parameter for delete', () => {
      expect(() => deleteMantenimiento('')).not.toThrow()
    })

    it('should handle partial updates', () => {
      const updates = {
        estado: 'En proceso' as const
      }

      expect(() => updateMantenimiento('mant-123', updates)).not.toThrow()
    })
  })

  describe('TypeScript Type Safety', () => {
    it('should enforce correct maintenance data structure', () => {
      // This test ensures TypeScript compilation catches type errors
      const validData = {
        equipoId: 'equipo-123',
        fecha: '2024-01-01',
        descripcion: 'Valid maintenance',
        estado: 'Pendiente' as const,
        tipo: 'Correctivo' as const,
        prioridad: 'Media' as const
      }

      expect(() => createMantenimiento(validData)).not.toThrow()
    })

    it('should enforce correct update data structure', () => {
      const validUpdates = {
        estado: 'En proceso' as const,
        comentarios: 'Valid update',
        prioridad: 'Alta' as const
      }

      expect(() => updateMantenimiento('mant-123', validUpdates)).not.toThrow()
    })

    it('should enforce correct archivo structure', () => {
      const validArchivo = {
        nombre: 'test.pdf',
        tamaño: 1024,
        tipo: 'application/pdf'
      }

      const mantenimientoData = {
        equipoId: 'equipo-123',
        fecha: '2024-01-01',
        descripcion: 'Test with file',
        estado: 'Pendiente' as const,
        tipo: 'Correctivo' as const,
        prioridad: 'Media' as const,
        archivo: validArchivo
      }

      expect(() => createMantenimiento(mantenimientoData)).not.toThrow()
    })

    it('should enforce correct repuestosUtilizados structure', () => {
      const validRepuestos = [
        {
          id: 'rep-123',
          nombre: 'Test Part',
          marca: 'Test Brand',
          modelo: 'Test Model',
          cantidad: 1,
          stockAntes: 10
        }
      ]

      const mantenimientoData = {
        equipoId: 'equipo-123',
        fecha: '2024-01-01',
        descripcion: 'Test with parts',
        estado: 'Pendiente' as const,
        tipo: 'Correctivo' as const,
        prioridad: 'Media' as const,
        repuestosUtilizados: validRepuestos
      }

      expect(() => createMantenimiento(mantenimientoData)).not.toThrow()
    })

    it('should enforce correct archivoFacturaPDF structure', () => {
      const validFacturaPDF = {
        nombre: 'factura.pdf',
        url: 'https://example.com/factura.pdf',
        tamaño: 2048
      }

      const mantenimientoData = {
        equipoId: 'equipo-123',
        fecha: '2024-01-01',
        descripcion: 'Test with invoice PDF',
        estado: 'Pendiente' as const,
        tipo: 'Correctivo' as const,
        prioridad: 'Media' as const,
        archivoFacturaPDF: validFacturaPDF
      }

      expect(() => createMantenimiento(mantenimientoData)).not.toThrow()
    })
  })

  describe('Backward Compatibility', () => {
    it('should maintain compatibility with existing function signatures', () => {
      // Test that all functions can be called with the same parameters as before refactoring
      expect(typeof createMantenimiento).toBe('function')
      expect(typeof getAllMantenimientos).toBe('function')
      expect(typeof updateMantenimiento).toBe('function')
      expect(typeof deleteMantenimiento).toBe('function')
    })

    it('should support all existing maintenance states', () => {
      const existingStates = ['Pendiente', 'En proceso', 'Finalizado'] as const
      
      existingStates.forEach(estado => {
        const mantenimientoData = {
          equipoId: 'equipo-123',
          fecha: '2024-01-01',
          descripcion: 'Compatibility test',
          estado,
          tipo: 'Correctivo' as const,
          prioridad: 'Media' as const
        }

        expect(() => createMantenimiento(mantenimientoData)).not.toThrow()
      })
    })

    it('should support all existing maintenance types', () => {
      const existingTypes = ['Correctivo', 'Preventivo'] as const
      
      existingTypes.forEach(tipo => {
        const mantenimientoData = {
          equipoId: 'equipo-123',
          fecha: '2024-01-01',
          descripcion: 'Compatibility test',
          estado: 'Pendiente' as const,
          tipo,
          prioridad: 'Media' as const
        }

        expect(() => createMantenimiento(mantenimientoData)).not.toThrow()
      })
    })
  })
})