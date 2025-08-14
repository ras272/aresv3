import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/database/shared/supabase';
import { getCurrentUser, verifyToken, COOKIE_CONFIG } from '@/lib/jwt';
import { ROLE_PERMISSIONS, hasPermission, hasRole, type UserRole } from '@/types/auth';

// ===============================================
// HELPER FUNCTIONS
// ===============================================

/**
 * Get detailed user information from database
 */
async function getDetailedUserInfo(userId: string) {
  try {
    const { data: user, error } = await supabase
      .from('usuarios')
      .select(`
        id,
        nombre,
        email,
        rol,
        activo,
        last_login,
        created_at,
        updated_at,
        login_attempts,
        locked_until
      `)
      .eq('id', userId)
      .single();

    if (error || !user) {
      console.error('Failed to get detailed user info:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Failed to get detailed user info:', error);
    return null;
  }
}

/**
 * Get user's active sessions count
 */
async function getUserActiveSessionsCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('active_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Failed to get active sessions count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Failed to get active sessions count:', error);
    return 0;
  }
}

/**
 * Get user permissions based on role
 */
function getUserPermissions(role: UserRole) {
  const roleConfig = ROLE_PERMISSIONS[role];
  if (!roleConfig) {
    return {
      permissions: [],
      label: 'Desconocido',
      description: 'Rol no reconocido'
    };
  }

  return {
    permissions: roleConfig.permissions,
    label: roleConfig.label,
    description: roleConfig.description
  };
}

/**
 * Check if user account is locked
 */
function isAccountLocked(lockedUntil: string | null): boolean {
  if (!lockedUntil) return false;
  return new Date(lockedUntil) > new Date();
}

// ===============================================
// MAIN USER INFO HANDLER
// ===============================================

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 /api/auth/me: Starting user info request');
    
    // Extract and verify access token
    const currentUser = await getCurrentUser(request);
    
    console.log('🔍 /api/auth/me: getCurrentUser result:', currentUser ? {
      id: currentUser.id,
      email: currentUser.email,
      nombre: currentUser.nombre,
      rol: currentUser.rol
    } : null);
    
    if (!currentUser) {
      console.log('❌ /api/auth/me: No current user found');
      return NextResponse.json(
        {
          success: false,
          message: 'Token de acceso inválido o expirado',
          code: 'INVALID_TOKEN',
        },
        { status: 401 }
      );
    }

    // Get detailed user information from database
    const detailedUser = await getDetailedUserInfo(currentUser.id);
    
    if (!detailedUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'Usuario no encontrado',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Check if user is still active
    if (!detailedUser.activo) {
      return NextResponse.json(
        {
          success: false,
          message: 'Usuario inactivo',
          code: 'USER_INACTIVE',
        },
        { status: 401 }
      );
    }

    // Check if account is locked
    const accountLocked = isAccountLocked(detailedUser.locked_until);
    if (accountLocked) {
      const lockoutMinutes = Math.ceil((new Date(detailedUser.locked_until).getTime() - Date.now()) / (1000 * 60));
      return NextResponse.json(
        {
          success: false,
          message: `Cuenta bloqueada. Intente nuevamente en ${lockoutMinutes} minutos.`,
          code: 'ACCOUNT_LOCKED',
          lockedUntil: new Date(detailedUser.locked_until).getTime(),
        },
        { status: 423 }
      );
    }

    // Get user permissions and role information
    const roleInfo = getUserPermissions(detailedUser.rol as UserRole);
    
    // Get active sessions count
    const activeSessionsCount = await getUserActiveSessionsCount(currentUser.id);

    // Prepare sanitized user response
    const userResponse = {
      id: detailedUser.id,
      nombre: detailedUser.nombre,
      email: detailedUser.email,
      rol: detailedUser.rol,
      activo: detailedUser.activo,
      lastLogin: detailedUser.last_login,
      createdAt: detailedUser.created_at,
      updatedAt: detailedUser.updated_at,
      
      // Security information
      loginAttempts: detailedUser.login_attempts,
      isLocked: accountLocked,
      lockedUntil: detailedUser.locked_until,
      
      // Session information
      activeSessionsCount,
      
      // Role and permissions information
      roleInfo: {
        label: roleInfo.label,
        description: roleInfo.description,
        permissions: roleInfo.permissions,
      },
      
      // Helper methods for frontend
      hasPermission: (permission: string) => hasPermission(detailedUser.rol as UserRole, permission),
      hasRole: (roles: UserRole[]) => hasRole(detailedUser.rol as UserRole, roles),
    };

    return NextResponse.json({
      success: true,
      message: 'Información de usuario obtenida exitosamente',
      user: userResponse,
    });

  } catch (error) {
    console.error('Get user info error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

// ===============================================
// UPDATE USER INFO HANDLER (Optional)
// ===============================================

export async function PATCH(request: NextRequest) {
  try {
    // Extract and verify access token
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'Token de acceso inválido o expirado',
          code: 'INVALID_TOKEN',
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const allowedUpdates = ['nombre']; // Only allow updating name for now
    
    const updates: any = {};
    for (const field of allowedUpdates) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No hay campos válidos para actualizar',
          code: 'NO_VALID_FIELDS',
        },
        { status: 400 }
      );
    }

    // Update user in database
    const { data: updatedUser, error } = await supabase
      .from('usuarios')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentUser.id)
      .select('id, nombre, email, rol, activo, updated_at')
      .single();

    if (error || !updatedUser) {
      console.error('Failed to update user:', error);
      return NextResponse.json(
        {
          success: false,
          message: 'Error al actualizar usuario',
          code: 'UPDATE_FAILED',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      user: {
        id: updatedUser.id,
        nombre: updatedUser.nombre,
        email: updatedUser.email,
        rol: updatedUser.rol,
        activo: updatedUser.activo,
        updatedAt: updatedUser.updated_at,
      },
    });

  } catch (error) {
    console.error('Update user info error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

// ===============================================
// HANDLE OTHER HTTP METHODS
// ===============================================

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: 'Método no permitido. Use GET para obtener información del usuario o PATCH para actualizarla.',
      code: 'METHOD_NOT_ALLOWED',
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      message: 'Método no permitido',
      code: 'METHOD_NOT_ALLOWED',
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      message: 'Método no permitido',
      code: 'METHOD_NOT_ALLOWED',
    },
    { status: 405 }
  );
}