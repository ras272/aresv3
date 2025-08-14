import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/database/shared/supabase";
import { verifyPassword } from "@/lib/crypto";
import {
  generateAccessToken,
  generateRefreshToken,
  COOKIE_CONFIG,
  createCookieString,
} from "@/lib/jwt";
import {
  logSecurityEvent,
  logPerformanceMetric,
  monitorPerformance,
} from "@/lib/security-monitoring";
import type { UserPayload } from "@/lib/jwt";

// ===============================================
// VALIDATION SCHEMAS
// ===============================================

const loginSchema = z.object({
  email: z.string().email("Email inválido").toLowerCase(),
  password: z.string().min(1, "Contraseña requerida"),
  rememberMe: z.boolean().optional().default(false),
});

// ===============================================
// RATE LIMITING STORAGE
// ===============================================

// In-memory rate limiting (in production, use Redis)
const rateLimitStore = new Map<
  string,
  { attempts: number; resetTime: number }
>();
const accountLockStore = new Map<
  string,
  { attempts: number; lockedUntil: number }
>();

// ===============================================
// HELPER FUNCTIONS
// ===============================================

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const remoteAddr = request.headers.get("x-vercel-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (remoteAddr) {
    return remoteAddr;
  }

  return "unknown";
}

/**
 * Get user agent from request
 */
function getUserAgent(request: NextRequest): string {
  return request.headers.get("user-agent") || "unknown";
}

/**
 * Check rate limiting for IP address
 */
function checkRateLimit(ip: string): {
  allowed: boolean;
  remainingAttempts: number;
  resetTime: number;
} {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  const current = rateLimitStore.get(ip);

  if (!current || now > current.resetTime) {
    // Reset or initialize
    rateLimitStore.set(ip, { attempts: 1, resetTime: now + windowMs });
    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1,
      resetTime: now + windowMs,
    };
  }

  if (current.attempts >= maxAttempts) {
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: current.resetTime,
    };
  }

  // Increment attempts
  current.attempts++;
  rateLimitStore.set(ip, current);

  return {
    allowed: true,
    remainingAttempts: maxAttempts - current.attempts,
    resetTime: current.resetTime,
  };
}

/**
 * Check account lockout status
 */
function checkAccountLockout(email: string): {
  locked: boolean;
  lockedUntil: number;
  attempts: number;
} {
  const now = Date.now();
  const current = accountLockStore.get(email);

  if (!current) {
    return { locked: false, lockedUntil: 0, attempts: 0 };
  }

  if (now > current.lockedUntil) {
    // Lockout expired, reset
    accountLockStore.delete(email);
    return { locked: false, lockedUntil: 0, attempts: 0 };
  }

  return {
    locked: current.lockedUntil > now,
    lockedUntil: current.lockedUntil,
    attempts: current.attempts,
  };
}

/**
 * Increment failed login attempts for account
 */
function incrementFailedAttempts(email: string): {
  attempts: number;
  locked: boolean;
  lockedUntil: number;
} {
  const now = Date.now();
  const lockoutDuration = 30 * 60 * 1000; // 30 minutes
  const maxAttempts = 5;

  const current = accountLockStore.get(email) || {
    attempts: 0,
    lockedUntil: 0,
  };
  current.attempts++;

  if (current.attempts >= maxAttempts) {
    current.lockedUntil = now + lockoutDuration;
    accountLockStore.set(email, current);
    return {
      attempts: current.attempts,
      locked: true,
      lockedUntil: current.lockedUntil,
    };
  }

  accountLockStore.set(email, current);
  return { attempts: current.attempts, locked: false, lockedUntil: 0 };
}

/**
 * Reset failed attempts on successful login
 */
function resetFailedAttempts(email: string): void {
  accountLockStore.delete(email);
}

/**
 * Log login attempt to database
 */
async function logLoginAttempt(
  email: string,
  ip: string,
  userAgent: string,
  success: boolean,
  failureReason?: string
): Promise<void> {
  try {
    await supabase.rpc("log_login_attempt", {
      p_email: email,
      p_ip_address: ip,
      p_user_agent: userAgent,
      p_success: success,
      p_failure_reason: failureReason || null,
    });
  } catch (error) {
    console.error("Failed to log login attempt:", error);
    // Don't throw - logging failure shouldn't break login
  }
}

/**
 * Create active session in database
 */
async function createActiveSession(
  userId: string,
  refreshTokenHash: string,
  expiresAt: Date,
  ip: string,
  userAgent: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc("create_active_session", {
      p_user_id: userId,
      p_refresh_token_hash: refreshTokenHash,
      p_expires_at: expiresAt.toISOString(),
      p_ip_address: ip,
      p_user_agent: userAgent,
    });

    if (error) {
      console.error("Failed to create active session:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Failed to create active session:", error);
    return null;
  }
}

// ===============================================
// MAIN LOGIN HANDLER
// ===============================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const ip = getClientIP(request);
  const userAgent = getUserAgent(request);
  let success = false;
  let email = "";

  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = loginSchema.parse(body);
    email = validatedData.email;
    const { password, rememberMe } = validatedData;

    // Check rate limiting
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      await logLoginAttempt(email, ip, userAgent, false, "Rate limited");

      const resetTimeMinutes = Math.ceil(
        (rateLimit.resetTime - Date.now()) / (1000 * 60)
      );
      return NextResponse.json(
        {
          success: false,
          message: `Demasiados intentos fallidos. Intente nuevamente en ${resetTimeMinutes} minutos.`,
          code: "RATE_LIMITED",
          resetTime: rateLimit.resetTime,
        },
        { status: 429 }
      );
    }

    // Check account lockout
    const lockoutStatus = checkAccountLockout(email);
    if (lockoutStatus.locked) {
      await logLoginAttempt(email, ip, userAgent, false, "Account locked");

      const lockoutMinutes = Math.ceil(
        (lockoutStatus.lockedUntil - Date.now()) / (1000 * 60)
      );
      return NextResponse.json(
        {
          success: false,
          message: `Cuenta bloqueada por múltiples intentos fallidos. Intente nuevamente en ${lockoutMinutes} minutos.`,
          code: "ACCOUNT_LOCKED",
          lockedUntil: lockoutStatus.lockedUntil,
          attempts: lockoutStatus.attempts,
        },
        { status: 423 }
      );
    }

    // Get user from database
    console.log("🔍 Looking for user with email:", email);
    const { data: user, error: userError } = await supabase
      .from("usuarios")
      .select(
        "id, nombre, email, password_hash, rol, activo, login_attempts, locked_until"
      )
      .eq("email", email)
      .single();

    console.log("👤 User query result:", {
      user: user
        ? { email: user.email, rol: user.rol, activo: user.activo }
        : null,
      error: userError,
    });

    if (userError || !user) {
      console.log("❌ User not found or error:", userError);
      await logLoginAttempt(email, ip, userAgent, false, "User not found");
      incrementFailedAttempts(email);

      return NextResponse.json(
        {
          success: false,
          message: "Credenciales inválidas",
          code: "INVALID_CREDENTIALS",
        },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.activo) {
      await logLoginAttempt(email, ip, userAgent, false, "User inactive");

      return NextResponse.json(
        {
          success: false,
          message: "Usuario inactivo. Contacte al administrador.",
          code: "USER_INACTIVE",
        },
        { status: 401 }
      );
    }

    // Check database-level account lockout
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      await logLoginAttempt(
        email,
        ip,
        userAgent,
        false,
        "Account locked in database"
      );

      const lockoutMinutes = Math.ceil(
        (new Date(user.locked_until).getTime() - Date.now()) / (1000 * 60)
      );
      return NextResponse.json(
        {
          success: false,
          message: `Cuenta bloqueada. Intente nuevamente en ${lockoutMinutes} minutos.`,
          code: "ACCOUNT_LOCKED",
          lockedUntil: new Date(user.locked_until).getTime(),
        },
        { status: 423 }
      );
    }

    // Verify password
    console.log("🔐 Verifying password for user:", user.email);
    console.log(
      "🔐 Password hash preview:",
      user.password_hash.substring(0, 20) + "..."
    );
    const passwordValid = await verifyPassword(password, user.password_hash);
    console.log("🔐 Password verification result:", passwordValid);

    if (!passwordValid) {
      await logLoginAttempt(email, ip, userAgent, false, "Invalid password");

      // Increment failed attempts both in memory and database
      const failedAttempts = incrementFailedAttempts(email);

      // Update database with failed attempts
      try {
        await supabase.rpc("increment_failed_login_attempts", {
          p_email: email,
        });
      } catch (dbError) {
        console.error("Failed to update database login attempts:", dbError);
      }

      let message = "Credenciales inválidas";
      if (failedAttempts.locked) {
        message = `Cuenta bloqueada por múltiples intentos fallidos. Intente nuevamente en 30 minutos.`;
      } else {
        const remainingAttempts = 5 - failedAttempts.attempts;
        if (remainingAttempts <= 2) {
          message = `Credenciales inválidas. ${remainingAttempts} intentos restantes antes del bloqueo.`;
        }
      }

      return NextResponse.json(
        {
          success: false,
          message,
          code: failedAttempts.locked
            ? "ACCOUNT_LOCKED"
            : "INVALID_CREDENTIALS",
          remainingAttempts: Math.max(0, 5 - failedAttempts.attempts),
          lockedUntil: failedAttempts.locked
            ? failedAttempts.lockedUntil
            : undefined,
        },
        { status: failedAttempts.locked ? 423 : 401 }
      );
    }

    // Login successful - reset failed attempts
    resetFailedAttempts(email);

    // Create user payload for JWT
    const userPayload: UserPayload = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      activo: user.activo,
    };

    console.log("✅ Login successful, creating JWT tokens for user:", {
      id: userPayload.id,
      email: userPayload.email,
      nombre: userPayload.nombre,
      rol: userPayload.rol,
    });

    // Generate JWT tokens
    const accessToken = await generateAccessToken(userPayload);
    const refreshToken = await generateRefreshToken(userPayload);

    console.log("🔑 JWT tokens generated successfully");
    console.log(
      "🔑 Access token preview:",
      accessToken.substring(0, 50) + "..."
    );
    console.log(
      "🔑 Refresh token preview:",
      refreshToken.substring(0, 50) + "..."
    );

    // Create active session
    const refreshTokenExpiry = new Date(
      Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000
    );
    const sessionId = await createActiveSession(
      user.id,
      refreshToken, // In production, hash this token
      refreshTokenExpiry,
      ip,
      userAgent
    );

    if (!sessionId) {
      console.error("Failed to create active session");
      // Continue anyway - session tracking failure shouldn't break login
    }

    // Log successful login
    await logLoginAttempt(email, ip, userAgent, true);

    // Log security event for successful login
    await logSecurityEvent({
      event_type: "login_success",
      user_id: user.id,
      email: user.email,
      ip_address: ip,
      user_agent: userAgent,
      severity: "low",
      details: {
        remember_me: rememberMe,
        session_id: sessionId,
      },
    });

    success = true;

    // Create response with cookies
    const response = NextResponse.json({
      success: true,
      message: "Login exitoso",
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        activo: user.activo,
      },
    });

    // Set access token cookie
    const accessTokenMaxAge = rememberMe
      ? 30 * 24 * 60 * 60
      : COOKIE_CONFIG.ACCESS_TOKEN.maxAge;

    const accessCookieString = createCookieString(
      COOKIE_CONFIG.ACCESS_TOKEN.name,
      accessToken,
      {
        maxAge: accessTokenMaxAge,
        httpOnly: COOKIE_CONFIG.ACCESS_TOKEN.httpOnly,
        secure: COOKIE_CONFIG.ACCESS_TOKEN.secure,
        sameSite: COOKIE_CONFIG.ACCESS_TOKEN.sameSite,
        path: COOKIE_CONFIG.ACCESS_TOKEN.path,
      }
    );

    console.log("🍪 Setting access token cookie:", {
      name: COOKIE_CONFIG.ACCESS_TOKEN.name,
      maxAge: accessTokenMaxAge,
      httpOnly: COOKIE_CONFIG.ACCESS_TOKEN.httpOnly,
      secure: COOKIE_CONFIG.ACCESS_TOKEN.secure,
      sameSite: COOKIE_CONFIG.ACCESS_TOKEN.sameSite,
      path: COOKIE_CONFIG.ACCESS_TOKEN.path,
      cookieString: accessCookieString,
    });

    response.headers.set("Set-Cookie", accessCookieString);

    // Set refresh token cookie
    const refreshTokenMaxAge = rememberMe
      ? 30 * 24 * 60 * 60
      : COOKIE_CONFIG.REFRESH_TOKEN.maxAge;

    const refreshCookieString = createCookieString(
      COOKIE_CONFIG.REFRESH_TOKEN.name,
      refreshToken,
      {
        maxAge: refreshTokenMaxAge,
        httpOnly: COOKIE_CONFIG.REFRESH_TOKEN.httpOnly,
        secure: COOKIE_CONFIG.REFRESH_TOKEN.secure,
        sameSite: COOKIE_CONFIG.REFRESH_TOKEN.sameSite,
        path: COOKIE_CONFIG.REFRESH_TOKEN.path,
      }
    );

    console.log("🍪 Setting refresh token cookie:", {
      name: COOKIE_CONFIG.REFRESH_TOKEN.name,
      maxAge: refreshTokenMaxAge,
      httpOnly: COOKIE_CONFIG.REFRESH_TOKEN.httpOnly,
      secure: COOKIE_CONFIG.REFRESH_TOKEN.secure,
      sameSite: COOKIE_CONFIG.REFRESH_TOKEN.sameSite,
      path: COOKIE_CONFIG.REFRESH_TOKEN.path,
      cookieString: refreshCookieString,
    });

    response.headers.append("Set-Cookie", refreshCookieString);

    console.log("✅ Login response ready with cookies set");
    return response;
  } catch (error) {
    console.error("Login error:", error);

    // Log the failed attempt if we have the email
    try {
      const body = await request.json();
      if (body.email) {
        await logLoginAttempt(body.email, ip, userAgent, false, "Server error");

        // Log security event for server error
        await logSecurityEvent({
          event_type: "login_failure",
          email: body.email,
          ip_address: ip,
          user_agent: userAgent,
          severity: "medium",
          details: {
            error: error instanceof Error ? error.message : "Unknown error",
            failure_reason: "Server error",
          },
        });
      }
    } catch {
      // Ignore parsing errors for logging
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Datos de entrada inválidos",
          code: "VALIDATION_ERROR",
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  } finally {
    // Log performance metrics
    const duration = Date.now() - startTime;
    logPerformanceMetric({
      operation: "login",
      duration_ms: duration,
      success,
      metadata: email ? { user_email: email } : undefined,
    });
  }
}

// ===============================================
// HANDLE OTHER HTTP METHODS
// ===============================================

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: "Método no permitido",
      code: "METHOD_NOT_ALLOWED",
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      message: "Método no permitido",
      code: "METHOD_NOT_ALLOWED",
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      message: "Método no permitido",
      code: "METHOD_NOT_ALLOWED",
    },
    { status: 405 }
  );
}
