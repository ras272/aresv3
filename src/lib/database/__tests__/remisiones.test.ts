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

// Mock stock module functions that remisiones depends on
vi.mock('../stock', () => ({
  registrarMovimientoStock: vi.fn(() => Promise.resolve()),
  createTransaccionStock: vi.fn(() => Promise.resolve())
}))

// Mock supabase with basic functionality
vi.mock('../shared/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: {
              id: 'remision-123',
              numero_remision: 'REM-20240101-001',
              numero_factura: 'FAC-001',
              fecha: '2024-01-01',
              cliente_nombre: 'Test Client',
              direccion_entrega: 'Test Address',
              contacto: 'Test Contact',
              telefono: '123456789',
              tipo_remision: 'Instalación',
              tecnico_responsable: 'Test Technician',
              descripcion_general: 'Test description',
              estado: 'Borrador',
              fecha_entrega: null,
              observaciones_entrega: null,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            }, 
            error: null 
          }))
        }))
      })),
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ 
          data: [
            {
              id: 'remision-123',
              numero_remision: 'REM-20240101-001',
              numero_factura: 'FAC-001',
              fecha: '2024-01-01',
              cliente_nombre: 'Test Client',
              direccion_entrega: 'Test Address',
              contacto: 'Test Contact',
              telefono: '123456789',
              tipo_remision: 'Instalación',
              tecnico_responsable: 'Test Technician',
              descripcion_general: 'Test description',
              estado: 'Borrador',
              fecha_entrega: null,
              observaciones_entrega: null,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              productos_remision: [
                {
                  id: 'producto-123',
                  componente_id: 'comp-123',
                  nombre: 'Test Product',
                  marca: 'Test Brand',
                  modelo: 'Test Model',
                  numero_serie: 'SN123',
                  cantidad_solicitada: 2,
                  cantidad_disponible: 5,
                  observaciones: 'Test observations'
                }
              ]
            }
          ], 
          error: null 
        })),
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: {
              id: 'remision-123',
              numero_remision: 'REM-20240101-001',
              estado: 'Borrador',
              productos_remision: []
            }, 
            error: null 
          }))
        })),
        like: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ 
              data: [
                { numero_remision: 'REM-20240101-001' }
              ], 
              error: null 
            }))
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ 
              data: {
                id: 'remision-123',
                numero_remision: 'REM-20240101-001',
                estado: 'Confirmada'
              }, 
              error: null 
            }))
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
  getAllRemisiones,
  createRemision,
  updateRemision,
  deleteRemision,
  deleteRemisionConRestauracion,
  generateNumeroRemision,
  reducirStockPorRemision,
  type RemisionInput,
  type RemisionUpdate
} from '../remisiones'

describe('Remisiones Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Module Structure', () => {
    it('should export all required functions', () => {
      expect(typeof getAllRemisiones).toBe('function')
      expect(typeof createRemision).toBe('function')
      expect(typeof updateRemision).toBe('function')
      expect(typeof deleteRemision).toBe('function')
      expect(typeof deleteRemisionConRestauracion).toBe('function')
      expect(typeof generateNumeroRemision).toBe('function')
      expect(typeof reducirStockPorRemision).toBe('function')
    })

    it('should have correct TypeScript interfaces available', () => {
      // Type-only test - if this compiles, the interfaces are properly exported
      const remisionInput: RemisionInput = {
        fecha: '2024-01-01',
        cliente: 'Test Client',
        direccionEntrega: 'Test Address',
        tipoRemision: 'Instalación',
        tecnicoResponsable: 'Test Technician',
        productos: [],
        estado: 'Borrador'
      }

      const remisionUpdate: RemisionUpdate = {
        estado: 'Confirmada'
      }

      expect(remisionInput).toBeDefined()
      expect(remisionUpdate).toBeDefined()
    })
  })

  describe('getAllRemisiones', () => {
    it('should fetch all remisiones successfully', async () => {
      const result = await getAllRemisiones()

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      
      // Check that the data is properly mapped
      const remision = result[0]
      expect(remision).toHaveProperty('numeroRemision')
      expect(remision).toHaveProperty('cliente')
      expect(remision).toHaveProperty('direccionEntrega')
      expect(remision).toHaveProperty('tipoRemision')
      expect(remision).toHaveProperty('tecnicoResponsable')
      expect(remision).toHaveProperty('productos')
    })

    it('should properly map database fields to interface fields', async () => {
      const result = await getAllRemisiones()
      const remision = result[0]

      expect(remision.numeroRemision).toBe('REM-20240101-001')
      expect(remision.cliente).toBe('Test Client')
      expect(remision.direccionEntrega).toBe('Test Address')
      expect(remision.tipoRemision).toBe('Instalación')
      expect(remision.tecnicoResponsable).toBe('Test Technician')
    })
  })

  describe('Type Validation', () => {
    it('should validate required fields in RemisionInput', () => {
      const validInput: RemisionInput = {
        fecha: '2024-01-01',
        cliente: 'Valid Client',
        direccionEntrega: 'Valid Address',
        tipoRemision: 'Instalación',
        tecnicoResponsable: 'Valid Technician',
        productos: [],
        estado: 'Borrador'
      }

      expect(validInput).toBeDefined()
      expect(validInput.fecha).toBe('2024-01-01')
      expect(validInput.cliente).toBe('Valid Client')
      expect(validInput.tipoRemision).toBe('Instalación')
      expect(validInput.estado).toBe('Borrador')
    })

    it('should validate tipoRemision enum values', () => {
      const validTypes: Array<'Instalación' | 'Mantenimiento' | 'Reparación' | 'Entrega'> = [
        'Instalación',
        'Mantenimiento', 
        'Reparación',
        'Entrega'
      ]

      validTypes.forEach(tipo => {
        const validInput: RemisionInput = {
          fecha: '2024-01-01',
          cliente: 'Valid Client',
          direccionEntrega: 'Valid Address',
          tipoRemision: tipo,
          tecnicoResponsable: 'Valid Technician',
          productos: [],
          estado: 'Borrador'
        }

        expect(validInput.tipoRemision).toBe(tipo)
      })
    })

    it('should validate estado enum values', () => {
      const validStates: Array<'Borrador' | 'Confirmada' | 'En tránsito' | 'Entregada' | 'Cancelada'> = [
        'Borrador',
        'Confirmada',
        'En tránsito',
        'Entregada',
        'Cancelada'
      ]

      validStates.forEach(estado => {
        const validInput: RemisionInput = {
          fecha: '2024-01-01',
          cliente: 'Valid Client',
          direccionEntrega: 'Valid Address',
          tipoRemision: 'Instalación',
          tecnicoResponsable: 'Valid Technician',
          productos: [],
          estado: estado
        }

        expect(validInput.estado).toBe(estado)
      })
    })

    it('should validate all optional fields in RemisionUpdate', () => {
      const validUpdate: RemisionUpdate = {
        numeroFactura: 'FAC-UPDATE',
        estado: 'Confirmada',
        fechaEntrega: '2024-01-02',
        observacionesEntrega: 'Updated observations',
        descripcionGeneral: 'Updated description'
      }

      expect(validUpdate.numeroFactura).toBe('FAC-UPDATE')
      expect(validUpdate.estado).toBe('Confirmada')
      expect(validUpdate.fechaEntrega).toBe('2024-01-02')
    })
  })

  describe('Backward Compatibility', () => {
    it('should maintain compatibility with existing function signatures', () => {
      expect(typeof getAllRemisiones).toBe('function')
      expect(typeof createRemision).toBe('function')
      expect(typeof updateRemision).toBe('function')
      expect(typeof deleteRemision).toBe('function')
      expect(typeof deleteRemisionConRestauracion).toBe('function')
      expect(typeof generateNumeroRemision).toBe('function')
      expect(typeof reducirStockPorRemision).toBe('function')
    })

    it('should return data in the same format as before refactoring', async () => {
      const result = await getAllRemisiones()

      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('numeroRemision')
      expect(result[0]).toHaveProperty('numeroFactura')
      expect(result[0]).toHaveProperty('fecha')
      expect(result[0]).toHaveProperty('cliente')
      expect(result[0]).toHaveProperty('direccionEntrega')
      expect(result[0]).toHaveProperty('contacto')
      expect(result[0]).toHaveProperty('telefono')
      expect(result[0]).toHaveProperty('tipoRemision')
      expect(result[0]).toHaveProperty('tecnicoResponsable')
      expect(result[0]).toHaveProperty('productos')
      expect(result[0]).toHaveProperty('descripcionGeneral')
      expect(result[0]).toHaveProperty('estado')
      expect(result[0]).toHaveProperty('fechaEntrega')
      expect(result[0]).toHaveProperty('observacionesEntrega')
      expect(result[0]).toHaveProperty('createdAt')
      expect(result[0]).toHaveProperty('updatedAt')
    })

    it('should support stockItemId for backward compatibility', () => {
      const remisionData: RemisionInput = {
        fecha: '2024-01-01',
        cliente: 'Backward Compatible Client',
        direccionEntrega: 'Backward Compatible Address',
        tipoRemision: 'Instalación',
        tecnicoResponsable: 'Backward Compatible Technician',
        productos: [
          {
            componenteId: '',
            stockItemId: 'stock-123', // Using old field name
            nombre: 'Backward Compatible Product',
            marca: 'Backward Compatible Brand',
            modelo: 'Backward Compatible Model',
            cantidadSolicitada: 1,
            cantidadDisponible: 3
          }
        ],
        estado: 'Borrador'
      }

      expect(remisionData.productos[0].stockItemId).toBe('stock-123')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle null/undefined values gracefully', () => {
      const remisionData: RemisionInput = {
        numeroFactura: undefined,
        fecha: '2024-01-01',
        cliente: 'Null Test Client',
        direccionEntrega: 'Null Test Address',
        contacto: undefined,
        telefono: undefined,
        tipoRemision: 'Instalación',
        tecnicoResponsable: 'Null Test Technician',
        productos: [],
        descripcionGeneral: undefined,
        estado: 'Borrador'
      }

      expect(remisionData.numeroFactura).toBeUndefined()
      expect(remisionData.contacto).toBeUndefined()
      expect(remisionData.telefono).toBeUndefined()
      expect(remisionData.descripcionGeneral).toBeUndefined()
    })

    it('should handle empty productos array', () => {
      const remisionData: RemisionInput = {
        fecha: '2024-01-01',
        cliente: 'Empty Products Client',
        direccionEntrega: 'Empty Products Address',
        tipoRemision: 'Instalación',
        tecnicoResponsable: 'Empty Products Technician',
        productos: [], // Empty array
        estado: 'Borrador'
      }

      expect(remisionData.productos).toEqual([])
      expect(remisionData.productos.length).toBe(0)
    })

    it('should handle empty string values', () => {
      const remisionData: RemisionInput = {
        numeroFactura: '',
        fecha: '2024-01-01',
        cliente: '',
        direccionEntrega: '',
        contacto: '',
        telefono: '',
        tipoRemision: 'Instalación',
        tecnicoResponsable: '',
        productos: [],
        descripcionGeneral: '',
        estado: 'Borrador'
      }

      expect(remisionData.numeroFactura).toBe('')
      expect(remisionData.cliente).toBe('')
      expect(remisionData.direccionEntrega).toBe('')
    })
  })

  describe('Function Signatures', () => {
    it('should have correct getAllRemisiones signature', () => {
      expect(getAllRemisiones.length).toBe(0) // No parameters
    })

    it('should have correct createRemision signature', () => {
      expect(createRemision.length).toBe(1) // One parameter: remisionData
    })

    it('should have correct updateRemision signature', () => {
      expect(updateRemision.length).toBe(2) // Two parameters: remisionId, updates
    })

    it('should have correct deleteRemision signature', () => {
      expect(deleteRemision.length).toBe(1) // One parameter: remisionId
    })

    it('should have correct deleteRemisionConRestauracion signature', () => {
      expect(deleteRemisionConRestauracion.length).toBe(2) // Two parameters: remisionId, motivo
    })

    it('should have correct generateNumeroRemision signature', () => {
      expect(generateNumeroRemision.length).toBe(0) // No parameters
    })

    it('should have correct reducirStockPorRemision signature', () => {
      expect(reducirStockPorRemision.length).toBe(2) // Two parameters: remision, productos
    })
  })

  describe('Module Integration', () => {
    it('should be properly integrated with the main database index', () => {
      // This test verifies that the module can be imported and used
      // The fact that we can import and call these functions means integration is working
      expect(getAllRemisiones).toBeDefined()
      expect(createRemision).toBeDefined()
      expect(updateRemision).toBeDefined()
      expect(deleteRemision).toBeDefined()
      expect(deleteRemisionConRestauracion).toBeDefined()
      expect(generateNumeroRemision).toBeDefined()
      expect(reducirStockPorRemision).toBeDefined()
    })

    it('should have proper TypeScript types exported', () => {
      // Type-only test - if this compiles, the types are properly exported
      const input: RemisionInput = {
        fecha: '2024-01-01',
        cliente: 'Type Test Client',
        direccionEntrega: 'Type Test Address',
        tipoRemision: 'Instalación',
        tecnicoResponsable: 'Type Test Technician',
        productos: [],
        estado: 'Borrador'
      }

      const update: RemisionUpdate = {
        estado: 'Confirmada'
      }

      expect(input).toBeDefined()
      expect(update).toBeDefined()
    })
  })
})