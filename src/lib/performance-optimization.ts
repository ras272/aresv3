import { supabase } from './database/shared/supabase';

// Token blacklist cache - in production, use Redis
const tokenBlacklist = new Map<string, number>();
const BLACKLIST_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

// User permissions cache
const userPermissionsCache = new Map<string, {
  permissions: string[];
  roles: string[];
  timestamp: number;
}>();
const PERMISSIONS_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// Performance monitoring
interface PerformanceMetrics {
  totalQueries: number;
  averageQueryTime: number;
  slowQueries: number;
  cacheHits: number;
  cacheMisses: number;
}

class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private metrics: PerformanceMetrics = {
    totalQueries: 0,
    averageQueryTime: 0,
    slowQueries: 0,
    cacheHits: 0,
    cacheMisses: 0
  };

  private constructor() {
    // Start cleanup intervals
    this.startCleanupIntervals();
  }

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * Efficient token blacklist management
   */
  addToBlacklist(token: string, expirationTime: number): void {
    tokenBlacklist.set(token, expirationTime);
  }

  isTokenBlacklisted(token: string): boolean {
    const expirationTime = tokenBlacklist.get(token);
    if (!expirationTime) {
      return false;
    }

    // Check if token has expired
    if (Date.now() > expirationTime) {
      tokenBlacklist.delete(token);
      return false;
    }

    return true;
  }

  /**
   * User permissions caching
   */
  async getUserPermissions(userId: string): Promise<{ permissions: string[]; roles: string[] }> {
    const cached = userPermissionsCache.get(userId);
    
    // Check cache first
    if (cached && Date.now() - cached.timestamp < PERMISSIONS_CACHE_TTL) {
      this.metrics.cacheHits++;
      return {
        permissions: cached.permissions,
        roles: cached.roles
      };
    }

    this.metrics.cacheMisses++;

    // Fetch from database
    const startTime = Date.now();
    
    try {
      const { data: user, error } = await supabase
        .from('usuarios')
        .select('rol, activo')
        .eq('id', userId)
        .single();

      if (error || !user) {
        throw new Error('User not found');
      }

      // Map roles to permissions (this would be more complex in a real system)
      const rolePermissions = this.getRolePermissions(user.rol);
      
      // Cache the result
      userPermissionsCache.set(userId, {
        permissions: rolePermissions,
        roles: [user.rol],
        timestamp: Date.now()
      });

      this.updateQueryMetrics(Date.now() - startTime);

      return {
        permissions: rolePermissions,
        roles: [user.rol]
      };
    } catch (error) {
      this.updateQueryMetrics(Date.now() - startTime, true);
      throw error;
    }
  }

  /**
   * Invalidate user permissions cache
   */
  invalidateUserPermissions(userId: string): void {
    userPermissionsCache.delete(userId);
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    userPermissionsCache.clear();
    tokenBlacklist.clear();
  }

  /**
   * Get role permissions mapping
   */
  private getRolePermissions(role: string): string[] {
    const rolePermissionMap: Record<string, string[]> = {
      'super_admin': ['*'], // All permissions
      'admin': [
        'usuarios', 'equipos', 'inventario-tecnico', 'mercaderias', 
        'stock', 'remisiones', 'clinicas', 'documentos', 'archivos', 
        'reportes', 'servtec'
      ],
      'gerente': [
        'equipos', 'inventario-tecnico', 'mercaderias', 'stock', 
        'remisiones', 'clinicas', 'reportes', 'servtec'
      ],
      'tecnico': [
        'equipos', 'inventario-tecnico', 'servtec', 'reportes'
      ],
      'contabilidad': [
        'remisiones', 'reportes', 'mercaderias', 'stock'
      ],
      'vendedor': [
        'equipos', 'clinicas', 'remisiones', 'reportes'
      ],
      'cliente': [
        'equipos', 'reportes'
      ]
    };

    return rolePermissionMap[role] || [];
  }

  /**
   * Optimized database query with caching
   */
  async optimizedQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    cacheTTL: number = 5 * 60 * 1000 // 5 minutes default
  ): Promise<T> {
    // Simple in-memory cache for demonstration
    // In production, use Redis or similar
    const cacheKey = `query:${queryKey}`;
    const cached = this.getFromCache(cacheKey);

    if (cached && Date.now() - cached.timestamp < cacheTTL) {
      this.metrics.cacheHits++;
      return cached.data;
    }

    this.metrics.cacheMisses++;
    const startTime = Date.now();

    try {
      const result = await queryFn();
      
      // Cache the result
      this.setCache(cacheKey, result);
      
      this.updateQueryMetrics(Date.now() - startTime);
      return result;
    } catch (error) {
      this.updateQueryMetrics(Date.now() - startTime, true);
      throw error;
    }
  }

  /**
   * Batch database operations
   */
  async batchInsert<T>(
    table: string,
    records: T[],
    batchSize: number = 100
  ): Promise<void> {
    const batches = [];
    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize));
    }

    const promises = batches.map(batch => 
      supabase.from(table).insert(batch)
    );

    await Promise.all(promises);
  }

  /**
   * Database connection pooling optimization
   */
  async optimizeConnections(): Promise<void> {
    // In a real implementation, this would configure connection pooling
    // For Supabase, this is handled automatically, but we can optimize queries
    
    // Analyze slow queries
    await this.analyzeSlowQueries();
    
    // Optimize indexes
    await this.optimizeIndexes();
  }

  /**
   * Analyze slow queries and suggest optimizations
   */
  private async analyzeSlowQueries(): Promise<void> {
    try {
      // This would analyze pg_stat_statements in a real PostgreSQL setup
      // For now, we'll just log our metrics
      console.log('[PERFORMANCE] Query Analysis:', {
        totalQueries: this.metrics.totalQueries,
        averageQueryTime: this.metrics.averageQueryTime,
        slowQueries: this.metrics.slowQueries,
        cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100
      });
    } catch (error) {
      console.error('Error analyzing slow queries:', error);
    }
  }

  /**
   * Optimize database indexes
   */
  private async optimizeIndexes(): Promise<void> {
    try {
      // Check for missing indexes on frequently queried columns
      const indexOptimizations = [
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usuarios_email_activo ON usuarios(email, activo);',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_login_attempts_email_attempted_at ON login_attempts(email, attempted_at);',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_sessions_user_expires ON active_sessions(user_id, expires_at);',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_timestamp_type ON security_events(timestamp, event_type);',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_metrics_timestamp_operation ON performance_metrics(timestamp, operation);'
      ];

      for (const sql of indexOptimizations) {
        try {
          await supabase.rpc('execute_sql', { sql });
        } catch (error) {
          // Index might already exist, continue
          console.log('Index optimization skipped:', error);
        }
      }
    } catch (error) {
      console.error('Error optimizing indexes:', error);
    }
  }

  /**
   * React component re-rendering optimization
   */
  createMemoizedSelector<T, R>(
    selector: (state: T) => R,
    equalityFn?: (a: R, b: R) => boolean
  ): (state: T) => R {
    let lastResult: R;
    let lastArgs: T;

    return (state: T): R => {
      if (lastArgs !== state) {
        const result = selector(state);
        
        if (equalityFn) {
          if (!equalityFn(result, lastResult)) {
            lastResult = result;
          }
        } else {
          lastResult = result;
        }
        
        lastArgs = state;
      }
      
      return lastResult;
    };
  }

  /**
   * Memory management for caches
   */
  private startCleanupIntervals(): void {
    // Clean up expired tokens from blacklist
    setInterval(() => {
      const now = Date.now();
      for (const [token, expirationTime] of tokenBlacklist.entries()) {
        if (now > expirationTime) {
          tokenBlacklist.delete(token);
        }
      }
    }, BLACKLIST_CLEANUP_INTERVAL);

    // Clean up expired permissions cache
    setInterval(() => {
      const now = Date.now();
      for (const [userId, cached] of userPermissionsCache.entries()) {
        if (now - cached.timestamp > PERMISSIONS_CACHE_TTL) {
          userPermissionsCache.delete(userId);
        }
      }
    }, PERMISSIONS_CACHE_TTL);
  }

  /**
   * Update query performance metrics
   */
  private updateQueryMetrics(duration: number, isError: boolean = false): void {
    this.metrics.totalQueries++;
    
    if (isError) {
      return;
    }

    // Update average query time
    this.metrics.averageQueryTime = 
      (this.metrics.averageQueryTime * (this.metrics.totalQueries - 1) + duration) / 
      this.metrics.totalQueries;

    // Track slow queries (> 1 second)
    if (duration > 1000) {
      this.metrics.slowQueries++;
    }
  }

  /**
   * Simple cache implementation (use Redis in production)
   */
  private cache = new Map<string, { data: any; timestamp: number }>();

  private getFromCache(key: string): { data: any; timestamp: number } | undefined {
    return this.cache.get(key);
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    
    // Limit cache size
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics & {
    blacklistSize: number;
    permissionsCacheSize: number;
    queryCacheSize: number;
  } {
    return {
      ...this.metrics,
      blacklistSize: tokenBlacklist.size,
      permissionsCacheSize: userPermissionsCache.size,
      queryCacheSize: this.cache.size
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalQueries: 0,
      averageQueryTime: 0,
      slowQueries: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();

// Helper functions
export const getUserPermissions = (userId: string) => 
  performanceOptimizer.getUserPermissions(userId);

export const invalidateUserPermissions = (userId: string) => 
  performanceOptimizer.invalidateUserPermissions(userId);

export const addTokenToBlacklist = (token: string, expirationTime: number) => 
  performanceOptimizer.addToBlacklist(token, expirationTime);

export const isTokenBlacklisted = (token: string) => 
  performanceOptimizer.isTokenBlacklisted(token);

export const optimizedQuery = <T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  cacheTTL?: number
) => performanceOptimizer.optimizedQuery(queryKey, queryFn, cacheTTL);

export const batchInsert = <T>(table: string, records: T[], batchSize?: number) =>
  performanceOptimizer.batchInsert(table, records, batchSize);

// React optimization helpers
export const createMemoizedSelector = <T, R>(
  selector: (state: T) => R,
  equalityFn?: (a: R, b: R) => boolean
) => performanceOptimizer.createMemoizedSelector(selector, equalityFn);

// Performance monitoring decorator
export function measurePerformance(operationName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      
      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - startTime;
        
        if (duration > 100) { // Log operations taking more than 100ms
          console.log(`[PERFORMANCE] ${operationName} took ${duration}ms`);
        }
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        console.warn(`[PERFORMANCE] ${operationName} failed after ${duration}ms:`, error);
        throw error;
      }
    };

    return descriptor;
  };
}