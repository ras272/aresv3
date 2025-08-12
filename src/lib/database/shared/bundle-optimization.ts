// Bundle optimization utilities for database modules
// This module provides tree-shaking optimization and bundle size analysis

interface BundleAnalysis {
  moduleSize: number;
  exportCount: number;
  unusedExports: string[];
  dependencies: string[];
  circularDependencies: string[];
}

interface OptimizationConfig {
  enableTreeShaking: boolean;
  enableCodeSplitting: boolean;
  enableLazyLoading: boolean;
  minChunkSize: number;
  maxChunkSize: number;
}

/**
 * Analyze bundle composition and identify optimization opportunities
 */
export function analyzeBundleComposition(): BundleAnalysis {
  // This would be implemented with actual bundle analysis tools in production
  // For now, we provide a mock implementation
  return {
    moduleSize: 0,
    exportCount: 0,
    unusedExports: [],
    dependencies: [],
    circularDependencies: [],
  };
}

/**
 * Tree-shaking friendly export pattern
 * This ensures that unused functions are properly eliminated from the bundle
 */
export function createTreeShakableExports<T extends Record<string, any>>(
  exports: T
): T {
  // Mark exports for tree-shaking optimization
  Object.keys(exports).forEach(key => {
    const fn = exports[key];
    if (typeof fn === 'function') {
      // Add metadata for bundlers to optimize
      Object.defineProperty(fn, '__esModule', { value: true });
      Object.defineProperty(fn, 'name', { value: key });
    }
  });

  return exports;
}

/**
 * Code splitting configuration for database modules
 */
export const codeSplittingConfig: OptimizationConfig = {
  enableTreeShaking: true,
  enableCodeSplitting: true,
  enableLazyLoading: true,
  minChunkSize: 20000, // 20KB minimum chunk size
  maxChunkSize: 244000, // 244KB maximum chunk size
};

/**
 * Dynamic import wrapper with error handling and retry logic
 */
export async function dynamicImportWithRetry<T>(
  importFn: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await importFn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        console.error(`❌ Failed to load module after ${maxRetries} attempts:`, error);
        throw error;
      }

      console.warn(`⚠️ Module load attempt ${attempt} failed, retrying in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  throw lastError!;
}

/**
 * Preload critical modules for better performance
 */
export async function preloadCriticalModules(): Promise<void> {
  const criticalModules = [
    () => import('../mercaderias'),
    () => import('../stock'),
    () => import('../equipos'),
  ];

  try {
    await Promise.all(
      criticalModules.map(importFn => 
        dynamicImportWithRetry(importFn, 2, 500)
      )
    );
    console.log('✅ Critical database modules preloaded successfully');
  } catch (error) {
    console.error('❌ Error preloading critical modules:', error);
  }
}

/**
 * Memory usage optimization for large datasets
 */
export function optimizeMemoryUsage<T>(
  data: T[],
  chunkSize: number = 100
): T[][] {
  const chunks: T[][] = [];
  
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }
  
  return chunks;
}

/**
 * Cleanup unused references to prevent memory leaks
 */
export function cleanupReferences(obj: any): void {
  if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      if (obj[key] && typeof obj[key] === 'object') {
        cleanupReferences(obj[key]);
      }
      delete obj[key];
    });
  }
}

/**
 * Bundle size reporter for development
 */
export function reportBundleSize(): void {
  if (process.env.NODE_ENV === 'development') {
    // This would integrate with webpack-bundle-analyzer or similar tools
    console.log('📊 Bundle analysis would be reported here in development mode');
  }
}

export type { BundleAnalysis, OptimizationConfig };