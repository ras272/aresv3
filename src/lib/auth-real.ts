import { supabase } from './database/shared/supabase';
import { User, UserRole } from '@/types/auth';
import { hashPassword, verifyPassword } from './crypto';

// ===============================================
// FUNCIONES PARA GESTIÓN DE USUARIOS REALES
// ===============================================

export async function getAllRealUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(usuario => ({
      id: usuario.id,
      name: usuario.nombre,
      email: usuario.email,
      role: usuario.rol as UserRole,
      isActive: usuario.activo,
      lastLogin: usuario.ultimo_acceso,
      createdAt: usuario.created_at
    }));
  } catch (error) {
    throw error;
  }
}

export async function createRealUser(userData: {
  nombre: string;
  email: string;
  rol: UserRole;
  password: string;
}): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    // Verificar si el email ya existe
    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('email')
      .eq('email', userData.email)
      .single();

    if (existingUser) {
      return { success: false, error: 'El email ya está registrado' };
    }

    // Crear usuario
    // Hash de la contraseña con bcrypt
    const passwordHash = await hashPassword(userData.password);
    
    const { data, error } = await supabase
      .from('usuarios')
      .insert({
        nombre: userData.nombre,
        email: userData.email,
        password_hash: passwordHash, // Password hasheada con bcrypt
        rol: userData.rol,
        activo: true
      })
      .select()
      .single();

    if (error) throw error;

    const user: User = {
      id: data.id,
      name: data.nombre,
      email: data.email,
      role: data.rol as UserRole,
      isActive: data.activo,
      lastLogin: data.ultimo_acceso,
      createdAt: data.created_at
    };

    return { success: true, user };
  } catch (error) {
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function updateRealUser(
  userId: string, 
  updates: {
    nombre?: string;
    email?: string;
    rol?: UserRole;
    activo?: boolean;
  }
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    // Verificar si el email ya existe (si se está actualizando)
    if (updates.email) {
      const { data: existingUser } = await supabase
        .from('usuarios')
        .select('id, email')
        .eq('email', updates.email)
        .neq('id', userId)
        .single();

      if (existingUser) {
        return { success: false, error: 'El email ya está registrado por otro usuario' };
      }
    }

    // Actualizar usuario
    const { data, error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    const user: User = {
      id: data.id,
      name: data.nombre,
      email: data.email,
      role: data.rol as UserRole,
      isActive: data.activo,
      lastLogin: data.ultimo_acceso,
      createdAt: data.created_at
    };

    return { success: true, user };
  } catch (error) {
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function deleteRealUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function authenticateUser(email: string, password: string): Promise<{
  success: boolean;
  user?: User;
  error?: string;
}> {
  try {
    // Obtenemos el usuario por email
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .eq('activo', true)
      .single();

    if (error || !data) {
      return { success: false, error: 'Email o contraseña incorrectos' };
    }

    // Verificamos la contraseña usando bcrypt
    const isValidPassword = await verifyPassword(password, data.password_hash);
    if (!isValidPassword) {
      return { success: false, error: 'Email o contraseña incorrectos' };
    }

    // Actualizar último acceso
    await supabase
      .from('usuarios')
      .update({ ultimo_acceso: new Date().toISOString() })
      .eq('id', data.id);

    const user: User = {
      id: data.id,
      name: data.nombre,
      email: data.email,
      role: data.rol as UserRole,
      isActive: data.activo,
      lastLogin: new Date().toISOString(),
      createdAt: data.created_at
    };

    return { success: true, user };
  } catch (error) {
    return { success: false, error: 'Error interno del servidor' };
  }
}