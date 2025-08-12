// Lazy loading utilities for database modules
// This module provides lazy loading capabilities to optimize bundle size and initial load time

type ModuleLoader<T> = () => Promise<T>;

interface LazyModule<T> {
  load(): Promise<T>;
  isLoaded(): boolean;
  getModule(): T | null;
}

class LazyModuleLoader<T> implements LazyModule<T> {
  private module: T | null = null;
  private loading: Promise<T> | null = null;
  private loader: ModuleLoader<T>;

  constructor(loader: ModuleLoader<T>) {
    this.loader = loader;
  }

  async load(): Promise<T> {
    if (this.module) {
      return this.module;
    }

    if (this.loading) {
      return this.loading;
    }

    this.loading = this.loader().then(module => {
      this.module = module;
      this.loading = null;
      return module;
    });

    return this.loading;
  }

  isLoaded(): boolean {
    return this.module !== null;
  }

  getModule(): T | null {
    return this.module;
  }
}

// Create lazy loaders for each database module
export const lazyModules = {
  mercaderias: new LazyModuleLoader(() => import('../mercaderias')),
  stock: new LazyModuleLoader(() => import('../stock')),
  equipos: new LazyModuleLoader(() => import('../equipos')),
  mantenimientos: new LazyModuleLoader(() => import('../mantenimientos')),
  clinicas: new LazyModuleLoader(() => import('../clinicas')),
  remisiones: new LazyModuleLoader(() => import('../remisiones')),
  usuarios: new LazyModuleLoader(() => import('../usuarios')),
};

/**
 * Preload critical modules that are likely to be used immediately
 */
export async function preloadCriticalModules(): Promise<void> {
  try {
    // Preload the most commonly used modules
    await Promise.all([
      lazyModules.mercaderias.load(),
      lazyModules.stock.load(),
      lazyModules.equipos.load(),
    ]);
    console.log('✅ Critical database modules preloaded');
  } catch (error) {
    console.error('❌ Error preloading critical modules:', error);
  }
}

/**
 * Preload all modules for better performance after initial load
 */
export async function preloadAllModules(): Promise<void> {
  try {
    await Promise.all([
      lazyModules.mercaderias.load(),
      lazyModules.stock.load(),
      lazyModules.equipos.load(),
      lazyModules.mantenimientos.load(),
      lazyModules.clinicas.load(),
      lazyModules.remisiones.load(),
      lazyModules.usuarios.load(),
    ]);
    console.log('✅ All database modules preloaded');
  } catch (error) {
    console.error('❌ Error preloading all modules:', error);
  }
}

/**
 * Get module loading status
 */
export function getModuleStatus() {
  return {
    mercaderias: lazyModules.mercaderias.isLoaded(),
    stock: lazyModules.stock.isLoaded(),
    equipos: lazyModules.equipos.isLoaded(),
    mantenimientos: lazyModules.mantenimientos.isLoaded(),
    clinicas: lazyModules.clinicas.isLoaded(),
    remisiones: lazyModules.remisiones.isLoaded(),
    usuarios: lazyModules.usuarios.isLoaded(),
  };
}

/**
 * Utility function to create a lazy-loaded function wrapper
 */
export function createLazyFunction<T extends (...args: any[]) => any>(
  moduleLoader: LazyModule<any>,
  functionName: string
): T {
  return (async (...args: any[]) => {
    const module = await moduleLoader.load();
    const fn = module[functionName];
    if (typeof fn !== 'function') {
      throw new Error(`Function ${functionName} not found in module`);
    }
    return fn(...args);
  }) as T;
}

export type { LazyModule, ModuleLoader };
export { LazyModuleLoader };