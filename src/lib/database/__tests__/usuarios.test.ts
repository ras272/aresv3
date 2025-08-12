import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'

// Mock the supabase import first
vi.mock('../shared/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        not: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }))
    }))
  }
}))

import { getUsuariosReferenciados, getEstadisticasUsuarios } from '../usuarios'
import { supabase } from '../shared/supabase'

const mockSupabase = supabase as any

describe('Usuarios Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    console.log = vi.fn()
    console.error = vi.fn()
  })

  describe('getUsuariosReferenciados', () => {
    it('should return unique users from stock movements', async () => {
      // Mock data with duplicate users
      const mockMovimientos = [
        { usuario_responsable: 'Juan Pérez', tecnico_responsable: 'Carlos López' },
        { usuario_responsable: 'María García', tecnico_responsable: 'Juan Pérez' },
        { usuario_responsable: 'Juan Pérez', tecnico_responsable: 'Ana Martín' },
        { usuario_responsable: null, tecnico_responsable: 'Carlos López' }
      ]

      const mockQuery = {
        select: vi.fn(() => ({
          not: vi.fn(() => Promise.resolve({ data: mockMovimientos, error: null }))
        }))
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await getUsuariosReferenciados()

      expect(mockSupabase.from).toHaveBeenCalledWith('movimientos_stock')
      expect(mockQuery.select).toHaveBeenCalledWith('usuario_responsable, tecnico_responsable')
      expect(result).toEqual(['Juan Pérez', 'Carlos López', 'María García', 'Ana Martín'])
      expect(result).toHaveLength(4) // Should remove duplicates
    })

    it('should handle empty results', async () => {
      const mockQuery = {
        select: vi.fn(() => ({
          not: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await getUsuariosReferenciados()

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it('should filter out null and undefined users', async () => {
      const mockMovimientos = [
        { usuario_responsable: 'Juan Pérez', tecnico_responsable: null },
        { usuario_responsable: null, tecnico_responsable: 'Carlos López' },
        { usuario_responsable: '', tecnico_responsable: 'Ana Martín' },
        { usuario_responsable: 'María García', tecnico_responsable: undefined }
      ]

      const mockQuery = {
        select: vi.fn(() => ({
          not: vi.fn(() => Promise.resolve({ data: mockMovimientos, error: null }))
        }))
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await getUsuariosReferenciados()

      expect(result).toEqual(['Juan Pérez', 'Carlos López', 'Ana Martín', 'María García'])
      expect(result).not.toContain('')
      expect(result).not.toContain(null)
      expect(result).not.toContain(undefined)
    })

    it('should handle database errors', async () => {
      const mockError = new Error('Database connection failed')
      const mockQuery = {
        select: vi.fn(() => ({
          not: vi.fn(() => Promise.resolve({ data: null, error: mockError }))
        }))
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      await expect(getUsuariosReferenciados()).rejects.toThrow('Database connection failed')
      expect(console.error).toHaveBeenCalledWith('❌ Error obteniendo usuarios referenciados:', mockError)
    })

    it('should log the correct information', async () => {
      const mockMovimientos = [
        { usuario_responsable: 'Juan Pérez', tecnico_responsable: 'Carlos López' }
      ]

      const mockQuery = {
        select: vi.fn(() => ({
          not: vi.fn(() => Promise.resolve({ data: mockMovimientos, error: null }))
        }))
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      await getUsuariosReferenciados()

      expect(console.log).toHaveBeenCalledWith('👥 Obteniendo usuarios referenciados en el sistema...')
      expect(console.log).toHaveBeenCalledWith('✅ Usuarios referenciados encontrados:', 2)
    })
  })

  describe('getEstadisticasUsuarios', () => {
    it('should return user statistics with movement counts and last activity', async () => {
      const mockMovimientos = [
        { 
          usuario_responsable: 'Juan Pérez', 
          tecnico_responsable: 'Carlos López',
          created_at: '2024-01-15T10:00:00Z'
        },
        { 
          usuario_responsable: 'Juan Pérez', 
          tecnico_responsable: null,
          created_at: '2024-01-20T15:30:00Z'
        },
        { 
          usuario_responsable: 'María García', 
          tecnico_responsable: 'Carlos López',
          created_at: '2024-01-10T08:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn(() => ({
          not: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockMovimientos, error: null }))
          }))
        }))
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await getEstadisticasUsuarios()

      expect(mockSupabase.from).toHaveBeenCalledWith('movimientos_stock')
      expect(mockQuery.select).toHaveBeenCalledWith('usuario_responsable, tecnico_responsable, created_at')
      
      expect(result).toHaveLength(3)
      
      // Check Juan Pérez stats (appears in 2 movements)
      const juanStats = result.find(u => u.usuario === 'Juan Pérez')
      expect(juanStats).toBeDefined()
      expect(juanStats?.totalMovimientos).toBe(2)
      expect(juanStats?.ultimaActividad).toBe('2024-01-20T15:30:00Z') // Most recent
      
      // Check Carlos López stats (appears in 2 movements)
      const carlosStats = result.find(u => u.usuario === 'Carlos López')
      expect(carlosStats).toBeDefined()
      expect(carlosStats?.totalMovimientos).toBe(2)
      expect(carlosStats?.ultimaActividad).toBe('2024-01-15T10:00:00Z') // Most recent for him
      
      // Check María García stats (appears in 1 movement)
      const mariaStats = result.find(u => u.usuario === 'María García')
      expect(mariaStats).toBeDefined()
      expect(mariaStats?.totalMovimientos).toBe(1)
      expect(mariaStats?.ultimaActividad).toBe('2024-01-10T08:00:00Z')
    })

    it('should handle empty results', async () => {
      const mockQuery = {
        select: vi.fn(() => ({
          not: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await getEstadisticasUsuarios()

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it('should filter out null users in statistics', async () => {
      const mockMovimientos = [
        { 
          usuario_responsable: 'Juan Pérez', 
          tecnico_responsable: null,
          created_at: '2024-01-15T10:00:00Z'
        },
        { 
          usuario_responsable: null, 
          tecnico_responsable: 'Carlos López',
          created_at: '2024-01-20T15:30:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn(() => ({
          not: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockMovimientos, error: null }))
          }))
        }))
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await getEstadisticasUsuarios()

      expect(result).toHaveLength(2)
      expect(result.map(u => u.usuario)).toEqual(['Juan Pérez', 'Carlos López'])
    })

    it('should correctly update last activity date', async () => {
      const mockMovimientos = [
        { 
          usuario_responsable: 'Juan Pérez', 
          tecnico_responsable: null,
          created_at: '2024-01-10T10:00:00Z'
        },
        { 
          usuario_responsable: 'Juan Pérez', 
          tecnico_responsable: null,
          created_at: '2024-01-20T15:30:00Z' // More recent
        },
        { 
          usuario_responsable: 'Juan Pérez', 
          tecnico_responsable: null,
          created_at: '2024-01-15T12:00:00Z' // In between
        }
      ]

      const mockQuery = {
        select: vi.fn(() => ({
          not: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockMovimientos, error: null }))
          }))
        }))
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await getEstadisticasUsuarios()

      expect(result).toHaveLength(1)
      const juanStats = result[0]
      expect(juanStats.usuario).toBe('Juan Pérez')
      expect(juanStats.totalMovimientos).toBe(3)
      expect(juanStats.ultimaActividad).toBe('2024-01-20T15:30:00Z') // Should be the most recent
    })

    it('should handle database errors', async () => {
      const mockError = new Error('Database query failed')
      const mockQuery = {
        select: vi.fn(() => ({
          not: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: null, error: mockError }))
          }))
        }))
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      await expect(getEstadisticasUsuarios()).rejects.toThrow('Database query failed')
      expect(console.error).toHaveBeenCalledWith('❌ Error generando estadísticas de usuarios:', mockError)
    })

    it('should log the correct information', async () => {
      const mockMovimientos = [
        { 
          usuario_responsable: 'Juan Pérez', 
          tecnico_responsable: null,
          created_at: '2024-01-15T10:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn(() => ({
          not: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockMovimientos, error: null }))
          }))
        }))
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      await getEstadisticasUsuarios()

      expect(console.log).toHaveBeenCalledWith('📊 Generando estadísticas de usuarios...')
      expect(console.log).toHaveBeenCalledWith('✅ Estadísticas de usuarios generadas:', 1)
    })

    it('should handle query ordering correctly', async () => {
      const mockMovimientos = [
        { 
          usuario_responsable: 'Juan Pérez', 
          tecnico_responsable: null,
          created_at: '2024-01-15T10:00:00Z'
        }
      ]

      const mockOrder = vi.fn(() => Promise.resolve({ data: mockMovimientos, error: null }))
      const mockNot = vi.fn(() => ({ order: mockOrder }))
      const mockSelect = vi.fn(() => ({ not: mockNot }))
      
      mockSupabase.from.mockReturnValue({ select: mockSelect })

      await getEstadisticasUsuarios()

      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockNot).toHaveBeenCalledWith('usuario_responsable', 'is', null)
    })
  })

  describe('Error Handling', () => {
    it('should handle Supabase client errors gracefully', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Supabase client error')
      })

      await expect(getUsuariosReferenciados()).rejects.toThrow('Supabase client error')
      await expect(getEstadisticasUsuarios()).rejects.toThrow('Supabase client error')
    })

    it('should handle malformed data gracefully', async () => {
      const mockMovimientos = [
        { usuario_responsable: 123, tecnico_responsable: 'Valid User' }, // Invalid type
        { usuario_responsable: 'Valid User', tecnico_responsable: {} }, // Invalid type
        { usuario_responsable: 'Valid User', tecnico_responsable: 'Another Valid User' }
      ]

      const mockQuery = {
        select: vi.fn(() => ({
          not: vi.fn(() => Promise.resolve({ data: mockMovimientos, error: null }))
        }))
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await getUsuariosReferenciados()

      // Should handle invalid types gracefully and only return valid strings
      expect(result).toContain('Valid User')
      expect(result).toContain('Another Valid User')
      expect(result).toHaveLength(2)
    })
  })

  describe('Integration with Authentication System', () => {
    it('should be compatible with future authentication integration', async () => {
      // This test ensures the module structure is ready for auth integration
      const mockMovimientos = [
        { 
          usuario_responsable: 'user@example.com', 
          tecnico_responsable: 'tech@example.com',
          created_at: '2024-01-15T10:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn(() => ({
          not: vi.fn(() => Promise.resolve({ data: mockMovimientos, error: null }))
        }))
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const usuarios = await getUsuariosReferenciados()
      
      // Should handle email-like usernames (common in auth systems)
      expect(usuarios).toContain('user@example.com')
      expect(usuarios).toContain('tech@example.com')
    })
  })
})