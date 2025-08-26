// 🔄 Sistema de sincronización automática de productos
// Mantiene consistencia de nombres entre catálogo y todas las demás tablas

import { supabase } from './database/shared/supabase';
import { generarClaveProducto, normalizarNombreProducto, normalizarMarca, normalizarModelo } from './product-normalization';

export interface ProductoUpdate {
  nombreAnterior: string;
  marcaAnterior: string;
  modeloAnterior?: string;
  nombreNuevo: string;
  marcaNueva: string;
  modeloNuevo?: string;
  categoriaProducto?: string;
}

export interface SyncResult {
  success: boolean;
  tablasSincronizadas: string[];
  registrosActualizados: number;
  errores: string[];
  detalles: {
    tabla: string;
    actualizados: number;
    error?: string;
  }[];
}

/**
 * Sincroniza automáticamente el cambio de nombre de un producto en todas las tablas relacionadas
 */
export async function sincronizarProductoEnTodasLasTablas(
  productId: string,
  cambios: ProductoUpdate
): Promise<SyncResult> {
  
  const resultado: SyncResult = {
    success: false,
    tablasSincronizadas: [],
    registrosActualizados: 0,
    errores: [],
    detalles: []
  };

  console.log('🔄 Iniciando sincronización de producto:', {
    productId,
    cambios
  });

  try {
    // 1. Actualizar stock_items
    const stockResult = await actualizarStockItems(cambios);
    resultado.detalles.push(stockResult);
    if (stockResult.error) {
      resultado.errores.push(`stock_items: ${stockResult.error}`);
    } else {
      resultado.tablasSincronizadas.push('stock_items');
      resultado.registrosActualizados += stockResult.actualizados;
    }

    // 2. Omitir componentes_disponibles - tabla eliminada según migración del proyecto
    console.log('⚠️ Saltando componentes_disponibles: tabla eliminada en migración a stock_items');
    resultado.detalles.push({ tabla: 'componentes_disponibles', actualizados: 0 }); // Registro sin error
    resultado.tablasSincronizadas.push('componentes_disponibles (omitida)');

    // 3. Actualizar productos_carga
    const cargaResult = await actualizarProductosCarga(cambios);
    resultado.detalles.push(cargaResult);
    if (cargaResult.error) {
      resultado.errores.push(`productos_carga: ${cargaResult.error}`);
    } else {
      resultado.tablasSincronizadas.push('productos_carga');
      resultado.registrosActualizados += cargaResult.actualizados;
    }

    // 4. Actualizar movimientos_stock (campo descripcion JSON)
    const movimientosResult = await actualizarMovimientosStock(cambios);
    resultado.detalles.push(movimientosResult);
    if (movimientosResult.error) {
      resultado.errores.push(`movimientos_stock: ${movimientosResult.error}`);
    } else {
      resultado.tablasSincronizadas.push('movimientos_stock');
      resultado.registrosActualizados += movimientosResult.actualizados;
    }

    // 5. Actualizar remisiones (productos_remision)
    const remisionesResult = await actualizarProductosRemision(cambios);
    resultado.detalles.push(remisionesResult);
    if (remisionesResult.error) {
      resultado.errores.push(`productos_remision: ${remisionesResult.error}`);
    } else {
      resultado.tablasSincronizadas.push('productos_remision');
      resultado.registrosActualizados += remisionesResult.actualizados;
    }

    // 6. Actualizar equipos
    const equiposResult = await actualizarEquipos(cambios);
    resultado.detalles.push(equiposResult);
    if (equiposResult.error) {
      resultado.errores.push(`equipos: ${equiposResult.error}`);
    } else {
      resultado.tablasSincronizadas.push('equipos');
      resultado.registrosActualizados += equiposResult.actualizados;
    }

    // Determinar éxito general
    resultado.success = resultado.errores.length === 0 || resultado.registrosActualizados > 0;

    console.log('✅ Sincronización completada:', resultado);
    return resultado;

  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    const errorMessage: string = error && typeof error === 'object' && 'message' in error 
      ? (error as any).message 
      : String(error);
    resultado.errores.push(`Error general: ${errorMessage}`);
    return resultado;
  }
}

/**
 * Actualiza registros en stock_items
 */
async function actualizarStockItems(cambios: ProductoUpdate): Promise<{ tabla: string; actualizados: number; error?: string }> {
  try {
    console.log('🔄 Actualizando stock_items...');
    
    // Buscar registros que coincidan con los criterios anteriores
    const { data: registrosExistentes, error: findError } = await supabase
      .from('stock_items')
      .select('id')
      .eq('nombre', cambios.nombreAnterior)
      .eq('marca', cambios.marcaAnterior);

    if (findError) throw findError;

    if (!registrosExistentes || registrosExistentes.length === 0) {
      return { tabla: 'stock_items', actualizados: 0 };
    }

    // Actualizar registros encontrados
    const updateData: any = {
      nombre: cambios.nombreNuevo,
      marca: cambios.marcaNueva,
      updated_at: new Date().toISOString()
    };
    
    // Solo incluir modelo si está definido, usar 'N/A' como fallback
    if (cambios.modeloNuevo !== undefined && cambios.modeloNuevo !== null) {
      updateData.modelo = cambios.modeloNuevo || 'N/A';
    } else {
      updateData.modelo = 'N/A';
    }

    const { error: updateError } = await supabase
      .from('stock_items')
      .update(updateData)
      .eq('nombre', cambios.nombreAnterior)
      .eq('marca', cambios.marcaAnterior);

    if (updateError) throw updateError;

    console.log(`✅ Actualizados ${registrosExistentes.length} registros en stock_items`);
    return { tabla: 'stock_items', actualizados: registrosExistentes.length };

  } catch (error) {
    console.error('❌ Error actualizando stock_items:', error);
    const errorMessage: string = error && typeof error === 'object' && 'message' in error 
      ? (error as any).message 
      : String(error);
    return { tabla: 'stock_items', actualizados: 0, error: errorMessage };
  }
}

/**
 * Actualiza registros en componentes_disponibles
 */
async function actualizarComponentesDisponibles(cambios: ProductoUpdate): Promise<{ tabla: string; actualizados: number; error?: string }> {
  try {
    console.log('🔄 Actualizando componentes_disponibles...');
    
    const { data: registrosExistentes, error: findError } = await supabase
      .from('componentes_disponibles')
      .select('id')
      .eq('nombre', cambios.nombreAnterior)
      .eq('marca', cambios.marcaAnterior);

    if (findError) throw findError;

    if (!registrosExistentes || registrosExistentes.length === 0) {
      return { tabla: 'componentes_disponibles', actualizados: 0 };
    }

    const { error: updateError } = await supabase
      .from('componentes_disponibles')
      .update({
        nombre: cambios.nombreNuevo,
        marca: cambios.marcaNueva,
        modelo: cambios.modeloNuevo || 'N/A', // Usar 'N/A' si no hay modelo
        updated_at: new Date().toISOString()
      })
      .eq('nombre', cambios.nombreAnterior)
      .eq('marca', cambios.marcaAnterior);

    if (updateError) throw updateError;

    console.log(`✅ Actualizados ${registrosExistentes.length} registros en componentes_disponibles`);
    return { tabla: 'componentes_disponibles', actualizados: registrosExistentes.length };

  } catch (error) {
    console.error('❌ Error actualizando componentes_disponibles:', error);
    const errorMessage: string = error && typeof error === 'object' && 'message' in error 
      ? (error as any).message 
      : String(error);
    return { tabla: 'componentes_disponibles', actualizados: 0, error: errorMessage };
  }
}

/**
 * Actualiza registros en productos_carga
 */
async function actualizarProductosCarga(cambios: ProductoUpdate): Promise<{ tabla: string; actualizados: number; error?: string }> {
  try {
    console.log('🔄 Actualizando productos_carga...');
    
    const { data: registrosExistentes, error: findError } = await supabase
      .from('productos_carga')
      .select('id')
      .eq('producto', cambios.nombreAnterior) // En productos_carga el nombre se llama 'producto'
      .eq('marca', cambios.marcaAnterior);

    if (findError) throw findError;

    if (!registrosExistentes || registrosExistentes.length === 0) {
      return { tabla: 'productos_carga', actualizados: 0 };
    }

    const updateData: any = {
      producto: cambios.nombreNuevo, // Campo 'producto' en lugar de 'nombre'
      marca: cambios.marcaNueva,
      updated_at: new Date().toISOString()
    };
    
    // Solo incluir modelo si está definido
    if (cambios.modeloNuevo !== undefined && cambios.modeloNuevo !== null) {
      updateData.modelo = cambios.modeloNuevo || 'N/A';
    } else {
      updateData.modelo = 'N/A';
    }

    const { error: updateError } = await supabase
      .from('productos_carga')
      .update(updateData)
      .eq('producto', cambios.nombreAnterior)
      .eq('marca', cambios.marcaAnterior);

    if (updateError) throw updateError;

    console.log(`✅ Actualizados ${registrosExistentes.length} registros en productos_carga`);
    return { tabla: 'productos_carga', actualizados: registrosExistentes.length };

  } catch (error) {
    console.error('❌ Error actualizando productos_carga:', error);
    const errorMessage: string = error && typeof error === 'object' && 'message' in error 
      ? (error as any).message 
      : String(error);
    return { tabla: 'productos_carga', actualizados: 0, error: errorMessage };
  }
}

/**
 * Actualiza registros en movimientos_stock (campo descripcion JSON)
 */
async function actualizarMovimientosStock(cambios: ProductoUpdate): Promise<{ tabla: string; actualizados: number; error?: string }> {
  try {
    console.log('🔄 Actualizando movimientos_stock...');
    
    // Obtener todos los movimientos que podrían contener el producto en el JSON de descripción
    const { data: movimientos, error: findError } = await supabase
      .from('movimientos_stock')
      .select('id, descripcion')
      .not('descripcion', 'is', null);

    if (findError) throw findError;

    if (!movimientos || movimientos.length === 0) {
      return { tabla: 'movimientos_stock', actualizados: 0 };
    }

    let actualizados = 0;

    // Procesar cada movimiento
    for (const movimiento of movimientos) {
      try {
        if (!movimiento.descripcion) continue;

        const descripcionObj = JSON.parse(movimiento.descripcion);
        
        // Verificar si este movimiento corresponde al producto que se está actualizando
        if (descripcionObj.productoNombre === cambios.nombreAnterior && 
            descripcionObj.productoMarca === cambios.marcaAnterior) {
          
          // Actualizar los datos del producto en el JSON
          descripcionObj.productoNombre = cambios.nombreNuevo;
          descripcionObj.productoMarca = cambios.marcaNueva;
          if (cambios.modeloNuevo) {
            descripcionObj.productoModelo = cambios.modeloNuevo;
          }

          // Guardar el JSON actualizado
          const { error: updateError } = await supabase
            .from('movimientos_stock')
            .update({
              descripcion: JSON.stringify(descripcionObj)
            })
            .eq('id', movimiento.id);

          if (updateError) {
            console.error(`Error actualizando movimiento ${movimiento.id}:`, updateError);
          } else {
            actualizados++;
          }
        }
      } catch (parseError) {
        // Ignorar movimientos con JSON inválido
        console.warn(`JSON inválido en movimiento ${movimiento.id}:`, parseError);
      }
    }

    console.log(`✅ Actualizados ${actualizados} registros en movimientos_stock`);
    return { tabla: 'movimientos_stock', actualizados };

  } catch (error) {
    console.error('❌ Error actualizando movimientos_stock:', error);
    const errorMessage: string = error && typeof error === 'object' && 'message' in error 
      ? (error as any).message 
      : String(error);
    return { tabla: 'movimientos_stock', actualizados: 0, error: errorMessage };
  }
}

/**
 * Actualiza registros en productos_remision
 */
async function actualizarProductosRemision(cambios: ProductoUpdate): Promise<{ tabla: string; actualizados: number; error?: string }> {
  try {
    console.log('🔄 Actualizando productos_remision...');
    
    // Verificar si la tabla productos_remision existe
    const { data: tablaExiste } = await supabase
      .from('productos_remision')
      .select('id')
      .limit(1);

    // Si la tabla no existe o no hay datos, no es un error
    if (!tablaExiste) {
      return { tabla: 'productos_remision', actualizados: 0 };
    }

    const { data: registrosExistentes, error: findError } = await supabase
      .from('productos_remision')
      .select('id')
      .eq('nombre', cambios.nombreAnterior)
      .eq('marca', cambios.marcaAnterior);

    if (findError) {
      // Si es un error de tabla no encontrada, no es crítico
      if (findError.message.includes('does not exist')) {
        return { tabla: 'productos_remision', actualizados: 0 };
      }
      throw findError;
    }

    if (!registrosExistentes || registrosExistentes.length === 0) {
      return { tabla: 'productos_remision', actualizados: 0 };
    }

    const updateData: any = {
      nombre: cambios.nombreNuevo,
      marca: cambios.marcaNueva
    };
    
    // Solo incluir modelo si está definido
    if (cambios.modeloNuevo !== undefined && cambios.modeloNuevo !== null) {
      updateData.modelo = cambios.modeloNuevo || 'N/A';
    } else {
      updateData.modelo = 'N/A';
    }

    const { error: updateError } = await supabase
      .from('productos_remision')
      .update(updateData)
      .eq('nombre', cambios.nombreAnterior)
      .eq('marca', cambios.marcaAnterior);

    if (updateError) throw updateError;

    console.log(`✅ Actualizados ${registrosExistentes.length} registros en productos_remision`);
    return { tabla: 'productos_remision', actualizados: registrosExistentes.length };

  } catch (error) {
    console.error('❌ Error actualizando productos_remision:', error);
    const errorMessage: string = error && typeof error === 'object' && 'message' in error 
      ? (error as any).message 
      : String(error);
    return { tabla: 'productos_remision', actualizados: 0, error: errorMessage };
  }
}

/**
 * Actualiza registros en equipos
 */
async function actualizarEquipos(cambios: ProductoUpdate): Promise<{ tabla: string; actualizados: number; error?: string }> {
  try {
    console.log('🔄 Actualizando equipos...');
    
    const { data: registrosExistentes, error: findError } = await supabase
      .from('equipos')
      .select('id')
      .eq('nombre_equipo', cambios.nombreAnterior)
      .eq('marca', cambios.marcaAnterior);

    if (findError) throw findError;

    if (!registrosExistentes || registrosExistentes.length === 0) {
      return { tabla: 'equipos', actualizados: 0 };
    }

    const updateData: any = {
      nombre_equipo: cambios.nombreNuevo,
      marca: cambios.marcaNueva,
      updated_at: new Date().toISOString()
    };
    
    // Solo incluir modelo si está definido
    if (cambios.modeloNuevo !== undefined && cambios.modeloNuevo !== null) {
      updateData.modelo = cambios.modeloNuevo || 'N/A';
    } else {
      updateData.modelo = 'N/A';
    }

    const { error: updateError } = await supabase
      .from('equipos')
      .update(updateData)
      .eq('nombre_equipo', cambios.nombreAnterior)
      .eq('marca', cambios.marcaAnterior);

    if (updateError) throw updateError;

    console.log(`✅ Actualizados ${registrosExistentes.length} registros en equipos`);
    return { tabla: 'equipos', actualizados: registrosExistentes.length };

  } catch (error) {
    console.error('❌ Error actualizando equipos:', error);
    const errorMessage: string = error && typeof error === 'object' && 'message' in error 
      ? (error as any).message 
      : String(error);
    return { tabla: 'equipos', actualizados: 0, error: errorMessage };
  }
}

/**
 * Función de verificación para comprobar el estado antes y después de la sincronización
 */
export async function verificarSincronizacion(
  nombreAnterior: string,
  marcaAnterior: string,
  nombreNuevo: string,
  marcaNueva: string
): Promise<{
  antes: Record<string, number>;
  despues: Record<string, number>;
}> {
  const verificarTabla = async (tabla: string, campoNombre: string, campoMarca: string, nombre: string, marca: string) => {
    try {
      const { data, error } = await supabase
        .from(tabla)
        .select('id')
        .eq(campoNombre, nombre)
        .eq(campoMarca, marca);

      if (error) return 0;
      return data?.length || 0;
    } catch {
      return 0;
    }
  };

  const tablas = [
    { tabla: 'stock_items', campoNombre: 'nombre', campoMarca: 'marca' },
    { tabla: 'componentes_disponibles', campoNombre: 'nombre', campoMarca: 'marca' },
    { tabla: 'productos_carga', campoNombre: 'producto', campoMarca: 'marca' },
    { tabla: 'equipos', campoNombre: 'nombre_equipo', campoMarca: 'marca' }
  ];

  const antes: Record<string, number> = {};
  const despues: Record<string, number> = {};

  for (const { tabla, campoNombre, campoMarca } of tablas) {
    antes[tabla] = await verificarTabla(tabla, campoNombre, campoMarca, nombreAnterior, marcaAnterior);
    despues[tabla] = await verificarTabla(tabla, campoNombre, campoMarca, nombreNuevo, marcaNueva);
  }

  return { antes, despues };
}