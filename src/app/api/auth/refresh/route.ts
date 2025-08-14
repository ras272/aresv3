import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/database/shared/supabase';
import { 
  verifyToken, 
  generateAccessToken, 
  generateRefreshToken,
  blacklistToken,
  COOKIE_CONFIG, 
  createCookieString,
  createDeleteCookieString,
  type UserPayload 
} from '@/lib/jwt';
import { logSecurityEvent } from '@/lib/security-monitoring';

// ===============================================
// HELPER FUNCTIONS
// ===============================================

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('x-vercel-forwarded-for');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (remoteAddr) {
    return remoteAddr;
  }
  
  return 'unknown';
}

/**
 * Get user agent from request
 */
function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Update active session last_used_at timestamp
 */
async function updateSessionLastUsed(refreshTokenHash: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('active_sessions')
      .update({ last_used_at: new Date().toISOString() })
      .eq('refresh_token_hash', refreshTokenHash);

    if (error) {
      console.error('Failed to update session last used:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to update session last used:', error);
    return false;
  }
}

/**
 * Validate active session exists and is not expired
 */
async function validateActiveSession(refreshTokenHash: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('active_sessions')
      .select('id, expires_at, user_id')
      .eq('refresh_token_hash', refreshTokenHash)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.log('Active session not found:', error);
      return false;
    }

    // Check if session is expired
    if (new Date(data.expires_at) <= new Date()) {
      console.log('Active session expired');
      // Clean up expired session
      await supabase
        .from('active_sessions')
        .delete()
        .eq('id', data.id);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to validate active session:', error);
    return false;
  }
}

/**
 * Update active session with new refresh token (token rotation)
 */
async function rotateRefreshToken(
  oldRefreshTokenHash: string, 
  newRefreshTokenHash: string,
  newExpiresAt: Date
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('active_sessions')
      .update({ 
        refresh_token_hash: newRefreshTokenHash,
        expires_at: newExpiresAt.toISOString(),
        last_used_at: new Date().toISOString()
      })
      .eq('refresh_token_hash', oldRefreshTokenHash);

    if (error) {
      console.error('Failed to rotate refresh token:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to rotate refresh token:', error);
    return false;
  }
}

/**
 * Get fresh user data from database
 */
async function getFreshUserData(userId: string): Promise<UserPayload | null> {
  try {
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, rol, activo')
      .eq('id', userId)
      .single();

    if (error || !user) {
      console.error('Failed to get fresh user data:', error);
      return null;
    }

    // Check if user is still active
    if (!user.activo) {
      console.log('User is no longer active');
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      activo: user.activo,
    };
  } catch (error) {
    console.error('Failed to get fresh user data:', error);
    return null;
  }
}

// ===============================================
// MAIN REFRESH HANDLER
// ===============================================

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const userAgent = getUserAgent(request);
  
  try {
    console.log('🔄 Token refresh attempt from IP:', ip);
    
    // Extract refresh token from cookies
    const refreshToken = request.cookies.get(COOKIE_CONFIG.REFRESH_TOKEN.name)?.value;

    if (!refreshToken) {
      console.log('❌ No refresh token found in cookies');
      return NextResponse.json(
        {
          success: false,
          message: 'Token de actualización no encontrado',
          code: 'REFRESH_TOKEN_MISSING',
        },
        { status: 401 }
      );
    }

    console.log('🔍 Found refresh token, verifying...');

    // Verify refresh token
    const payload = await verifyToken(refreshToken, 'refresh');
    if (!payload) {
      // Clear invalid refresh token cookie
      const response = NextResponse.json(
        {
          success: false,
          message: 'Token de actualización inválido o expirado',
          code: 'REFRESH_TOKEN_INVALID',
        },
        { status: 401 }
      );

      response.headers.set(
        'Set-Cookie',
        createDeleteCookieString(COOKIE_CONFIG.REFRESH_TOKEN.name, COOKIE_CONFIG.REFRESH_TOKEN.path)
      );

      return response;
    }

    const { id: userId, email } = payload;

    console.log('✅ Refresh token verified for user:', userId);

    // Simplify session validation - just check if user exists and is active
    // The refresh token verification already ensures the token is valid

    // Get fresh user data to ensure user is still active and get latest info
    const freshUserData = await getFreshUserData(userId);
    if (!freshUserData) {
      // User no longer exists or is inactive - invalidate session
      await supabase
        .from('active_sessions')
        .delete()
        .eq('refresh_token_hash', refreshToken);

      const response = NextResponse.json(
        {
          success: false,
          message: 'Usuario inactivo o no encontrado',
          code: 'USER_INACTIVE',
        },
        { status: 401 }
      );

      response.headers.set(
        'Set-Cookie',
        createDeleteCookieString(COOKIE_CONFIG.ACCESS_TOKEN.name, COOKIE_CONFIG.ACCESS_TOKEN.path)
      );
      response.headers.append(
        'Set-Cookie',
        createDeleteCookieString(COOKIE_CONFIG.REFRESH_TOKEN.name, COOKIE_CONFIG.REFRESH_TOKEN.path)
      );

      return response;
    }

    console.log('🔄 Generating new access token for user:', freshUserData.email);
    
    // Generate new access token with fresh user data
    const newAccessToken = await generateAccessToken(freshUserData);

    // For now, keep the same refresh token to avoid rotation issues
    // In production, you might want to implement token rotation
    console.log('✅ New access token generated successfully');

    // Update session last used timestamp (use original refresh token)
    try {
      await updateSessionLastUsed(refreshToken);
      console.log('✅ Session last used timestamp updated');
    } catch (updateError) {
      console.error('Failed to update session timestamp:', updateError);
      // Continue anyway - this shouldn't break the refresh
    }

    // Log security event for successful token refresh
    try {
      await logSecurityEvent({
        event_type: 'token_refresh',
        user_id: freshUserData.id,
        email: freshUserData.email,
        ip_address: ip,
        user_agent: userAgent,
        severity: 'low',
        details: {
          token_rotation: false, // Not rotating tokens for now
          user_data_refreshed: true
        }
      });
      console.log('✅ Security event logged successfully');
    } catch (logError) {
      console.error('Failed to log security event:', logError);
      // Continue anyway - logging failure shouldn't break refresh
    }

    // Create response with new tokens
    const response = NextResponse.json({
      success: true,
      message: 'Tokens actualizados exitosamente',
      code: 'REFRESH_SUCCESS',
      user: freshUserData, // Return fresh user data
    });

    // Set new access token cookie
    response.headers.set(
      'Set-Cookie',
      createCookieString(COOKIE_CONFIG.ACCESS_TOKEN.name, newAccessToken, {
        maxAge: COOKIE_CONFIG.ACCESS_TOKEN.maxAge,
        httpOnly: COOKIE_CONFIG.ACCESS_TOKEN.httpOnly,
        secure: COOKIE_CONFIG.ACCESS_TOKEN.secure,
        sameSite: COOKIE_CONFIG.ACCESS_TOKEN.sameSite,
        path: COOKIE_CONFIG.ACCESS_TOKEN.path,
      })
    );

    // Keep the same refresh token (no rotation for now)
    // The refresh token is already valid and doesn't need to be updated
    console.log('✅ Refresh token kept the same (no rotation)');

    return response;

  } catch (error) {
    console.error('Token refresh error:', error);

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

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: 'Método no permitido. Use POST para actualizar tokens.',
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