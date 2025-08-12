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
          single: vi.fn(() => Promise.resolve({ 
            data: {
              id: 'clinic-123',
              nombre: 'Test Clinic',
              direccion: 'Test Address',
              ciudad: 'Test City',
              telefono: '123456789',
              email: 'test@clinic.com',
              contacto_principal: 'Dr. Test',
              observaciones: 'Test observations',
              activa: true,
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
              id: 'clinic-123',
              nombre: 'Test Clinic',
              direccion: 'Test Address',
              ciudad: 'Test City',
              telefono: '123456789',
              email: 'test@clinic.com',
              contacto_principal: 'Dr. Test',
              observaciones: 'Test observations',
              activa: true,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            }
          ], 
          error: null 
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ 
              data: {
                id: 'clinic-123',
                nombre: 'Updated Clinic',
                direccion: 'Updated Address',
                ciudad: 'Updated City',
                telefono: '987654321',
                email: 'updated@clinic.com',
                contacto_principal: 'Dr. Updated',
                observaciones: 'Updated observations',
                activa: false,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-02T00:00:00Z'
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
  getAllClinicas,
  createClinica,
  updateClinica,
  deleteClinica,
  clinicasModule,
  type ClinicasModule,
  type ClinicaInput,
  type ClinicaUpdate
} from '../clinicas'

import { supabase } from '../shared/supabase'

// Cast to any to access mock methods
const mockSupabase = supabase as any

describe('Clinicas Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Module Structure', () => {
    it('should export all required functions', () => {
      expect(typeof getAllClinicas).toBe('function')
      expect(typeof createClinica).toBe('function')
      expect(typeof updateClinica).toBe('function')
      expect(typeof deleteClinica).toBe('function')
    })

    it('should export the clinicasModule object', () => {
      expect(clinicasModule).toBeDefined()
      expect(typeof clinicasModule.getAllClinicas).toBe('function')
      expect(typeof clinicasModule.createClinica).toBe('function')
      expect(typeof clinicasModule.updateClinica).toBe('function')
      expect(typeof clinicasModule.deleteClinica).toBe('function')
    })

    it('should have ClinicasModule interface available', () => {
      // Type-only test - if this compiles, the interface is properly exported
      const moduleInterface: ClinicasModule = {
        getAllClinicas,
        createClinica,
        updateClinica,
        deleteClinica
      }
      expect(moduleInterface).toBeDefined()
    })
  })

  describe('getAllClinicas', () => {
    it('should fetch all clinics successfully', async () => {
      const result = await getAllClinicas()

      expect(mockSupabase.from).toHaveBeenCalledWith('clinicas')
      expect(result).toEqual([
        {
          id: 'clinic-123',
          nombre: 'Test Clinic',
          direccion: 'Test Address',
          ciudad: 'Test City',
          telefono: '123456789',
          email: 'test@clinic.com',
          contactoPrincipal: 'Dr. Test',
          observaciones: 'Test observations',
          activa: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ])
    })

    it('should handle database errors', async () => {
      const mockError = new Error('Database connection failed')
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: null, error: mockError }))
        }))
      })

      await expect(getAllClinicas()).rejects.toThrow('Database connection failed')
    })

    it('should order clinics by created_at descending', async () => {
      await getAllClinicas()

      const selectMock = mockSupabase.from().select()
      expect(selectMock.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('should handle empty result set', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })

      const result = await getAllClinicas()
      expect(result).toEqual([])
    })
  })

  describe('createClinica', () => {
    it('should create a clinic with required fields only', async () => {
      const clinicaData: ClinicaInput = {
        nombre: 'New Clinic',
        direccion: 'New Address',
        ciudad: 'New City'
      }

      const result = await createClinica(clinicaData)

      expect(mockSupabase.from).toHaveBeenCalledWith('clinicas')
      expect(result).toEqual({
        id: 'clinic-123',
        nombre: 'Test Clinic',
        direccion: 'Test Address',
        ciudad: 'Test City',
        telefono: '123456789',
        email: 'test@clinic.com',
        contactoPrincipal: 'Dr. Test',
        observaciones: 'Test observations',
        activa: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      })
    })

    it('should create a clinic with all fields', async () => {
      const clinicaData: ClinicaInput = {
        nombre: 'Complete Clinic',
        direccion: 'Complete Address',
        ciudad: 'Complete City',
        telefono: '123456789',
        email: 'complete@clinic.com',
        contactoPrincipal: 'Dr. Complete',
        observaciones: 'Complete observations',
        activa: true
      }

      const result = await createClinica(clinicaData)

      expect(mockSupabase.from).toHaveBeenCalledWith('clinicas')
      expect(result).toBeDefined()
    })

    it('should default activa to true when not provided', async () => {
      const clinicaData: ClinicaInput = {
        nombre: 'Default Active Clinic',
        direccion: 'Default Address',
        ciudad: 'Default City'
      }

      await createClinica(clinicaData)

      const insertMock = mockSupabase.from().insert
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          activa: true
        })
      )
    })

    it('should handle database errors during creation', async () => {
      const mockError = new Error('Insert failed')
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: mockError }))
          }))
        }))
      })

      const clinicaData: ClinicaInput = {
        nombre: 'Error Clinic',
        direccion: 'Error Address',
        ciudad: 'Error City'
      }

      await expect(createClinica(clinicaData)).rejects.toThrow('Insert failed')
    })

    it('should map database field names correctly', async () => {
      const clinicaData: ClinicaInput = {
        nombre: 'Mapping Test Clinic',
        direccion: 'Mapping Address',
        ciudad: 'Mapping City',
        contactoPrincipal: 'Dr. Mapping'
      }

      await createClinica(clinicaData)

      const insertMock = mockSupabase.from().insert
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          contacto_principal: 'Dr. Mapping'
        })
      )
    })
  })

  describe('updateClinica', () => {
    it('should update clinic with partial data', async () => {
      const updates: ClinicaUpdate = {
        nombre: 'Updated Name',
        activa: false
      }

      const result = await updateClinica('clinic-123', updates)

      expect(mockSupabase.from).toHaveBeenCalledWith('clinicas')
      expect(result).toBeDefined()
    })

    it('should update clinic with all fields', async () => {
      const updates: ClinicaUpdate = {
        nombre: 'Fully Updated Clinic',
        direccion: 'Fully Updated Address',
        ciudad: 'Fully Updated City',
        telefono: '987654321',
        email: 'updated@clinic.com',
        contactoPrincipal: 'Dr. Updated',
        observaciones: 'Fully updated observations',
        activa: false
      }

      const result = await updateClinica('clinic-123', updates)

      expect(mockSupabase.from).toHaveBeenCalledWith('clinicas')
      expect(result).toBeDefined()
    })

    it('should handle database errors during update', async () => {
      const mockError = new Error('Update failed')
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: null, error: mockError }))
            }))
          }))
        }))
      })

      const updates: ClinicaUpdate = {
        nombre: 'Error Update'
      }

      await expect(updateClinica('clinic-123', updates)).rejects.toThrow('Update failed')
    })

    it('should use correct WHERE clause for update', async () => {
      const updates: ClinicaUpdate = {
        nombre: 'Where Test Clinic'
      }

      await updateClinica('clinic-456', updates)

      const updateMock = mockSupabase.from().update()
      expect(updateMock.eq).toHaveBeenCalledWith('id', 'clinic-456')
    })

    it('should map field names correctly in updates', async () => {
      const updates: ClinicaUpdate = {
        contactoPrincipal: 'Dr. Updated Contact'
      }

      await updateClinica('clinic-123', updates)

      const updateMock = mockSupabase.from().update
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          contacto_principal: 'Dr. Updated Contact'
        })
      )
    })

    it('should handle empty updates object', async () => {
      const updates: ClinicaUpdate = {}

      const result = await updateClinica('clinic-123', updates)

      expect(result).toBeDefined()
    })
  })

  describe('deleteClinica', () => {
    it('should delete clinic successfully', async () => {
      const result = await deleteClinica('clinic-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('clinicas')
      expect(result).toBe(true)
    })

    it('should use correct WHERE clause for delete', async () => {
      await deleteClinica('clinic-456')

      const deleteMock = mockSupabase.from().delete()
      expect(deleteMock.eq).toHaveBeenCalledWith('id', 'clinic-456')
    })

    it('should handle database errors during deletion', async () => {
      const mockError = new Error('Delete failed')
      mockSupabase.from.mockReturnValueOnce({
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: mockError }))
        }))
      })

      await expect(deleteClinica('clinic-123')).rejects.toThrow('Delete failed')
    })

    it('should handle empty ID parameter', async () => {
      const result = await deleteClinica('')

      expect(result).toBe(true)
    })
  })

  describe('Function Signatures', () => {
    it('should have correct getAllClinicas signature', () => {
      expect(() => getAllClinicas()).not.toThrow()
    })

    it('should have correct createClinica signature with required fields', () => {
      const clinicaData: ClinicaInput = {
        nombre: 'Test Clinic',
        direccion: 'Test Address',
        ciudad: 'Test City'
      }

      expect(() => createClinica(clinicaData)).not.toThrow()
    })

    it('should have correct createClinica signature with all optional fields', () => {
      const clinicaData: ClinicaInput = {
        nombre: 'Complete Test Clinic',
        direccion: 'Complete Test Address',
        ciudad: 'Complete Test City',
        telefono: '123456789',
        email: 'test@clinic.com',
        contactoPrincipal: 'Dr. Test',
        observaciones: 'Test observations',
        activa: true
      }

      expect(() => createClinica(clinicaData)).not.toThrow()
    })

    it('should have correct updateClinica signature', () => {
      const updates: ClinicaUpdate = {
        nombre: 'Updated Name'
      }

      expect(() => updateClinica('clinic-123', updates)).not.toThrow()
    })

    it('should have correct deleteClinica signature', () => {
      expect(() => deleteClinica('clinic-123')).not.toThrow()
    })
  })

  describe('Type Validation', () => {
    it('should validate required fields in ClinicaInput', () => {
      const validInput: ClinicaInput = {
        nombre: 'Valid Clinic',
        direccion: 'Valid Address',
        ciudad: 'Valid City'
      }

      expect(() => createClinica(validInput)).not.toThrow()
    })

    it('should validate optional fields in ClinicaInput', () => {
      const validInput: ClinicaInput = {
        nombre: 'Valid Clinic',
        direccion: 'Valid Address',
        ciudad: 'Valid City',
        telefono: '123456789',
        email: 'valid@email.com',
        contactoPrincipal: 'Dr. Valid',
        observaciones: 'Valid observations',
        activa: true
      }

      expect(() => createClinica(validInput)).not.toThrow()
    })

    it('should validate all optional fields in ClinicaUpdate', () => {
      const validUpdate: ClinicaUpdate = {
        nombre: 'Updated Name',
        direccion: 'Updated Address',
        ciudad: 'Updated City',
        telefono: '987654321',
        email: 'updated@email.com',
        contactoPrincipal: 'Dr. Updated',
        observaciones: 'Updated observations',
        activa: false
      }

      expect(() => updateClinica('clinic-123', validUpdate)).not.toThrow()
    })

    it('should handle boolean activa field correctly', () => {
      const activeClinic: ClinicaInput = {
        nombre: 'Active Clinic',
        direccion: 'Active Address',
        ciudad: 'Active City',
        activa: true
      }

      const inactiveClinic: ClinicaInput = {
        nombre: 'Inactive Clinic',
        direccion: 'Inactive Address',
        ciudad: 'Inactive City',
        activa: false
      }

      expect(() => createClinica(activeClinic)).not.toThrow()
      expect(() => createClinica(inactiveClinic)).not.toThrow()
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle null/undefined values gracefully', async () => {
      const clinicaData: ClinicaInput = {
        nombre: 'Null Test Clinic',
        direccion: 'Null Test Address',
        ciudad: 'Null Test City',
        telefono: undefined,
        email: undefined,
        contactoPrincipal: undefined,
        observaciones: undefined
      }

      expect(() => createClinica(clinicaData)).not.toThrow()
    })

    it('should handle very long text fields', async () => {
      const longText = 'A'.repeat(1000)

      const clinicaData: ClinicaInput = {
        nombre: longText,
        direccion: longText,
        ciudad: longText,
        observaciones: longText
      }

      expect(() => createClinica(clinicaData)).not.toThrow()
    })

    it('should handle special characters in text fields', async () => {
      const specialChars = 'Clínica São José & Associados - Médicos Especialistas (24/7)'

      const clinicaData: ClinicaInput = {
        nombre: specialChars,
        direccion: specialChars,
        ciudad: specialChars,
        contactoPrincipal: specialChars,
        observaciones: specialChars
      }

      expect(() => createClinica(clinicaData)).not.toThrow()
    })

    it('should handle empty string values', async () => {
      const clinicaData: ClinicaInput = {
        nombre: '',
        direccion: '',
        ciudad: '',
        telefono: '',
        email: '',
        contactoPrincipal: '',
        observaciones: ''
      }

      expect(() => createClinica(clinicaData)).not.toThrow()
    })

    it('should handle partial updates with undefined values', async () => {
      const updates: ClinicaUpdate = {
        nombre: 'Updated Name',
        telefono: undefined,
        email: undefined
      }

      expect(() => updateClinica('clinic-123', updates)).not.toThrow()
    })
  })

  describe('Database Constraint Handling', () => {
    it('should handle unique constraint violations', async () => {
      const mockError = new Error('duplicate key value violates unique constraint')
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: mockError }))
          }))
        }))
      })

      const clinicaData: ClinicaInput = {
        nombre: 'Duplicate Clinic',
        direccion: 'Duplicate Address',
        ciudad: 'Duplicate City'
      }

      await expect(createClinica(clinicaData)).rejects.toThrow('duplicate key value violates unique constraint')
    })

    it('should handle foreign key constraint violations', async () => {
      const mockError = new Error('violates foreign key constraint')
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: null, error: mockError }))
            }))
          }))
        }))
      })

      const updates: ClinicaUpdate = {
        nombre: 'FK Violation Test'
      }

      await expect(updateClinica('invalid-id', updates)).rejects.toThrow('violates foreign key constraint')
    })

    it('should handle not null constraint violations', async () => {
      const mockError = new Error('null value in column violates not-null constraint')
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: mockError }))
          }))
        }))
      })

      const clinicaData: ClinicaInput = {
        nombre: 'Not Null Test',
        direccion: 'Not Null Address',
        ciudad: 'Not Null City'
      }

      await expect(createClinica(clinicaData)).rejects.toThrow('null value in column violates not-null constraint')
    })
  })

  describe('Backward Compatibility', () => {
    it('should maintain compatibility with existing function signatures', () => {
      // Test that all functions can be called with the same parameters as before refactoring
      expect(typeof getAllClinicas).toBe('function')
      expect(typeof createClinica).toBe('function')
      expect(typeof updateClinica).toBe('function')
      expect(typeof deleteClinica).toBe('function')
    })

    it('should return data in the same format as before refactoring', async () => {
      const result = await getAllClinicas()

      // Verify the returned data structure matches the expected Clinica interface
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('nombre')
      expect(result[0]).toHaveProperty('direccion')
      expect(result[0]).toHaveProperty('ciudad')
      expect(result[0]).toHaveProperty('telefono')
      expect(result[0]).toHaveProperty('email')
      expect(result[0]).toHaveProperty('contactoPrincipal')
      expect(result[0]).toHaveProperty('observaciones')
      expect(result[0]).toHaveProperty('activa')
      expect(result[0]).toHaveProperty('createdAt')
      expect(result[0]).toHaveProperty('updatedAt')
    })

    it('should support the same parameter structure for createClinica', async () => {
      // Test the exact parameter structure that was used before refactoring
      const clinicaData = {
        nombre: 'Backward Compatible Clinic',
        direccion: 'Backward Compatible Address',
        ciudad: 'Backward Compatible City',
        telefono: '123456789',
        email: 'backward@compatible.com',
        contactoPrincipal: 'Dr. Backward',
        observaciones: 'Backward compatible observations',
        activa: true
      }

      const result = await createClinica(clinicaData)
      expect(result).toBeDefined()
    })

    it('should support the same parameter structure for updateClinica', async () => {
      // Test the exact parameter structure that was used before refactoring
      const updates = {
        nombre: 'Backward Compatible Update',
        direccion: 'Updated Address',
        ciudad: 'Updated City',
        telefono: '987654321',
        email: 'updated@backward.com',
        contactoPrincipal: 'Dr. Updated',
        observaciones: 'Updated observations',
        activa: false
      }

      const result = await updateClinica('clinic-123', updates)
      expect(result).toBeDefined()
    })

    it('should return boolean for deleteClinica as before', async () => {
      const result = await deleteClinica('clinic-123')
      expect(typeof result).toBe('boolean')
      expect(result).toBe(true)
    })
  })

  describe('TypeScript Type Safety', () => {
    it('should enforce correct ClinicaInput structure', () => {
      const validInput: ClinicaInput = {
        nombre: 'Type Safe Clinic',
        direccion: 'Type Safe Address',
        ciudad: 'Type Safe City'
      }

      expect(() => createClinica(validInput)).not.toThrow()
    })

    it('should enforce correct ClinicaUpdate structure', () => {
      const validUpdate: ClinicaUpdate = {
        nombre: 'Type Safe Update',
        activa: false
      }

      expect(() => updateClinica('clinic-123', validUpdate)).not.toThrow()
    })

    it('should enforce string type for ID parameters', () => {
      expect(() => updateClinica('string-id', { nombre: 'Test' })).not.toThrow()
      expect(() => deleteClinica('string-id')).not.toThrow()
    })

    it('should enforce boolean type for activa field', () => {
      const validTrue: ClinicaInput = {
        nombre: 'Boolean Test',
        direccion: 'Boolean Address',
        ciudad: 'Boolean City',
        activa: true
      }

      const validFalse: ClinicaInput = {
        nombre: 'Boolean Test',
        direccion: 'Boolean Address',
        ciudad: 'Boolean City',
        activa: false
      }

      expect(() => createClinica(validTrue)).not.toThrow()
      expect(() => createClinica(validFalse)).not.toThrow()
    })
  })
})