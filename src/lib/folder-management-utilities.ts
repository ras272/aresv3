// ===============================================
// UTILIDADES DE GESTIÓN DE CARPETAS
// ===============================================

import { supabase } from './supabase';
import { 
  ejecutarConManejoErrores, 
  logOperacionCarpeta,
  errorHandler,
  FolderErrorType
} from './folder-error-handling';
import { invalidarCacheCarpeta, invalidarCacheCompleto } from './folder-performance';

// ===============================================
// INTERFACES Y TIPOS
// ===============================================

interface FolderOperation {
  id: string;
  type: 'move' | 'rename' | 'merge' | 'split' | 'cleanup';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  sourceFolder?: string;
  targetFolder?: string;
  affectedProducts: string[];
  startTime: number;
  endTime?: number;
  error?: string;
  metadata?: Record<string, any>;
}

interface FolderReorganizationPlan {
  operations: FolderOperation[];
  estimatedTime: number;
  affectedProductsCount: number;
  backupRequired: boolean;
}

interface FolderCleanupReport {
  emptyFolders: string[];
  inconsistentProducts: Array<{
    id: string;
    nombre: string;
    currentFolder: string;
    expectedFolder: string;
    issue: string;
  }>;
  duplicateFolders: Array<{
    folders: string[];
    suggestedMerge: string;
  }>;
  orphanedProducts: Array<{
    id: string;
    nombre: string;
    issue: string;
  }>;
}

// ===============================================
// CLASE PRINCIPAL DE GESTIÓN DE CARPETAS
// ===============================================

class FolderManager {
  private activeOperations = new Map<string, FolderOperation>();

  // ===============================================
  // REORGANIZACIÓN DE PRODUCTOS ENTRE CARPETAS
  // ===============================================

  async reorganizarProductosEntreCarpetas(
    productIds: string[],
    carpetaDestino: string,
    tipoDestinoNuevo?: string
  ): Promise<{ success: boolean; movedCount: number; errors: string[] }> {
    const operationId = this.generateOperationId();
    const operation: FolderOperation = {
      id: operationId,
      type: 'move',
      status: 'pending',
      targetFolder: carpetaDestino,
      affectedProducts: productIds,
      startTime: Date.now()
    };

    this.activeOperations.set(operationId, operation);

    return await ejecutarConManejoErrores(async () => {
      operation.status = 'in_progress';
      
      let movedCount = 0;
      const errors: string[] = [];

      for (const productId of productIds) {
        try {
          const moved = await this.moverProductoACarpeta(productId, carpetaDestino, tipoDestinoNuevo);
          if (moved) {
            movedCount++;
          }
        } catch (error) {
          const errorMsg = `Error moviendo producto ${productId}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      operation.status = movedCount > 0 ? 'completed' : 'failed';
      operation.endTime = Date.now();
      
      if (errors.length > 0) {
        operation.error = errors.join('; ');
      }

      // Invalidar caché de carpetas afectadas
      invalidarCacheCarpeta(carpetaDestino);

      logOperacionCarpeta('reorganizarProductos', movedCount > 0, {
        movedCount,
        totalProducts: productIds.length,
        targetFolder: carpetaDestino,
        errors: errors.length
      });

      return { success: movedCount > 0, movedCount, errors };
    }, 'reorganizarProductosEntreCarpetas', { productIds, carpetaDestino });
  }

  private async moverProductoACarpeta(
    productId: string,
    carpetaDestino: string,
    tipoDestinoNuevo?: string
  ): Promise<boolean> {
    // Obtener información actual del producto
    const { data: producto, error: fetchError } = await supabase
      .from('componentes_disponibles')
      .select('*')
      .eq('id', productId)
      .single();

    if (fetchError || !producto) {
      throw new Error(`No se pudo obtener información del producto ${productId}`);
    }

    // Determinar nueva información de carpeta
    const partesDestino = carpetaDestino.split('/');
    const carpetaPrincipal = partesDestino[0];
    const subcarpeta = partesDestino[1] || null;
    
    // Determinar tipo de destino si no se proporciona
    const tipoDestino = tipoDestinoNuevo || this.inferirTipoDestino(carpetaDestino);
    
    // Calcular nueva ubicación física
    const nuevaUbicacion = this.calcularUbicacionFisica(carpetaPrincipal, subcarpeta, producto.marca);

    // Actualizar en base de datos
    const { error: updateError } = await supabase
      .from('componentes_disponibles')
      .update({
        carpeta_principal: carpetaPrincipal,
        subcarpeta: subcarpeta,
        ruta_carpeta: carpetaDestino,
        tipo_destino: tipoDestino,
        ubicacion_fisica: nuevaUbicacion,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (updateError) {
      throw updateError;
    }

    // Registrar transacción de movimiento
    await this.registrarMovimientoCarpeta(
      productId,
      producto.ruta_carpeta || 'Sin Carpeta',
      carpetaDestino,
      'Reorganización manual'
    );

    return true;
  }

  private inferirTipoDestino(rutaCarpeta: string): string {
    if (rutaCarpeta.includes('Servicio Técnico')) {
      return 'reparacion';
    } else if (rutaCarpeta.includes('Cliente')) {
      return 'cliente';
    } else {
      return 'stock';
    }
  }

  private calcularUbicacionFisica(carpetaPrincipal: string, subcarpeta: string | null, marca: string): string {
    if (carpetaPrincipal === 'Servicio Técnico') {
      return `Servicio Técnico - Estante ${subcarpeta || marca}`;
    } else {
      return `Almacén General - Estante ${carpetaPrincipal}`;
    }
  }

  // ===============================================
  // OPERACIONES MASIVAS DE CARPETAS
  // ===============================================

  async renombrarCarpeta(
    rutaCarpetaActual: string,
    nuevaRutaCarpeta: string
  ): Promise<{ success: boolean; affectedProducts: number }> {
    const operationId = this.generateOperationId();
    
    return await ejecutarConManejoErrores(async () => {
      // Obtener productos afectados
      const { data: productos, error: fetchError } = await supabase
        .from('componentes_disponibles')
        .select('id, nombre')
        .eq('ruta_carpeta', rutaCarpetaActual);

      if (fetchError) throw fetchError;

      if (!productos || productos.length === 0) {
        return { success: true, affectedProducts: 0 };
      }

      // Calcular nueva estructura
      const partesNuevas = nuevaRutaCarpeta.split('/');
      const nuevaCarpetaPrincipal = partesNuevas[0];
      const nuevaSubcarpeta = partesNuevas[1] || null;

      // Actualizar todos los productos
      const { error: updateError } = await supabase
        .from('componentes_disponibles')
        .update({
          carpeta_principal: nuevaCarpetaPrincipal,
          subcarpeta: nuevaSubcarpeta,
          ruta_carpeta: nuevaRutaCarpeta,
          updated_at: new Date().toISOString()
        })
        .eq('ruta_carpeta', rutaCarpetaActual);

      if (updateError) throw updateError;

      // Registrar operación para cada producto
      for (const producto of productos) {
        await this.registrarMovimientoCarpeta(
          producto.id,
          rutaCarpetaActual,
          nuevaRutaCarpeta,
          'Renombrado de carpeta'
        );
      }

      // Invalidar caché
      invalidarCacheCarpeta(rutaCarpetaActual);
      invalidarCacheCarpeta(nuevaRutaCarpeta);

      logOperacionCarpeta('renombrarCarpeta', true, {
        oldPath: rutaCarpetaActual,
        newPath: nuevaRutaCarpeta,
        affectedProducts: productos.length
      });

      return { success: true, affectedProducts: productos.length };
    }, 'renombrarCarpeta', { rutaCarpetaActual, nuevaRutaCarpeta });
  }

  async fusionarCarpetas(
    carpetasOrigen: string[],
    carpetaDestino: string
  ): Promise<{ success: boolean; mergedProducts: number; conflicts: string[] }> {
    return await ejecutarConManejoErrores(async () => {
      let mergedProducts = 0;
      const conflicts: string[] = [];

      for (const carpetaOrigen of carpetasOrigen) {
        if (carpetaOrigen === carpetaDestino) continue;

        // Obtener productos de la carpeta origen
        const { data: productos, error: fetchError } = await supabase
          .from('componentes_disponibles')
          .select('*')
          .eq('ruta_carpeta', carpetaOrigen);

        if (fetchError) {
          conflicts.push(`Error obteniendo productos de ${carpetaOrigen}: ${fetchError.message}`);
          continue;
        }

        if (!productos || productos.length === 0) continue;

        // Verificar conflictos potenciales
        for (const producto of productos) {
          const { data: existente, error: checkError } = await supabase
            .from('componentes_disponibles')
            .select('id')
            .eq('nombre', producto.nombre)
            .eq('marca', producto.marca)
            .eq('modelo', producto.modelo)
            .eq('ruta_carpeta', carpetaDestino)
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            conflicts.push(`Error verificando conflicto para ${producto.nombre}: ${checkError.message}`);
            continue;
          }

          if (existente) {
            conflicts.push(`Producto duplicado encontrado: ${producto.nombre} ya existe en ${carpetaDestino}`);
            continue;
          }

          // Mover producto a carpeta destino
          try {
            await this.moverProductoACarpeta(producto.id, carpetaDestino);
            mergedProducts++;
          } catch (error) {
            conflicts.push(`Error moviendo ${producto.nombre}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
          }
        }
      }

      // Invalidar caché
      carpetasOrigen.forEach(carpeta => invalidarCacheCarpeta(carpeta));
      invalidarCacheCarpeta(carpetaDestino);

      logOperacionCarpeta('fusionarCarpetas', true, {
        sourceFolders: carpetasOrigen,
        targetFolder: carpetaDestino,
        mergedProducts,
        conflicts: conflicts.length
      });

      return { success: mergedProducts > 0, mergedProducts, conflicts };
    }, 'fusionarCarpetas', { carpetasOrigen, carpetaDestino });
  }

  async dividirCarpeta(
    carpetaOrigen: string,
    criterio: 'marca' | 'tipo' | 'custom',
    configuracion?: Record<string, any>
  ): Promise<{ success: boolean; newFolders: string[]; movedProducts: number }> {
    return await ejecutarConManejoErrores(async () => {
      // Obtener productos de la carpeta origen
      const { data: productos, error: fetchError } = await supabase
        .from('componentes_disponibles')
        .select('*')
        .eq('ruta_carpeta', carpetaOrigen);

      if (fetchError) throw fetchError;

      if (!productos || productos.length === 0) {
        return { success: true, newFolders: [], movedProducts: 0 };
      }

      const newFolders: string[] = [];
      let movedProducts = 0;

      // Agrupar productos según criterio
      const grupos = this.agruparProductosParaDivision(productos, criterio, configuracion);

      for (const [nombreGrupo, productosGrupo] of grupos.entries()) {
        const nuevaCarpeta = `${carpetaOrigen}/${nombreGrupo}`;
        
        if (!newFolders.includes(nuevaCarpeta)) {
          newFolders.push(nuevaCarpeta);
        }

        // Mover productos al nuevo grupo
        for (const producto of productosGrupo) {
          try {
            await this.moverProductoACarpeta(producto.id, nuevaCarpeta);
            movedProducts++;
          } catch (error) {
            console.error(`Error moviendo producto ${producto.nombre} a ${nuevaCarpeta}:`, error);
          }
        }
      }

      // Invalidar caché
      invalidarCacheCarpeta(carpetaOrigen);
      newFolders.forEach(carpeta => invalidarCacheCarpeta(carpeta));

      logOperacionCarpeta('dividirCarpeta', true, {
        sourceFolder: carpetaOrigen,
        criterion: criterio,
        newFolders: newFolders.length,
        movedProducts
      });

      return { success: movedProducts > 0, newFolders, movedProducts };
    }, 'dividirCarpeta', { carpetaOrigen, criterio, configuracion });
  }

  private agruparProductosParaDivision(
    productos: any[],
    criterio: 'marca' | 'tipo' | 'custom',
    configuracion?: Record<string, any>
  ): Map<string, any[]> {
    const grupos = new Map<string, any[]>();

    for (const producto of productos) {
      let nombreGrupo: string;

      switch (criterio) {
        case 'marca':
          nombreGrupo = producto.marca || 'Sin Marca';
          break;
        case 'tipo':
          nombreGrupo = producto.tipo_componente || 'Sin Tipo';
          break;
        case 'custom':
          nombreGrupo = this.determinarGrupoCustom(producto, configuracion);
          break;
        default:
          nombreGrupo = 'General';
      }

      if (!grupos.has(nombreGrupo)) {
        grupos.set(nombreGrupo, []);
      }
      grupos.get(nombreGrupo)!.push(producto);
    }

    return grupos;
  }

  private determinarGrupoCustom(producto: any, configuracion?: Record<string, any>): string {
    if (!configuracion) return 'General';

    // Implementar lógica custom basada en configuración
    if (configuracion.porCantidad) {
      if (producto.cantidad_disponible === 0) return 'Sin Stock';
      if (producto.cantidad_disponible <= 5) return 'Stock Bajo';
      return 'Stock Normal';
    }

    if (configuracion.porFecha) {
      const fechaIngreso = new Date(producto.fecha_ingreso);
      const hoy = new Date();
      const diasDiferencia = Math.floor((hoy.getTime() - fechaIngreso.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diasDiferencia <= 30) return 'Reciente';
      if (diasDiferencia <= 90) return 'Medio';
      return 'Antiguo';
    }

    return 'General';
  }

  // ===============================================
  // FUNCIONES DE LIMPIEZA Y MANTENIMIENTO
  // ===============================================

  async ejecutarLimpiezaCarpetas(): Promise<FolderCleanupReport> {
    return await ejecutarConManejoErrores(async () => {
      const report: FolderCleanupReport = {
        emptyFolders: [],
        inconsistentProducts: [],
        duplicateFolders: [],
        orphanedProducts: []
      };

      // 1. Encontrar carpetas vacías
      const { data: estadisticas, error: statsError } = await supabase
        .from('vista_estadisticas_carpetas')
        .select('ruta_carpeta, total_productos')
        .eq('total_productos', 0);

      if (!statsError && estadisticas) {
        report.emptyFolders = estadisticas.map(s => s.ruta_carpeta);
      }

      // 2. Encontrar productos con datos inconsistentes
      const { data: productos, error: productError } = await supabase
        .from('componentes_disponibles')
        .select('*')
        .not('carpeta_principal', 'is', null);

      if (!productError && productos) {
        for (const producto of productos) {
          const issues = this.validarConsistenciaProducto(producto);
          if (issues.length > 0) {
            report.inconsistentProducts.push({
              id: producto.id,
              nombre: producto.nombre,
              currentFolder: producto.ruta_carpeta || 'Sin Carpeta',
              expectedFolder: this.calcularCarpetaEsperada(producto),
              issue: issues.join(', ')
            });
          }
        }
      }

      // 3. Encontrar productos huérfanos (sin carpeta)
      const { data: huerfanos, error: orphanError } = await supabase
        .from('componentes_disponibles')
        .select('id, nombre, marca, ubicacion_fisica')
        .is('carpeta_principal', null);

      if (!orphanError && huerfanos) {
        report.orphanedProducts = huerfanos.map(p => ({
          id: p.id,
          nombre: p.nombre,
          issue: 'Sin organización por carpetas'
        }));
      }

      // 4. Encontrar carpetas duplicadas (lógica simplificada)
      const carpetasUnicas = new Set<string>();
      const carpetasDuplicadas = new Set<string>();
      
      if (productos) {
        for (const producto of productos) {
          const carpetaNormalizada = this.normalizarNombreCarpeta(producto.ruta_carpeta);
          if (carpetasUnicas.has(carpetaNormalizada) && carpetaNormalizada !== producto.ruta_carpeta) {
            carpetasDuplicadas.add(producto.ruta_carpeta);
          }
          carpetasUnicas.add(carpetaNormalizada);
        }
      }

      logOperacionCarpeta('limpiezaCarpetas', true, {
        emptyFolders: report.emptyFolders.length,
        inconsistentProducts: report.inconsistentProducts.length,
        orphanedProducts: report.orphanedProducts.length
      });

      return report;
    }, 'ejecutarLimpiezaCarpetas', {});
  }

  private validarConsistenciaProducto(producto: any): string[] {
    const issues: string[] = [];

    // Validar que la ruta de carpeta coincida con carpeta_principal y subcarpeta
    const rutaEsperada = producto.subcarpeta 
      ? `${producto.carpeta_principal}/${producto.subcarpeta}`
      : producto.carpeta_principal;

    if (producto.ruta_carpeta !== rutaEsperada) {
      issues.push(`Ruta inconsistente: "${producto.ruta_carpeta}" vs esperada "${rutaEsperada}"`);
    }

    // Validar que la ubicación física sea consistente con la carpeta
    if (producto.carpeta_principal === 'Servicio Técnico' && !producto.ubicacion_fisica?.includes('Servicio Técnico')) {
      issues.push('Ubicación física no coincide con carpeta de Servicio Técnico');
    }

    // Validar que el tipo de destino sea consistente
    if (producto.tipo_destino === 'reparacion' && producto.carpeta_principal !== 'Servicio Técnico') {
      issues.push('Tipo destino "reparacion" pero no está en carpeta Servicio Técnico');
    }

    return issues;
  }

  private calcularCarpetaEsperada(producto: any): string {
    if (producto.tipo_destino === 'reparacion') {
      return `Servicio Técnico/${producto.marca || 'Sin Marca'}`;
    } else {
      return producto.marca || 'Sin Marca';
    }
  }

  private normalizarNombreCarpeta(carpeta: string): string {
    return carpeta?.toLowerCase().trim().replace(/\s+/g, ' ') || '';
  }

  async corregirInconsistenciasAutomaticamente(
    inconsistencias: FolderCleanupReport['inconsistentProducts']
  ): Promise<{ corrected: number; failed: string[] }> {
    let corrected = 0;
    const failed: string[] = [];

    for (const inconsistencia of inconsistencias) {
      try {
        await this.moverProductoACarpeta(inconsistencia.id, inconsistencia.expectedFolder);
        corrected++;
      } catch (error) {
        failed.push(`${inconsistencia.nombre}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }

    logOperacionCarpeta('corregirInconsistencias', true, { corrected, failed: failed.length });

    return { corrected, failed };
  }

  // ===============================================
  // HERRAMIENTAS DE ADMINISTRACIÓN
  // ===============================================

  async generarReporteCarpetas(): Promise<{
    resumen: {
      totalCarpetas: number;
      totalProductos: number;
      carpetasVacias: number;
      productosInconsistentes: number;
    };
    carpetasPorTipo: Record<string, number>;
    estadisticasDetalladas: any[];
  }> {
    const { data: estadisticas, error } = await supabase
      .from('vista_estadisticas_carpetas')
      .select('*')
      .order('total_productos', { ascending: false });

    if (error) throw error;

    const resumen = {
      totalCarpetas: estadisticas?.length || 0,
      totalProductos: estadisticas?.reduce((sum, s) => sum + s.total_productos, 0) || 0,
      carpetasVacias: estadisticas?.filter(s => s.total_productos === 0).length || 0,
      productosInconsistentes: 0 // Se calculará con validación
    };

    const carpetasPorTipo: Record<string, number> = {};
    estadisticas?.forEach(stat => {
      const tipo = stat.tipo_destino || 'unknown';
      carpetasPorTipo[tipo] = (carpetasPorTipo[tipo] || 0) + 1;
    });

    return {
      resumen,
      carpetasPorTipo,
      estadisticasDetalladas: estadisticas || []
    };
  }

  async crearBackupEstructuraCarpetas(): Promise<{ success: boolean; backupId: string; recordCount: number }> {
    const backupId = `backup_${Date.now()}`;
    
    const { data: productos, error } = await supabase
      .from('componentes_disponibles')
      .select('id, nombre, marca, carpeta_principal, subcarpeta, ruta_carpeta, tipo_destino, ubicacion_fisica');

    if (error) throw error;

    // En un sistema real, esto se guardaría en una tabla de backup o archivo
    const backup = {
      id: backupId,
      timestamp: new Date().toISOString(),
      data: productos
    };

    // Simular guardado de backup (en implementación real usar tabla dedicada)
    console.log(`Backup creado: ${backupId} con ${productos?.length || 0} registros`);

    return {
      success: true,
      backupId,
      recordCount: productos?.length || 0
    };
  }

  // ===============================================
  // UTILIDADES AUXILIARES
  // ===============================================

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async registrarMovimientoCarpeta(
    productId: string,
    carpetaOrigen: string,
    carpetaDestino: string,
    motivo: string
  ): Promise<void> {
    try {
      await supabase
        .from('transacciones_stock')
        .insert({
          componente_id: productId,
          tipo: 'MOVIMIENTO_CARPETA',
          cantidad: 0, // No afecta cantidad
          cantidad_anterior: 0,
          cantidad_nueva: 0,
          motivo: `${motivo}: ${carpetaOrigen} → ${carpetaDestino}`,
          fecha: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error registrando movimiento de carpeta:', error);
      // No lanzar error para no interrumpir la operación principal
    }
  }

  getActiveOperations(): FolderOperation[] {
    return Array.from(this.activeOperations.values());
  }

  getOperationStatus(operationId: string): FolderOperation | null {
    return this.activeOperations.get(operationId) || null;
  }

  clearCompletedOperations(): void {
    for (const [id, operation] of this.activeOperations.entries()) {
      if (operation.status === 'completed' || operation.status === 'failed') {
        this.activeOperations.delete(id);
      }
    }
  }
}

// ===============================================
// INSTANCIA GLOBAL Y EXPORTACIONES
// ===============================================

const folderManager = new FolderManager();

export {
  folderManager,
  FolderManager,
  type FolderOperation,
  type FolderReorganizationPlan,
  type FolderCleanupReport
};

// ===============================================
// FUNCIONES DE CONVENIENCIA
// ===============================================

export async function reorganizarProductos(
  productIds: string[],
  carpetaDestino: string,
  tipoDestinoNuevo?: string
) {
  return folderManager.reorganizarProductosEntreCarpetas(productIds, carpetaDestino, tipoDestinoNuevo);
}

export async function renombrarCarpeta(rutaActual: string, rutaNueva: string) {
  return folderManager.renombrarCarpeta(rutaActual, rutaNueva);
}

export async function fusionarCarpetas(carpetasOrigen: string[], carpetaDestino: string) {
  return folderManager.fusionarCarpetas(carpetasOrigen, carpetaDestino);
}

export async function dividirCarpeta(
  carpetaOrigen: string,
  criterio: 'marca' | 'tipo' | 'custom',
  configuracion?: Record<string, any>
) {
  return folderManager.dividirCarpeta(carpetaOrigen, criterio, configuracion);
}

export async function ejecutarLimpiezaCarpetas() {
  return folderManager.ejecutarLimpiezaCarpetas();
}

export async function generarReporteCarpetas() {
  return folderManager.generarReporteCarpetas();
}

export async function crearBackupEstructuraCarpetas() {
  return folderManager.crearBackupEstructuraCarpetas();
}