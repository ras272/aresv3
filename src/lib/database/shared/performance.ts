// Performance monitoring utilities for database operations
// This module provides performance tracking and optimization tools

interface PerformanceMetrics {
  functionName: string;
  executionTime: number;
  timestamp: Date;
  memoryUsage?: NodeJS.MemoryUsage;
  parameters?: any;
  result?: any;
  error?: Error;
}

interface PerformanceConfig {
  enableLogging: boolean;
  enableMemoryTracking: boolean;
  slowQueryThreshold: number; // milliseconds
  maxMetricsHistory: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private config: PerformanceConfig;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enableLogging: config.enableLogging ?? false,
      enableMemoryTracking: config.enableMemoryTracking ?? false,
      slowQueryThreshold: config.slowQueryThreshold ?? 1000,
      maxMetricsHistory: config.maxMetricsHistory ?? 100,
      ...config
    };
  }

  /**
   * Wraps a function with performance monitoring
   */
  monitor<T extends (...args: any[]) => Promise<any>>(
    functionName: string,
    fn: T
  ): T {
    return (async (...args: Parameters<T>) => {
      const startTime = performance.now();
      const startMemory = this.config.enableMemoryTracking && typeof process !== 'undefined' && process.memoryUsage ? process.memoryUsage() : undefined;

      try {
        const result = await fn(...args);
        const endTime = performance.now();
        const executionTime = endTime - startTime;

        const metric: PerformanceMetrics = {
          functionName,
          executionTime,
          timestamp: new Date(),
          memoryUsage: startMemory,
          parameters: this.config.enableLogging ? args : undefined,
          result: this.config.enableLogging ? result : undefined,
        };

        this.recordMetric(metric);

        if (executionTime > this.config.slowQueryThreshold) {
          console.warn(`⚠️ Slow database operation detected: ${functionName} took ${executionTime.toFixed(2)}ms`);
        }

        return result;
      } catch (error) {
        const endTime = performance.now();
        const executionTime = endTime - startTime;

        const metric: PerformanceMetrics = {
          functionName,
          executionTime,
          timestamp: new Date(),
          memoryUsage: startMemory,
          parameters: this.config.enableLogging ? args : undefined,
          error: error as Error,
        };

        this.recordMetric(metric);
        throw error;
      }
    }) as T;
  }

  private recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Keep only the most recent metrics to prevent memory leaks
    if (this.metrics.length > this.config.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.config.maxMetricsHistory);
    }

    if (this.config.enableLogging) {
      console.log(`📊 ${metric.functionName}: ${metric.executionTime.toFixed(2)}ms`);
    }
  }

  /**
   * Get performance statistics for a specific function
   */
  getStats(functionName?: string): {
    totalCalls: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
    slowQueries: number;
    errorRate: number;
  } {
    const relevantMetrics = functionName 
      ? this.metrics.filter(m => m.functionName === functionName)
      : this.metrics;

    if (relevantMetrics.length === 0) {
      return {
        totalCalls: 0,
        averageTime: 0,
        minTime: 0,
        maxTime: 0,
        slowQueries: 0,
        errorRate: 0,
      };
    }

    const executionTimes = relevantMetrics.map(m => m.executionTime);
    const errors = relevantMetrics.filter(m => m.error).length;
    const slowQueries = relevantMetrics.filter(m => m.executionTime > this.config.slowQueryThreshold).length;

    return {
      totalCalls: relevantMetrics.length,
      averageTime: executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length,
      minTime: Math.min(...executionTimes),
      maxTime: Math.max(...executionTimes),
      slowQueries,
      errorRate: errors / relevantMetrics.length,
    };
  }

  /**
   * Get all recorded metrics
   */
  getAllMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Clear all recorded metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): NodeJS.MemoryUsage | null {
    if (!this.config.enableMemoryTracking) {
      return null;
    }
    // Check if we're in Node.js environment
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage();
    }
    return null;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor({
  enableLogging: process.env.NODE_ENV === 'development',
  enableMemoryTracking: process.env.NODE_ENV === 'development',
  slowQueryThreshold: 1000, // 1 second
  maxMetricsHistory: 100,
});

/**
 * Decorator for monitoring database function performance
 */
export function monitorPerformance(functionName: string) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    if (descriptor.value) {
      descriptor.value = performanceMonitor.monitor(functionName, descriptor.value);
    }
    return descriptor;
  };
}

/**
 * Simple performance wrapper for functions
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => Promise<any>>(
  functionName: string,
  fn: T
): T {
  return performanceMonitor.monitor(functionName, fn);
}

// Export types for external use
export type { PerformanceMetrics, PerformanceConfig };
export { PerformanceMonitor };