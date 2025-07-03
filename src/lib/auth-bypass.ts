'use client';

// Sistema de autenticación bypass temporal para solucionar el problema de Supabase Auth
// Este es un workaround mientras se soluciona el problema principal

import { User, UserRole } from '@/types/auth';

// Usuarios demo para bypass
const BYPASS_USERS: Record<string, { password: string; user: User }> = {
  'admin@ares.com.py': {
    password: 'admin123',
    user: {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'admin@ares.com.py',
      name: 'Administrador Sistema',
      role: 'admin' as UserRole,
      empresa: 'Ares Paraguay',
      telefono: '+595 21 123-4567',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      lastLogin: new Date().toISOString()
    }
  },
  'gerente@ares.com.py': {
    password: 'gerente123',
    user: {
      id: '550e8400-e29b-41d4-a716-446655440002',
      email: 'gerente@ares.com.py',
      name: 'María González - Gerente',
      role: 'gerente' as UserRole,
      empresa: 'Ares Paraguay',
      telefono: '+595 21 123-4568',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      lastLogin: new Date().toISOString()
    }
  },
  'vendedor@ares.com.py': {
    password: 'vendedor123',
    user: {
      id: '550e8400-e29b-41d4-a716-446655440003',
      email: 'vendedor@ares.com.py',
      name: 'Carlos López - Vendedor',
      role: 'vendedor' as UserRole,
      empresa: 'Ares Paraguay',
      telefono: '+595 21 123-4569',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      lastLogin: new Date().toISOString()
    }
  },
  'tecnico@ares.com.py': {
    password: 'tecnico123',
    user: {
      id: '550e8400-e29b-41d4-a716-446655440004',
      email: 'tecnico@ares.com.py',
      name: 'Roberto Kim - Técnico',
      role: 'tecnico' as UserRole,
      empresa: 'Ares Paraguay',
      telefono: '+595 21 123-4570',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      lastLogin: new Date().toISOString()
    }
  },
  'cliente@clinicasanjose.com': {
    password: 'cliente123',
    user: {
      id: '550e8400-e29b-41d4-a716-446655440005',
      email: 'cliente@clinicasanjose.com',
      name: 'Dra. Ana Rodríguez',
      role: 'cliente' as UserRole,
      empresa: 'Clínica San José',
      telefono: '+595 21 987-6543',
      isActive: true,
      createdAt: '2024-02-01T00:00:00Z',
      lastLogin: new Date().toISOString()
    }
  }
};

/**
 * Sistema de autenticación bypass temporal
 */
export async function bypassLogin(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    console.log('🔄 Usando sistema de bypass temporal para:', email);
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const userRecord = BYPASS_USERS[email];
    
    if (!userRecord) {
      return {
        success: false,
        error: 'Usuario no encontrado'
      };
    }
    
    if (userRecord.password !== password) {
      return {
        success: false,
        error: 'Contraseña incorrecta'
      };
    }
    
    // Actualizar último login
    const user = { 
      ...userRecord.user, 
      lastLogin: new Date().toISOString() 
    };
    
    console.log('✅ Login bypass exitoso para:', user.name);
    
    return {
      success: true,
      user
    };
    
  } catch (error) {
    console.error('❌ Error en bypass login:', error);
    return {
      success: false,
      error: 'Error interno del sistema'
    };
  }
}

/**
 * Obtener todos los usuarios para administración
 */
export function getAllBypassUsers(): User[] {
  return Object.values(BYPASS_USERS).map(record => ({
    ...record.user,
    lastLogin: new Date().toISOString()
  }));
}

/**
 * Verificar si un email existe en el sistema bypass
 */
export function bypassUserExists(email: string): boolean {
  return email in BYPASS_USERS;
}

/**
 * Obtener usuario por email
 */
export function getBypassUser(email: string): User | null {
  const userRecord = BYPASS_USERS[email];
  return userRecord ? { ...userRecord.user, lastLogin: new Date().toISOString() } : null;
} 