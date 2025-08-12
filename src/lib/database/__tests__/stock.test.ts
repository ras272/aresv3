import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase before importing the module
vi.mock('../shared/supabase', () => {
  const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    update: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    or: vi.fn(() => mockSupabase),
    order: vi.fn(() => Promise.resolve({ data: [], error: null })),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    limit: vi.fn(() => mockSupabase)
  }
  
  return {
    supabase: mockSupabase
  }
})

import stockModule from '../stock'
import { getAllMovimientosStock } from '@/lib/database'
import { registrarMovimientoStock } from '@/lib/database'
import { getAllStockItems } from '@/lib/database'
import { getAllStockItems } from '@/lib/database'
import { getAllStockItems } from '@/lib/database'
import { registrarSalidaStock } from '@/lib/database'
import { registrarSalidaStock } from '@/lib/database'
import { registrarSalidaStock } from '@/lib/database'
import { devolverRepuestosAlStockReporte } from '@/lib/database'
import { registrarSalidaStockReporte } from '@/lib/database'
import { procesarSalidaStock } from '@/lib/database'
import { procesarSalidaStock } from '@/lib/database'
import { procesarSalidaStock } from '@/lib/database'
import { createTransaccionStock } from '@/lib/database'
import { getAllTransaccionesStock } from '@/lib/database'
import { getEstadisticasTrazabilidad } from '@/lib/database'
import { getEstadisticasTrazabilidad } from '@/lib/database'
import { getMovimientosByCarpeta } from '@/lib/database'
import { getMovimientosByProducto } from '@/lib/database'
import { getMovimientosByProducto } from '@/lib/database'
import { getMovimientosByProducto } from '@/lib/database'
import { getAllMovimientosStock } from '@/lib/database'
import { getAllMovimientosStock } from '@/lib/database'
import { getAllMovimientosStock } from '@/lib/database'
import { registrarMovimientoStock } from '@/lib/database'
import { registrarMovimientoStock } from '@/lib/database'
import { registrarMovimientoStock } from '@/lib/database'
import { registrarMovimientoStock } from '@/lib/database'
import { updateComponenteDisponibleDetails } from '@/lib/database'
import { updateComponenteDisponibleDetails } from '@/lib/database'
import { updateStockItemDetails } from '@/lib/database'
import { updateStockItemDetails } from '@/lib/database'
import { updateStockItemDetails } from '@/lib/database'
import { getAllStockItems } from '@/lib/database'
import { getAllStockItems } from '@/lib/database'
import { getAllStockItems } from '@/lib/database'
import { getAllStockItems } from '@/lib/database'

// Get the mocked supabase for test setup
const mockSupabase = vi.mocked(await import('../shared/supabase')).supabase

describe('Stock Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Module Initialization', () => {
    it('should initialize with default config', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      await stockModule.initialize({
        supabaseClient: mockSupabase,
        enableLogging: true,
        enableErrorReporting: true
      })

      expect(consoleSpy).toHaveBeenCalledWith('📦 Stock module initialized')
      consoleSpy.mockRestore()
    })

    it('should cleanup properly', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      await stockModule.initialize({
        supabaseClient: mockSupabase,
        enableLogging: true
      })
      
      await stockModule.cleanup()

      expect(consoleSpy).toHaveBeenCalledWith('📦 Stock module cleaned up')
      consoleSpy.mockRestore()
    })
  })

  describe('Module Interface', () => {
    it('should have all required methods', () => {
      expect(typeof stockModule.getAllStockItems).toBe('function')
      expect(typeof stockModule.updateStockItemDetails).toBe('function')
      expect(typeof stockModule.updateComponenteDisponibleDetails).toBe('function')
      expect(typeof stockModule.registrarMovimientoStock).toBe('function')
      expect(typeof stockModule.getAllMovimientosStock).toBe('function')
      expect(typeof stockModule.getMovimientosByProducto).toBe('function')
      expect(typeof stockModule.getMovimientosByCarpeta).toBe('function')
      expect(typeof stockModule.getEstadisticasTrazabilidad).toBe('function')
      expect(typeof stockModule.getAllTransaccionesStock).toBe('function')
      expect(typeof stockModule.createTransaccionStock).toBe('function')
      expect(typeof stockModule.procesarSalidaStock).toBe('function')
      expect(typeof stockModule.registrarSalidaStockReporte).toBe('function')
      expect(typeof stockModule.devolverRepuestosAlStockReporte).toBe('function')
      expect(typeof stockModule.registrarSalidaStock).toBe('function')
    })
  })

  describe('Basic Functionality', () => {
    it('should handle getAllStockItems with empty data', async () => {
      mockSupabase.order.mockResolvedValueOnce({ data: [], error: null })
      mockSupabase.order.mockResolvedValueOnce({ data: [], error: null })

      const result = await stockModule.getAllStockItems()
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(0)
    })

    it('should handle database errors gracefully', async () => {
      mockSupabase.order.mockResolvedValueOnce({ 
        data: null, 
        error: new Error('Database connection failed') 
      })

      await expect(stockModule.getAllStockItems()).rejects.toThrow('Database connection failed')
    })

    it('should handle successful stock item retrieval', async () => {
      const mockComponentes = [
        {
          id: '1',
          nombre: 'Test Component',
          marca: 'Test Brand',
          modelo: 'Test Model',
          cantidad_disponible: 5,
          estado: 'Disponible',
          created_at: '2024-01-01T10:00:00Z'
        }
      ]

      const mockStockItems = [
        {
          id: '2',
          nombre: 'Test Stock Item',
          marca: 'Test Brand',
          modelo: 'Test Model',
          cantidad_actual: 3,
          estado: 'Disponible',
          created_at: '2024-01-01T10:00:00Z'
        }
      ]

      mockSupabase.order.mockResolvedValueOnce({ data: mockComponentes, error: null })
      mockSupabase.order.mockResolvedValueOnce({ data: mockStockItems, error: null })

      const result = await stockModule.getAllStockItems()
      
      expect(result).toHaveLength(2)
      expect(result[0].fuente).toBe('componentes_disponibles')
      expect(result[1].fuente).toBe('stock_items')
      expect(result[0].cantidadDisponible).toBe(5)
      expect(result[1].cantidadDisponible).toBe(3)
    })
  })

  describe('Error Handling', () => {
    it('should handle null data responses', async () => {
      mockSupabase.order.mockResolvedValueOnce({ data: null, error: null })
      mockSupabase.order.mockResolvedValueOnce({ data: [], error: null })

      const result = await stockModule.getAllStockItems()
      expect(result).toHaveLength(0)
    })

    it('should handle malformed data', async () => {
      const malformedData = [{ invalid: 'structure' }]
      
      mockSupabase.order.mockResolvedValueOnce({ data: malformedData, error: null })
      mockSupabase.order.mockResolvedValueOnce({ data: [], error: null })

      const result = await stockModule.getAllStockItems()
      expect(result).toHaveLength(1)
      // Should handle malformed data gracefully
      expect(result[0].fuente).toBe('componentes_disponibles')
    })
  })

  describe('Module Configuration', () => {
    it('should work with logging disabled', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      await stockModule.initialize({
        supabaseClient: mockSupabase,
        enableLogging: false
      })

      // Should not log when logging is disabled
      expect(consoleSpy).not.toHaveBeenCalledWith('📦 Stock module initialized')
      consoleSpy.mockRestore()
    })

    it('should handle initialization without optional parameters', async () => {
      await expect(stockModule.initialize({
        supabaseClient: mockSupabase
      })).resolves.not.toThrow()
    })
  })

  describe('getAllStockItems', () => {
    it('should retrieve and combine stock from both tables', async () => {
      const mockComponentes = [
        {
          id: '1',
          nombre: 'Component 1',
          marca: 'Brand A',
          modelo: 'Model X',
          numero_serie: 'SN001',
          tipo_componente: 'Pieza de mano',
          cantidad_disponible: 5,
          cantidad_original: 10,
          estado: 'Disponible',
          observaciones: 'Test component',
          codigo_carga_origen: 'CARGA-001',
          carpeta_principal: 'Brand A',
          fecha_ingreso: '2024-01-01',
          imagen: 'image1.jpg',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z'
        }
      ]

      const mockStockItems = [
        {
          id: '2',
          nombre: 'Stock Item 1',
          marca: 'Brand B',
          modelo: 'Model Y',
          numero_serie: 'SN002',
          cantidad_actual: 3,
          estado: 'Disponible',
          observaciones: 'Test stock item',
          codigo_carga_origen: 'CARGA-002',
          fecha_ingreso: '2024-01-02',
          imagen_url: 'image2.jpg',
          created_at: '2024-01-02T10:00:00Z',
          updated_at: '2024-01-02T10:00:00Z'
        }
      ]

      // Mock componentes_disponibles query
      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockComponentes,
        error: null
      })

      // Mock stock_items query
      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockStockItems,
        error: null
      })

      const result = await getAllStockItems()

      expect(result).toHaveLength(2)
      expect(result[0].fuente).toBe('componentes_disponibles')
      expect(result[1].fuente).toBe('stock_items')
      expect(result[0].cantidadDisponible).toBe(5)
      expect(result[1].cantidadDisponible).toBe(3)
      expect(mockSupabase.from).toHaveBeenCalledWith('componentes_disponibles')
      expect(mockSupabase.from).toHaveBeenCalledWith('stock_items')
    })

    it('should handle empty results from both tables', async () => {
      mockSupabase.from().select().order.mockResolvedValueOnce({
        data: [],
        error: null
      })

      mockSupabase.from().select().order.mockResolvedValueOnce({
        data: [],
        error: null
      })

      const result = await getAllStockItems()

      expect(result).toHaveLength(0)
    })

    it('should throw error when componentes_disponibles query fails', async () => {
      mockSupabase.from().select().order.mockResolvedValueOnce({
        data: null,
        error: new Error('Database error')
      })

      await expect(getAllStockItems()).rejects.toThrow('Database error')
    })

    it('should throw error when stock_items query fails', async () => {
      mockSupabase.from().select().order.mockResolvedValueOnce({
        data: [],
        error: null
      })

      mockSupabase.from().select().order.mockResolvedValueOnce({
        data: null,
        error: new Error('Stock items error')
      })

      await expect(getAllStockItems()).rejects.toThrow('Stock items error')
    })
  })

  describe('updateStockItemDetails', () => {
    it('should update stock item details successfully', async () => {
      const mockComponentes = [
        {
          id: '1',
          nombre: 'Test Product',
          marca: 'Test Brand',
          modelo: 'Test Model'
        },
        {
          id: '2',
          nombre: 'Test Product',
          marca: 'Test Brand',
          modelo: 'Test Model'
        }
      ]

      mockSupabase.from().select.mockResolvedValue({
        data: mockComponentes,
        error: null
      })

      mockSupabase.from().update().eq.mockResolvedValue({
        error: null
      })

      const result = await updateStockItemDetails('test-product-test-brand-test-model', {
        imagen: 'new-image.jpg',
        observaciones: 'Updated observations'
      })

      expect(result).toBe(true)
      expect(mockSupabase.from().update().eq).toHaveBeenCalledTimes(2)
    })

    it('should throw error when no items found', async () => {
      mockSupabase.from().select.mockResolvedValue({
        data: [],
        error: null
      })

      await expect(updateStockItemDetails('nonexistent-product', {
        imagen: 'image.jpg'
      })).rejects.toThrow('Producto no encontrado en stock')
    })

    it('should handle partial updates', async () => {
      const mockComponentes = [
        {
          id: '1',
          nombre: 'Test Product',
          marca: 'Test Brand',
          modelo: 'Test Model'
        }
      ]

      mockSupabase.from().select.mockResolvedValue({
        data: mockComponentes,
        error: null
      })

      mockSupabase.from().update().eq.mockResolvedValue({
        error: null
      })

      await updateStockItemDetails('test-product-test-brand-test-model', {
        imagen: 'new-image.jpg'
        // observaciones is undefined, should not be included
      })

      const updateCall = mockSupabase.from().update.mock.calls[0][0]
      expect(updateCall).toHaveProperty('imagen', 'new-image.jpg')
      expect(updateCall).not.toHaveProperty('observaciones')
    })
  })

  describe('updateComponenteDisponibleDetails', () => {
    it('should update component details with timestamped observations', async () => {
      const mockComponentes = [
        {
          id: '1',
          nombre: 'Test Component',
          marca: 'Test Brand',
          modelo: 'Test Model',
          observaciones: 'Existing observations'
        }
      ]

      mockSupabase.from().select.mockResolvedValue({
        data: mockComponentes,
        error: null
      })

      mockSupabase.from().update().eq.mockResolvedValue({
        error: null
      })

      const result = await updateComponenteDisponibleDetails('test-component-test-brand-test-model', {
        imagen: 'new-image.jpg',
        observaciones: 'New observation'
      })

      expect(result).toBe(true)
      
      const updateCall = mockSupabase.from().update.mock.calls[0][0]
      expect(updateCall.imagen).toBe('new-image.jpg')
      expect(updateCall.observaciones).toContain('Existing observations')
      expect(updateCall.observaciones).toContain('New observation')
    })

    it('should throw error when no components found', async () => {
      mockSupabase.from().select.mockResolvedValue({
        data: [],
        error: null
      })

      await expect(updateComponenteDisponibleDetails('nonexistent', {
        imagen: 'image.jpg'
      })).rejects.toThrow('Producto no encontrado en componentes disponibles')
    })
  })

  describe('registrarMovimientoStock', () => {
    it('should register stock movement for stock_item', async () => {
      const mockMovimiento = {
        itemId: 'stock-123',
        itemType: 'stock_item' as const,
        productoNombre: 'Test Product',
        productoMarca: 'Test Brand',
        tipoMovimiento: 'Entrada' as const,
        cantidad: 5,
        cantidadAnterior: 10,
        cantidadNueva: 15,
        motivo: 'Restock',
        responsable: 'Admin'
      }

      const mockResult = {
        id: 'mov-123',
        ...mockMovimiento
      }

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockResult,
        error: null
      })

      const result = await registrarMovimientoStock(mockMovimiento)

      expect(result.id).toBe('mov-123')
      expect(mockSupabase.from).toHaveBeenCalledWith('movimientos_stock')
      
      const insertData = mockSupabase.from().insert.mock.calls[0][0]
      expect(insertData.stock_item_id).toBe('stock-123')
      expect(insertData.item_type).toBe('stock_item')
    })

    it('should register stock movement for componente_disponible', async () => {
      const mockMovimiento = {
        itemId: 'comp-123',
        itemType: 'componente_disponible' as const,
        productoNombre: 'Test Component',
        tipoMovimiento: 'Salida' as const,
        cantidad: 2,
        cantidadAnterior: 5,
        cantidadNueva: 3,
        motivo: 'Service'
      }

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'mov-124' },
        error: null
      })

      await registrarMovimientoStock(mockMovimiento)

      const insertData = mockSupabase.from().insert.mock.calls[0][0]
      expect(insertData.codigo_item).toBe('comp-123')
      expect(insertData.stock_item_id).toBeUndefined()
      expect(insertData.item_type).toBe('componente_disponible')
    })

    it('should calculate valor_total when costoUnitario provided', async () => {
      const mockMovimiento = {
        productoNombre: 'Test Product',
        tipoMovimiento: 'Entrada' as const,
        cantidad: 3,
        cantidadAnterior: 0,
        cantidadNueva: 3,
        motivo: 'Purchase',
        costoUnitario: 100
      }

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'mov-125' },
        error: null
      })

      await registrarMovimientoStock(mockMovimiento)

      const insertData = mockSupabase.from().insert.mock.calls[0][0]
      expect(insertData.valor_total).toBe(300)
    })

    it('should throw error when insertion fails', async () => {
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: new Error('Insert failed')
      })

      await expect(registrarMovimientoStock({
        productoNombre: 'Test',
        tipoMovimiento: 'Entrada',
        cantidad: 1,
        cantidadAnterior: 0,
        cantidadNueva: 1,
        motivo: 'Test'
      })).rejects.toThrow('Insert failed')
    })
  })

  describe('getAllMovimientosStock', () => {
    it('should retrieve all stock movements', async () => {
      const mockData = [
        {
          id: 'mov-1',
          stock_item_id: 'stock-1',
          tipo_movimiento: 'Entrada',
          cantidad: 5,
          cantidad_anterior: 0,
          cantidad_nueva: 5,
          motivo: 'Initial stock',
          producto_nombre: 'Product 1',
          producto_marca: 'Brand A',
          item_type: 'stock_item',
          fecha_movimiento: '2024-01-01T10:00:00Z',
          created_at: '2024-01-01T10:00:00Z'
        }
      ]

      mockSupabase.from().select().order.mockResolvedValue({
        data: mockData,
        error: null
      })

      const result = await getAllMovimientosStock()

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('mov-1')
      expect(result[0].tipoMovimiento).toBe('Entrada')
      expect(result[0].itemType).toBe('stock_item')
      expect(mockSupabase.from().select().order).toHaveBeenCalledWith('fecha_movimiento', { ascending: false })
    })

    it('should handle empty results', async () => {
      mockSupabase.from().select().order.mockResolvedValue({
        data: [],
        error: null
      })

      const result = await getAllMovimientosStock()

      expect(result).toHaveLength(0)
    })

    it('should throw error when query fails', async () => {
      mockSupabase.from().select().order.mockResolvedValue({
        data: null,
        error: new Error('Query failed')
      })

      await expect(getAllMovimientosStock()).rejects.toThrow('Query failed')
    })
  })

  describe('getMovimientosByProducto', () => {
    it('should filter movements by product name only', async () => {
      const mockData = [
        {
          id: 'mov-1',
          producto_nombre: 'Test Product',
          producto_marca: 'Brand A',
          tipo_movimiento: 'Entrada',
          created_at: '2024-01-01T10:00:00Z'
        }
      ]

      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: mockData,
        error: null
      })

      const result = await getMovimientosByProducto('Test Product')

      expect(result).toHaveLength(1)
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('producto_nombre', 'Test Product')
    })

    it('should filter movements by product name and brand', async () => {
      const mockData = []

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null })
      }

      mockSupabase.from().select().eq.mockReturnValue(mockQuery)

      await getMovimientosByProducto('Test Product', 'Brand A')

      expect(mockQuery.eq).toHaveBeenCalledWith('producto_marca', 'Brand A')
    })

    it('should throw error when query fails', async () => {
      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: null,
        error: new Error('Filter failed')
      })

      await expect(getMovimientosByProducto('Test Product')).rejects.toThrow('Filter failed')
    })
  })

  describe('getMovimientosByCarpeta', () => {
    it('should filter movements by folder', async () => {
      const mockData = [
        {
          id: 'mov-1',
          carpeta_origen: 'Folder A',
          producto_marca: 'Brand A',
          created_at: '2024-01-01T10:00:00Z'
        }
      ]

      mockSupabase.from().select().or().order.mockResolvedValue({
        data: mockData,
        error: null
      })

      const result = await getMovimientosByCarpeta('Folder A')

      expect(result).toHaveLength(1)
      expect(mockSupabase.from().select().or).toHaveBeenCalledWith('carpeta_origen.eq.Folder A,carpeta_destino.eq.Folder A,producto_marca.eq.Folder A')
    })
  })

  describe('getEstadisticasTrazabilidad', () => {
    it('should calculate traceability statistics', async () => {
      const today = new Date().toISOString().split('T')[0]
      const thisMonth = new Date().toISOString().substring(0, 7)

      const mockMovimientos = [
        {
          tipo_movimiento: 'Entrada',
          fecha_movimiento: `${today}T10:00:00Z`,
          valor_total: 100,
          producto_nombre: 'Product A',
          producto_marca: 'Brand A',
          carpeta_origen: 'Folder 1'
        },
        {
          tipo_movimiento: 'Salida',
          fecha_movimiento: `${thisMonth}-15T10:00:00Z`,
          valor_total: 50,
          producto_nombre: 'Product B',
          producto_marca: 'Brand B',
          carpeta_origen: 'Folder 1'
        },
        {
          tipo_movimiento: 'Ajuste',
          fecha_movimiento: '2023-12-01T10:00:00Z',
          producto_nombre: 'Product A',
          producto_marca: 'Brand A',
          carpeta_origen: 'Folder 2'
        }
      ]

      mockSupabase.from().select.mockResolvedValue({
        data: mockMovimientos,
        error: null
      })

      const result = await getEstadisticasTrazabilidad()

      expect(result.totalMovimientos).toBe(3)
      expect(result.movimientosHoy).toBe(1)
      expect(result.movimientosMes).toBe(2)
      expect(result.entradas.total).toBe(1)
      expect(result.entradas.valorTotal).toBe(100)
      expect(result.salidas.total).toBe(1)
      expect(result.salidas.valorTotal).toBe(50)
      expect(result.ajustes.total).toBe(1)
      expect(result.productosConMasMovimientos).toHaveLength(2)
      expect(result.carpetasConMasActividad).toHaveLength(2)
    })

    it('should handle empty movements', async () => {
      mockSupabase.from().select.mockResolvedValue({
        data: [],
        error: null
      })

      const result = await getEstadisticasTrazabilidad()

      expect(result.totalMovimientos).toBe(0)
      expect(result.entradas.total).toBe(0)
      expect(result.productosConMasMovimientos).toHaveLength(0)
    })
  })

  describe('Stock Transaction Functions', () => {
    describe('getAllTransaccionesStock', () => {
      it('should retrieve all stock transactions with component info', async () => {
        const mockData = [
          {
            id: 'trans-1',
            componente_id: 'comp-1',
            tipo: 'SALIDA',
            cantidad: 2,
            cantidad_anterior: 5,
            cantidad_nueva: 3,
            motivo: 'Service use',
            created_at: '2024-01-01T10:00:00Z',
            componentes_disponibles: {
              nombre: 'Component 1',
              marca: 'Brand A',
              modelo: 'Model X',
              numero_serie: 'SN001'
            }
          }
        ]

        mockSupabase.from().select().order.mockResolvedValue({
          data: mockData,
          error: null
        })

        const result = await getAllTransaccionesStock()

        expect(result).toHaveLength(1)
        expect(result[0].componenteId).toBe('comp-1')
        expect(result[0].tipo).toBe('SALIDA')
        expect(result[0].componente?.nombre).toBe('Component 1')
      })
    })

    describe('createTransaccionStock', () => {
      it('should create stock transaction successfully', async () => {
        const transaccionData = {
          componenteId: 'comp-1',
          tipo: 'SALIDA' as const,
          cantidad: 2,
          cantidadAnterior: 5,
          cantidadNueva: 3,
          motivo: 'Service use',
          referencia: 'REF-001',
          cliente: 'Client A',
          fecha: '2024-01-01T10:00:00Z'
        }

        const mockResult = {
          id: 'trans-1',
          ...transaccionData
        }

        mockSupabase.from().insert().select().single.mockResolvedValue({
          data: mockResult,
          error: null
        })

        const result = await createTransaccionStock(transaccionData)

        expect(result.id).toBe('trans-1')
        expect(mockSupabase.from).toHaveBeenCalledWith('transacciones_stock')
      })
    })

    describe('procesarSalidaStock', () => {
      it('should process stock exit successfully', async () => {
        const mockComponente = {
          id: 'comp-1',
          cantidad_disponible: 10
        }

        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: mockComponente,
          error: null
        })

        mockSupabase.from().update().eq.mockResolvedValue({
          error: null
        })

        mockSupabase.from().insert().select().single.mockResolvedValue({
          data: { id: 'trans-1' },
          error: null
        })

        const result = await procesarSalidaStock('comp-1', 3, 'Service use', 'REF-001', 'FAC-001', 'Client A')

        expect(result).toBe(true)
        expect(mockSupabase.from().update().eq).toHaveBeenCalledWith('id', 'comp-1')
      })

      it('should throw error when insufficient stock', async () => {
        const mockComponente = {
          id: 'comp-1',
          cantidad_disponible: 2
        }

        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: mockComponente,
          error: null
        })

        await expect(procesarSalidaStock('comp-1', 5, 'Service use')).rejects.toThrow('Stock insuficiente')
      })

      it('should throw error when component not found', async () => {
        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: null,
          error: null
        })

        await expect(procesarSalidaStock('nonexistent', 1, 'Test')).rejects.toThrow('Componente no encontrado')
      })
    })
  })

  describe('Stock Exit Functions', () => {
    describe('registrarSalidaStockReporte', () => {
      it('should register stock exit for service report', async () => {
        const salidaData = {
          itemId: 'comp-1',
          productoNombre: 'Test Component',
          cantidad: 2,
          cantidadAnterior: 5,
          mantenimientoId: 'mant-1',
          equipoId: 'equipo-1',
          tecnicoResponsable: 'Tech A'
        }

        mockSupabase.from().update().eq.mockResolvedValue({
          error: null
        })

        mockSupabase.from().insert().select().single.mockResolvedValue({
          data: { id: 'mov-1' },
          error: null
        })

        mockSupabase.from().update().eq().order().limit.mockResolvedValue({
          error: null
        })

        const result = await registrarSalidaStockReporte(salidaData)

        expect(result).toBe(true)
        expect(mockSupabase.from().update().eq).toHaveBeenCalledWith('id', 'comp-1')
      })
    })

    describe('devolverRepuestosAlStockReporte', () => {
      it('should return parts to stock from service report', async () => {
        const devolucionData = {
          itemId: 'comp-1',
          productoNombre: 'Test Component',
          cantidad: 1,
          cantidadAnterior: 3,
          mantenimientoId: 'mant-1'
        }

        mockSupabase.from().update().eq.mockResolvedValue({
          error: null
        })

        mockSupabase.from().insert().select().single.mockResolvedValue({
          data: { id: 'mov-1' },
          error: null
        })

        const result = await devolverRepuestosAlStockReporte(devolucionData)

        expect(result).toBe(true)
        
        const updateCall = mockSupabase.from().update.mock.calls[0][0]
        expect(updateCall.cantidad_disponible).toBe(4) // 3 + 1
      })
    })

    describe('registrarSalidaStock', () => {
      it('should register stock exit for stock_item', async () => {
        const salidaData = {
          itemId: 'stock-1',
          productoNombre: 'Test Product',
          cantidad: 2,
          cantidadAnterior: 5,
          motivo: 'Sale',
          destino: 'Client A',
          responsable: 'Admin'
        }

        // Mock stock_item found
        mockSupabase.from().select().eq().single.mockResolvedValueOnce({
          data: { id: 'stock-1', cantidad_actual: 5 },
          error: null
        })

        // Mock componente_disponible not found
        mockSupabase.from().select().eq().single.mockResolvedValueOnce({
          data: null,
          error: new Error('Not found')
        })

        mockSupabase.from().insert().select().single.mockResolvedValue({
          data: { id: 'mov-1' },
          error: null
        })

        mockSupabase.from().update().eq.mockResolvedValue({
          error: null
        })

        const result = await registrarSalidaStock(salidaData)

        expect(result).toBe(true)
        expect(mockSupabase.from).toHaveBeenCalledWith('stock_items')
      })

      it('should register stock exit for componente_disponible', async () => {
        const salidaData = {
          itemId: 'comp-1',
          productoNombre: 'Test Component',
          cantidad: 1,
          cantidadAnterior: 3,
          motivo: 'Service',
          destino: 'Maintenance',
          responsable: 'Tech'
        }

        // Mock stock_item not found
        mockSupabase.from().select().eq().single.mockResolvedValueOnce({
          data: null,
          error: new Error('Not found')
        })

        // Mock componente_disponible found
        mockSupabase.from().select().eq().single.mockResolvedValueOnce({
          data: { id: 'comp-1', cantidad_disponible: 3 },
          error: null
        })

        mockSupabase.from().insert().select().single.mockResolvedValue({
          data: { id: 'mov-1' },
          error: null
        })

        mockSupabase.from().update().eq.mockResolvedValue({
          error: null
        })

        const result = await registrarSalidaStock(salidaData)

        expect(result).toBe(true)
        expect(mockSupabase.from).toHaveBeenCalledWith('componentes_disponibles')
      })

      it('should throw error when item not found in either table', async () => {
        // Mock both queries failing
        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: null,
          error: new Error('Not found')
        })

        await expect(registrarSalidaStock({
          itemId: 'nonexistent',
          productoNombre: 'Test',
          cantidad: 1,
          cantidadAnterior: 1,
          motivo: 'Test',
          destino: 'Test',
          responsable: 'Test'
        })).rejects.toThrow('Item con ID nonexistent no encontrado')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      mockSupabase.from().select().order.mockResolvedValue({
        data: null,
        error: new Error('Connection failed')
      })

      await expect(getAllStockItems()).rejects.toThrow('Connection failed')
    })

    it('should handle malformed data gracefully', async () => {
      mockSupabase.from().select().order.mockResolvedValueOnce({
        data: [{ invalid: 'data' }],
        error: null
      })

      mockSupabase.from().select().order.mockResolvedValueOnce({
        data: [],
        error: null
      })

      const result = await getAllStockItems()

      expect(result).toHaveLength(1)
      expect(result[0].nombre).toBeUndefined()
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete stock movement workflow', async () => {
      // 1. Get stock items
      mockSupabase.from().select().order.mockResolvedValueOnce({
        data: [{ id: '1', nombre: 'Product', cantidad_disponible: 10 }],
        error: null
      })

      mockSupabase.from().select().order.mockResolvedValueOnce({
        data: [],
        error: null
      })

      const stockItems = await getAllStockItems()
      expect(stockItems).toHaveLength(1)

      // 2. Register movement
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'mov-1' },
        error: null
      })

      await registrarMovimientoStock({
        itemId: '1',
        itemType: 'componente_disponible',
        productoNombre: 'Product',
        tipoMovimiento: 'Salida',
        cantidad: 2,
        cantidadAnterior: 10,
        cantidadNueva: 8,
        motivo: 'Test workflow'
      })

      // 3. Get movements
      mockSupabase.from().select().order.mockResolvedValue({
        data: [{ id: 'mov-1', tipo_movimiento: 'Salida' }],
        error: null
      })

      const movements = await getAllMovimientosStock()
      expect(movements).toHaveLength(1)
    })
  })
})