// ===============================================
// MANEJO INTEGRAL DE ERRORES PARA OPERACIONES DE CARPETAS
// ===============================================

import { supabase } from './supabase';

// ===============================================
// TIPOS E INTERFACES DE ERROR
// ===============================================

export enum FolderErrorType {
  MISSING_MARCA = 'MISSING_MARCA',
  INVALID_TIPO_CARGA = 'INVALID_TIPO_CARGA',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  FOLDER_CREATION_FAILED = 'FOLDER_CREATION_FAILED',
  INCONSISTENT_DATA = 'INCONSISTENT_DATA',
  MIGRATION_ERROR = 'MIGRATION_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

export interface FolderError extends Error {
  type: FolderErrorType;
  code: string;
  details?: any;
  userMessage: string;
  technicalMessage: string;
  suggestions?: string[];
  recoverable: boolean;
  context?: Record<string, any>;
}

export interface ErrorLogEntry {
  id: string;
  timestamp: number;
  error: FolderError;
  operation: string;
  userId?: string;
  resolved: boolean;
  resolution?: string;
}

// ===============================================
// CLASE PRINCIPAL DE MANEJO DE ERRORES
// ===============================================

class FolderErrorHandler {
  private errorLog: ErrorLogEntry[] = [];
  private maxLogSize = 1000;
  private retryAttempts = new Map<string, number>();
  private maxRetries = 3;

  createError(
    type: FolderErrorType,
    message: string,
    details?: any,
    context?: Record<string, any>
  ): FolderError {
    const error = new Error(message) as FolderError;
    error.type = type;
    error.code = this.generateErrorCode(type);
    error.details = details;
    error.context = context;
    
    const errorInfo = this.getErrorInfo(type);
    error.userMessage = errorInfo.userMessage;
    error.technicalMessage = errorInfo.technicalMessage;
    error.suggestions = errorInfo.suggestions;
    error.recoverable = errorInfo.recoverable;

    return error;
  }

  private generateErrorCode(type: FolderErrorType): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 4);
    return `FOLDER_${type}_${timestamp}_${random}`.toUpperCase();
  }

  private getErrorInfo(type: FolderErrorType): {
    userMessage: string;
    technicalMessage: string;
    suggestions: string[];
    recoverable: boolean;
  } {
    switch (type) {
      case FolderErrorType.MISSING_MARCA:
        return {
          userMessage: 'No se pudo determinar la marca del producto para organizarlo en carpetas.',
          technicalMessage: 'Marca faltante o vacía en los datos del producto',
          suggestions: [
            'Verificar que el producto tenga una marca asignada',
            'Revisar la configuración de importación de datos',
            'Contactar al administrador si el problema persiste'
          ],
          recoverable: true
        };

      case FolderErrorType.INVALID_TIPO_CARGA:
        return {
          userMessage: 'El tipo de destino seleccionado no es válido.',
          technicalMessage: 'Tipo de carga no reconocido para organización de carpetas',
          suggestions: [
            'Seleccionar un tipo de destino válido (Stock, Cliente, Reparación)',
            'Verificar la configuración del formulario',
            'Contactar soporte técnico'
          ],
          recoverable: true
        };

      case FolderErrorType.DATABASE_ERROR:
        return {
          userMessage: 'Error al acceder a la base de datos. Intente nuevamente.',
          technicalMessage: 'Error de conexión o consulta a la base de datos',
          suggestions: [
            'Verificar conexión a internet',
            'Intentar la operación nuevamente',
            'Contactar al administrador del sistema'
          ],
          recoverable: true
        };

      case FolderErrorType.FOLDER_CREATION_FAILED:
        return {
          userMessage: 'No se pudo crear la estructura de carpetas automáticamente.',
          technicalMessage: 'Fallo en la creación de carpetas por marca',
          suggestions: [
            'Verificar permisos de escritura',
            'Revisar la configuración de carpetas',
            'Intentar con organización manual'
          ],
          recoverable: true
        };

      case FolderErrorType.INCONSISTENT_DATA:
        return {
          userMessage: 'Se detectaron inconsistencias en la organización de carpetas.',
          technicalMessage: 'Datos inconsistentes entre carpeta y ubicación física',
          suggestions: [
            'Ejecutar validación de consistencia',
            'Corregir datos manualmente',
            'Ejecutar migración de datos'
          ],
          recoverable: true
        };

      case FolderErrorType.MIGRATION_ERROR:
        return {
          userMessage: 'Error durante la migración de productos a carpetas.',
          technicalMessage: 'Fallo en el proceso de migración de estructura de carpetas',
          suggestions: [
            'Revisar logs de migración',
            'Ejecutar migración por lotes',
            'Contactar al administrador'
          ],
          recoverable: true
        };

      default:
        return {
          userMessage: 'Ha ocurrido un error inesperado.',
          technicalMessage: 'Error no categorizado en operaciones de carpetas',
          suggestions: [
            'Intentar la operación nuevamente',
            'Contactar soporte técnico'
          ],
          recoverable: false
        };
    }
  }

  logError(error: FolderError, operation: string, userId?: string): string {
    const logEntry: ErrorLogEntry = {
      id: this.generateErrorCode(error.type),
      timestamp: Date.now(),
      error,
      operation,
      userId,
      resolved: false
    };

    this.errorLog.push(logEntry);

    // Mantener tamaño del log
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Log técnico para debugging
    console.error(`[FOLDER_ERROR] ${operation}:`, {
      code: error.code,
      type: error.type,
      message: error.technicalMessage,
      details: error.details,
      context: error.context
    });

    return logEntry.id;
  }

  async handleError(error: any, operation: string, context?: Record<string, any>): Promise<FolderError> {
    let folderError: FolderError;

    if (error instanceof Error && 'type' in error) {
      folderError = error as FolderError;
    } else {
      // Convertir error genérico a FolderError
      folderError = this.categorizeError(error, context);
    }

    // Agregar contexto si no existe
    if (!folderError.context) {
      folderError.context = context;
    }

    // Registrar error
    const logId = this.logError(folderError, operation);

    // Intentar recuperación automática si es posible
    if (folderError.recoverable) {
      const recovered = await this.attemptRecovery(folderError, operation);
      if (recovered) {
        this.markErrorResolved(logId, 'Recuperación automática exitosa');
      }
    }

    return folderError;
  }

  private categorizeError(error: any, context?: Record<string, any>): FolderError {
    const errorMessage = error?.message || 'Error desconocido';
    const errorCode = error?.code;

    // Categorizar por código de error de Supabase
    if (errorCode) {
      switch (errorCode) {
        case 'PGRST116':
          return this.createError(
            FolderErrorType.DATABASE_ERROR,
            'No se encontraron registros',
            { originalError: error },
            context
          );
        case '23505':
          return this.createError(
            FolderErrorType.VALIDATION_ERROR,
            'Violación de restricción única',
            { originalError: error },
            context
          );
        case '23503':
          return this.createError(
            FolderErrorType.VALIDATION_ERROR,
            'Violación de clave foránea',
            { originalError: error },
            context
          );
        default:
          return this.createError(
            FolderErrorType.DATABASE_ERROR,
            errorMessage,
            { originalError: error, code: errorCode },
            context
          );
      }
    }

    // Categorizar por mensaje de error
    if (errorMessage.toLowerCase().includes('marca')) {
      return this.createError(
        FolderErrorType.MISSING_MARCA,
        errorMessage,
        { originalError: error },
        context
      );
    }

    if (errorMessage.toLowerCase().includes('tipo') || errorMessage.toLowerCase().includes('carga')) {
      return this.createError(
        FolderErrorType.INVALID_TIPO_CARGA,
        errorMessage,
        { originalError: error },
        context
      );
    }

    if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
      return this.createError(
        FolderErrorType.NETWORK_ERROR,
        errorMessage,
        { originalError: error },
        context
      );
    }

    // Error genérico
    return this.createError(
      FolderErrorType.DATABASE_ERROR,
      errorMessage,
      { originalError: error },
      context
    );
  }

  private async attemptRecovery(error: FolderError, operation: string): Promise<boolean> {
    const retryKey = `${operation}-${error.type}`;
    const currentAttempts = this.retryAttempts.get(retryKey) || 0;

    if (currentAttempts >= this.maxRetries) {
      console.warn(`Máximo de reintentos alcanzado para ${operation}`);
      return false;
    }

    this.retryAttempts.set(retryKey, currentAttempts + 1);

    try {
      switch (error.type) {
        case FolderErrorType.MISSING_MARCA:
          return await this.recoverMissingMarca(error);
        
        case FolderErrorType.INVALID_TIPO_CARGA:
          return await this.recoverInvalidTipoCarga(error);
        
        case FolderErrorType.FOLDER_CREATION_FAILED:
          return await this.recoverFolderCreation(error);
        
        case FolderErrorType.INCONSISTENT_DATA:
          return await this.recoverInconsistentData(error);
        
        default:
          return false;
      }
    } catch (recoveryError) {
      console.error(`Error durante recuperación de ${error.type}:`, recoveryError);
      return false;
    }
  }

  private async recoverMissingMarca(error: FolderError): Promise<boolean> {
    const context = error.context;
    if (!context?.producto) return false;

    // Intentar inferir marca desde el nombre del producto
    const marcaInferida = this.inferirMarcaDesdeNombre(context.producto.nombre || context.producto.producto);
    
    if (marcaInferida) {
      console.log(`Marca inferida para ${context.producto.nombre}: ${marcaInferida}`);
      context.producto.marca = marcaInferida;
      return true;
    }

    // Usar marca por defecto
    context.producto.marca = 'Sin Marca';
    console.warn(`Usando marca por defecto para ${context.producto.nombre}`);
    return true;
  }

  private async recoverInvalidTipoCarga(error: FolderError): Promise<boolean> {
    const context = error.context;
    if (!context) return false;

    // Usar tipo por defecto
    context.tipoCarga = 'stock';
    console.warn(`Usando tipo de carga por defecto: stock`);
    return true;
  }

  private async recoverFolderCreation(error: FolderError): Promise<boolean> {
    const context = error.context;
    if (!context?.producto) return false;

    // Intentar crear carpeta con configuración básica
    try {
      const carpetaBasica = {
        carpetaPrincipal: context.producto.marca || 'Sin Marca',
        ubicacionFisica: `Almacén General - Estante ${context.producto.marca || 'General'}`,
        rutaCompleta: context.producto.marca || 'Sin Marca',
        tipoDestino: 'stock'
      };

      context.carpetaInfo = carpetaBasica;
      console.log(`Carpeta básica creada para ${context.producto.nombre}`);
      return true;
    } catch (basicError) {
      console.error('Error creando carpeta básica:', basicError);
      return false;
    }
  }

  private async recoverInconsistentData(error: FolderError): Promise<boolean> {
    const context = error.context;
    if (!context?.componenteId) return false;

    try {
      // Intentar corregir inconsistencias automáticamente
      const { data: producto, error: fetchError } = await supabase
        .from('componentes_disponibles')
        .select('*')
        .eq('id', context.componenteId)
        .single();

      if (fetchError || !producto) return false;

      // Recalcular información de carpeta
      const carpetaCorrecta = this.determinarCarpetaCorrecta(producto);
      
      // Actualizar en base de datos
      const { error: updateError } = await supabase
        .from('componentes_disponibles')
        .update({
          carpeta_principal: carpetaCorrecta.carpetaPrincipal,
          subcarpeta: carpetaCorrecta.subcarpeta || null,
          ruta_carpeta: carpetaCorrecta.rutaCompleta,
          ubicacion_fisica: carpetaCorrecta.ubicacionFisica,
          updated_at: new Date().toISOString()
        })
        .eq('id', context.componenteId);

      if (updateError) throw updateError;

      console.log(`Inconsistencia corregida para producto ${producto.nombre}`);
      return true;
    } catch (correctionError) {
      console.error('Error corrigiendo inconsistencia:', correctionError);
      return false;
    }
  }

  private inferirMarcaDesdeNombre(nombre: string): string | null {
    if (!nombre) return null;

    const nombreLower = nombre.toLowerCase();
    const marcasConocidas = [
      'ares', 'classys', 'hydrafacial', 'venus', 'candela', 'fotona',
      'lumenis', 'zimmer', 'philips', 'siemens', 'endymed', 'bodyhealth',
      'intermedic', 'ultraformer', 'hifu', 'ipl', 'laser'
    ];

    for (const marca of marcasConocidas) {
      if (nombreLower.includes(marca)) {
        return marca.charAt(0).toUpperCase() + marca.slice(1);
      }
    }

    return null;
  }

  private determinarCarpetaCorrecta(producto: any): {
    carpetaPrincipal: string;
    subcarpeta?: string;
    rutaCompleta: string;
    ubicacionFisica: string;
  } {
    const marca = producto.marca || 'Sin Marca';
    const tipoDestino = producto.tipo_destino || 'stock';

    if (tipoDestino === 'reparacion') {
      return {
        carpetaPrincipal: 'Servicio Técnico',
        subcarpeta: marca,
        rutaCompleta: `Servicio Técnico/${marca}`,
        ubicacionFisica: `Servicio Técnico - Estante ${marca}`
      };
    } else {
      return {
        carpetaPrincipal: marca,
        rutaCompleta: marca,
        ubicacionFisica: `Almacén General - Estante ${marca}`
      };
    }
  }

  markErrorResolved(logId: string, resolution: string): void {
    const entry = this.errorLog.find(e => e.id === logId);
    if (entry) {
      entry.resolved = true;
      entry.resolution = resolution;
    }
  }

  getErrorLog(resolved?: boolean): ErrorLogEntry[] {
    if (resolved === undefined) {
      return [...this.errorLog];
    }
    return this.errorLog.filter(e => e.resolved === resolved);
  }

  getErrorStats(): {
    total: number;
    resolved: number;
    byType: Record<FolderErrorType, number>;
    recentErrors: ErrorLogEntry[];
  } {
    const byType = {} as Record<FolderErrorType, number>;
    let resolved = 0;

    for (const entry of this.errorLog) {
      byType[entry.error.type] = (byType[entry.error.type] || 0) + 1;
      if (entry.resolved) resolved++;
    }

    const recentErrors = this.errorLog
      .filter(e => Date.now() - e.timestamp < 24 * 60 * 60 * 1000) // Últimas 24 horas
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    return {
      total: this.errorLog.length,
      resolved,
      byType,
      recentErrors
    };
  }

  clearErrorLog(): void {
    this.errorLog = [];
    this.retryAttempts.clear();
  }
}

// ===============================================
// FUNCIONES DE UTILIDAD CON MANEJO DE ERRORES
// ===============================================

const errorHandler = new FolderErrorHandler();

export async function ejecutarConManejoErrores<T>(
  operation: () => Promise<T>,
  operationName: string,
  context?: Record<string, any>
): Promise<{ success: boolean; data?: T; error?: FolderError }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const folderError = await errorHandler.handleError(error, operationName, context);
    return { success: false, error: folderError };
  }
}

export function validarDatosProducto(producto: any): { valid: boolean; errors: FolderError[] } {
  const errors: FolderError[] = [];

  if (!producto.marca || producto.marca.trim() === '') {
    errors.push(errorHandler.createError(
      FolderErrorType.MISSING_MARCA,
      'Marca requerida para organización en carpetas',
      { producto },
      { validacion: 'marca' }
    ));
  }

  if (!producto.nombre || producto.nombre.trim() === '') {
    errors.push(errorHandler.createError(
      FolderErrorType.VALIDATION_ERROR,
      'Nombre de producto requerido',
      { producto },
      { validacion: 'nombre' }
    ));
  }

  if (producto.cantidad !== undefined && (isNaN(producto.cantidad) || producto.cantidad < 0)) {
    errors.push(errorHandler.createError(
      FolderErrorType.VALIDATION_ERROR,
      'Cantidad debe ser un número positivo',
      { producto },
      { validacion: 'cantidad' }
    ));
  }

  return { valid: errors.length === 0, errors };
}

export function validarTipoCarga(tipoCarga: string): { valid: boolean; error?: FolderError } {
  const tiposValidos = ['stock', 'cliente', 'reparacion'];
  
  if (!tipoCarga || !tiposValidos.includes(tipoCarga)) {
    return {
      valid: false,
      error: errorHandler.createError(
        FolderErrorType.INVALID_TIPO_CARGA,
        `Tipo de carga inválido: ${tipoCarga}`,
        { tipoCarga, tiposValidos },
        { validacion: 'tipoCarga' }
      )
    };
  }

  return { valid: true };
}

// ===============================================
// FUNCIONES DE LOGGING Y MONITOREO
// ===============================================

export function logOperacionCarpeta(
  operacion: string,
  exito: boolean,
  detalles?: any,
  tiempoEjecucion?: number
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    operacion,
    exito,
    detalles,
    tiempoEjecucion
  };

  console.log(`[FOLDER_OPERATION] ${operacion}:`, logEntry);

  // En producción, esto se enviaría a un servicio de logging
  if (!exito) {
    console.error(`[FOLDER_OPERATION_ERROR] ${operacion} falló:`, detalles);
  }
}

export function generarReporteErrores(): {
  resumen: ReturnType<typeof errorHandler.getErrorStats>;
  erroresRecientes: ErrorLogEntry[];
  recomendaciones: string[];
} {
  const stats = errorHandler.getErrorStats();
  const erroresNoResueltos = errorHandler.getErrorLog(false);
  
  const recomendaciones: string[] = [];

  // Generar recomendaciones basadas en errores frecuentes
  if (stats.byType[FolderErrorType.MISSING_MARCA] > 5) {
    recomendaciones.push('Considerar validación más estricta de marcas en el formulario de ingreso');
  }

  if (stats.byType[FolderErrorType.DATABASE_ERROR] > 3) {
    recomendaciones.push('Revisar estabilidad de la conexión a base de datos');
  }

  if (stats.byType[FolderErrorType.INCONSISTENT_DATA] > 2) {
    recomendaciones.push('Ejecutar validación de consistencia de datos');
  }

  if (stats.resolved / stats.total < 0.8) {
    recomendaciones.push('Mejorar mecanismos de recuperación automática de errores');
  }

  return {
    resumen: stats,
    erroresRecientes: erroresNoResueltos.slice(0, 20),
    recomendaciones
  };
}

// ===============================================
// EXPORTACIONES
// ===============================================

export {
  errorHandler,
  FolderErrorHandler,
  type FolderError,
  type ErrorLogEntry
};