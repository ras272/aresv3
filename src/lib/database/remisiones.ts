import { supabase } from './shared/supabase';
import { createLogger } from './shared/utils';
import { RemisionesModuleInterface } from './shared/types';

const logger = createLogger('RemisionesModule');

// Import functions from other modules that we depend on
import { registrarMovimientoStock, createTransaccionStock } from './stock';

// Types for Remisiones module
export interface RemisionInput {
  numeroFactura?: string;
  fecha: string;
  cliente: string;
  direccionEntrega: string;
  contacto?: string;
  telefono?: string;
  tipoRemision: 'Instalación' | 'Mantenimiento' | 'Reparación' | 'Entrega' | 'Random';
  tecnicoResponsable: string;
  productos: Array<{
    componenteId: string;
    stockItemId?: string; // For backward compatibility
    nombre: string;
    marca: string;
    modelo: string;
    numeroSerie?: string;
    cantidadSolicitada: number;
    cantidadDisponible: number;
    observaciones?: string;
  }>;
  descripcionGeneral?: string;
  estado: 'Borrador' | 'Confirmada' | 'En tránsito' | 'Entregada' | 'Cancelada';
}

export interface RemisionUpdate {
  numeroFactura?: string;
  estado?: 'Borrador' | 'Confirmada' | 'En tránsito' | 'Entregada' | 'Cancelada';
  fechaEntrega?: string;
  observacionesEntrega?: string;
  descripcionGeneral?: string;
}

export interface Remision {
  id: string;
  numeroRemision: string;
  numeroFactura?: string;
  fecha: string;
  cliente: string;
  direccionEntrega: string;
  contacto?: string;
  telefono?: string;
  tipoRemision: 'Instalación' | 'Mantenimiento' | 'Reparación' | 'Entrega' | 'Random';
  tecnicoResponsable: string;
  productos: Array<{
    id: string;
    componenteId: string;
    nombre: string;
    marca: string;
    modelo: string;
    numeroSerie?: string;
    cantidadSolicitada: number;
    cantidadDisponible: number;
    observaciones?: string;
  }>;
  descripcionGeneral?: string;
  estado: 'Borrador' | 'Confirmada' | 'En tránsito' | 'Entregada' | 'Cancelada';
  fechaEntrega?: string;
  observacionesEntrega?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all remisiones with their products
 */
export async function getAllRemisiones(): Promise<Remision[]> {
  try {
    logger.info('Fetching all remisiones', 'getAllRemisiones');

    const { data, error } = await supabase
      .from('remisiones')
      .select(`
        *,
        productos_remision (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const remisiones = data.map((remision: any) => ({
      id: remision.id,
      numeroRemision: remision.numero_remision,
      numeroFactura: remision.numero_factura,
      fecha: remision.fecha,
      cliente: remision.cliente_nombre,
      direccionEntrega: remision.direccion_entrega,
      contacto: remision.contacto,
      telefono: remision.telefono,
      tipoRemision: remision.tipo_remision,
      tecnicoResponsable: remision.tecnico_responsable,
      productos: remision.productos_remision.map((p: any) => ({
        id: p.id,
        componenteId: p.componente_id,
        nombre: p.nombre,
        marca: p.marca,
        modelo: p.modelo,
        numeroSerie: p.numero_serie,
        cantidadSolicitada: p.cantidad_solicitada,
        cantidadDisponible: p.cantidad_disponible,
        observaciones: p.observaciones
      })),
      descripcionGeneral: remision.descripcion_general,
      estado: remision.estado,
      fechaEntrega: remision.fecha_entrega,
      observacionesEntrega: remision.observaciones_entrega,
      createdAt: remision.created_at,
      updatedAt: remision.updated_at
    }));

    logger.info(`Successfully fetched ${remisiones.length} remisiones`, 'getAllRemisiones');
    return remisiones;
  } catch (error) {
    logger.error('Error loading remisiones', 'getAllRemisiones', { error });
    throw error;
  }
}

/**
 * Create a new remision with products
 */
export async function createRemision(remisionData: RemisionInput): Promise<Remision> {
  try {
    logger.info('Creating new remision', 'createRemision', { 
      cliente: remisionData.cliente, 
      productos: remisionData.productos.length 
    });

    // 1. Generate remision number
    const numeroRemision = await generateNumeroRemision();

    // 2. Create main remision
    const { data: remision, error: remisionError } = await supabase
      .from('remisiones')
      .insert({
        numero_remision: numeroRemision,
        numero_factura: remisionData.numeroFactura,
        fecha: remisionData.fecha,
        cliente_nombre: remisionData.cliente,
        direccion_entrega: remisionData.direccionEntrega,
        contacto: remisionData.contacto,
        telefono: remisionData.telefono,
        tipo_remision: remisionData.tipoRemision,
        tecnico_responsable: remisionData.tecnicoResponsable,
        descripcion_general: remisionData.descripcionGeneral,
        estado: remisionData.estado
      })
      .select()
      .single();

    if (remisionError) throw remisionError;

    // 3. Create remision products
    const productosParaInsertar = remisionData.productos.map(producto => ({
      remision_id: remision.id,
      // Solo usar componente_id si realmente viene de componentes_disponibles
      componente_id: producto.componenteId && !producto.stockItemId ? producto.componenteId : null,
      nombre: producto.nombre,
      marca: producto.marca,
      modelo: producto.modelo,
      numero_serie: producto.numeroSerie,
      cantidad_solicitada: producto.cantidadSolicitada,
      cantidad_disponible: producto.cantidadDisponible,
      observaciones: producto.observaciones
    }));

    const { error: productosError } = await supabase
      .from('productos_remision')
      .insert(productosParaInsertar);

    if (productosError) throw productosError;

    const result: Remision = {
      id: remision.id,
      numeroRemision: remision.numero_remision,
      numeroFactura: remision.numero_factura,
      fecha: remision.fecha,
      cliente: remision.cliente_nombre,
      direccionEntrega: remision.direccion_entrega,
      contacto: remision.contacto,
      telefono: remision.telefono,
      tipoRemision: remision.tipo_remision,
      tecnicoResponsable: remision.tecnico_responsable,
      productos: remisionData.productos.map((p, index) => ({
        id: `temp-${index}`, // Will be replaced with actual ID from database
        componenteId: p.componenteId || p.stockItemId || '',
        nombre: p.nombre,
        marca: p.marca,
        modelo: p.modelo,
        numeroSerie: p.numeroSerie,
        cantidadSolicitada: p.cantidadSolicitada,
        cantidadDisponible: p.cantidadDisponible,
        observaciones: p.observaciones
      })),
      descripcionGeneral: remision.descripcion_general,
      estado: remision.estado,
      fechaEntrega: remision.fecha_entrega,
      observacionesEntrega: remision.observaciones_entrega,
      createdAt: remision.created_at,
      updatedAt: remision.updated_at
    };

    logger.info('Remision created successfully', 'createRemision', {
      numeroRemision,
      cliente: remisionData.cliente,
      productos: remisionData.productos.length,
      stockReducido: remisionData.estado === 'Confirmada'
    });

    return result;
  } catch (error) {
    logger.error('Error creating remision', 'createRemision', { error });
    throw error;
  }
}/**

 * Update an existing remision
 */
export async function updateRemision(remisionId: string, updates: RemisionUpdate): Promise<any> {
  try {
    logger.info('Updating remision', 'updateRemision', { remisionId, updates });

    // 1. Get current remision to check for state changes
    const { data: remisionActual, error: getError } = await supabase
      .from('remisiones')
      .select(`
        *,
        productos_remision (*)
      `)
      .eq('id', remisionId)
      .single();

    if (getError) throw getError;

    // 2. Update remision
    const { data, error } = await supabase
      .from('remisiones')
      .update({
        numero_factura: updates.numeroFactura,
        estado: updates.estado,
        fecha_entrega: updates.fechaEntrega,
        observaciones_entrega: updates.observacionesEntrega,
        descripcion_general: updates.descripcionGeneral
      })
      .eq('id', remisionId)
      .select()
      .single();

    if (error) throw error;

    // 3. If state changed to "Confirmada", automatically reduce stock
    if (updates.estado === 'Confirmada' && remisionActual.estado !== 'Confirmada') {
      logger.info('State changed to Confirmada - Automatically reducing stock', 'updateRemision');

      // Convert remision products to expected format
      const productosParaReducir = remisionActual.productos_remision.map((p: any) => ({
        componenteId: p.componente_id,
        nombre: p.nombre,
        cantidadSolicitada: p.cantidad_solicitada,
        observaciones: p.observaciones
      }));

      await reducirStockPorRemision(data, productosParaReducir);
    }

    logger.info('Remision updated successfully', 'updateRemision', {
      id: data.id,
      numeroRemision: data.numero_remision,
      estadoAnterior: remisionActual.estado,
      estadoNuevo: data.estado,
      stockReducido: updates.estado === 'Confirmada' && remisionActual.estado !== 'Confirmada'
    });

    return data;
  } catch (error) {
    logger.error('Error updating remision', 'updateRemision', { error });
    throw error;
  }
}

/**
 * Delete a remision (simple deletion)
 */
export async function deleteRemision(remisionId: string): Promise<boolean> {
  try {
    logger.info('Deleting remision', 'deleteRemision', { remisionId });

    // Products are automatically deleted by CASCADE
    const { error } = await supabase
      .from('remisiones')
      .delete()
      .eq('id', remisionId);

    if (error) throw error;

    logger.info('Remision deleted successfully', 'deleteRemision');
    return true;
  } catch (error) {
    logger.error('Error deleting remision', 'deleteRemision', { error });
    throw error;
  }
}

/**
 * Delete a remision with stock restoration
 */
export async function deleteRemisionConRestauracion(remisionId: string, motivo: string): Promise<{
  success: boolean;
  productosRestaurados: number;
  numeroRemision: string;
}> {
  try {
    logger.info('Deleting remision with stock restoration', 'deleteRemisionConRestauracion', { 
      remisionId, 
      motivo 
    });

    // 1. Get remision details with products before deletion
    const { data: remision, error: remisionError } = await supabase
      .from('remisiones')
      .select(`
        *,
        productos_remision (*)
      `)
      .eq('id', remisionId)
      .single();

    if (remisionError) throw remisionError;
    if (!remision) throw new Error('Remisión no encontrada');

    // 2. Only restore stock if remision was confirmed (stock was actually reduced)
    let productosRestaurados = 0;
    
    if (remision.estado === 'Confirmada') {
      logger.info('Restoring stock for confirmed remision', 'deleteRemisionConRestauracion', {
        productos: remision.productos_remision.length
      });

      // 3. Restore stock for each product
      for (const producto of remision.productos_remision) {
        try {
          let currentComponent: any = null;
          let currentStock: any = null;
          let stockItems: any[] = [];

          // Check if product came from stock_items or componentes_disponibles
          if (producto.componente_id) {
            // Product from componentes_disponibles
            // Get current quantity first
            const { data: componentData, error: getError } = await supabase
              .from('componentes_disponibles')
              .select('cantidad_disponible')
              .eq('id', producto.componente_id)
              .single();

            if (getError) throw getError;
            currentComponent = componentData;

            const { error: updateError } = await supabase
              .from('componentes_disponibles')
              .update({
                cantidad_disponible: currentComponent.cantidad_disponible + producto.cantidad_solicitada
              })
              .eq('id', producto.componente_id);

            if (updateError) {
              logger.error('Error restoring componente stock', 'deleteRemisionConRestauracion', {
                componenteId: producto.componente_id,
                error: updateError
              });
            } else {
              productosRestaurados++;
            }
          } else {
            // Product from stock_items - find by name, marca, modelo
            const { data: stockItemsData, error: findError } = await supabase
              .from('stock_items')
              .select('*')
              .eq('nombre', producto.nombre)
              .eq('marca', producto.marca)
              .eq('modelo', producto.modelo)
              .limit(1);

            if (findError) {
              logger.error('Error finding stock item', 'deleteRemisionConRestauracion', {
                producto: producto.nombre,
                error: findError
              });
              continue;
            }

            stockItems = stockItemsData || [];

            if (stockItems.length > 0) {
              const stockItem = stockItems[0];
              
              // Get current quantity first
              const { data: stockData, error: getCurrentError } = await supabase
                .from('stock_items')
                .select('cantidad_actual')
                .eq('id', stockItem.id)
                .single();

              if (getCurrentError) throw getCurrentError;
              currentStock = stockData;

              const { error: updateError } = await supabase
                .from('stock_items')
                .update({
                  cantidad_actual: currentStock.cantidad_actual + producto.cantidad_solicitada
                })
                .eq('id', stockItem.id);

              if (updateError) {
                logger.error('Error restoring stock item', 'deleteRemisionConRestauracion', {
                  stockItemId: stockItem.id,
                  error: updateError
                });
              } else {
                productosRestaurados++;
              }
            }
          }

          // 4. Register proper stock movement for traceability
          try {
            if (producto.componente_id && currentComponent) {
              // Movement for componente_disponible
              await registrarMovimientoStock({
                itemId: producto.componente_id,
                itemType: 'componente_disponible',
                productoNombre: producto.nombre,
                productoMarca: producto.marca,
                productoModelo: producto.modelo,
                numeroSerie: producto.numero_serie,
                tipoMovimiento: 'Entrada',
                cantidad: producto.cantidad_solicitada,
                cantidadAnterior: currentComponent.cantidad_disponible,
                cantidadNueva: currentComponent.cantidad_disponible + producto.cantidad_solicitada,
                motivo: `Devolución por eliminación de remisión ${remision.numero_remision}`,
                observaciones: `${motivo} - Producto restaurado al stock`,
                numeroFactura: remision.numero_factura,
                cliente: remision.cliente_nombre
              });
            } else if (stockItems.length > 0 && currentStock) {
              // Movement for stock_item
              const stockItem = stockItems[0];
              await registrarMovimientoStock({
                itemId: stockItem.id,
                itemType: 'stock_item',
                productoNombre: producto.nombre,
                productoMarca: producto.marca,
                productoModelo: producto.modelo,
                numeroSerie: producto.numero_serie,
                tipoMovimiento: 'Entrada',
                cantidad: producto.cantidad_solicitada,
                cantidadAnterior: currentStock.cantidad_actual,
                cantidadNueva: currentStock.cantidad_actual + producto.cantidad_solicitada,
                motivo: `Devolución por eliminación de remisión ${remision.numero_remision}`,
                observaciones: `${motivo} - Producto restaurado al stock`,
                numeroFactura: remision.numero_factura,
                cliente: remision.cliente_nombre
              });
            }
          } catch (movimientoError) {
            logger.error('Error registering stock movement', 'deleteRemisionConRestauracion', {
              error: movimientoError,
              producto: producto.nombre
            });
          }

        } catch (productError) {
          logger.error('Error processing product restoration', 'deleteRemisionConRestauracion', {
            producto: producto.nombre,
            error: productError
          });
        }
      }
    }

    // 5. Delete the remision (products will be deleted by CASCADE)
    const { error: deleteError } = await supabase
      .from('remisiones')
      .delete()
      .eq('id', remisionId);

    if (deleteError) throw deleteError;

    logger.info('Remision deleted with stock restoration completed', 'deleteRemisionConRestauracion', {
      numeroRemision: remision.numero_remision,
      productosRestaurados,
      motivo
    });

    return {
      success: true,
      productosRestaurados,
      numeroRemision: remision.numero_remision
    };

  } catch (error) {
    logger.error('Error deleting remision with restoration', 'deleteRemisionConRestauracion', { error });
    throw error;
  }

}

/**
 * Generate a unique remision number
 */
export async function generateNumeroRemision(): Promise<string> {
  try {
    logger.debug('Generating remision number', 'generateNumeroRemision');

    // Buscar el último número de remisión generado
    const { data, error } = await supabase
      .from('remisiones')
      .select('numero_remision')
      .order('numero_remision', { ascending: false })
      .limit(1);

    if (error) throw error;

    let nextNumber: number;
    
    if (data.length > 0) {
      // Extraer el número del último registro
      const lastNumber = data[0].numero_remision;
      const lastNumberMatch = lastNumber.match(/^REM-(\d+)$/);
      
      if (lastNumberMatch) {
        // Si el formato es el nuevo (REM-XXXX)
        nextNumber = parseInt(lastNumberMatch[1]) + 1;
      } else {
        // Si el formato es el antiguo (REM-YYYYMMDD-XXX), convertir al nuevo formato
        // Buscar el número más alto entre todos los formatos
        const { data: allData, error: allError } = await supabase
          .from('remisiones')
          .select('numero_remision');
        
        if (allError) throw allError;
        
        let maxNumber = 2753; // Comenzar desde 2754 según solicitud del usuario
        for (const remision of allData) {
          const numberMatch = remision.numero_remision.match(/^REM-(\d+)$/);
          if (numberMatch) {
            const num = parseInt(numberMatch[1]);
            if (num > maxNumber) maxNumber = num;
          } else {
            // Formato antiguo REM-YYYYMMDD-XXX
            const oldFormatMatch = remision.numero_remision.match(/^REM-\d{8}-(\d{3})$/);
            if (oldFormatMatch) {
              const num = parseInt(oldFormatMatch[1]);
              if (num > maxNumber) maxNumber = num;
            }
          }
        }
        nextNumber = maxNumber + 1;
      }
    } else {
      // Si no hay remisiones, comenzar desde 2754
      nextNumber = 2754;
    }

    // Asegurarse de que el número no sea menor que 2754
    if (nextNumber < 2754) {
      nextNumber = 2754;
    }

    const numeroRemision = `REM-${nextNumber}`;
    
    logger.debug('Generated remision number', 'generateNumeroRemision', { numeroRemision });
    return numeroRemision;
  } catch (error) {
    logger.error('Error generating remision number', 'generateNumeroRemision', { error });
    throw error;
  }
}

/**
 * Automatically reduce stock when a remision is confirmed
 */
export async function reducirStockPorRemision(remision: any, productos: any[]): Promise<void> {
  try {
    logger.info('Reducing stock for confirmed remision', 'reducirStockPorRemision', { 
      numeroRemision: remision.numero_remision 
    });

    for (const producto of productos) {
      if (producto.componenteId) {
        // 1. Get current stock
        const { data: stockActual, error: stockError } = await supabase
          .from('componentes_disponibles')
          .select('*')
          .eq('id', producto.componenteId)
          .single();

        if (stockError) {
          logger.error('Error getting stock', 'reducirStockPorRemision', { error: stockError });
          continue;
        }

        // 2. Verify sufficient stock
        if (stockActual.cantidad_disponible < producto.cantidadSolicitada) {
          logger.warn('Insufficient stock', 'reducirStockPorRemision', {
            producto: producto.nombre,
            disponible: stockActual.cantidad_disponible,
            solicitado: producto.cantidadSolicitada
          });
          // Continue with available quantity
        }

        // 3. Calculate new quantity (don't allow negative)
        const cantidadAReducir = Math.min(producto.cantidadSolicitada, stockActual.cantidad_disponible);
        const nuevaCantidad = stockActual.cantidad_disponible - cantidadAReducir;

        // 4. Update stock
        const { error: updateError } = await supabase
          .from('componentes_disponibles')
          .update({
            cantidad_disponible: nuevaCantidad,
            updated_at: new Date().toISOString()
          })
          .eq('id', producto.componenteId);

        if (updateError) {
          logger.error('Error updating stock', 'reducirStockPorRemision', { error: updateError });
          continue;
        }

        // 5. Register stock transaction
        await createTransaccionStock({
          componenteId: producto.componenteId,
          tipo: 'SALIDA',
          cantidad: cantidadAReducir,
          cantidadAnterior: stockActual.cantidad_disponible,
          cantidadNueva: nuevaCantidad,
          motivo: `Salida por remisión ${remision.numero_remision}`,
          referencia: remision.numero_remision,
          numeroFactura: remision.numero_factura,
          cliente: remision.cliente_nombre,
          observaciones: `Remisión tipo: ${remision.tipo_remision}. ${producto.observaciones || ''}`
        });

        logger.info('Stock reduced successfully', 'reducirStockPorRemision', {
          producto: producto.nombre,
          cantidadAnterior: stockActual.cantidad_disponible,
          cantidadReducida: cantidadAReducir,
          cantidadNueva: nuevaCantidad,
          remision: remision.numero_remision
        });
      }
    }

    logger.info('Stock completely reduced for remision', 'reducirStockPorRemision', { 
      numeroRemision: remision.numero_remision 
    });

  } catch (error) {
    logger.error('Error reducing stock for remision', 'reducirStockPorRemision', { error });
    throw error;
  }
}

// Export the module interface implementation
export const RemisionesModule: RemisionesModuleInterface = {
  // Interface will be defined in shared/types.ts
};