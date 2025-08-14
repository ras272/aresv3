import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { NextRequest } from 'next/server';
import { isTokenBlacklisted, addTokenToBlacklist, measurePerformance } from './performance-optimization';

/**
 * User payload interface for JWT tokens
 */
export interface UserPayload {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  activo: boolean;
}

/**
 * Extended JWT payload with authentication metadata
 */
export interface AuthJWTPayload extends JWTPayload {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  activo: boolean;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
  iss: string;
}

/**
 * Cookie configuration constants for security
 */
export const COOKIE_CONFIG = {
  ACCESS_TOKEN: {
    name: process.env.SESSION_COOKIE_NAME || 'ares_session',
    maxAge: 15 * 60, // 15 minutes in seconds
    httpOnly: process.env.COOKIE_HTTP_ONLY !== 'false', // Default to true
    secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false', // Only secure in production
    sameSite: (process.env.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none') || 'lax', // Use 'lax' for better compatibility
    path: process.env.COOKIE_PATH || '/',
  },
  REFRESH_TOKEN: {
    name: process.env.REFRESH_COOKIE_NAME || 'ares_refresh',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    httpOnly: process.env.COOKIE_HTTP_ONLY !== 'false', // Default to true
    secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false', // Only secure in production
    sameSite: (process.env.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none') || 'lax', // Use 'lax' for better compatibility
    path: process.env.COOKIE_PATH || '/',
  }
} as const;

/**
 * JWT configuration constants
 */
const JWT_CONFIG = {
  ACCESS_SECRET: new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key'),
  REFRESH_SECRET: new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-key'),
  ISSUER: process.env.JWT_ISSUER || 'ares-paraguay-app',
  ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m',
  REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d',
} as const;

// Token blacklist is now handled by the performance optimization system

/**
 * Convert time string to seconds
 * @param timeStr - Time string like '15m', '7d', '1h'
 * @returns number - Time in seconds
 */
function parseTimeToSeconds(timeStr: string): number {
  const unit = timeStr.slice(-1);
  const value = parseInt(timeStr.slice(0, -1));
  
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 24 * 60 * 60;
    default: return 900; // Default 15 minutes
  }
}

/**
 * Generate an access token with 15-minute expiration
 * @param user - User payload to include in token
 * @returns Promise<string> - Signed JWT access token
 */
export async function generateAccessToken(user: UserPayload): Promise<string> {
  const expirationTime = parseTimeToSeconds(JWT_CONFIG.ACCESS_EXPIRES_IN);
  
  return await new SignJWT({
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    rol: user.rol,
    activo: user.activo,
    type: 'access'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_CONFIG.ISSUER)
    .setExpirationTime(Math.floor(Date.now() / 1000) + expirationTime)
    .sign(JWT_CONFIG.ACCESS_SECRET);
}

/**
 * Generate a refresh token with 7-day expiration
 * @param user - User payload to include in token
 * @returns Promise<string> - Signed JWT refresh token
 */
export async function generateRefreshToken(user: UserPayload): Promise<string> {
  const expirationTime = parseTimeToSeconds(JWT_CONFIG.REFRESH_EXPIRES_IN);
  
  return await new SignJWT({
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    rol: user.rol,
    activo: user.activo,
    type: 'refresh'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_CONFIG.ISSUER)
    .setExpirationTime(Math.floor(Date.now() / 1000) + expirationTime)
    .sign(JWT_CONFIG.REFRESH_SECRET);
}

/**
 * Verify a JWT token with signature and expiration validation
 * @param token - JWT token to verify
 * @param type - Token type ('access' | 'refresh')
 * @returns Promise<AuthJWTPayload | null> - Decoded payload or null if invalid
 */
export async function verifyToken(token: string, type: 'access' | 'refresh' = 'access'): Promise<AuthJWTPayload | null> {
  if (!token || typeof token !== 'string') {
    return null;
  }

  // Check if token is blacklisted (using performance-optimized blacklist)
  if (isTokenBlacklisted(token)) {
    return null;
  }

  try {
    const secret = type === 'access' ? JWT_CONFIG.ACCESS_SECRET : JWT_CONFIG.REFRESH_SECRET;
    
    const { payload } = await jwtVerify(token, secret, {
      issuer: JWT_CONFIG.ISSUER,
    });

    // Validate token type matches expected type
    if (payload.type !== type) {
      return null;
    }

    // Validate required fields
    if (!payload.id || !payload.email || !payload.nombre || !payload.rol) {
      return null;
    }

    return payload as AuthJWTPayload;
  } catch (error) {
    console.error(`Token verification failed for ${type} token:`, error);
    return null;
  }
}

/**
 * Extract and verify access token from request cookies or headers
 * @param request - Next.js request object
 * @returns Promise<UserPayload | null> - Current user or null if not authenticated
 */
export async function getCurrentUser(request: NextRequest): Promise<UserPayload | null> {
  try {
    // Try to get token from cookies first
    let token = request.cookies.get(COOKIE_CONFIG.ACCESS_TOKEN.name)?.value;
    
    // Fallback to Authorization header
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return null;
    }

    const payload = await verifyToken(token, 'access');
    if (!payload) {
      return null;
    }

    return {
      id: payload.id,
      email: payload.email,
      nombre: payload.nombre,
      rol: payload.rol,
      activo: payload.activo,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Add token to blacklist for secure logout
 * @param token - JWT token to blacklist
 */
export function blacklistToken(token: string): void {
  if (token && typeof token === 'string') {
    // Get token expiration time for efficient cleanup
    getTokenExpiration(token, 'access').then(exp => {
      if (exp) {
        addTokenToBlacklist(token, exp * 1000); // Convert to milliseconds
      }
    });
  }
}

// Cleanup is now handled by the performance optimization system

/**
 * Extract token from request without verification (for blacklisting during logout)
 * @param request - Next.js request object
 * @returns string | null - Raw token string or null
 */
export function extractTokenFromRequest(request: NextRequest): string | null {
  // Try cookies first
  let token = request.cookies.get(COOKIE_CONFIG.ACCESS_TOKEN.name)?.value;
  
  // Fallback to Authorization header
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  return token || null;
}

/**
 * Check if token is near expiration (within 5 minutes)
 * @param token - JWT token to check
 * @returns Promise<boolean> - True if token expires within 5 minutes
 */
export async function isTokenNearExpiration(token: string): Promise<boolean> {
  try {
    const payload = await verifyToken(token, 'access');
    if (!payload || !payload.exp) {
      return true; // Treat invalid tokens as expired
    }

    const now = Math.floor(Date.now() / 1000);
    const fiveMinutes = 5 * 60;
    
    return (payload.exp - now) <= fiveMinutes;
  } catch (error) {
    return true; // Treat errors as expired
  }
}

/**
 * Get token expiration time
 * @param token - JWT token
 * @param type - Token type
 * @returns Promise<number | null> - Expiration timestamp or null
 */
export async function getTokenExpiration(token: string, type: 'access' | 'refresh' = 'access'): Promise<number | null> {
  try {
    const payload = await verifyToken(token, type);
    return payload?.exp || null;
  } catch (error) {
    return null;
  }
}

/**
 * Create cookie string for setting HTTP cookies
 * @param name - Cookie name
 * @param value - Cookie value
 * @param options - Cookie options
 * @returns string - Cookie string for Set-Cookie header
 */
export function createCookieString(
  name: string, 
  value: string, 
  options: {
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    path?: string;
  } = {}
): string {
  let cookie = `${name}=${value}`;
  
  if (options.maxAge) {
    cookie += `; Max-Age=${options.maxAge}`;
  }
  
  if (options.httpOnly) {
    cookie += '; HttpOnly';
  }
  
  if (options.secure) {
    cookie += '; Secure';
  }
  
  if (options.sameSite) {
    cookie += `; SameSite=${options.sameSite}`;
  }
  
  if (options.path) {
    cookie += `; Path=${options.path}`;
  }
  
  return cookie;
}

/**
 * Create cookie deletion string
 * @param name - Cookie name to delete
 * @param path - Cookie path
 * @returns string - Cookie deletion string
 */
export function createDeleteCookieString(name: string, path: string = '/'): string {
  return `${name}=; Max-Age=0; Path=${path}; HttpOnly; Secure; SameSite=strict`;
}

/**
 * Validate user payload structure
 * @param payload - Payload to validate
 * @returns boolean - True if payload is valid
 */
export function isValidUserPayload(payload: any): payload is UserPayload {
  return (
    payload &&
    typeof payload === 'object' &&
    typeof payload.id === 'string' &&
    typeof payload.email === 'string' &&
    typeof payload.nombre === 'string' &&
    typeof payload.rol === 'string' &&
    typeof payload.activo === 'boolean'
  );
}