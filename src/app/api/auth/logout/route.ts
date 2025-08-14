import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/database/shared/supabase';
import { 
  extractTokenFromRequest, 
  blacklistToken, 
  COOKIE_CONFIG, 
  createDeleteCookieString,
  verifyToken 
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
 * Log logout event to database
 */
async function logLogoutEvent(
  email: string,
  ip: string,
  userAgent: string,
  success: boolean,
  reason?: string
): Promise<void> {
  try {
    await supabase.rpc('log_login_attempt', {
      p_email: email,
      p_ip_address: ip,
      p_user_agent: userAgent,
      p_success: success,
      p_failure_reason: reason ? `LOGOUT: ${reason}` : 'LOGOUT: Success',
    });
  } catch (error) {
    console.error('Failed to log logout event:', error);
    // Don't throw - logging failure shouldn't break logout
  }
}

/**
 * Remove active session from database
 */
async function removeActiveSession(refreshToken: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('active_sessions')
      .delete()
      .eq('refresh_token_hash', refreshToken);

    if (error) {
      console.error('Failed to remove active session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to remove active session:', error);
    return false;
  }
}

/**
 * Remove all active sessions for a user
 */
async function removeAllUserSessions(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('active_sessions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to remove all user sessions:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to remove all user sessions:', error);
    return false;
  }
}

/**
 * Clear refresh token from user record
 */
async function clearUserRefreshToken(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('usuarios')
      .update({ refresh_token: null, token_expires_at: null })
      .eq('id', userId);

    if (error) {
      console.error('Failed to clear user refresh token:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to clear user refresh token:', error);
    return false;
  }
}

// ===============================================
// MAIN LOGOUT HANDLER
// ===============================================

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const userAgent = getUserAgent(request);
  
  try {
    // Extract tokens from request
    const accessToken = request.cookies.get(COOKIE_CONFIG.ACCESS_TOKEN.name)?.value;
    const refreshToken = request.cookies.get(COOKIE_CONFIG.REFRESH_TOKEN.name)?.value;

    let userEmail = 'unknown';
    let userId: string | null = null;
    let logoutSuccess = true;
    let logoutReason = '';

    // If we have an access token, try to get user info for logging
    if (accessToken) {
      try {
        const payload = await verifyToken(accessToken, 'access');
        if (payload) {
          userEmail = payload.email;
          userId = payload.id;
        }
      } catch (error) {
        console.log('Access token verification failed during logout (expected if expired):', error);
        logoutReason = 'Access token invalid/expired';
      }
    }

    // If no access token but we have refresh token, try to get user info from it
    if (!userId && refreshToken) {
      try {
        const payload = await verifyToken(refreshToken, 'refresh');
        if (payload) {
          userEmail = payload.email;
          userId = payload.id;
        }
      } catch (error) {
        console.log('Refresh token verification failed during logout:', error);
        logoutReason = 'Refresh token invalid/expired';
      }
    }

    // Handle case where no valid tokens are present
    if (!accessToken && !refreshToken) {
      await logLogoutEvent(userEmail, ip, userAgent, false, 'No tokens present');
      
      // Still return success and clear cookies in case they exist client-side
      const response = NextResponse.json({
        success: true,
        message: 'Logout exitoso (no había sesión activa)',
        code: 'NO_ACTIVE_SESSION',
      });

      // Clear cookies anyway
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

    // Blacklist the access token if present
    if (accessToken) {
      blacklistToken(accessToken);
    }

    // Blacklist the refresh token if present
    if (refreshToken) {
      blacklistToken(refreshToken);
    }

    // Remove active session from database
    if (refreshToken) {
      const sessionRemoved = await removeActiveSession(refreshToken);
      if (!sessionRemoved) {
        logoutSuccess = false;
        logoutReason += ' Failed to remove session from database.';
      }
    }

    // Clear refresh token from user record
    if (userId) {
      const tokenCleared = await clearUserRefreshToken(userId);
      if (!tokenCleared) {
        logoutSuccess = false;
        logoutReason += ' Failed to clear user refresh token.';
      }
    }

    // Log logout event
    await logLogoutEvent(
      userEmail, 
      ip, 
      userAgent, 
      logoutSuccess, 
      logoutReason || 'Success'
    );

    // Log security event for logout
    try {
      await logSecurityEvent({
        event_type: 'logout',
        user_id: userId || undefined,
        email: userEmail !== 'unknown' ? userEmail : undefined,
        ip_address: ip,
        user_agent: userAgent,
        severity: 'low',
        details: {
          success: logoutSuccess,
          reason: logoutReason || 'Success',
          tokens_present: {
            access_token: !!accessToken,
            refresh_token: !!refreshToken
          }
        }
      });
    } catch (logError) {
      console.error('Failed to log security event:', logError);
      // Continue anyway - logging failure shouldn't break logout
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logout exitoso',
      code: 'LOGOUT_SUCCESS',
    });

    // Clear cookies
    response.headers.set(
      'Set-Cookie',
      createDeleteCookieString(COOKIE_CONFIG.ACCESS_TOKEN.name, COOKIE_CONFIG.ACCESS_TOKEN.path)
    );
    response.headers.append(
      'Set-Cookie',
      createDeleteCookieString(COOKIE_CONFIG.REFRESH_TOKEN.name, COOKIE_CONFIG.REFRESH_TOKEN.path)
    );

    return response;

  } catch (error) {
    console.error('Logout error:', error);

    // Log the failed logout attempt
    await logLogoutEvent('unknown', ip, userAgent, false, `Server error: ${error}`);

    // Even on error, we should clear cookies and return success
    // because the user wants to logout regardless of server issues
    const response = NextResponse.json({
      success: true,
      message: 'Logout completado (con advertencias)',
      code: 'LOGOUT_WITH_WARNINGS',
      warning: 'Algunas operaciones de limpieza fallaron, pero la sesión local fue cerrada',
    });

    // Clear cookies
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
}

// ===============================================
// LOGOUT ALL SESSIONS HANDLER (Optional)
// ===============================================

/**
 * Special endpoint to logout from all devices/sessions
 * This can be called as POST /api/auth/logout?all=true
 */
export async function DELETE(request: NextRequest) {
  const ip = getClientIP(request);
  const userAgent = getUserAgent(request);
  
  try {
    // Extract access token to get user info
    const accessToken = request.cookies.get(COOKIE_CONFIG.ACCESS_TOKEN.name)?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'No hay sesión activa para cerrar',
          code: 'NO_ACTIVE_SESSION',
        },
        { status: 401 }
      );
    }

    // Verify token and get user info
    const payload = await verifyToken(accessToken, 'access');
    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          message: 'Token inválido',
          code: 'INVALID_TOKEN',
        },
        { status: 401 }
      );
    }

    const { email, id: userId } = payload;

    // Blacklist current tokens
    blacklistToken(accessToken);
    const refreshToken = request.cookies.get(COOKIE_CONFIG.REFRESH_TOKEN.name)?.value;
    if (refreshToken) {
      blacklistToken(refreshToken);
    }

    // Remove all active sessions for this user
    const allSessionsRemoved = await removeAllUserSessions(userId);
    
    // Clear refresh token from user record
    const tokenCleared = await clearUserRefreshToken(userId);

    // Log logout all event
    await logLogoutEvent(
      email, 
      ip, 
      userAgent, 
      allSessionsRemoved && tokenCleared, 
      'LOGOUT_ALL_SESSIONS'
    );

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logout exitoso de todos los dispositivos',
      code: 'LOGOUT_ALL_SUCCESS',
    });

    // Clear cookies
    response.headers.set(
      'Set-Cookie',
      createDeleteCookieString(COOKIE_CONFIG.ACCESS_TOKEN.name, COOKIE_CONFIG.ACCESS_TOKEN.path)
    );
    response.headers.append(
      'Set-Cookie',
      createDeleteCookieString(COOKIE_CONFIG.REFRESH_TOKEN.name, COOKIE_CONFIG.REFRESH_TOKEN.path)
    );

    return response;

  } catch (error) {
    console.error('Logout all error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Error al cerrar todas las sesiones',
        code: 'LOGOUT_ALL_ERROR',
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
      message: 'Método no permitido. Use POST para logout normal o DELETE para logout de todos los dispositivos.',
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