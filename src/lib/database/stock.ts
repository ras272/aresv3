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
  
  // 📦 CAMPOS DE FRACCIONAMIENTO
  tipoUnidadMovimiento?: string; // 'caja' | 'unidad'
  cajasAfectadas?: number;
  unidadesSueltasAfectadas?: number;

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
   * Get all stock items from stock_items table only
   */
  async getAllStockItems() {
    try {
      if (this.config?.enableLogging) {
        console.log('🔄 Obteniendo stock desde vista v_stock_disponible_fraccionado...');
      }

      // Usar la vista con información de fraccionamiento
      const { data: stockItems, error: stockError } = await supabase
        .from('v_stock_disponible_fraccionado')
        .select('*')
        .order('created_at', { ascending: false });

      if (stockError) {
        console.error('❌ Error obteniendo stock desde vista:', stockError);
        throw stockError;
      }

      if (this.config?.enableLogging) {
        console.log(`✅ Obtenidos ${stockItems?.length || 0} stock items con info de fraccionamiento`);
      }

      // Mapear datos de la vista al formato esperado por el store
      const stockItemsFormateados = (stockItems || []).map((item: any) => ({
        id: item.id,
        nombre: item.nombre,
        marca: item.marca,
        modelo: item.modelo,
        numeroSerie: item.numero_serie || null,
        tipoComponente: 'Producto', // Campo fijo ya que todos los items en stock_items son productos
        cantidadDisponible: item.cantidad_actual,
        cantidadOriginal: item.cantidad_actual,
        ubicacionFisica: `Almacén ${item.marca}`, // Campo calculado
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
        fuente: 'stock_items',
        
        // Nuevos campos de fraccionamiento para el stock principal
        permite_fraccionamiento: item.permite_fraccionamiento,
        unidades_por_paquete: item.unidades_por_paquete,
        cajas_completas: item.cajas_completas,
        unidades_sueltas: item.unidades_sueltas,
        estado_caja: item.estado_caja,
        badge_estado_caja: item.badge_estado_caja,
        stock_formato_legible: item.stock_formato_legible,
        unidades_totales: item.unidades_totales
      }));

      if (this.config?.enableLogging) {
        console.log('✅ Stock items obtenidos correctamente:', {
          total: stockItemsFormateados.length,
          marcas: [...new Set(stockItemsFormateados.map(item => item.marca))]
        });
      }

      return stockItemsFormateados;
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

      if (this.config?.enableLogging) {
        console.log('🔍 Total componentes en BD:', componentes?.length || 0);
        console.log('🔍 Primeros 3 componentes:', componentes?.slice(0, 3).map(c => ({
          nombre: c.nombre,
          marca: c.marca,
          modelo: c.modelo,
          id_generado: `${c.nombre}-${c.marca}-${c.modelo}`.toLowerCase().replace(/\s+/g, '-')
        })));
      }

      // Función para normalizar strings (manejar acentos y caracteres especiales)
      const normalizeString = (str: string) => {
        return str
          .toLowerCase()
          .normalize('NFD') // Descomponer caracteres acentuados
          .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos (acentos)
          .replace(/\s+/g, '-') // Reemplazar espacios con guiones
          .replace(/[^a-z0-9-]/g, ''); // Remover caracteres especiales excepto guiones
      };

      // Filtrar los items que corresponden al producto
      const itemsDelProducto = componentes.filter(item => {
        // Usar la misma lógica de generación de ID que en la página de stock
        const productoId = `${item.nombre}-${item.marca}-${item.modelo}`;
        const productoIdNormalizado = normalizeString(productoId);
        const productIdNormalizado = normalizeString(productId);
        
        if (this.config?.enableLogging) {
          console.log('🔍 Comparando:', { 
            generado: productoIdNormalizado, 
            buscado: productIdNormalizado, 
            coincide: productoIdNormalizado === productIdNormalizado,
            original: {
              generado: productoId,
              buscado: productId
            },
            item: { 
              nombre: item.nombre, 
              marca: item.marca, 
              modelo: item.modelo
            }
          });
        }
        return productoIdNormalizado === productIdNormalizado;
      });

      if (this.config?.enableLogging) {
        console.log('🔍 Items encontrados:', itemsDelProducto.length);
      }

      if (itemsDelProducto.length === 0) {
        if (this.config?.enableLogging) {
          console.log('🔍 No encontrado en componentes_disponibles, buscando en stock_items...');
        }
        
        // Buscar en stock_items si no se encuentra en componentes_disponibles
        const { data: stockItems, error: stockError } = await supabase
          .from('stock_items')
          .select('*');

        if (stockError) throw stockError;

        const stockItemsDelProducto = stockItems.filter(item => {
          const productoId = `${item.nombre}-${item.marca}-${item.modelo}`;
          const productoIdNormalizado = normalizeString(productoId);
          const productIdNormalizado = normalizeString(productId);
          
          if (this.config?.enableLogging) {
            console.log('🔍 Comparando en stock_items:', { 
              generado: productoIdNormalizado, 
              buscado: productIdNormalizado, 
              coincide: productoIdNormalizado === productIdNormalizado,
              item: { 
                nombre: item.nombre, 
                marca: item.marca, 
                modelo: item.modelo
              }
            });
          }
          return productoIdNormalizado === productIdNormalizado;
        });

        if (stockItemsDelProducto.length === 0) {
          throw new Error('Producto no encontrado en stock (ni en componentes_disponibles ni en stock_items)');
        }

        // Actualizar en stock_items
        const updateData: any = {
          updated_at: new Date().toISOString()
        };
        
        if (updates.imagen !== undefined) {
          updateData.imagen_url = updates.imagen;
        }
        if (updates.observaciones !== undefined) {
          updateData.observaciones = updates.observaciones;
        }

        const updatePromises = stockItemsDelProducto.map(item =>
          supabase
            .from('stock_items')
            .update(updateData)
            .eq('id', item.id)
        );

        const results = await Promise.all(updatePromises);
        const errors = results.filter(result => result.error);
        if (errors.length > 0) {
          throw new Error(`Error actualizando ${errors.length} items en stock_items`);
        }

        if (this.config?.enableLogging) {
          console.log('✅ Producto actualizado exitosamente en stock_items:', {
            productId,
            itemsActualizados: stockItemsDelProducto.length,
            imagen: updates.imagen ? 'Actualizada' : 'Sin cambios',
            observaciones: updates.observaciones ? 'Actualizadas' : 'Sin cambios'
          });
        }

        return true;
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
      // 🔧 SOLUCIÓN TEMPORAL: Primero intentar inserción básica sin metadata
      // para identificar qué campos exactos espera la tabla
      
      // Solo campos básicos que REALMENTE existen en la tabla movimientos_stock
      const insertData: any = {
        tipo_movimiento: movimiento.tipoMovimiento,
        cantidad: Math.round(movimiento.cantidad), // Redondear a entero
        cantidad_anterior: Math.round(movimiento.cantidadAnterior), // Redondear a entero
        cantidad_nueva: Math.round(movimiento.cantidadNueva), // Redondear a entero
        motivo: movimiento.motivo,
        // Guardar información del producto y cliente en descripcion JSON
        descripcion: JSON.stringify({
          productoNombre: movimiento.productoNombre,
          productoMarca: movimiento.productoMarca,
          productoModelo: movimiento.productoModelo,
          numeroSerie: movimiento.numeroSerie,
          cliente: movimiento.cliente,
          numeroFactura: movimiento.numeroFactura,  // 🆕 NUEVO: Incluir explícitamente el número de factura
          observaciones: movimiento.observaciones,
          carpetaOrigen: movimiento.carpetaOrigen,
          carpetaDestino: movimiento.carpetaDestino,
          responsable: movimiento.responsable
        })
      };

      // Campos opcionales solo si tienen valor
      if (movimiento.numeroFactura || movimiento.destinoOrigen) {
        insertData.referencia_externa = movimiento.numeroFactura || movimiento.destinoOrigen;
      }
      if (movimiento.costoUnitario) {
        insertData.costo_unitario = movimiento.costoUnitario;
        insertData.costo_total = movimiento.costoUnitario * movimiento.cantidad;
      }

      // Solo agregar stock_item_id si es realmente un stock_item
      if (movimiento.itemType === 'stock_item' && movimiento.itemId) {
        insertData.stock_item_id = movimiento.itemId;
      } else {
        // Para componentes_disponibles, necesitamos crear un stock_item temporal o saltarnos esto
        // Por ahora, saltaremos el registro de movimiento para componentes_disponibles
        // ya que la tabla requiere un stock_item_id válido
        if (this.config?.enableLogging) {
          console.log('⚠️ Saltando registro de movimiento para componente_disponible:', {
            itemId: movimiento.itemId,
            producto: movimiento.productoNombre
          });
        }
        return null; // No registrar movimiento para componentes_disponibles
      }

      if (this.config?.enableLogging) {
        console.log('🔄 Intentando insertar movimiento con datos:', JSON.stringify(insertData, null, 2));
      }

      const { data, error } = await supabase
        .from('movimientos_stock')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error específico de Supabase:');
        console.error('Message:', error.message);
        console.error('Details:', error.details);
        console.error('Hint:', error.hint);
        console.error('Code:', error.code);
        console.error('Full error object:', error);
        console.error('Data que se intentó insertar:', JSON.stringify(insertData, null, 2));
        throw error;
      }

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
      // Obtener movimientos con información del stock_item relacionado
      const { data, error } = await supabase
        .from('movimientos_stock')
        .select(`
          *,
          stock_items (
            id,
            nombre,
            marca,
            modelo,
            numero_serie
          )
        `)
        .order('fecha_movimiento', { ascending: false });

      if (error) throw error;

      return data.map((mov: any) => {
        // 🔧 CORREGIDO: Usar detalles_adicionales para metadatos de fraccionamiento
        let datosAdicionales: any = {};
        let metadataJSON: string | null = null;
        
        // Priorizar detalles_adicionales (donde se guardan metadatos de fraccionamiento)
        if (mov.detalles_adicionales) {
          try {
            datosAdicionales = JSON.parse(mov.detalles_adicionales);
            metadataJSON = mov.detalles_adicionales; // Guardar el JSON original
          } catch (e) {
            // Si no es JSON válido, probar con descripcion
            try {
              if (mov.descripcion) {
                datosAdicionales = JSON.parse(mov.descripcion);
                metadataJSON = mov.descripcion;
              }
            } catch (e2) {
              datosAdicionales.observaciones = mov.descripcion;
            }
          }
        } else {
          // Fallback a descripcion si no hay detalles_adicionales
          try {
            if (mov.descripcion) {
              datosAdicionales = JSON.parse(mov.descripcion);
              metadataJSON = mov.descripcion;
            }
          } catch (e) {
            datosAdicionales.observaciones = mov.descripcion;
          }
        }
        
        // Usar datos del stock_item relacionado si existe
        const stockItem = mov.stock_items;
        
        return {
          id: mov.id,
          stockItemId: mov.stock_item_id,
          tipoMovimiento: mov.tipo_movimiento,
          cantidad: mov.cantidad,
          cantidadAnterior: mov.cantidad_anterior,
          cantidadNueva: mov.cantidad_nueva,
          motivo: mov.motivo,
          descripcion: metadataJSON || undefined, // 🔧 CORREGIDO: Pasar el JSON original para formateo
          referenciaExterna: mov.referencia_externa,
          usuarioResponsable: datosAdicionales.responsable || 'Sistema',
          tecnicoResponsable: undefined,
          fechaMovimiento: mov.fecha_movimiento,

          // Datos del producto desde stock_item o desde JSON
          productoNombre: stockItem?.nombre || datosAdicionales.productoNombre || 'Producto no especificado',
          productoMarca: stockItem?.marca || datosAdicionales.productoMarca,
          productoModelo: stockItem?.modelo || datosAdicionales.productoModelo,
          numeroSerie: stockItem?.numero_serie || datosAdicionales.numeroSerie,
          codigoItem: undefined,
          codigoCargaOrigen: undefined,
          numeroFactura: datosAdicionales.numeroFactura || mov.referencia_externa,  // 🆕 PRIORIZAR numeroFactura del JSON
          cliente: (datosAdicionales.cliente && !datosAdicionales.cliente.includes('REMISION-') && !datosAdicionales.cliente.includes('REM-')) 
                  ? datosAdicionales.cliente 
                  : null,  // 🔧 EVITAR mostrar números de remisión como cliente
          costoUnitario: mov.costo_unitario,
          valorTotal: mov.costo_total,
          carpetaOrigen: datosAdicionales.carpetaOrigen || stockItem?.marca,
          carpetaDestino: datosAdicionales.carpetaDestino,
          ubicacionFisica: undefined,
          itemType: 'stock_item',
          
          // 📦 CAMPOS DE FRACCIONAMIENTO
          tipoUnidadMovimiento: mov.tipo_unidad_movimiento,
          cajasAfectadas: mov.cajas_afectadas,
          unidadesSueltasAfectadas: mov.unidades_sueltas_afectadas,

          createdAt: mov.created_at
        };
      });

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
      // Obtener movimientos con información del stock_item relacionado
      const { data, error } = await supabase
        .from('movimientos_stock')
        .select(`
          *,
          stock_items (
            id,
            nombre,
            marca,
            modelo,
            numero_serie
          )
        `)
        .order('fecha_movimiento', { ascending: false });

      if (error) throw error;

      // Filtrar por producto
      const movimientosFiltrados = data.filter((mov: any) => {
        const stockItem = mov.stock_items;
        
        // 🔧 CORREGIDO: Priorizar detalles_adicionales para metadatos de fraccionamiento
        let datosAdicionales: any = {};
        if (mov.detalles_adicionales) {
          try {
            datosAdicionales = JSON.parse(mov.detalles_adicionales);
          } catch (e) {
            try {
              if (mov.descripcion) {
                datosAdicionales = JSON.parse(mov.descripcion);
              }
            } catch (e2) {
              // No es JSON
            }
          }
        } else {
          try {
            if (mov.descripcion) {
              datosAdicionales = JSON.parse(mov.descripcion);
            }
          } catch (e) {
            // No es JSON
          }
        }
        
        const nombre = stockItem?.nombre || datosAdicionales.productoNombre;
        const marca = stockItem?.marca || datosAdicionales.productoMarca;
        
        const nombreCoincide = nombre === productoNombre;
        const marcaCoincide = !productoMarca || marca === productoMarca;
        return nombreCoincide && marcaCoincide;
      });

      return movimientosFiltrados.map((mov: any) => {
        // 🔧 CORREGIDO: Usar detalles_adicionales para metadatos de fraccionamiento
        let datosAdicionales: any = {};
        let metadataJSON: string | null = null;
        
        if (mov.detalles_adicionales) {
          try {
            datosAdicionales = JSON.parse(mov.detalles_adicionales);
            metadataJSON = mov.detalles_adicionales;
          } catch (e) {
            try {
              if (mov.descripcion) {
                datosAdicionales = JSON.parse(mov.descripcion);
                metadataJSON = mov.descripcion;
              }
            } catch (e2) {
              datosAdicionales.observaciones = mov.descripcion;
            }
          }
        } else {
          try {
            if (mov.descripcion) {
              datosAdicionales = JSON.parse(mov.descripcion);
              metadataJSON = mov.descripcion;
            }
          } catch (e) {
            datosAdicionales.observaciones = mov.descripcion;
          }
        }
        
        const stockItem = mov.stock_items;
        
        return {
          id: mov.id,
          stockItemId: mov.stock_item_id,
          tipoMovimiento: mov.tipo_movimiento,
          cantidad: mov.cantidad,
          cantidadAnterior: mov.cantidad_anterior,
          cantidadNueva: mov.cantidad_nueva,
          motivo: mov.motivo,
          descripcion: metadataJSON || undefined, // 🔧 CORREGIDO: Pasar JSON original
          referenciaExterna: mov.referencia_externa,
          usuarioResponsable: datosAdicionales.responsable || 'Sistema',
          tecnicoResponsable: undefined,
          fechaMovimiento: mov.fecha_movimiento,

          productoNombre: stockItem?.nombre || datosAdicionales.productoNombre || 'Producto no especificado',
          productoMarca: stockItem?.marca || datosAdicionales.productoMarca,
          productoModelo: stockItem?.modelo || datosAdicionales.productoModelo,
          numeroSerie: stockItem?.numero_serie || datosAdicionales.numeroSerie,
          codigoItem: undefined,
          codigoCargaOrigen: undefined,
          numeroFactura: datosAdicionales.numeroFactura || mov.referencia_externa,  // 🆕 PRIORIZAR numeroFactura del JSON
          cliente: datosAdicionales.cliente || mov.referencia_externa,
          costoUnitario: mov.costo_unitario,
          valorTotal: mov.costo_total,
          carpetaOrigen: datosAdicionales.carpetaOrigen || stockItem?.marca,
          carpetaDestino: datosAdicionales.carpetaDestino,
          ubicacionFisica: undefined,
          itemType: 'stock_item',
          
          // 📦 CAMPOS DE FRACCIONAMIENTO
          tipoUnidadMovimiento: mov.tipo_unidad_movimiento,
          cajasAfectadas: mov.cajas_afectadas,
          unidadesSueltasAfectadas: mov.unidades_sueltas_afectadas,

          createdAt: mov.created_at
        };
      });

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
      // Obtener movimientos con información del stock_item relacionado
      const { data, error } = await supabase
        .from('movimientos_stock')
        .select(`
          *,
          stock_items (
            id,
            nombre,
            marca,
            modelo,
            numero_serie
          )
        `)
        .order('fecha_movimiento', { ascending: false });

      if (error) throw error;

      // Filtrar por carpeta (marca)
      const movimientosFiltrados = data.filter((mov: any) => {
        const stockItem = mov.stock_items;
        
        // 🔧 CORREGIDO: Priorizar detalles_adicionales para metadatos de fraccionamiento
        let datosAdicionales: any = {};
        if (mov.detalles_adicionales) {
          try {
            datosAdicionales = JSON.parse(mov.detalles_adicionales);
          } catch (e) {
            try {
              if (mov.descripcion) {
                datosAdicionales = JSON.parse(mov.descripcion);
              }
            } catch (e2) {
              // No es JSON
            }
          }
        } else {
          try {
            if (mov.descripcion) {
              datosAdicionales = JSON.parse(mov.descripcion);
            }
          } catch (e) {
            // No es JSON
          }
        }
        
        const marca = stockItem?.marca || datosAdicionales.productoMarca;
        const carpetaOrigen = datosAdicionales.carpetaOrigen || marca;
        const carpetaDestino = datosAdicionales.carpetaDestino;
        
        return carpetaOrigen === carpeta || 
               carpetaDestino === carpeta || 
               marca === carpeta;
      });

      return movimientosFiltrados.map((mov: any) => {
        // 🔧 CORREGIDO: Usar detalles_adicionales para metadatos de fraccionamiento
        let datosAdicionales: any = {};
        let metadataJSON: string | null = null;
        
        if (mov.detalles_adicionales) {
          try {
            datosAdicionales = JSON.parse(mov.detalles_adicionales);
            metadataJSON = mov.detalles_adicionales;
          } catch (e) {
            try {
              if (mov.descripcion) {
                datosAdicionales = JSON.parse(mov.descripcion);
                metadataJSON = mov.descripcion;
              }
            } catch (e2) {
              datosAdicionales.observaciones = mov.descripcion;
            }
          }
        } else {
          try {
            if (mov.descripcion) {
              datosAdicionales = JSON.parse(mov.descripcion);
              metadataJSON = mov.descripcion;
            }
          } catch (e) {
            datosAdicionales.observaciones = mov.descripcion;
          }
        }
        
        const stockItem = mov.stock_items;
        
        return {
          id: mov.id,
          stockItemId: mov.stock_item_id,
          tipoMovimiento: mov.tipo_movimiento,
          cantidad: mov.cantidad,
          cantidadAnterior: mov.cantidad_anterior,
          cantidadNueva: mov.cantidad_nueva,
          motivo: mov.motivo,
          descripcion: metadataJSON || undefined, // 🔧 CORREGIDO: Pasar JSON original
          referenciaExterna: mov.referencia_externa,
          usuarioResponsable: datosAdicionales.responsable || 'Sistema',
          tecnicoResponsable: undefined,
          fechaMovimiento: mov.fecha_movimiento,

          productoNombre: stockItem?.nombre || datosAdicionales.productoNombre || 'Producto no especificado',
          productoMarca: stockItem?.marca || datosAdicionales.productoMarca,
          productoModelo: stockItem?.modelo || datosAdicionales.productoModelo,
          numeroSerie: stockItem?.numero_serie || datosAdicionales.numeroSerie,
          codigoItem: undefined,
          codigoCargaOrigen: undefined,
          numeroFactura: datosAdicionales.numeroFactura || mov.referencia_externa,  // 🆕 PRIORIZAR numeroFactura del JSON
          cliente: datosAdicionales.cliente || mov.referencia_externa,
          costoUnitario: mov.costo_unitario,
          valorTotal: mov.costo_total,
          carpetaOrigen: datosAdicionales.carpetaOrigen || stockItem?.marca,
          carpetaDestino: datosAdicionales.carpetaDestino,
          ubicacionFisica: undefined,
          itemType: 'stock_item',
          
          // 📦 CAMPOS DE FRACCIONAMIENTO
          tipoUnidadMovimiento: mov.tipo_unidad_movimiento,
          cajasAfectadas: mov.cajas_afectadas,
          unidadesSueltasAfectadas: mov.unidades_sueltas_afectadas,

          createdAt: mov.created_at
        };
      });

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
      // Por ahora, devolver un array vacío ya que las transacciones_stock
      // estaban vinculadas a componentes_disponibles que ya no existe
      // TODO: Migrar transacciones_stock para usar stock_items
      console.warn('⚠️ getAllTransaccionesStock: Retornando array vacío - tabla necesita migración');
      return [];
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
   * Register general stock exit (with fractioning support)
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
    // 📦 NUEVO: Soporte para fraccionamiento
    tipoVenta?: 'unidad' | 'caja';
    permiteFraccionamiento?: boolean;
    unidadesPorPaquete?: number;
  }) {
    try {
      if (this.config?.enableLogging) {
        console.log('🔍 Iniciando registrarSalidaStock con datos:', {
          itemId: salidaData.itemId,
          productoNombre: salidaData.productoNombre,
          numeroSerie: salidaData.numeroSerie,
          cantidad: salidaData.cantidad,
          cantidadAnterior: salidaData.cantidadAnterior,
          tipoVenta: salidaData.tipoVenta,
          permiteFraccionamiento: salidaData.permiteFraccionamiento,
          unidadesPorPaquete: salidaData.unidadesPorPaquete
        });
      }

      // 🔧 CORRECCIÓN: Detectar automáticamente si el producto está en stock_items o componentes_disponibles
      const { data: stockItem, error: stockError } = await supabase
        .from('stock_items')
        .select('id, cantidad_actual, permite_fraccionamiento, unidades_por_paquete')
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

      // 📦 PREPARAR INFORMACIÓN PARA REGISTRO DE MOVIMIENTO
      let descripcionFraccionamiento = '';

      // Solo aplicar lógica de fraccionamiento para stock_items que la soporten
      if (itemType === 'stock_item' && 
          salidaData.permiteFraccionamiento && 
          salidaData.unidadesPorPaquete && 
          salidaData.tipoVenta) {
        
        if (salidaData.tipoVenta === 'caja') {
          descripcionFraccionamiento = `Venta por caja: ${salidaData.cantidad} caja(s) de ${salidaData.unidadesPorPaquete} unidades c/u`;
        } else if (salidaData.tipoVenta === 'unidad') {
          descripcionFraccionamiento = `Venta por unidad: ${salidaData.cantidad} unidades (fraccionamiento automático)`;
        }
        
        if (this.config?.enableLogging) {
          console.log('📦 Producto fraccionable - será procesado por función de base de datos:', {
            tipoVenta: salidaData.tipoVenta,
            cantidadSolicitada: salidaData.cantidad,
            unidadesPorPaquete: salidaData.unidadesPorPaquete,
            descripcionFraccionamiento
          });
        }
      } else {
        // Sin fraccionamiento: usar cantidad directamente
        descripcionFraccionamiento = `Venta normal: ${salidaData.cantidad} unidades`;
      }

      if (this.config?.enableLogging) {
        console.log('✅ Item encontrado:', {
          itemType,
          tableName,
          cantidadField,
          cantidadActual: stockItem?.cantidad_actual || componenteItem?.cantidad_disponible
        });
      }

      // Calcular cantidad nueva solo para productos sin fraccionamiento
      // Para productos fraccionados, la función de base de datos maneja todo
      const cantidadNuevaCalculada = (itemType === 'stock_item' && salidaData.permiteFraccionamiento) 
        ? salidaData.cantidadAnterior // Se mantendrá igual, la función de DB se encarga
        : salidaData.cantidadAnterior - salidaData.cantidad;

      // 1. Registrar el movimiento de salida con la descripción de fraccionamiento
      const observacionesCompletas = [
        salidaData.observaciones,
        descripcionFraccionamiento
      ].filter(Boolean).join(' | ');

      // Solo registrar movimiento manual para productos SIN fraccionamiento
      // Los productos fraccionados registran su propio movimiento en la función de DB
      if (!(itemType === 'stock_item' && salidaData.permiteFraccionamiento && salidaData.tipoVenta)) {
        await this.registrarMovimientoStock({
          itemId: salidaData.itemId,
          itemType: itemType,
          productoNombre: salidaData.productoNombre,
          productoMarca: salidaData.productoMarca,
          productoModelo: salidaData.productoModelo,
          numeroSerie: salidaData.numeroSerie,
          tipoMovimiento: 'Salida',
          cantidad: salidaData.cantidad, // Cantidad solicitada por el usuario
          cantidadAnterior: salidaData.cantidadAnterior,
          cantidadNueva: cantidadNuevaCalculada,
          motivo: salidaData.motivo,
          destinoOrigen: salidaData.destino,
          responsable: salidaData.responsable,
          cliente: salidaData.cliente,
          numeroFactura: salidaData.numeroFactura,
          observaciones: observacionesCompletas,
          carpetaOrigen: salidaData.carpetaOrigen
        });
      }

      // 2. Actualizar la cantidad en la tabla correcta
      if (itemType === 'stock_item' && salidaData.permiteFraccionamiento && salidaData.tipoVenta) {
        // 📦 USAR LA FUNCIÓN DE BASE DE DATOS PARA FRACCIONAMIENTO
        if (this.config?.enableLogging) {
          console.log('📦 Usando función procesar_venta_fraccionada:', {
            stockItemId: salidaData.itemId,
            cantidadSolicitada: salidaData.cantidad,
            tipoVenta: salidaData.tipoVenta,
            usuario: salidaData.responsable,
            referencia: `REMISION-${Date.now()}`
          });
        }

        const { data: resultado, error: fraccionError } = await supabase.rpc('procesar_venta_fraccionada', {
          p_stock_item_id: salidaData.itemId,
          p_cantidad_solicitada: salidaData.cantidad,
          p_tipo_venta: salidaData.tipoVenta,
          p_usuario: salidaData.responsable || 'Sistema',
          p_referencia: `REMISION-${Date.now()}`
        });

        if (fraccionError) {
          console.error('❌ Error en función procesar_venta_fraccionada:', fraccionError);
          throw fraccionError;
        }

        if (!resultado?.success) {
          console.error('❌ Error procesando venta fraccionada:', resultado?.error);
          throw new Error(resultado?.error || 'Error procesando venta fraccionada');
        }

        if (this.config?.enableLogging) {
          console.log('✅ Venta fraccionada procesada exitosamente:', resultado);
        }
      } else {
        // Para productos sin fraccionamiento o componentes_disponibles
        const updateData: any = { 
          [cantidadField]: Math.round(cantidadNuevaCalculada),
          updated_at: new Date().toISOString()
        };
        
        if (this.config?.enableLogging) {
          console.log('🔄 Actualizando stock simple:', {
            tabla: tableName,
            campo: cantidadField,
            itemId: salidaData.itemId,
            cantidadNueva: Math.round(cantidadNuevaCalculada)
          });
        }

        const { error: updateError } = await supabase
          .from(tableName)
          .update(updateData)
          .eq('id', salidaData.itemId);

        if (updateError) {
          console.error('❌ Error actualizando cantidad:', updateError);
          throw updateError;
        }
      }

      if (this.config?.enableLogging) {
        console.log('✅ Salida de stock procesada exitosamente:', {
          producto: salidaData.productoNombre,
          cantidadSolicitada: salidaData.cantidad,
          tipoVenta: salidaData.tipoVenta,
          permiteFraccionamiento: salidaData.permiteFraccionamiento,
          destino: salidaData.destino,
          descripcion: descripcionFraccionamiento
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
            .reduce((sum, m) => sum + (m.costo_total || 0), 0)
        },

        salidas: {
          total: movimientos.filter(m => m.tipo_movimiento === 'Salida').length,
          mes: movimientos.filter(m =>
            m.tipo_movimiento === 'Salida' &&
            m.fecha_movimiento?.startsWith(inicioMes)
          ).length,
          valorTotal: movimientos
            .filter(m => m.tipo_movimiento === 'Salida')
            .reduce((sum, m) => sum + (m.costo_total || 0), 0)
        },

        ajustes: {
          total: movimientos.filter(m => m.tipo_movimiento === 'Ajuste').length,
          mes: movimientos.filter(m =>
            m.tipo_movimiento === 'Ajuste' &&
            m.fecha_movimiento?.startsWith(inicioMes)
          ).length
        },

        // Top productos con más movimientos (usando metadata)
        productosConMasMovimientos: Object.entries(
          movimientos.reduce((acc: any, mov) => {
            const metadata = mov.metadata || {};
            const key = `${metadata.productoNombre || 'Sin nombre'} - ${metadata.productoMarca || 'Sin marca'}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {})
        )
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, 5)
          .map(([producto, cantidad]) => ({ producto, cantidad })),

        // Carpetas con más actividad (usando metadata)
        carpetasConMasActividad: Object.entries(
          movimientos.reduce((acc: any, mov) => {
            const metadata = mov.metadata || {};
            if (metadata.carpetaOrigen) {
              acc[metadata.carpetaOrigen] = (acc[metadata.carpetaOrigen] || 0) + 1;
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