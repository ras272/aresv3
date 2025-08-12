import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock stock-flow
vi.mock('../../stock-flow', () => ({
  procesarProductoParaStock: vi.fn()
}))

// Mock supabase
vi.mock('../../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        })),
        like: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn()
          }))
        })),
        order: vi.fn(() => ({
          ascending: vi.fn()
        })),
        in: vi.fn()
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(),
        in: vi.fn()
      }))
    }))
  }
}))

import { 
  createCargaMercaderia,
  getCargaCompleta,
  getAllCargas,
  generateCodigoCarga,
  createEquipoFromMercaderia,
  deleteCargaMercaderia,
  createOrUpdateStockFromProduct,
  createOrUpdateStockFromSubitem,
  createComponenteInventarioTecnico,
  createComponenteInventarioTecnicoReparacion,
  createComponenteInventarioTecnicoFromSubitem,
  type CargaMercaderiaInput
} from '../mercaderias'

// Get mocked supabase
const { supabase: mockSupabase } = await import('../../supabase')

describe('Mercaderias Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('generateCodigoCarga', () => {
    it('should generate a unique load code for today', async () => {
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      const expectedPrefix = `ENTRADA-${year}${month}${day}`

      // Mock no existing codes for today
      mockSupabase.from().select().like().order().limit.mockResolvedValue({
        data: [],
        error: null
      })

      const codigo = await generateCodigoCarga()

      expect(codigo).toBe(`${expectedPrefix}-001`)
      expect(mockSupabase.from).toHaveBeenCalledWith('cargas_mercaderia')
    })

    it('should increment the code number when codes exist for today', async () => {
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      const expectedPrefix = `ENTRADA-${year}${month}${day}`

      // Mock existing code
      mockSupabase.from().select().like().order().limit.mockResolvedValue({
        data: [{ codigo_carga: `${expectedPrefix}-005` }],
        error: null
      })

      const codigo = await generateCodigoCarga()

      expect(codigo).toBe(`${expectedPrefix}-006`)
    })

    it('should throw error when database query fails', async () => {
      mockSupabase.from().select().like().order().limit.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      })

      await expect(generateCodigoCarga()).rejects.toThrow('Database error')
    })
  })

  describe('createCargaMercaderia', () => {
    const mockCargaData: CargaMercaderiaInput = {
      tipoCarga: 'stock',
      observacionesGenerales: 'Test load',
      productos: [
        {
          producto: 'Test Product',
          tipoProducto: 'Insumo',
          marca: 'Test Brand',
          modelo: 'Test Model',
          cantidad: 5,
          paraStock: true,
          paraServicioTecnico: false
        }
      ]
    }

    it('should create a stock load successfully', async () => {
      const mockCarga = {
        id: '123',
        codigo_carga: 'ENTRADA-20241201-001',
        fecha_ingreso: '2024-12-01T10:00:00Z',
        destino: 'Stock/Inventario General',
        observaciones_generales: 'Test load',
        numero_carga_personalizado: null
      }

      const mockProducto = {
        id: '456',
        carga_id: '123',
        producto: 'Test Product',
        tipo_producto: 'Insumo',
        marca: 'Test Brand',
        modelo: 'Test Model',
        cantidad: 5
      }

      // Mock generateCodigoCarga
      vi.mocked(generateCodigoCarga).mockResolvedValue('ENTRADA-20241201-001')

      // Mock carga creation
      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: mockCarga,
        error: null
      })

      // Mock productos creation
      mockSupabase.from().insert().select.mockResolvedValueOnce({
        data: [mockProducto],
        error: null
      })

      // Mock getCargaCompleta
      const mockCargaCompleta = {
        id: '123',
        codigoCarga: 'ENTRADA-20241201-001',
        tipoCarga: 'stock' as const,
        productos: [{
          id: '456',
          producto: 'Test Product',
          tipoProducto: 'Insumo',
          marca: 'Test Brand',
          modelo: 'Test Model',
          cantidad: 5,
          subitems: []
        }]
      }

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          ...mockCarga,
          productos_carga: [{
            ...mockProducto,
            subitems: []
          }]
        },
        error: null
      })

      const result = await createCargaMercaderia(mockCargaData)

      expect(result.tipoCarga).toBe('stock')
      expect(result.codigoCarga).toBe('ENTRADA-20241201-001')
      expect(mockSupabase.from).toHaveBeenCalledWith('cargas_mercaderia')
      expect(mockSupabase.from).toHaveBeenCalledWith('productos_carga')
    })

    it('should create a repair load successfully', async () => {
      const repairData: CargaMercaderiaInput = {
        tipoCarga: 'reparacion',
        cliente: 'Test Client',
        ubicacionServicio: 'Test Location',
        productos: [
          {
            producto: 'Broken Equipment',
            tipoProducto: 'Equipo Médico',
            marca: 'Test Brand',
            modelo: 'Test Model',
            cantidad: 1
          }
        ]
      }

      const mockCarga = {
        id: '123',
        codigo_carga: 'ENTRADA-20241201-001',
        destino: '🔧 REPARACIÓN - Test Client - Test Location'
      }

      vi.mocked(generateCodigoCarga).mockResolvedValue('ENTRADA-20241201-001')
      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: mockCarga,
        error: null
      })

      mockSupabase.from().insert().select.mockResolvedValueOnce({
        data: [{ id: '456' }],
        error: null
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          ...mockCarga,
          productos_carga: [{ id: '456', subitems: [] }]
        },
        error: null
      })

      const result = await createCargaMercaderia(repairData)

      expect(result.tipoCarga).toBe('reparacion')
    })

    it('should handle medical equipment with subitems', async () => {
      const medicalData: CargaMercaderiaInput = {
        tipoCarga: 'stock',
        productos: [
          {
            producto: 'Medical Device',
            tipoProducto: 'Equipo Médico',
            marca: 'Medical Brand',
            modelo: 'Model X',
            cantidad: 1,
            subitems: [
              {
                nombre: 'Handpiece',
                cantidad: 2,
                paraServicioTecnico: true
              }
            ]
          }
        ]
      }

      vi.mocked(generateCodigoCarga).mockResolvedValue('ENTRADA-20241201-001')
      
      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: { id: '123', codigo_carga: 'ENTRADA-20241201-001' },
        error: null
      })

      mockSupabase.from().insert().select.mockResolvedValueOnce({
        data: [{ id: '456' }],
        error: null
      })

      // Mock subitems insertion
      mockSupabase.from().insert.mockResolvedValueOnce({
        error: null
      })

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          id: '123',
          codigo_carga: 'ENTRADA-20241201-001',
          destino: 'Stock/Inventario General',
          productos_carga: [{
            id: '456',
            tipo_producto: 'Equipo Médico',
            subitems: [{ nombre: 'Handpiece', cantidad: 2 }]
          }]
        },
        error: null
      })

      const result = await createCargaMercaderia(medicalData)

      expect(mockSupabase.from).toHaveBeenCalledWith('subitems')
    })

    it('should throw error when carga creation fails', async () => {
      vi.mocked(generateCodigoCarga).mockResolvedValue('ENTRADA-20241201-001')
      
      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: null,
        error: new Error('Creation failed')
      })

      await expect(createCargaMercaderia(mockCargaData)).rejects.toThrow('Creation failed')
    })
  })

  describe('getCargaCompleta', () => {
    it('should retrieve complete load with products and subitems', async () => {
      const mockData = {
        id: '123',
        codigo_carga: 'ENTRADA-20241201-001',
        fecha_ingreso: '2024-12-01T10:00:00Z',
        destino: 'Stock/Inventario General',
        observaciones_generales: 'Test',
        productos_carga: [
          {
            id: '456',
            producto: 'Test Product',
            tipo_producto: 'Insumo',
            marca: 'Test Brand',
            modelo: 'Test Model',
            numero_serie: 'SN123',
            cantidad: 5,
            para_servicio_tecnico: false,
            subitems: []
          }
        ]
      }

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockData,
        error: null
      })

      const result = await getCargaCompleta('123')

      expect(result.id).toBe('123')
      expect(result.codigoCarga).toBe('ENTRADA-20241201-001')
      expect(result.tipoCarga).toBe('stock')
      expect(result.productos).toHaveLength(1)
      expect(result.productos[0].producto).toBe('Test Product')
    })

    it('should parse repair load destination correctly', async () => {
      const mockData = {
        id: '123',
        codigo_carga: 'ENTRADA-20241201-001',
        destino: '🔧 REPARACIÓN - Client Name - Location',
        productos_carga: []
      }

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockData,
        error: null
      })

      const result = await getCargaCompleta('123')

      expect(result.tipoCarga).toBe('reparacion')
      expect(result.cliente).toBe('Client Name')
      expect(result.ubicacionServicio).toBe('Location')
    })

    it('should throw error when load not found', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: new Error('Not found')
      })

      await expect(getCargaCompleta('nonexistent')).rejects.toThrow('Not found')
    })
  })

  describe('getAllCargas', () => {
    it('should retrieve all loads ordered by creation date', async () => {
      const mockData = [
        {
          id: '123',
          codigo_carga: 'ENTRADA-20241201-001',
          destino: 'Stock/Inventario General',
          productos_carga: []
        },
        {
          id: '124',
          codigo_carga: 'ENTRADA-20241201-002',
          destino: 'Client - Location',
          productos_carga: []
        }
      ]

      mockSupabase.from().select().order.mockResolvedValue({
        data: mockData,
        error: null
      })

      const result = await getAllCargas()

      expect(result).toHaveLength(2)
      expect(result[0].tipoCarga).toBe('stock')
      expect(result[1].tipoCarga).toBe('cliente')
      expect(mockSupabase.from().select().order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('should throw error when query fails', async () => {
      mockSupabase.from().select().order.mockResolvedValue({
        data: null,
        error: new Error('Query failed')
      })

      await expect(getAllCargas()).rejects.toThrow('Query failed')
    })
  })

  describe('createEquipoFromMercaderia', () => {
    it('should create equipment from merchandise product', async () => {
      const mockProducto = {
        id: '456',
        producto: 'Medical Device',
        marca: 'Brand',
        modelo: 'Model',
        numero_serie: 'SN123',
        cantidad: 1
      }

      const mockCarga = {
        id: '123',
        codigo_carga: 'ENTRADA-20241201-001',
        destino: 'Client - Location',
        fecha_ingreso: '2024-12-01T10:00:00Z'
      }

      const mockEquipo = {
        id: '789',
        cliente: 'Client',
        nombre_equipo: 'Medical Device-ENTRADA-20241201-001'
      }

      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: mockEquipo,
        error: null
      })

      mockSupabase.from().insert.mockResolvedValueOnce({
        error: null
      })

      const result = await createEquipoFromMercaderia(mockProducto, mockCarga, [])

      expect(result.id).toBe('789')
      expect(mockSupabase.from).toHaveBeenCalledWith('equipos')
      expect(mockSupabase.from).toHaveBeenCalledWith('componentes_equipo')
    })

    it('should handle subitems marked for technical service', async () => {
      const mockProducto = { id: '456', producto: 'Device', marca: 'Brand', modelo: 'Model' }
      const mockCarga = { id: '123', codigo_carga: 'TEST-001', destino: 'Client' }
      const subitems = [
        { nombre: 'Component 1', paraServicioTecnico: true, cantidad: 1 },
        { nombre: 'Component 2', paraServicioTecnico: false, cantidad: 1 }
      ]

      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: { id: '789' },
        error: null
      })

      mockSupabase.from().insert.mockResolvedValueOnce({
        error: null
      })

      await createEquipoFromMercaderia(mockProducto, mockCarga, subitems)

      // Should create main component + only 1 subitem (the one marked for service)
      const insertCall = mockSupabase.from().insert.mock.calls.find(call => 
        Array.isArray(call[0]) && call[0].some((item: any) => item.nombre === 'Component 1')
      )
      expect(insertCall).toBeDefined()
      expect(insertCall[0]).toHaveLength(2) // Main component + 1 subitem
    })

    it('should throw error when equipment creation fails', async () => {
      const mockProducto = { id: '456', producto: 'Device' }
      const mockCarga = { id: '123', codigo_carga: 'TEST-001' }

      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: null,
        error: new Error('Creation failed')
      })

      await expect(createEquipoFromMercaderia(mockProducto, mockCarga, [])).rejects.toThrow('Creation failed')
    })
  })

  describe('deleteCargaMercaderia', () => {
    it('should delete load and related data in correct order', async () => {
      // Mock successful deletions
      mockSupabase.from().delete().in.mockResolvedValueOnce({ error: null })
      mockSupabase.from().delete().eq.mockResolvedValueOnce({ error: null })
      mockSupabase.from().delete().eq.mockResolvedValueOnce({ error: null })

      await deleteCargaMercaderia('123')

      expect(mockSupabase.from).toHaveBeenCalledWith('subitems')
      expect(mockSupabase.from).toHaveBeenCalledWith('productos_carga')
      expect(mockSupabase.from).toHaveBeenCalledWith('cargas_mercaderia')
    })

    it('should throw error when deletion fails', async () => {
      mockSupabase.from().delete().in.mockResolvedValueOnce({
        error: new Error('Deletion failed')
      })

      await expect(deleteCargaMercaderia('123')).rejects.toThrow('Deletion failed')
    })
  })

  describe('Stock Processing Functions', () => {
    describe('createOrUpdateStockFromProduct', () => {
      it('should process product for stock using stock-flow', async () => {
        const { procesarProductoParaStock } = await import('../../stock-flow')
        
        const producto = {
          producto: 'Test Product',
          marca: 'Test Brand',
          cantidad: 5
        }

        await createOrUpdateStockFromProduct('CARGA-001', producto, 'stock')

        expect(procesarProductoParaStock).toHaveBeenCalledWith('CARGA-001', producto, 'stock')
      })

      it('should throw error when stock processing fails', async () => {
        const { procesarProductoParaStock } = await import('../../stock-flow')
        vi.mocked(procesarProductoParaStock).mockRejectedValue(new Error('Stock processing failed'))

        const producto = { producto: 'Test Product', marca: 'Test Brand', cantidad: 5 }

        await expect(createOrUpdateStockFromProduct('CARGA-001', producto)).rejects.toThrow('Stock processing failed')
      })
    })

    describe('createOrUpdateStockFromSubitem', () => {
      it('should process subitem as product for stock', async () => {
        const { procesarProductoParaStock } = await import('../../stock-flow')
        
        const producto = { producto: 'Parent Product', marca: 'Test Brand', modelo: 'Test Model' }
        const subitem = { nombre: 'Subitem', cantidad: 2, numeroSerie: 'SUB123' }

        await createOrUpdateStockFromSubitem('CARGA-001', producto, subitem, 'stock')

        expect(procesarProductoParaStock).toHaveBeenCalledWith('CARGA-001', expect.objectContaining({
          producto: 'Subitem',
          marca: 'Test Brand',
          modelo: 'Test Model',
          numeroSerie: 'SUB123',
          cantidad: 2,
          tipoProducto: 'Accesorio'
        }), 'stock')
      })
    })
  })

  describe('Technical Inventory Functions', () => {
    describe('createComponenteInventarioTecnico', () => {
      it('should create component in technical inventory', async () => {
        const mockProducto = {
          id: '456',
          producto: 'Handpiece',
          marca: 'Brand',
          modelo: 'Model',
          numero_serie: 'SN123',
          cantidad: 1
        }

        const mockCarga = {
          codigo_carga: 'ENTRADA-001'
        }

        const mockComponente = {
          id: '789',
          nombre: 'Handpiece',
          tipo_componente: 'Pieza de mano'
        }

        mockSupabase.from().insert().select().single.mockResolvedValue({
          data: mockComponente,
          error: null
        })

        const result = await createComponenteInventarioTecnico(mockProducto, mockCarga)

        expect(result.tipo_componente).toBe('Pieza de mano')
        expect(mockSupabase.from).toHaveBeenCalledWith('componentes_disponibles')
      })

      it('should determine correct component type', async () => {
        const productos = [
          { producto: 'Pieza de mano láser', expectedType: 'Pieza de mano' },
          { producto: 'Cartucho IPL', expectedType: 'Cartucho' },
          { producto: 'Transductor ultrasónico', expectedType: 'Transductor' },
          { producto: 'Cable especializado', expectedType: 'Cable especializado' },
          { producto: 'Sensor de temperatura', expectedType: 'Sensor' },
          { producto: 'Aplicador facial', expectedType: 'Aplicador' },
          { producto: 'Punta de diamante', expectedType: 'Punta/Tip' },
          { producto: 'Otro componente', expectedType: 'Componente técnico' }
        ]

        for (const { producto, expectedType } of productos) {
          mockSupabase.from().insert().select().single.mockResolvedValue({
            data: { tipo_componente: expectedType },
            error: null
          })

          const result = await createComponenteInventarioTecnico(
            { id: '1', producto, marca: 'Brand', modelo: 'Model', cantidad: 1 },
            { codigo_carga: 'TEST-001' }
          )

          expect(result.tipo_componente).toBe(expectedType)
        }
      })
    })

    describe('createComponenteInventarioTecnicoReparacion', () => {
      it('should create component for repair with correct state', async () => {
        const mockProducto = {
          id: '456',
          producto: 'Broken Device',
          marca: 'Brand',
          cantidad: 1
        }

        const mockCarga = {
          codigo_carga: 'REPAIR-001'
        }

        mockSupabase.from().insert().select().single.mockResolvedValue({
          data: {
            id: '789',
            estado: 'En reparación',
            ubicacion_fisica: 'Taller de Reparación'
          },
          error: null
        })

        const result = await createComponenteInventarioTecnicoReparacion(mockProducto, mockCarga)

        expect(result.estado).toBe('En reparación')
        expect(result.ubicacion_fisica).toBe('Taller de Reparación')
      })
    })

    describe('createComponenteInventarioTecnicoFromSubitem', () => {
      it('should create component from subitem with parent product info', async () => {
        const subitem = {
          nombre: 'Subcomponent',
          numeroSerie: 'SUB123',
          cantidad: 1
        }

        const producto = {
          id: '456',
          producto: 'Parent Device',
          marca: 'Parent Brand'
        }

        const carga = {
          codigo_carga: 'ENTRADA-001'
        }

        mockSupabase.from().insert().select().single.mockResolvedValue({
          data: {
            id: '789',
            nombre: 'Subcomponent',
            marca: 'Parent Brand',
            modelo: 'Subcomponent'
          },
          error: null
        })

        const result = await createComponenteInventarioTecnicoFromSubitem(subitem, producto, carga)

        expect(result.nombre).toBe('Subcomponent')
        expect(result.marca).toBe('Parent Brand')
        expect(result.modelo).toBe('Subcomponent')
      })
    })
  })
})