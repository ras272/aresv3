// ===============================================
// UTILIDADES DE PERFORMANCE PARA OPERACIONES DE CARPETAS
// ===============================================

import { supabase } from './database/shared/supabase';

// ===============================================
// INTERFACES Y TIPOS
// ===============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface FolderStats {
  rutaCarpeta: string;
  totalProductos: number;
  totalUnidades: number;
  productosStockBajo: number;
  productosSinStock: number;
  marcasDistintas: number;
  valorTotalEstimado: number;
}

interface QueryPerformanceMetrics {
  queryName: string;
  executionTime: number;
  recordCount: number;
  cacheHit: boolean;
  timestamp: number;
}

// ===============================================
// SISTEMA DE CACHÉ EN MEMORIA
// ===============================================

class FolderCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutos por defecto
  private maxCacheSize = 100; // Máximo 100 entradas en caché

  set<T>(key: string, data: T, ttl?: number): void {
    // Limpiar caché si está lleno
    if (this.cache.size >= this.maxCacheSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar si ha expirado
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Verificar si ha expirado
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    // Si aún está lleno, eliminar las entradas más antiguas
    if (this.cache.size >= this.maxCacheSize) {
      const entries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      const toDelete = entries.slice(0, Math.floor(this.maxCacheSize * 0.3));
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    oldestEntry: number;
  } {
    const now = Date.now();
    let oldestTimestamp = now;
    
    for (const entry of this.cache.values()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: 0, // Se calculará externamente
      oldestEntry: now - oldestTimestamp
    };
  }
}

// Instancia global del caché
const folderCache = new FolderCache();

// ===============================================
// MÉTRICAS DE PERFORMANCE
// ===============================================

class PerformanceMonitor {
  private metrics: QueryPerformanceMetrics[] = [];
  private maxMetrics = 1000;

  recordQuery(queryName: string, executionTime: number, recordCount: number, cacheHit: boolean): void {
    this.metrics.push({
      queryName,
      executionTime,
      recordCount,
      cacheHit,
      timestamp: Date.now()
    });

    // Mantener solo las métricas más recientes
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getMetrics(queryName?: string, lastMinutes?: number): QueryPerformanceMetrics[] {
    let filtered = this.metrics;

    if (queryName) {
      filtered = filtered.filter(m => m.queryName === queryName);
    }

    if (lastMinutes) {
      const cutoff = Date.now() - (lastMinutes * 60 * 1000);
      filtered = filtered.filter(m => m.timestamp > cutoff);
    }

    return filtered;
  }

  getAverageExecutionTime(queryName: string, lastMinutes?: number): number {
    const metrics = this.getMetrics(queryName, lastMinutes);
    if (metrics.length === 0) return 0;

    const total = metrics.reduce((sum, m) => sum + m.executionTime, 0);
    return total / metrics.length;
  }

  getCacheHitRate(queryName?: string, lastMinutes?: number): number {
    const metrics = this.getMetrics(queryName, lastMinutes);
    if (metrics.length === 0) return 0;

    const hits = metrics.filter(m => m.cacheHit).length;
    return (hits / metrics.length) * 100;
  }

  getSlowestQueries(limit: number = 10): QueryPerformanceMetrics[] {
    return [...this.metrics]
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, limit);
  }

  clear(): void {
    this.metrics = [];
  }
}

const performanceMonitor = new PerformanceMonitor();

// ===============================================
// FUNCIONES OPTIMIZADAS CON CACHÉ
// ===============================================

export async function obtenerEstadisticasCarpetaOptimizada(rutaCarpeta: string): Promise<FolderStats> {
  const cacheKey = `folder-stats-${rutaCarpeta}`;
  const startTime = Date.now();

  // Intentar obtener del caché
  const cached = folderCache.get<FolderStats>(cacheKey);
  if (cached) {
    performanceMonitor.recordQuery('obtenerEstadisticasCarpeta', Date.now() - startTime, 1, true);
    return cached;
  }

  try {
    // Consulta optimizada usando la función de base de datos
    const { data, error } = await supabase
      .rpc('obtener_estadisticas_carpeta', { p_ruta_carpeta: rutaCarpeta });

    if (error) throw error;

    const stats: FolderStats = {
      rutaCarpeta,
      totalProductos: data[0]?.total_productos || 0,
      totalUnidades: data[0]?.total_unidades || 0,
      productosStockBajo: data[0]?.productos_stock_bajo || 0,
      productosSinStock: data[0]?.productos_sin_stock || 0,
      marcasDistintas: data[0]?.marcas_distintas || 0,
      valorTotalEstimado: data[0]?.valor_total_estimado || 0
    };

    // Guardar en caché con TTL de 3 minutos para estadísticas
    folderCache.set(cacheKey, stats, 3 * 60 * 1000);

    performanceMonitor.recordQuery('obtenerEstadisticasCarpeta', Date.now() - startTime, 1, false);
    return stats;
  } catch (error) {
    console.error('Error obteniendo estadísticas de carpeta:', error);
    performanceMonitor.recordQuery('obtenerEstadisticasCarpeta', Date.now() - startTime, 0, false);
    throw error;
  }
}

export async function buscarProductosEnCarpetasOptimizada(
  terminoBusqueda: string,
  carpetaPrincipal?: string,
  tipoDestino?: string,
  limite: number = 50
): Promise<any[]> {
  const cacheKey = `search-${terminoBusqueda}-${carpetaPrincipal || 'all'}-${tipoDestino || 'all'}-${limite}`;
  const startTime = Date.now();

  // Para búsquedas, usar caché más corto (1 minuto)
  const cached = folderCache.get<any[]>(cacheKey);
  if (cached) {
    performanceMonitor.recordQuery('buscarProductosEnCarpetas', Date.now() - startTime, cached.length, true);
    return cached;
  }

  try {
    const { data, error } = await supabase
      .rpc('buscar_productos_en_carpetas', {
        p_termino_busqueda: terminoBusqueda,
        p_carpeta_principal: carpetaPrincipal || null,
        p_tipo_destino: tipoDestino || null,
        p_limite: limite
      });

    if (error) throw error;

    // Caché de búsqueda con TTL corto (1 minuto)
    folderCache.set(cacheKey, data || [], 60 * 1000);

    performanceMonitor.recordQuery('buscarProductosEnCarpetas', Date.now() - startTime, data?.length || 0, false);
    return data || [];
  } catch (error) {
    console.error('Error buscando productos en carpetas:', error);
    performanceMonitor.recordQuery('buscarProductosEnCarpetas', Date.now() - startTime, 0, false);
    throw error;
  }
}

export async function obtenerJerarquiaCarpetasOptimizada(): Promise<any[]> {
  const cacheKey = 'folder-hierarchy';
  const startTime = Date.now();

  // Caché de jerarquía con TTL de 5 minutos
  const cached = folderCache.get<any[]>(cacheKey);
  if (cached) {
    performanceMonitor.recordQuery('obtenerJerarquiaCarpetas', Date.now() - startTime, cached.length, true);
    return cached;
  }

  try {
    const { data, error } = await supabase
      .rpc('obtener_jerarquia_carpetas_con_cache');

    if (error) throw error;

    // Caché con TTL de 5 minutos
    folderCache.set(cacheKey, data || [], 5 * 60 * 1000);

    performanceMonitor.recordQuery('obtenerJerarquiaCarpetas', Date.now() - startTime, data?.length || 0, false);
    return data || [];
  } catch (error) {
    console.error('Error obteniendo jerarquía de carpetas:', error);
    performanceMonitor.recordQuery('obtenerJerarquiaCarpetas', Date.now() - startTime, 0, false);
    throw error;
  }
}

// ===============================================
// OPTIMIZACIÓN DE CONSULTAS BATCH
// ===============================================

export async function obtenerEstadisticasMultiplesCarpetas(rutasCarpetas: string[]): Promise<Map<string, FolderStats>> {
  const startTime = Date.now();
  const resultado = new Map<string, FolderStats>();
  const carpetasPendientes: string[] = [];

  // Verificar caché para cada carpeta
  for (const ruta of rutasCarpetas) {
    const cacheKey = `folder-stats-${ruta}`;
    const cached = folderCache.get<FolderStats>(cacheKey);
    
    if (cached) {
      resultado.set(ruta, cached);
    } else {
      carpetasPendientes.push(ruta);
    }
  }

  // Si todas están en caché, retornar inmediatamente
  if (carpetasPendientes.length === 0) {
    performanceMonitor.recordQuery('obtenerEstadisticasMultiples', Date.now() - startTime, rutasCarpetas.length, true);
    return resultado;
  }

  try {
    // Consulta batch para carpetas no cacheadas
    const { data, error } = await supabase
      .from('vista_estadisticas_carpetas')
      .select('*')
      .in('ruta_carpeta', carpetasPendientes);

    if (error) throw error;

    // Procesar resultados y actualizar caché
    for (const row of data || []) {
      const stats: FolderStats = {
        rutaCarpeta: row.ruta_carpeta,
        totalProductos: row.total_productos,
        totalUnidades: row.total_unidades,
        productosStockBajo: row.productos_stock_bajo,
        productosSinStock: 0, // No disponible en esta vista
        marcasDistintas: row.marcas_en_carpeta?.length || 0,
        valorTotalEstimado: 0 // No disponible en esta vista
      };

      resultado.set(row.ruta_carpeta, stats);
      folderCache.set(`folder-stats-${row.ruta_carpeta}`, stats, 3 * 60 * 1000);
    }

    // Agregar entradas vacías para carpetas que no se encontraron
    for (const ruta of carpetasPendientes) {
      if (!resultado.has(ruta)) {
        const emptyStats: FolderStats = {
          rutaCarpeta: ruta,
          totalProductos: 0,
          totalUnidades: 0,
          productosStockBajo: 0,
          productosSinStock: 0,
          marcasDistintas: 0,
          valorTotalEstimado: 0
        };
        resultado.set(ruta, emptyStats);
        folderCache.set(`folder-stats-${ruta}`, emptyStats, 60 * 1000); // TTL más corto para carpetas vacías
      }
    }

    const cacheHitRate = (rutasCarpetas.length - carpetasPendientes.length) / rutasCarpetas.length;
    performanceMonitor.recordQuery('obtenerEstadisticasMultiples', Date.now() - startTime, rutasCarpetas.length, cacheHitRate > 0.5);
    
    return resultado;
  } catch (error) {
    console.error('Error obteniendo estadísticas múltiples:', error);
    performanceMonitor.recordQuery('obtenerEstadisticasMultiples', Date.now() - startTime, 0, false);
    throw error;
  }
}

// ===============================================
// UTILIDADES DE MANTENIMIENTO DE CACHÉ
// ===============================================

export function invalidarCacheCarpeta(rutaCarpeta: string): void {
  folderCache.delete(`folder-stats-${rutaCarpeta}`);
  
  // Invalidar también búsquedas relacionadas
  const cacheKeys = Array.from((folderCache as any).cache.keys());
  const searchKeys = cacheKeys.filter(key => 
    key.startsWith('search-') && key.includes(rutaCarpeta)
  );
  
  searchKeys.forEach(key => folderCache.delete(key));
}

export function invalidarCacheCompleto(): void {
  folderCache.clear();
  console.log('Caché de carpetas limpiado completamente');
}

export function actualizarCacheEstadisticas(): Promise<void> {
  return supabase.rpc('actualizar_cache_estadisticas_carpetas');
}

// ===============================================
// UTILIDADES DE MONITOREO
// ===============================================

export function obtenerMetricasPerformance(): {
  cache: ReturnType<typeof folderCache.getStats>;
  queries: {
    total: number;
    averageTime: number;
    cacheHitRate: number;
    slowestQueries: QueryPerformanceMetrics[];
  };
} {
  const cacheStats = folderCache.getStats();
  const allMetrics = performanceMonitor.getMetrics();
  
  return {
    cache: cacheStats,
    queries: {
      total: allMetrics.length,
      averageTime: allMetrics.length > 0 
        ? allMetrics.reduce((sum, m) => sum + m.executionTime, 0) / allMetrics.length 
        : 0,
      cacheHitRate: performanceMonitor.getCacheHitRate(),
      slowestQueries: performanceMonitor.getSlowestQueries(5)
    }
  };
}

export function limpiarMetricasPerformance(): void {
  performanceMonitor.clear();
  console.log('Métricas de performance limpiadas');
}

// ===============================================
// CONFIGURACIÓN Y AJUSTES
// ===============================================

export function configurarCache(opciones: {
  maxSize?: number;
  defaultTTL?: number;
}): void {
  if (opciones.maxSize) {
    (folderCache as any).maxCacheSize = opciones.maxSize;
  }
  
  if (opciones.defaultTTL) {
    (folderCache as any).defaultTTL = opciones.defaultTTL;
  }
}

// Limpieza automática del caché cada 10 minutos
setInterval(() => {
  folderCache.cleanup();
}, 10 * 60 * 1000);

// ===============================================
// EXPORTACIONES
// ===============================================

export {
  folderCache,
  performanceMonitor,
  type FolderStats,
  type QueryPerformanceMetrics
};