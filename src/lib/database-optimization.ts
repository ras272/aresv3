/**
 * Utilidades para optimización de base de datos
 * Reduce el uso de espacio y mejora el rendimiento
 */

import { supabase } from './supabase';

export class DatabaseOptimizer {
  
  /**
   * Ejecuta limpieza automática de datos antiguos
   */
  static async runCleanup(): Promise<{
    movimientos_deleted: number;
    alertas_deleted: number;
    sesiones_deleted: number;
    actividad_deleted: number;
    total_deleted: number;
  }> {
    try {
      console.log('🧹 Iniciando limpieza automática...');
      
      const { data, error } = await supabase.rpc('cleanup_old_data_with_stats');
      
      if (error) throw error;
      
      console.log('✅ Limpieza automática completada:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en limpieza automática:', error);
      throw error;
    }
  }

  /**
   * Comprime campos JSON grandes
   */
  static async compressJSON(): Promise<void> {
    try {
      console.log('🗜️ Comprimiendo campos JSON...');
      
      const { error } = await supabase.rpc('compress_large_json');
      
      if (error) throw error;
      
      console.log('✅ Compresión JSON completada');
    } catch (error) {
      console.error('❌ Error en compresión JSON:', error);
      throw error;
    }
  }

  /**
   * Optimización completa de base de datos
   */
  static async optimizeDatabase(): Promise<{
    cleanup: any;
    compression: any;
    status: string;
  }> {
    try {
      console.log('🚀 Iniciando optimización completa...');
      
      const { data, error } = await supabase.rpc('optimize_database');
      
      if (error) throw error;
      
      console.log('✅ Optimización completa finalizada:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en optimización:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de uso de espacio
   */
  static async getSpaceUsage(): Promise<{
    totalSize: string;
    tablesSizes: Array<{ table: string; size: string }>;
    optimizationCandidates?: any;
  }> {
    try {
      // Obtener estadísticas detalladas
      const { data: stats, error } = await supabase.rpc('get_detailed_stats');

      if (error) throw error;

      return {
        totalSize: stats?.database_size || '0 MB',
        tablesSizes: stats?.top_tables?.map((t: any) => ({
          table: t.table_name,
          size: t.size
        })) || [],
        optimizationCandidates: stats?.optimization_candidates
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return {
        totalSize: 'Error',
        tablesSizes: []
      };
    }
  }

  /**
   * Limpia archivos huérfanos (sin referencias)
   */
  static async cleanupOrphanedFiles(): Promise<number> {
    try {
      console.log('🗑️ Limpiando archivos huérfanos...');
      
      // Eliminar documentos de carga sin carga asociada
      const { data: orphanedDocs, error: docsError } = await supabase
        .from('documentos_carga')
        .delete()
        .not('carga_id', 'in', 
          supabase.from('cargas_mercaderia').select('id')
        )
        .select('id');

      if (docsError) throw docsError;

      // Eliminar versiones de archivo sin archivo padre
      const { data: orphanedVersions, error: versionsError } = await supabase
        .from('versiones_archivo')
        .delete()
        .not('archivo_id', 'in',
          supabase.from('archivos').select('id')
        )
        .select('id');

      if (versionsError) throw versionsError;

      const totalCleaned = (orphanedDocs?.length || 0) + (orphanedVersions?.length || 0);
      
      console.log(`✅ ${totalCleaned} archivos huérfanos eliminados`);
      return totalCleaned;
    } catch (error) {
      console.error('❌ Error limpiando archivos huérfanos:', error);
      return 0;
    }
  }

  /**
   * Optimiza campos de texto eliminando espacios innecesarios
   */
  static async optimizeTextFields(): Promise<number> {
    try {
      console.log('✂️ Optimizando campos de texto...');
      
      const { data, error } = await supabase.rpc('optimize_text_fields');
      
      if (error) throw error;
      
      const optimizedCount = data?.optimized_count || 0;
      console.log(`✅ ${optimizedCount} campos de texto optimizados`);
      return optimizedCount;
    } catch (error) {
      console.error('❌ Error optimizando campos de texto:', error);
      return 0;
    }
  }

  /**
   * Programa limpieza automática (ejecutar mensualmente)
   */
  static async scheduleMonthlyCleanup(): Promise<void> {
    const lastCleanup = localStorage.getItem('last_db_cleanup');
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (!lastCleanup || new Date(lastCleanup) < oneMonthAgo) {
      console.log('📅 Ejecutando limpieza mensual programada...');
      
      await this.runCleanup();
      await this.cleanupOrphanedFiles();
      await this.optimizeTextFields();
      
      localStorage.setItem('last_db_cleanup', now.toISOString());
      console.log('✅ Limpieza mensual completada');
    }
  }
}

// Función helper para usar en el store
export const optimizeDatabase = () => DatabaseOptimizer.optimizeDatabase();
export const getSpaceUsage = () => DatabaseOptimizer.getSpaceUsage();
export const scheduleCleanup = () => DatabaseOptimizer.scheduleMonthlyCleanup();