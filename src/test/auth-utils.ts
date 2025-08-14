import { vi } from 'vitest';
import type { UserPayload } from '@/lib/jwt';

/**
 * Mock user data for testing
 */
export const mockUsers = {
  admin: {
    id: 'admin-user-id-123',
    email: 'admin@aresparaguay.com',
    nombre: 'Admin User',
    rol: 'admin',
    activo: true,
  } as UserPayload,
  
  gerente: {
    id: 'gerente-user-id-456',
    email: 'gerente@aresparaguay.com',
    nombre: 'Gerente User',
    rol: 'gerente',
    activo: true,
  } as UserPayload,
  
  tecnico: {
    id: 'tecnico-user-id-789',
    email: 'tecnico@aresparaguay.com',
    nombre: 'Técnico User',
    rol: 'tecnico',
    activo: true,
  } as UserPayload,
  
  inactive: {
    id: 'inactive-user-id-000',
    email: 'inactive@aresparaguay.com',
    nombre: 'Inactive User',
    rol: 'tecnico',
    activo: false,
  } as UserPayload,
};

/**
 * Mock passwords for testing (plain text for testing purposes)
 */
export const mockPasswords = {
  valid: 'ValidPassword123!',
  weak: 'weak',
  common: 'password123',
  empty: '',
  long: 'ThisIsAVeryLongPasswordThatShouldPassAllValidationChecks123!@#',
};

/**
 * Mock environment variables for testing
 */
export const mockEnvVars = {
  JWT_SECRET: 'test-jwt-secret-key-for-access-tokens-must-be-very-long-and-secure',
  JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-key-for-refresh-tokens-must-be-very-long-and-secure',
  JWT_ISSUER: 'test-ares-app',
  JWT_ACCESS_TOKEN_EXPIRES_IN: '15m',
  JWT_REFRESH_TOKEN_EXPIRES_IN: '7d',
  SESSION_COOKIE_NAME: 'test_session',
  REFRESH_COOKIE_NAME: 'test_refresh',
  COOKIE_HTTP_ONLY: 'true',
  COOKIE_SECURE: 'true',
  COOKIE_SAME_SITE: 'strict',
  COOKIE_PATH: '/',
};

/**
 * Mock IP addresses for testing
 */
export const mockIPs = {
  valid: '192.168.1.100',
  localhost: '127.0.0.1',
  public: '203.0.113.1',
  invalid: 'invalid-ip',
  empty: '',
};

/**
 * Mock User Agents for testing
 */
export const mockUserAgents = {
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
  mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  empty: '',
};

/**
 * Setup mock environment variables
 */
export function setupMockEnv() {
  Object.entries(mockEnvVars).forEach(([key, value]) => {
    vi.stubEnv(key, value);
  });
}

/**
 * Cleanup mock environment variables
 */
export function cleanupMockEnv() {
  vi.unstubAllEnvs();
}

/**
 * Create a mock NextRequest for testing
 */
export function createMockRequest(options: {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  body?: any;
} = {}) {
  const {
    url = 'http://localhost:3000/test',
    method = 'GET',
    headers = {},
    cookies = {},
    body = null,
  } = options;

  // Convert cookies to cookie header
  const cookieHeader = Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');

  if (cookieHeader) {
    headers.cookie = cookieHeader;
  }

  const requestInit: RequestInit = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    requestInit.body = typeof body === 'string' ? body : JSON.stringify(body);
    if (!headers['content-type']) {
      headers['content-type'] = 'application/json';
    }
  }

  return new Request(url, requestInit) as any; // Cast to NextRequest-like object
}

/**
 * Mock Supabase client for testing
 */
export function createMockSupabase() {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
  };
}

/**
 * Mock database responses for testing
 */
export const mockDatabaseResponses = {
  userFound: {
    data: {
      id: mockUsers.admin.id,
      nombre: mockUsers.admin.nombre,
      email: mockUsers.admin.email,
      password: '$2a$12$hashedPasswordExample', // Mock bcrypt hash
      rol: mockUsers.admin.rol,
      activo: mockUsers.admin.activo,
      login_attempts: 0,
      locked_until: null,
    },
    error: null,
  },
  
  userNotFound: {
    data: null,
    error: { message: 'User not found' },
  },
  
  userInactive: {
    data: {
      ...mockDatabaseResponses.userFound.data,
      activo: false,
    },
    error: null,
  },
  
  userLocked: {
    data: {
      ...mockDatabaseResponses.userFound.data,
      login_attempts: 5,
      locked_until: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
    },
    error: null,
  },
};

/**
 * Create mock login attempt data
 */
export function createMockLoginAttempt(options: {
  email?: string;
  ip?: string;
  userAgent?: string;
  success?: boolean;
  failureReason?: string;
} = {}) {
  return {
    email: options.email || mockUsers.admin.email,
    ip: options.ip || mockIPs.valid,
    userAgent: options.userAgent || mockUserAgents.chrome,
    success: options.success ?? false,
    failureReason: options.failureReason || 'Invalid credentials',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create mock active session data
 */
export function createMockActiveSession(options: {
  userId?: string;
  ip?: string;
  userAgent?: string;
  expiresAt?: Date;
} = {}) {
  return {
    id: 'session-id-123',
    userId: options.userId || mockUsers.admin.id,
    refreshTokenHash: 'mock-refresh-token-hash',
    ip: options.ip || mockIPs.valid,
    userAgent: options.userAgent || mockUserAgents.chrome,
    createdAt: new Date().toISOString(),
    expiresAt: (options.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).toISOString(),
    lastUsedAt: new Date().toISOString(),
  };
}

/**
 * Mock time utilities for testing time-based functionality
 */
export class MockTimeUtils {
  private originalDateNow: typeof Date.now;
  private mockTime: number;

  constructor(initialTime?: number) {
    this.originalDateNow = Date.now;
    this.mockTime = initialTime || Date.now();
  }

  /**
   * Set the current mock time
   */
  setTime(time: number) {
    this.mockTime = time;
    vi.spyOn(Date, 'now').mockReturnValue(this.mockTime);
  }

  /**
   * Advance time by specified milliseconds
   */
  advanceTime(ms: number) {
    this.mockTime += ms;
    vi.spyOn(Date, 'now').mockReturnValue(this.mockTime);
  }

  /**
   * Advance time by minutes
   */
  advanceMinutes(minutes: number) {
    this.advanceTime(minutes * 60 * 1000);
  }

  /**
   * Advance time by hours
   */
  advanceHours(hours: number) {
    this.advanceTime(hours * 60 * 60 * 1000);
  }

  /**
   * Advance time by days
   */
  advanceDays(days: number) {
    this.advanceTime(days * 24 * 60 * 60 * 1000);
  }

  /**
   * Get current mock time
   */
  getCurrentTime() {
    return this.mockTime;
  }

  /**
   * Restore original Date.now
   */
  restore() {
    vi.restoreAllMocks();
  }
}

/**
 * Create a mock time utility instance
 */
export function createMockTimeUtils(initialTime?: number) {
  return new MockTimeUtils(initialTime);
}

/**
 * Assertion helpers for authentication tests
 */
export const authAssertions = {
  /**
   * Assert that a JWT token has the expected structure
   */
  isValidJWT(token: string) {
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  },

  /**
   * Assert that a user payload has the expected structure
   */
  isValidUserPayload(payload: any) {
    expect(payload).toBeDefined();
    expect(payload).toHaveProperty('id');
    expect(payload).toHaveProperty('email');
    expect(payload).toHaveProperty('nombre');
    expect(payload).toHaveProperty('rol');
    expect(payload).toHaveProperty('activo');
    expect(typeof payload.id).toBe('string');
    expect(typeof payload.email).toBe('string');
    expect(typeof payload.nombre).toBe('string');
    expect(typeof payload.rol).toBe('string');
    expect(typeof payload.activo).toBe('boolean');
  },

  /**
   * Assert that a password hash has the expected bcrypt format
   */
  isValidBcryptHash(hash: string) {
    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$.{53}$/);
  },

  /**
   * Assert that a cookie string has the expected format
   */
  isValidCookieString(cookieString: string, expectedName: string) {
    expect(cookieString).toBeDefined();
    expect(cookieString).toContain(`${expectedName}=`);
  },

  /**
   * Assert that an error response has the expected structure
   */
  isValidErrorResponse(response: any, expectedCode?: string) {
    expect(response).toHaveProperty('success', false);
    expect(response).toHaveProperty('message');
    expect(response).toHaveProperty('code');
    expect(typeof response.message).toBe('string');
    expect(typeof response.code).toBe('string');
    
    if (expectedCode) {
      expect(response.code).toBe(expectedCode);
    }
  },

  /**
   * Assert that a success response has the expected structure
   */
  isValidSuccessResponse(response: any) {
    expect(response).toHaveProperty('success', true);
    expect(response).toHaveProperty('message');
    expect(typeof response.message).toBe('string');
  },
};

/**
 * Test data generators
 */
export const testDataGenerators = {
  /**
   * Generate a random email for testing
   */
  randomEmail() {
    const randomId = Math.random().toString(36).substring(7);
    return `test-${randomId}@example.com`;
  },

  /**
   * Generate a random IP address for testing
   */
  randomIP() {
    return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  },

  /**
   * Generate a random user ID for testing
   */
  randomUserId() {
    return `user-${Math.random().toString(36).substring(7)}`;
  },

  /**
   * Generate test password with specific characteristics
   */
  generateTestPassword(options: {
    length?: number;
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
    avoidCommonPatterns?: boolean;
  } = {}) {
    const {
      length = 12,
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true,
      avoidCommonPatterns = true,
    } = options;

    let chars = '';
    let password = '';

    if (includeLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (includeUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) chars += '0123456789';
    if (includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    // Ensure at least one character from each required category
    if (includeLowercase) password += 'a';
    if (includeUppercase) password += 'A';
    if (includeNumbers) password += '1';
    if (includeSymbols) password += '!';

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }

    // Shuffle to avoid predictable patterns
    if (avoidCommonPatterns) {
      password = password.split('').sort(() => Math.random() - 0.5).join('');
    }

    return password;
  },
};