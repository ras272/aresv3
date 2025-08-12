import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock all modules with shared mock setup
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  delete: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  or: vi.fn(() => mockSupabase),
  in: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  limit: vi.fn(() => mockSupabase),
  single: vi.fn(() => Promise.resolve({ data: null, error: null })),
  then: vi.fn(() => Promise.resolve({ data: [], error: null }))
}

// Mock supabase
vi.mock('../shared/supabase', () => ({
  supabase: mockSupabase
}))

// Mock stock-flow
vi.mock('../../stock-flow', () => ({
  procesarProductoParaStock: vi.fn()
}))

// Import modules after mocking
import { 
  createCargaMercaderia,
  createEquipoFromMercaderia 
} from '../mercaderias'
import { 
  registrarMovimientoStock,
  getAllStockItems,
  registrarSalidaStock 
} from '../stock'
import { 
  createEquipo,
  asignarComponenteAEquipo,
  getAllComponentesDisponibles 
} from '../equipos'
import { 
  createMantenimiento 
} from '../mantenimientos'
import { 
  createRemision,
  reducirStockPorRemision 
} from '../remisiones'

describe('Database Module Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Mercaderias to Stock Integration', () => {
    it('should process merchandise and create stock entries', async () => {
      // Mock successful merchandise creation
      const mockCarga = {
        id: 'carga-123',
        codigoCarga: 'CARGA-001',
        tipoCarga: 'stock',
        productos: [{
          id: 'prod-123',
          producto: 'Monitor Cardíaco',
          marca: 'Philips',
          modelo: 'MP60',
          cantidad: 2,
          paraStock: true
        }]
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: mockCarga,
        error: null
      })

      // Mock stock creation
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'stock-123', cantidad: 2 },
        error: null
      })

      const result = await createCargaMercaderia({
        tipoCarga: 'stock',
        productos: [{
          producto: 'Monitor Cardíaco',
          tipoProducto: 'Equipo Médico',
          marca: 'Philips',
          modelo: 'MP60',
          cantidad: 2,
          paraStock: true
        }]
      })

      expect(result).toBeDefined()
      expect(mockSupabase.insert).toHaveBeenCalled()
    })

    it('should handle errors during merchandise to stock processing', async () => {
      // Mock merchandise creation success but stock creation failure
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: 'carga-123' },
          error: null
        })
        .mockRejectedValueOnce(new Error('Stock creation failed'))

      await expect(createCargaMercaderia({
        tipoCarga: 'stock',
        productos: [{
          producto: 'Monitor Cardíaco',
          tipoProducto: 'Equipo Médico',
          marca: 'Philips',
          modelo: 'MP60',
          cantidad: 2,
          paraStock: true
        }]
      })).rejects.toThrow()
    })
  })

  describe('Equipos to Mantenimientos Integration', () => {
    it('should create maintenance for existing equipment', async () => {
      // Mock equipment exists
      const mockEquipo = {
        id: 'equipo-123',
        nombreEquipo: 'Monitor Cardíaco',
        cliente: 'Hospital Central'
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: mockEquipo,
        error: null
      })

      // Mock maintenance creation
      const mockMantenimiento = {
        id: 'mant-123',
        equipoId: 'equipo-123',
        descripcion: 'Mantenimiento preventivo',
        estado: 'Pendiente'
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: mockMantenimiento,
        error: null
      })

      const result = await createMantenimiento({
        equipoId: 'equipo-123',
        fecha: '2024-01-15',
        descripcion: 'Mantenimiento preventivo',
        estado: 'Pendiente',
        tipo: 'Preventivo',
        prioridad: 'Media'
      })

      expect(result).toBeDefined()
      expect(mockSupabase.insert).toHaveBeenCalled()
    })

    it('should handle equipment not found during maintenance creation', async () => {
      // Mock equipment not found
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Equipment not found' }
      })

      await expect(createMantenimiento({
        equipoId: 'non-existent-equipo',
        fecha: '2024-01-15',
        descripcion: 'Mantenimiento preventivo',
        estado: 'Pendiente',
        tipo: 'Preventivo',
        prioridad: 'Media'
      })).rejects.toThrow()
    })
  })

  describe('Remisiones to Stock Integration', () => {
    it('should reduce stock when creating remision', async () => {
      // Mock stock items available
      const mockStockItems = [{
        id: 'stock-123',
        nombre: 'Monitor Cardíaco',
        cantidadDisponible: 5
      }]

      mockSupabase.then.mockResolvedValueOnce({
        data: mockStockItems,
        error: null
      })

      // Mock remision creation
      const mockRemision = {
        id: 'rem-123',
        numeroRemision: 'REM-001',
        productos: [{
          stockItemId: 'stock-123',
          cantidadSolicitada: 2
        }]
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: mockRemision,
        error: null
      })

      // Mock stock update
      mockSupabase.single.mockResolvedValueOnce({
        data: { cantidadDisponible: 3 },
        error: null
      })

      const result = await createRemision({
        fecha: '2024-01-15',
        cliente: 'Hospital Central',
        direccionEntrega: 'Av. Principal 123',
        tipoRemision: 'Entrega',
        tecnicoResponsable: 'Juan Pérez',
        estado: 'Confirmada',
        productos: [{
          componenteId: 'comp-123',
          stockItemId: 'stock-123',
          nombre: 'Monitor Cardíaco',
          marca: 'Philips',
          modelo: 'MP60',
          cantidadSolicitada: 2,
          cantidadDisponible: 5
        }]
      })

      expect(result).toBeDefined()
      expect(mockSupabase.insert).toHaveBeenCalled()
      expect(mockSupabase.update).toHaveBeenCalled()
    })

    it('should handle insufficient stock during remision creation', async () => {
      // Mock insufficient stock
      const mockStockItems = [{
        id: 'stock-123',
        nombre: 'Monitor Cardíaco',
        cantidadDisponible: 1
      }]

      mockSupabase.then.mockResolvedValueOnce({
        data: mockStockItems,
        error: null
      })

      await expect(createRemision({
        fecha: '2024-01-15',
        cliente: 'Hospital Central',
        direccionEntrega: 'Av. Principal 123',
        tipoRemision: 'Entrega',
        tecnicoResponsable: 'Juan Pérez',
        estado: 'Confirmada',
        productos: [{
          componenteId: 'comp-123',
          stockItemId: 'stock-123',
          nombre: 'Monitor Cardíaco',
          marca: 'Philips',
          modelo: 'MP60',
          cantidadSolicitada: 5,
          cantidadDisponible: 1
        }]
      })).rejects.toThrow()
    })
  })

  describe('Cross-Module Error Propagation', () => {
    it('should propagate database connection errors across modules', async () => {
      // Mock database connection error
      const dbError = new Error('Database connection failed')
      mockSupabase.single.mockRejectedValue(dbError)

      // Test error propagation in different modules
      await expect(createCargaMercaderia({
        tipoCarga: 'stock',
        productos: []
      })).rejects.toThrow('Database connection failed')

      await expect(getAllStockItems()).rejects.toThrow('Database connection failed')

      await expect(createEquipo({
        cliente: 'Test',
        ubicacion: 'Test',
        nombreEquipo: 'Test',
        tipoEquipo: 'Test',
        marca: 'Test',
        modelo: 'Test',
        numeroSerieBase: 'Test',
        componentes: [],
        fechaEntrega: '2024-01-15'
      })).rejects.toThrow('Database connection failed')
    })

    it('should handle validation errors consistently across modules', async () => {
      // Test validation error handling in different modules
      await expect(createCargaMercaderia({
        tipoCarga: 'invalid' as any,
        productos: []
      })).rejects.toThrow()

      await expect(createMantenimiento({
        equipoId: '',
        fecha: 'invalid-date',
        descripcion: '',
        estado: 'Invalid' as any,
        tipo: 'Invalid' as any,
        prioridad: 'Invalid' as any
      })).rejects.toThrow()
    })
  })

  describe('Component Assignment Integration', () => {
    it('should assign components from stock to equipment', async () => {
      // Mock available component
      const mockComponent = {
        id: 'comp-123',
        nombre: 'Sensor de Presión',
        cantidadDisponible: 3
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: mockComponent,
        error: null
      })

      // Mock equipment exists
      const mockEquipo = {
        id: 'equipo-123',
        nombreEquipo: 'Monitor Cardíaco'
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: mockEquipo,
        error: null
      })

      // Mock assignment creation
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'asign-123' },
        error: null
      })

      // Mock stock movement registration
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'mov-123' },
        error: null
      })

      const result = await asignarComponenteAEquipo(
        'comp-123',
        'equipo-123',
        2,
        'Instalación inicial',
        'Juan Pérez'
      )

      expect(result).toBeDefined()
      expect(mockSupabase.insert).toHaveBeenCalledTimes(2) // Assignment + Movement
      expect(mockSupabase.update).toHaveBeenCalled() // Component quantity update
    })
  })
})