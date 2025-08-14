import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentUser,
  isTokenNearExpiration,
  extractTokenFromRequest,
} from "./src/lib/jwt";

/**
 * Route configuration for authentication middleware
 */
const ROUTE_CONFIG = {
  // Public routes that don't require authentication
  publicRoutes: [
    "/login",
    "/api/auth/login",
    "/api/auth/refresh",
    "/_next",
    "/favicon.ico",
    "/icon.png",
  ],

  // Protected routes that require authentication
  protectedRoutes: [
    "/equipos",
    "/inventario-tecnico",
    "/mercaderias",
    "/stock",
    "/remisiones",
    "/usuarios",
    "/clinicas",
    "/documentos",
    "/archivos",
    "/reportes",
    "/servtec",
    "/calendario",
    "/productos",
    "/admin",
    "/", // Dashboard/home page
  ],

  // Role-based route permissions
  rolePermissions: {
    // Super admin has access to everything
    super_admin: ["*"] as const,

    // Contabilidad role permissions
    contabilidad: [
      "/",
      "/documentos",
      "/archivos",
      "/clinicas",
      "/reportes",
    ] as const,

    // Tecnico role permissions
    tecnico: [
      "/",
      "/equipos",
      "/inventario-tecnico",
      "/calendario",
      "/servtec",
    ] as const,
  },
} as const;

/**
 * Check if a route is public (doesn't require authentication)
 */
function isPublicRoute(pathname: string): boolean {
  return ROUTE_CONFIG.publicRoutes.some((route) => {
    if (route.endsWith("*")) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return pathname === route || pathname.startsWith(route + "/");
  });
}

/**
 * Check if a route is protected (requires authentication)
 */
function isProtectedRoute(pathname: string): boolean {
  return ROUTE_CONFIG.protectedRoutes.some((route) => {
    if (route === "/") {
      return pathname === "/";
    }
    return pathname === route || pathname.startsWith(route + "/");
  });
}

/**
 * Check if user has permission to access a specific route
 */
function hasRoutePermission(userRole: string, pathname: string): boolean {
  const permissions =
    ROUTE_CONFIG.rolePermissions[
      userRole as keyof typeof ROUTE_CONFIG.rolePermissions
    ];

  if (!permissions) {
    return false;
  }

  // Super admin has access to everything
  if (userRole === "super_admin") {
    return true;
  }

  // Check if user has permission for this specific route
  return permissions.some((allowedRoute) => {
    if (allowedRoute === "/") {
      return pathname === "/";
    }
    return pathname === allowedRoute || pathname.startsWith(allowedRoute + "/");
  });
}

/**
 * Create redirect response to login page
 */
function createLoginRedirect(request: NextRequest): NextResponse {
  const loginUrl = new URL("/login", request.url);

  // Add redirect parameter to return to original page after login
  if (request.nextUrl.pathname !== "/") {
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
  }

  return NextResponse.redirect(loginUrl);
}

/**
 * Create forbidden response for insufficient permissions
 */
function createForbiddenResponse(): NextResponse {
  return new NextResponse(
    JSON.stringify({
      error: "Forbidden",
      message: "You do not have permission to access this resource",
      code: "INSUFFICIENT_PERMISSIONS",
    }),
    {
      status: 403,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Handle token refresh for near-expiry tokens
 */
async function handleTokenRefresh(
  request: NextRequest
): Promise<NextResponse | null> {
  const token = extractTokenFromRequest(request);

  if (!token) {
    return null;
  }

  try {
    const isNearExpiry = await isTokenNearExpiration(token);

    if (isNearExpiry) {
      // Create a response that triggers token refresh on the client
      const response = NextResponse.next();
      response.headers.set("X-Token-Refresh-Required", "true");
      return response;
    }
  } catch (error) {
    console.error("Error checking token expiration:", error);
  }

  return null;
}

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/_next/") ||
    (pathname.includes(".") && !pathname.startsWith("/api/"))
  ) {
    return NextResponse.next();
  }

  // Allow public routes without authentication
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // For protected routes, verify authentication
  if (isProtectedRoute(pathname)) {
    try {
      // Get current user from token
      const user = await getCurrentUser(request);

      if (!user) {
        console.log(`🔒 Unauthorized access attempt to ${pathname}`);
        return createLoginRedirect(request);
      }

      // Check if user is active
      if (!user.activo) {
        console.log(
          `🚫 Inactive user ${user.email} attempted to access ${pathname}`
        );
        return createLoginRedirect(request);
      }

      // Check role-based permissions
      if (!hasRoutePermission(user.rol, pathname)) {
        console.log(
          `🚫 User ${user.email} (${user.rol}) denied access to ${pathname}`
        );

        // For API routes, return JSON error
        if (pathname.startsWith("/api/")) {
          return createForbiddenResponse();
        }

        // For regular routes, redirect to dashboard with error
        const dashboardUrl = new URL("/", request.url);
        dashboardUrl.searchParams.set("error", "insufficient_permissions");
        return NextResponse.redirect(dashboardUrl);
      }

      // Check if token needs refresh
      const refreshResponse = await handleTokenRefresh(request);
      if (refreshResponse) {
        console.log(`🔄 Token refresh required for user ${user.email}`);
        return refreshResponse;
      }

      // User is authenticated and authorized
      console.log(
        `✅ Access granted to ${user.email} (${user.rol}) for ${pathname}`
      );

      // Add user info to headers for downstream use
      const response = NextResponse.next();
      response.headers.set("X-User-ID", user.id);
      response.headers.set("X-User-Email", user.email);
      response.headers.set("X-User-Role", user.rol);

      return response;
    } catch (error) {
      console.error("Middleware authentication error:", error);
      return createLoginRedirect(request);
    }
  }

  // For API routes not explicitly configured, check authentication
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/")) {
    try {
      const user = await getCurrentUser(request);

      if (!user || !user.activo) {
        return new NextResponse(
          JSON.stringify({
            error: "Unauthorized",
            message: "Authentication required",
            code: "AUTHENTICATION_REQUIRED",
          }),
          {
            status: 401,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Add user info to headers for API routes
      const response = NextResponse.next();
      response.headers.set("X-User-ID", user.id);
      response.headers.set("X-User-Email", user.email);
      response.headers.set("X-User-Role", user.rol);

      return response;
    } catch (error) {
      console.error("API middleware authentication error:", error);
      return new NextResponse(
        JSON.stringify({
          error: "Unauthorized",
          message: "Invalid or expired token",
          code: "TOKEN_INVALID",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  }

  // Default: allow the request to continue
  return NextResponse.next();
}

/**
 * Middleware configuration
 * Specify which routes this middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
