import { supabase } from './shared/supabase';
import type { DatabaseModule, ModuleConfig } from './shared/types';

// ===============================================
// STOCK MODULE INTERFACES
// ===============================================

export interface MovimientoStock {
  id: string;
  stockItemId?: string;
  tipoMovimiento: 'Entrada' | 'Salida' | 'Ajuste' | 'Transferencia' | 'Asignacion';
  cantidad: number;
  cantidadAnterior: number;
  cantidadNueva: number;
  motivo: string;
  descripcion?: string;
  referenciaExterna?: string;
  usuarioResponsable?: string;
  tecnicoResponsable?: string;
  fechaMovimiento: string;

  // Nuevos campos para trazabilidad completa
  productoNombre: string;
  productoMarca?: string;
  productoModelo?: string;
  numeroSerie?: string;
  codigoItem?: string;
  codigoCargaOrigen?: string;
  numeroFactura?: string;
  cliente?: string;
  costoUnitario?: number;
  valorTotal?: number;
  carpetaOrigen?: string;
  carpetaDestino?: string;
  ubicacionFisica?: string;
  itemType: 'stock_item' | 'componente_disponible';

  createdAt: string;
}

export interface StockModule extends DatabaseModule {
  getAllStockItems(): Promise<any[]>;
  updateStockItemDetails(productId: string, updates: { imagen?: string; observaciones?: string }): Promise<boolean>;
  updateComponenteDisponibleDetails(productId: string, updates: { imagen?: string; observaciones?: string }): Promise<boolean>;
  registrarMovimientoStock(movimiento: any): Promise<any>;
  getAllMovimientosStock(): Promise<MovimientoStock[]>;
  getMovimientosByProducto(productoNombre: string, productoMarca?: string): Promise<MovimientoStock[]>;
  getMovimientosByCarpeta(carpeta: string): Promise<MovimientoStock[]>;
  getEstadisticasTrazabilidad(): Promise<any>;
  getAllTransaccionesStock(): Promise<any[]>;
  createTransaccionStock(transaccionData: any): Promise<any>;
  procesarSalidaStock(componenteId: string, cantidad: number, motivo: string, referencia?: string, numeroFactura?: string, cliente?: string): Promise<boolean>;
  registrarSalidaStockReporte(salidaData: any): Promise<boolean>;
  devolverRepuestosAlStockReporte(devolucionData: any): Promise<boolean>;
  registrarSalidaStock(salidaData: any): Promise<boolean>;
}

// ===============================================
// STOCK MODULE IMPLEMENTATION
// ===============================================

class StockModuleImpl implements StockModule {
  private config?: ModuleConfig;

  async initialize(config: ModuleConfig): Promise<void> {
    this.config = config;
    if (config.enableLogging) {
      console.log('📦 Stock module initialized');
    }
  }

  async cleanup(): Promise<void> {
    if (this.config?.enableLogging) {
      console.log('📦 Stock module cleaned up');
    }
  }

  /**
   * Get all stock items from both componentes_disponibles and stock_items tables
   */
  async getAllStockItems() {
    try {
      if (this.config?.enableLogging) {
        console.log('🔄 Obteniendo stock desde ambas tablas (componentes_disponibles + stock_items)...');
      }
      
      // Obtener datos de componentes_disponibles (productos nuevos)
      const { data: componentes, error: componentesError } = await supabase
        .from('componentes_disponibles')
        .select('*')
        .order('created_at', { ascending: false });

      if (componentesError) {
        console.error('❌ Error obteniendo componentes_disponibles:', componentesError);
        throw componentesError;
      }

      // Obtener datos de stock_items (productos existentes)
      const { data: stockItems, error: stockError } = await supabase
        .from('stock_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (stockError) {
        console.error('❌ Error obteniendo stock_items:', stockError);
        throw stockError;
      }

      if (this.config?.enableLogging) {
        console.log(`✅ Obtenidos ${componentes?.length || 0} componentes + ${stockItems?.length || 0} stock items`);
      }

      // Mapear componentes_disponibles al formato esperado
      const componentesFormateados = (componentes || []).map((item: any) => ({
        id: item.id,
        nombre: item.nombre,
        marca: item.marca,
        modelo: item.modelo,
        numeroSerie: item.numero_serie,
        tipoComponente: item.tipo_componente || 'Producto',
        cantidadDisponible: item.cantidad_disponible,
        cantidadOriginal: item.cantidad_original || item.cantidad_disponible,
        ubicacionFisica: item.ubicacion_fisica || `Almacén ${item.marca}`,
        estado: item.estado,
        observaciones: item.observaciones,
        codigoCargaOrigen: item.codigo_carga_origen,
        carpetaPrincipal: item.carpeta_principal || item.marca,
        subcarpeta: item.subcarpeta,
        rutaCarpeta: item.ruta_carpeta || item.marca,
        tipoDestino: item.tipo_destino || 'stock',
        fechaIngreso: item.fecha_ingreso,
        imagen: item.imagen,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        fuente: 'componentes_disponibles'
      }));

      // Mapear stock_items al formato esperado
      const stockItemsFormateados = (stockItems || []).map((item: any) => ({
        id: item.id,
        nombre: item.nombre,
        marca: item.marca,
        modelo: item.modelo,
        numeroSerie: item.numero_serie,
        tipoComponente: 'Producto',
        cantidadDisponible: item.cantidad_actual,
        cantidadOriginal: item.cantidad_actual,
        ubicacionFisica: `Almacén ${item.marca}`,
        estado: item.estado,
        observaciones: item.observaciones,
        codigoCargaOrigen: item.codigo_carga_origen,
        carpetaPrincipal: item.marca,
        subcarpeta: null,
        rutaCarpeta: item.marca,
        tipoDestino: 'stock',
        fechaIngreso: item.fecha_ingreso,
        imagen: item.imagen_url,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        fuente: 'stock_items'
      }));

      // Combinar ambas fuentes
      const todosLosItems = [...componentesFormateados, ...stockItemsFormateados];

      if (this.config?.enableLogging) {
        console.log('✅ Stock items combinados correctamente:', {
          componentes: componentesFormateados.length,
          stockItems: stockItemsFormateados.length,
          total: todosLosItems.length,
          marcas: [...new Set(todosLosItems.map(item => item.marca))]
        });
      }

      return todosLosItems;
    } catch (error) {
      console.error('❌ Error getting stock items:', error);
      throw error;
    }
  }

  /**
   * Update stock item details (image and observations)
   */
  async updateStockItemDetails(productId: string, updates: {
    imagen?: string;
    observaciones?: string;
  }) {
    try {
      if (this.config?.enableLogging) {
        console.log('🔍 Buscando producto con ID:', productId);
      }
      
      // Encontrar todos los componentes que corresponden a este producto agrupado
      const { data: componentes, error: fetchError } = await supabase
        .from('componentes_disponibles')
        .select('*')

      if (fetchError) throw fetchError;

      // Filtrar los items que corresponden al producto
      const itemsDelProducto = componentes.filter(item => {
        const productoId = `${item.nombre}-${item.marca}-${item.modelo}`.toLowerCase().replace(/\s+/g, '-');
        if (this.config?.enableLogging) {
          console.log('🔍 Comparando:', { 
            generado: productoId, 
            buscado: productId, 
            coincide: productoId === productId,
            item: { nombre: item.nombre, marca: item.marca, modelo: item.modelo }
          });
        }
        return productoId === productId;
      });

      if (this.config?.enableLogging) {
        console.log('🔍 Items encontrados:', itemsDelProducto.length);
      }

      if (itemsDelProducto.length === 0) {
        throw new Error('Producto no encontrado en stock');
      }

      // Actualizar todos los items relacionados
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      // Solo incluir campos que no sean undefined
      if (updates.imagen !== undefined) {
        updateData.imagen = updates.imagen;
      }
      if (updates.observaciones !== undefined) {
        updateData.observaciones = updates.observaciones;
      }

      if (this.config?.enableLogging) {
        console.log('🔄 Datos a actualizar:', updateData);
      }

      const updatePromises = itemsDelProducto.map(item =>
        supabase
          .from('componentes_disponibles')
          .update(updateData)
          .eq('id', item.id)
      );

      const results = await Promise.all(updatePromises);

      // Verificar si hubo errores
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Error actualizando ${errors.length} items`);
      }

      if (this.config?.enableLogging) {
        console.log('✅ Producto actualizado exitosamente:', {
          productId,
          itemsActualizados: itemsDelProducto.length,
          imagen: updates.imagen ? 'Actualizada' : 'Sin cambios',
          observaciones: updates.observaciones ? 'Actualizadas' : 'Sin cambios'
        });
      }

      return true;

    } catch (error) {
      console.error('❌ Error actualizando detalles del producto:', error);
      throw error;
    }
  }

  /**
   * Update componente disponible details (image and observations)
   */
  async updateComponenteDisponibleDetails(productId: string, updates: {
    imagen?: string;
    observaciones?: string;
  }) {
    try {
      // Encontrar todos los componentes que corresponden a este producto agrupado
      const { data: componentes, error: fetchError } = await supabase
        .from('componentes_disponibles')
        .select('*')

      if (fetchError) throw fetchError;

      // Filtrar los componentes que corresponden al producto
      const componentesDelProducto = componentes.filter(comp => {
        const productoId = `${comp.nombre}-${comp.marca}-${comp.modelo}`.toLowerCase().replace(/\s+/g, '-');
        return productoId === productId;
      });

      if (componentesDelProducto.length === 0) {
        throw new Error('Producto no encontrado en componentes disponibles');
      }

      // Actualizar todos los componentes relacionados
      const updatePromises = componentesDelProducto.map(comp =>
        supabase
          .from('componentes_disponibles')
          .update({
            imagen: updates.imagen,
            observaciones: updates.observaciones ?
              `${comp.observaciones || ''}\n[${new Date().toLocaleDateString()}] ${updates.observaciones}`.trim() :
              comp.observaciones,
            updated_at: new Date().toISOString()
          })
          .eq('id', comp.id)
      );

      const results = await Promise.all(updatePromises);

      // Verificar si hubo errores
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Error actualizando ${errors.length} componentes`);
      }

      if (this.config?.enableLogging) {
        console.log('✅ Componentes actualizados exitosamente:', {
          productId,
          componentesActualizados: componentesDelProducto.length,
          imagen: updates.imagen ? 'Actualizada' : 'Sin cambios',
          observaciones: updates.observaciones ? 'Actualizadas' : 'Sin cambios'
        });
      }

      return true;

    } catch (error) {
      console.error('❌ Error actualizando detalles de componentes:', error);
      throw error;
    }
  }

  /**
   * Register a stock movement
   */
  async registrarMovimientoStock(movimiento: {
    itemId?: string;
    itemType?: 'stock_item' | 'componente_disponible';
    productoNombre: string;
    productoMarca?: string;
    productoModelo?: string;
    numeroSerie?: string;
    codigoItem?: string;
    tipoMovimiento: 'Entrada' | 'Salida' | 'Ajuste' | 'Transferencia' | 'Asignacion';
    cantidad: number;
    cantidadAnterior: number;
    cantidadNueva: number;
    motivo: string;
    destinoOrigen?: string;
    responsable?: string;
    codigoCargaOrigen?: string;
    numeroFactura?: string;
    cliente?: string;
    observaciones?: string;
    costoUnitario?: number;
    carpetaOrigen?: string;
    carpetaDestino?: string;
    ubicacionFisica?: string;
  }) {
    try {
      const valorTotal = movimiento.costoUnitario ? movimiento.costoUnitario * movimiento.cantidad : null;

      // 🔧 SOLUCIÓN: Para componentes_disponibles, no usar stock_item_id
      // La tabla movimientos_stock tiene una restricción que requiere que stock_item_id exista en stock_items
      // Para componentes_disponibles, usaremos NULL en stock_item_id y guardaremos el ID en codigo_item
      
      const insertData: any = {
        item_type: movimiento.itemType || 'stock_item',
        producto_nombre: movimiento.productoNombre,
        producto_marca: movimiento.productoMarca,
        producto_modelo: movimiento.productoModelo,
        numero_serie: movimiento.numeroSerie,
        tipo_movimiento: movimiento.tipoMovimiento,
        cantidad: movimiento.cantidad,
        cantidad_anterior: movimiento.cantidadAnterior,
        cantidad_nueva: movimiento.cantidadNueva,
        motivo: movimiento.motivo,
        descripcion: movimiento.observaciones,
        referencia_externa: movimiento.destinoOrigen,
        usuario_responsable: movimiento.responsable,
        codigo_carga_origen: movimiento.codigoCargaOrigen,
        numero_factura: movimiento.numeroFactura,
        cliente: movimiento.cliente,
        costo_unitario: movimiento.costoUnitario,
        valor_total: valorTotal,
        carpeta_origen: movimiento.carpetaOrigen,
        carpeta_destino: movimiento.carpetaDestino,
        ubicacion_fisica: movimiento.ubicacionFisica,
        fecha_movimiento: new Date().toISOString()
      };

      // Solo agregar stock_item_id si es realmente un stock_item
      if (movimiento.itemType === 'stock_item' && movimiento.itemId) {
        insertData.stock_item_id = movimiento.itemId;
      } else if (movimiento.itemType === 'componente_disponible' && movimiento.itemId) {
        // Para componentes_disponibles, guardar el ID en codigo_item para referencia
        insertData.codigo_item = movimiento.itemId;
        // stock_item_id se queda como NULL (permitido por la base de datos)
      }

      const { data, error } = await supabase
        .from('movimientos_stock')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      if (this.config?.enableLogging) {
        console.log('✅ Movimiento de stock registrado:', {
          tipo: movimiento.tipoMovimiento,
          producto: movimiento.productoNombre,
          cantidad: movimiento.cantidad,
          motivo: movimiento.motivo,
          itemType: movimiento.itemType
        });
      }

      return data;

    } catch (error) {
      console.error('❌ Error registrando movimiento de stock:', error);
      throw error;
    }
  }

  /**
   * Get all stock movements
   */
  async getAllMovimientosStock(): Promise<MovimientoStock[]> {
    try {
      const { data, error } = await supabase
        .from('movimientos_stock')
        .select('*')
        .order('fecha_movimiento', { ascending: false });

      if (error) throw error;

      return data.map((mov: any) => ({
        id: mov.id,
        stockItemId: mov.stock_item_id,
        tipoMovimiento: mov.tipo_movimiento,
        cantidad: mov.cantidad,
        cantidadAnterior: mov.cantidad_anterior,
        cantidadNueva: mov.cantidad_nueva,
        motivo: mov.motivo,
        descripcion: mov.descripcion,
        referenciaExterna: mov.referencia_externa,
        usuarioResponsable: mov.usuario_responsable,
        tecnicoResponsable: mov.tecnico_responsable,
        fechaMovimiento: mov.fecha_movimiento,

        // Nuevos campos
        productoNombre: mov.producto_nombre,
        productoMarca: mov.producto_marca,
        productoModelo: mov.producto_modelo,
        numeroSerie: mov.numero_serie,
        codigoItem: mov.codigo_item,
        codigoCargaOrigen: mov.codigo_carga_origen,
        numeroFactura: mov.numero_factura,
        cliente: mov.cliente,
        costoUnitario: mov.costo_unitario,
        valorTotal: mov.valor_total,
        carpetaOrigen: mov.carpeta_origen,
        carpetaDestino: mov.carpeta_destino,
        ubicacionFisica: mov.ubicacion_fisica,
        itemType: mov.item_type || 'stock_item',

        createdAt: mov.created_at
      }));

    } catch (error) {
      console.error('❌ Error obteniendo movimientos de stock:', error);
      throw error;
    }
  }

  /**
   * Get stock movements by product
   */
  async getMovimientosByProducto(productoNombre: string, productoMarca?: string): Promise<MovimientoStock[]> {
    try {
      let query = supabase
        .from('movimientos_stock')
        .select('*')
        .eq('producto_nombre', productoNombre);

      if (productoMarca) {
        query = query.eq('producto_marca', productoMarca);
      }

      const { data, error } = await query.order('fecha_movimiento', { ascending: false });

      if (error) throw error;

      return data.map((mov: any) => ({
        id: mov.id,
        stockItemId: mov.stock_item_id,
        tipoMovimiento: mov.tipo_movimiento,
        cantidad: mov.cantidad,
        cantidadAnterior: mov.cantidad_anterior,
        cantidadNueva: mov.cantidad_nueva,
        motivo: mov.motivo,
        descripcion: mov.descripcion,
        referenciaExterna: mov.referencia_externa,
        usuarioResponsable: mov.usuario_responsable,
        tecnicoResponsable: mov.tecnico_responsable,
        fechaMovimiento: mov.fecha_movimiento,

        productoNombre: mov.producto_nombre,
        productoMarca: mov.producto_marca,
        productoModelo: mov.producto_modelo,
        codigoItem: mov.codigo_item,
        codigoCargaOrigen: mov.codigo_carga_origen,
        numeroFactura: mov.numero_factura,
        cliente: mov.cliente,
        costoUnitario: mov.costo_unitario,
        valorTotal: mov.valor_total,
        carpetaOrigen: mov.carpeta_origen,
        carpetaDestino: mov.carpeta_destino,
        ubicacionFisica: mov.ubicacion_fisica,
        itemType: mov.item_type || 'stock_item',

        createdAt: mov.created_at
      }));

    } catch (error) {
      console.error('❌ Error obteniendo movimientos por producto:', error);
      throw error;
    }
  }

  /**
   * Get stock movements by folder/category
   */
  async getMovimientosByCarpeta(carpeta: string): Promise<MovimientoStock[]> {
    try {
      const { data, error } = await supabase
        .from('movimientos_stock')
        .select('*')
        .or(`carpeta_origen.eq.${carpeta},carpeta_destino.eq.${carpeta},producto_marca.eq.${carpeta}`)
        .order('fecha_movimiento', { ascending: false });

      if (error) throw error;

      return data.map((mov: any) => ({
        id: mov.id,
        stockItemId: mov.stock_item_id,
        tipoMovimiento: mov.tipo_movimiento,
        cantidad: mov.cantidad,
        cantidadAnterior: mov.cantidad_anterior,
        cantidadNueva: mov.cantidad_nueva,
        motivo: mov.motivo,
        descripcion: mov.descripcion,
        referenciaExterna: mov.referencia_externa,
        usuarioResponsable: mov.usuario_responsable,
        tecnicoResponsable: mov.tecnico_responsable,
        fechaMovimiento: mov.fecha_movimiento,

        productoNombre: mov.producto_nombre,
        productoMarca: mov.producto_marca,
        productoModelo: mov.producto_modelo,
        numeroSerie: mov.numero_serie, // 🆕 AGREGADO: Incluir número de serie
        codigoItem: mov.codigo_item,
        codigoCargaOrigen: mov.codigo_carga_origen,
        numeroFactura: mov.numero_factura,
        cliente: mov.cliente,
        costoUnitario: mov.costo_unitario,
        valorTotal: mov.valor_total,
        carpetaOrigen: mov.carpeta_origen,
        carpetaDestino: mov.carpeta_destino,
        ubicacionFisica: mov.ubicacion_fisica,
        itemType: mov.item_type || 'stock_item',

        createdAt: mov.created_at
      }));

    } catch (error) {
      console.error('❌ Error obteniendo movimientos por carpeta:', error);
      throw error;
    }
  }

  /**
   * Get all stock transactions
   */
  async getAllTransaccionesStock() {
    try {
      const { data, error } = await supabase
        .from('transacciones_stock')
        .select(`
          *,
          componentes_disponibles (
            nombre,
            marca,
            modelo,
            numero_serie
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data.map((trans: any) => ({
        id: trans.id,
        componenteId: trans.componente_id,
        tipo: trans.tipo,
        cantidad: trans.cantidad,
        cantidadAnterior: trans.cantidad_anterior,
        cantidadNueva: trans.cantidad_nueva,
        motivo: trans.motivo,
        referencia: trans.referencia,
        numeroFactura: trans.numero_factura,
        cliente: trans.cliente,
        tecnicoResponsable: trans.tecnico_responsable,
        observaciones: trans.observaciones,
        fecha: trans.fecha,
        createdAt: trans.created_at,
        componente: trans.componentes_disponibles ? {
          nombre: trans.componentes_disponibles.nombre,
          marca: trans.componentes_disponibles.marca,
          modelo: trans.componentes_disponibles.modelo,
          numeroSerie: trans.componentes_disponibles.numero_serie
        } : undefined
      }))
    } catch (error) {
      console.error('❌ Error loading transacciones stock:', error)
      throw error
    }
  }

  /**
   * Create a stock transaction
   */
  async createTransaccionStock(transaccionData: {
    componenteId: string
    tipo: 'ENTRADA' | 'SALIDA' | 'RESERVA' | 'AJUSTE' | 'DEVOLUCION'
    cantidad: number
    cantidadAnterior: number
    cantidadNueva: number
    motivo: string
    referencia?: string
    numeroFactura?: string
    cliente?: string
    tecnicoResponsable?: string
    observaciones?: string
    fecha: string
  }) {
    try {
      const { data, error } = await supabase
        .from('transacciones_stock')
        .insert({
          componente_id: transaccionData.componenteId,
          tipo: transaccionData.tipo,
          cantidad: transaccionData.cantidad,
          cantidad_anterior: transaccionData.cantidadAnterior,
          cantidad_nueva: transaccionData.cantidadNueva,
          motivo: transaccionData.motivo,
          referencia: transaccionData.referencia,
          numero_factura: transaccionData.numeroFactura,
          cliente: transaccionData.cliente,
          tecnico_responsable: transaccionData.tecnicoResponsable,
          observaciones: transaccionData.observaciones,
          fecha: transaccionData.fecha
        })
        .select()
        .single()

      if (error) throw error

      if (this.config?.enableLogging) {
        console.log('✅ Transacción de stock registrada:', {
          tipo: transaccionData.tipo,
          cantidad: transaccionData.cantidad,
          referencia: transaccionData.referencia,
          cliente: transaccionData.cliente
        })
      }

      return data
    } catch (error) {
      console.error('❌ Error creating transacción stock:', error)
      throw error
    }
  }

  /**
   * Process stock exit with transaction
   */
  async procesarSalidaStock(
    componenteId: string,
    cantidad: number,
    motivo: string,
    referencia?: string,
    numeroFactura?: string,
    cliente?: string
  ) {
    try {
      // 1. Obtener componente actual
      const { data: componente, error: componenteError } = await supabase
        .from('componentes_disponibles')
        .select('*')
        .eq('id', componenteId)
        .single()

      if (componenteError) throw componenteError

      if (!componente) {
        throw new Error('Componente no encontrado')
      }

      if (componente.cantidad_disponible < cantidad) {
        throw new Error(`Stock insuficiente. Disponible: ${componente.cantidad_disponible}, Solicitado: ${cantidad}`)
      }

      const cantidadAnterior = componente.cantidad_disponible
      const cantidadNueva = cantidadAnterior - cantidad

      // 2. Actualizar stock del componente
      const { error: updateError } = await supabase
        .from('componentes_disponibles')
        .update({ cantidad_disponible: cantidadNueva })
        .eq('id', componenteId)

      if (updateError) throw updateError

      // 3. Registrar transacción
      await this.createTransaccionStock({
        componenteId,
        tipo: 'SALIDA',
        cantidad,
        cantidadAnterior,
        cantidadNueva,
        motivo,
        referencia,
        numeroFactura,
        cliente,
        fecha: new Date().toISOString()
      })

      if (this.config?.enableLogging) {
        console.log('✅ Salida de stock procesada exitosamente:', {
          componenteId,
          cantidad,
          cantidadAnterior,
          cantidadNueva,
          referencia,
          cliente
        })
      }

      return true
    } catch (error) {
      console.error('❌ Error procesando salida de stock:', error)
      throw error
    }
  }

  /**
   * Register stock exit for service report
   */
  async registrarSalidaStockReporte(salidaData: {
    itemId: string;
    productoNombre: string;
    productoMarca?: string;
    productoModelo?: string;
    cantidad: number;
    cantidadAnterior: number;
    mantenimientoId?: string;
    equipoId?: string;
    tecnicoResponsable?: string;
    observaciones?: string;
  }) {
    try {
      if (this.config?.enableLogging) {
        console.log('🔧 Registrando salida de stock para reporte de servicio técnico:', salidaData);
      }

      // 1. Actualizar stock en componentes_disponibles (simple y rápido)
      const { error: updateError } = await supabase
        .from('componentes_disponibles')
        .update({
          cantidad_disponible: salidaData.cantidadAnterior - salidaData.cantidad,
          updated_at: new Date().toISOString()
        })
        .eq('id', salidaData.itemId);

      if (updateError) throw updateError;

      // 2. Registrar movimiento para trazabilidad completa
      await this.registrarMovimientoStock({
        itemId: salidaData.itemId,
        itemType: 'componente_disponible',
        productoNombre: salidaData.productoNombre,
        productoMarca: salidaData.productoMarca,
        productoModelo: salidaData.productoModelo,
        tipoMovimiento: 'Salida',
        cantidad: salidaData.cantidad,
        cantidadAnterior: salidaData.cantidadAnterior,
        cantidadNueva: salidaData.cantidadAnterior - salidaData.cantidad,
        motivo: 'Reporte de Servicio Técnico',
        destinoOrigen: salidaData.equipoId ? `Equipo ID: ${salidaData.equipoId}` : 'Servicio Técnico',
        responsable: salidaData.tecnicoResponsable || 'Sistema',
        observaciones: `Mantenimiento ID: ${salidaData.mantenimientoId}. ${salidaData.observaciones || ''}`,
        carpetaOrigen: 'Servicio Técnico'
      });

      // 3. Si hay mantenimiento_id, también registrar en movimientos_stock con referencia
      if (salidaData.mantenimientoId) {
        const { error: movimientoError } = await supabase
          .from('movimientos_stock')
          .update({
            mantenimiento_id: salidaData.mantenimientoId,
            equipo_destino_id: salidaData.equipoId
          })
          .eq('stock_item_id', salidaData.itemId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (movimientoError) {
          console.warn('⚠️ No se pudo vincular el movimiento con el mantenimiento:', movimientoError);
        }
      }

      if (this.config?.enableLogging) {
        console.log('✅ Salida de stock para reporte registrada exitosamente:', {
          producto: salidaData.productoNombre,
          cantidad: salidaData.cantidad,
          mantenimiento: salidaData.mantenimientoId,
          trazabilidadCompleta: true
        });
      }

      return true;

    } catch (error) {
      console.error('❌ Error registrando salida de stock para reporte:', error);
      throw error;
    }
  }

  /**
   * Return parts to stock from service report
   */
  async devolverRepuestosAlStockReporte(devolucionData: {
    itemId: string;
    productoNombre: string;
    productoMarca?: string;
    productoModelo?: string;
    cantidad: number;
    cantidadAnterior: number;
    mantenimientoId?: string;
    equipoId?: string;
    tecnicoResponsable?: string;
    observaciones?: string;
  }) {
    try {
      if (this.config?.enableLogging) {
        console.log('🔄 Devolviendo repuestos al stock desde reporte:', devolucionData);
      }

      // 1. Actualizar stock en componentes_disponibles (simple y rápido)
      const { error: updateError } = await supabase
        .from('componentes_disponibles')
        .update({
          cantidad_disponible: devolucionData.cantidadAnterior + devolucionData.cantidad,
          updated_at: new Date().toISOString()
        })
        .eq('id', devolucionData.itemId);

      if (updateError) throw updateError;

      // 2. Registrar movimiento de devolución para trazabilidad completa
      await this.registrarMovimientoStock({
        itemId: devolucionData.itemId,
        itemType: 'componente_disponible',
        productoNombre: devolucionData.productoNombre,
        productoMarca: devolucionData.productoMarca,
        productoModelo: devolucionData.productoModelo,
        tipoMovimiento: 'Entrada',
        cantidad: devolucionData.cantidad,
        cantidadAnterior: devolucionData.cantidadAnterior,
        cantidadNueva: devolucionData.cantidadAnterior + devolucionData.cantidad,
        motivo: 'Devolución de Reporte de Servicio Técnico',
        destinoOrigen: 'Stock General',
        responsable: devolucionData.tecnicoResponsable || 'Sistema',
        observaciones: `Devolución de Mantenimiento ID: ${devolucionData.mantenimientoId}. ${devolucionData.observaciones || ''}`,
        carpetaDestino: 'Servicio Técnico'
      });

      if (this.config?.enableLogging) {
        console.log('✅ Devolución de repuestos registrada exitosamente:', {
          producto: devolucionData.productoNombre,
          cantidad: devolucionData.cantidad,
          mantenimiento: devolucionData.mantenimientoId,
          trazabilidadCompleta: true
        });
      }

      return true;

    } catch (error) {
      console.error('❌ Error devolviendo repuestos al stock:', error);
      throw error;
    }
  }

  /**
   * Register general stock exit
   */
  async registrarSalidaStock(salidaData: {
    itemId: string;
    productoNombre: string;
    productoMarca?: string;
    productoModelo?: string;
    numeroSerie?: string;
    cantidad: number;
    cantidadAnterior: number;
    motivo: string;
    destino: string;
    responsable: string;
    cliente?: string;
    numeroFactura?: string;
    observaciones?: string;
    carpetaOrigen?: string;
  }) {
    try {
      if (this.config?.enableLogging) {
        console.log('🔍 Iniciando registrarSalidaStock con datos:', {
          itemId: salidaData.itemId,
          productoNombre: salidaData.productoNombre,
          numeroSerie: salidaData.numeroSerie,
          cantidad: salidaData.cantidad,
          cantidadAnterior: salidaData.cantidadAnterior
        });
      }

      // 🔧 CORRECCIÓN: Detectar automáticamente si el producto está en stock_items o componentes_disponibles
      const { data: stockItem, error: stockError } = await supabase
        .from('stock_items')
        .select('id, cantidad_actual')
        .eq('id', salidaData.itemId)
        .single();

      const { data: componenteItem, error: componenteError } = await supabase
        .from('componentes_disponibles')
        .select('id, cantidad_disponible, numero_serie')
        .eq('id', salidaData.itemId)
        .single();

      if (this.config?.enableLogging) {
        console.log('🔍 Resultados de búsqueda:', {
          stockItem,
          stockError: stockError?.message,
          componenteItem,
          componenteError: componenteError?.message
        });
      }

      const itemType = stockItem ? 'stock_item' : 'componente_disponible';
      const tableName = stockItem ? 'stock_items' : 'componentes_disponibles';
      const cantidadField = stockItem ? 'cantidad_actual' : 'cantidad_disponible';

      // Verificar que el item existe en alguna de las dos tablas
      if (!stockItem && !componenteItem) {
        throw new Error(`Item con ID ${salidaData.itemId} no encontrado en stock_items ni componentes_disponibles`);
      }

      if (this.config?.enableLogging) {
        console.log('✅ Item encontrado:', {
          itemType,
          tableName,
          cantidadField,
          cantidadActual: stockItem?.cantidad_actual || componenteItem?.cantidad_disponible
        });
      }

      // 1. Registrar el movimiento de salida
      await this.registrarMovimientoStock({
        itemId: salidaData.itemId,
        itemType: itemType,
        productoNombre: salidaData.productoNombre,
        productoMarca: salidaData.productoMarca,
        productoModelo: salidaData.productoModelo,
        numeroSerie: salidaData.numeroSerie,
        tipoMovimiento: 'Salida', // ✅ Corregido: usar "Salida" en lugar de "SALIDA"
        cantidad: salidaData.cantidad,
        cantidadAnterior: salidaData.cantidadAnterior,
        cantidadNueva: salidaData.cantidadAnterior - salidaData.cantidad,
        motivo: salidaData.motivo,
        destinoOrigen: salidaData.destino,
        responsable: salidaData.responsable,
        cliente: salidaData.cliente,
        numeroFactura: salidaData.numeroFactura,
        observaciones: salidaData.observaciones,
        carpetaOrigen: salidaData.carpetaOrigen
      });

      // 2. Actualizar la cantidad en la tabla correcta
      if (this.config?.enableLogging) {
        console.log('🔄 Actualizando cantidad en tabla:', {
          tabla: tableName,
          campo: cantidadField,
          itemId: salidaData.itemId,
          cantidadAnterior: salidaData.cantidadAnterior,
          cantidadSalida: salidaData.cantidad,
          cantidadNueva: salidaData.cantidadAnterior - salidaData.cantidad
        });
      }

      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          [cantidadField]: salidaData.cantidadAnterior - salidaData.cantidad,
          updated_at: new Date().toISOString()
        })
        .eq('id', salidaData.itemId);

      if (updateError) {
        console.error('❌ Error actualizando cantidad:', updateError);
        throw updateError;
      }

      if (this.config?.enableLogging) {
        console.log('✅ Cantidad actualizada exitosamente en', tableName);
        console.log('✅ Salida de stock registrada exitosamente:', {
          producto: salidaData.productoNombre,
          cantidad: salidaData.cantidad,
          destino: salidaData.destino
        });
      }

      return true;

    } catch (error) {
      console.error('❌ Error registrando salida de stock:', error);
      throw error;
    }
  }

  /**
   * Get stock traceability statistics
   */
  async getEstadisticasTrazabilidad() {
    try {
      const { data: movimientos, error } = await supabase
        .from('movimientos_stock')
        .select('*');

      if (error) throw error;

      const hoy = new Date().toISOString().split('T')[0];
      const inicioMes = new Date().toISOString().substring(0, 7);

      const estadisticas = {
        totalMovimientos: movimientos.length,
        movimientosHoy: movimientos.filter(m => m.fecha_movimiento?.startsWith(hoy)).length,
        movimientosMes: movimientos.filter(m => m.fecha_movimiento?.startsWith(inicioMes)).length,

        entradas: {
          total: movimientos.filter(m => m.tipo_movimiento === 'Entrada').length,
          mes: movimientos.filter(m =>
            m.tipo_movimiento === 'Entrada' &&
            m.fecha_movimiento?.startsWith(inicioMes)
          ).length,
          valorTotal: movimientos
            .filter(m => m.tipo_movimiento === 'Entrada')
            .reduce((sum, m) => sum + (m.valor_total || 0), 0)
        },

        salidas: {
          total: movimientos.filter(m => m.tipo_movimiento === 'Salida').length,
          mes: movimientos.filter(m =>
            m.tipo_movimiento === 'Salida' &&
            m.fecha_movimiento?.startsWith(inicioMes)
          ).length,
          valorTotal: movimientos
            .filter(m => m.tipo_movimiento === 'Salida')
            .reduce((sum, m) => sum + (m.valor_total || 0), 0)
        },

        ajustes: {
          total: movimientos.filter(m => m.tipo_movimiento === 'Ajuste').length,
          mes: movimientos.filter(m =>
            m.tipo_movimiento === 'Ajuste' &&
            m.fecha_movimiento?.startsWith(inicioMes)
          ).length
        },

        // Top productos con más movimientos
        productosConMasMovimientos: Object.entries(
          movimientos.reduce((acc: any, mov) => {
            const key = `${mov.producto_nombre} - ${mov.producto_marca}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {})
        )
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, 5)
          .map(([producto, cantidad]) => ({ producto, cantidad })),

        // Carpetas con más actividad
        carpetasConMasActividad: Object.entries(
          movimientos.reduce((acc: any, mov) => {
            if (mov.carpeta_origen) {
              acc[mov.carpeta_origen] = (acc[mov.carpeta_origen] || 0) + 1;
            }
            return acc;
          }, {})
        )
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, 5)
          .map(([carpeta, cantidad]) => ({ carpeta, cantidad }))
      };

      return estadisticas;

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de trazabilidad:', error);
      throw error;
    }
  }
}

// ===============================================
// MODULE INSTANCE AND EXPORTS
// ===============================================

const stockModule = new StockModuleImpl();

// Export the module instance
export default stockModule;

// Export individual functions for backward compatibility
export const getAllStockItems = stockModule.getAllStockItems.bind(stockModule);
export const updateStockItemDetails = stockModule.updateStockItemDetails.bind(stockModule);
export const updateComponenteDisponibleDetails = stockModule.updateComponenteDisponibleDetails.bind(stockModule);
export const registrarMovimientoStock = stockModule.registrarMovimientoStock.bind(stockModule);
export const getAllMovimientosStock = stockModule.getAllMovimientosStock.bind(stockModule);
export const getMovimientosByProducto = stockModule.getMovimientosByProducto.bind(stockModule);
export const getMovimientosByCarpeta = stockModule.getMovimientosByCarpeta.bind(stockModule);
export const getEstadisticasTrazabilidad = stockModule.getEstadisticasTrazabilidad.bind(stockModule);
export const getAllTransaccionesStock = stockModule.getAllTransaccionesStock.bind(stockModule);
export const createTransaccionStock = stockModule.createTransaccionStock.bind(stockModule);
export const procesarSalidaStock = stockModule.procesarSalidaStock.bind(stockModule);
export const registrarSalidaStockReporte = stockModule.registrarSalidaStockReporte.bind(stockModule);
export const devolverRepuestosAlStockReporte = stockModule.devolverRepuestosAlStockReporte.bind(stockModule);
export const registrarSalidaStock = stockModule.registrarSalidaStock.bind(stockModule);

// Initialize the module with default config
stockModule.initialize({
  supabaseClient: supabase,
  enableLogging: true,
  enableErrorReporting: true
});