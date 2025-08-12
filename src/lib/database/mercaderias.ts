import { supabase } from '../supabase'
import type { CargaMercaderia, ProductoCarga, SubItem, Equipo } from '@/types'
import { procesarProductoParaStock } from '../stock-flow'
import { 
  createEquipoFromMercaderia,
  createComponenteInventarioTecnico,
  createComponenteInventarioTecnicoReparacion,
  createComponenteInventarioTecnicoFromSubitem
} from './equipos'
import { withPerformanceMonitoring } from './shared/performance'

// ===============================================
// TYPES AND INTERFACES
// ===============================================

export interface MercaderiasModule {
  createCargaMercaderia(cargaData: CargaMercaderiaInput): Promise<CargaMercaderia>
  getCargaCompleta(cargaId: string): Promise<CargaMercaderia>
  getAllCargas(): Promise<CargaMercaderia[]>
  generateCodigoCarga(): Promise<string>
  createEquipoFromMercaderia(producto: any, carga: any, subitems?: any[]): Promise<Equipo>
  deleteCargaMercaderia(cargaId: string): Promise<void>
}

export interface CargaMercaderiaInput {
  tipoCarga: 'stock' | 'cliente' | 'reparacion'
  cliente?: string
  ubicacionServicio?: string
  observacionesGenerales?: string
  numeroCargaPersonalizado?: string
  productos: Array<{
    producto: string
    tipoProducto: 'Insumo' | 'Repuesto' | 'Equipo Médico'
    marca: string
    modelo: string
    numeroSerie?: string
    cantidad: number
    observaciones?: string
    paraStock?: boolean
    paraServicioTecnico?: boolean
    imagen?: string
    subitems?: Array<{
      nombre: string
      numeroSerie?: string
      cantidad: number
      paraStock?: boolean
      paraServicioTecnico?: boolean
    }>
  }>
}

// ===============================================
// CORE MERCADERIAS FUNCTIONS
// ===============================================

const _createCargaMercaderia = async function(cargaData: CargaMercaderiaInput): Promise<CargaMercaderia> {
  try {
    console.log('🔄 Creating carga mercadería...', { tipoCarga: cargaData.tipoCarga })

    // 1. Generate load code
    const codigoCarga = await generateCodigoCarga()

    // 2. Calculate destination for database compatibility
    const destino = cargaData.tipoCarga === 'stock'
      ? 'Stock/Inventario General'
      : cargaData.tipoCarga === 'reparacion'
        ? `🔧 REPARACIÓN - ${cargaData.cliente} - ${cargaData.ubicacionServicio}`
        : `${cargaData.cliente} - ${cargaData.ubicacionServicio}`;

    // 3. Create main load
    const { data: carga, error: cargaError } = await supabase
      .from('cargas_mercaderia')
      .insert({
        codigo_carga: codigoCarga,
        destino: destino,
        observaciones_generales: cargaData.observacionesGenerales,
        numero_carga_personalizado: cargaData.numeroCargaPersonalizado
      })
      .select()
      .single()

    if (cargaError) {
      console.error('❌ Error creating carga mercadería:', cargaError)
      throw cargaError
    }

    // 4. Create products
    const productosParaInsertar = cargaData.productos.map(producto => ({
      carga_id: carga.id,
      producto: producto.producto,
      tipo_producto: producto.tipoProducto,
      marca: producto.marca,
      modelo: producto.modelo,
      numero_serie: producto.numeroSerie,
      cantidad: producto.cantidad,
      observaciones: producto.observaciones,
      para_servicio_tecnico: producto.paraServicioTecnico || false,
      imagen: producto.imagen
    }))

    const { data: productos, error: productosError } = await supabase
      .from('productos_carga')
      .insert(productosParaInsertar)
      .select()

    if (productosError) {
      console.error('❌ Error creating productos:', productosError)
      throw productosError
    }

    // 5. Create subitems for medical equipment
    const subitemsParaInsertar: any[] = []

    for (let i = 0; i < cargaData.productos.length; i++) {
      const producto = cargaData.productos[i]
      const productoDB = productos[i]

      if (producto.tipoProducto === 'Equipo Médico' && producto.subitems) {
        for (const subitem of producto.subitems) {
          subitemsParaInsertar.push({
            producto_id: productoDB.id,
            nombre: subitem.nombre,
            numero_serie: subitem.numeroSerie || '',
            cantidad: subitem.cantidad,
            para_servicio_tecnico: subitem.paraServicioTecnico || false
          })
        }
      }
    }

    if (subitemsParaInsertar.length > 0) {
      const { error: subitemsError } = await supabase
        .from('subitems')
        .insert(subitemsParaInsertar)

      if (subitemsError) {
        console.error('❌ Error creating subitems:', subitemsError)
        throw subitemsError
      }
    }

    // 6. Process all products for stock and technical inventory
    for (let i = 0; i < cargaData.productos.length; i++) {
      const producto = cargaData.productos[i]
      const productoDB = productos[i]

      // Special case: If it's a REPAIR entry, all products go to technical inventory as "En reparación"
      if (cargaData.tipoCarga === 'reparacion') {
        const componenteReparacion = await createComponenteInventarioTecnicoReparacion(productoDB, carga)
        if (componenteReparacion) {
          console.log('🔧 Product sent to Technical Inventory for REPAIR:', producto.producto)
        }
        continue // Skip the rest of the logic for this product
      }

      // All products go to stock (creating folders by brand)
      await createOrUpdateStockFromProduct(carga.codigo_carga, producto, cargaData.tipoCarga)

      // All medical equipment automatically goes to the equipment module and stock
      if (producto.tipoProducto === 'Equipo Médico') {
        // Complete medical equipment goes as equipment to technical service
        const equipoCreado = await createEquipoFromMercaderia(productoDB, carga, producto.subitems || [])
        if (equipoCreado) {
          console.log('✅ Medical equipment automatically sent to Equipment module')
        }
        
        // Medical equipment also goes to stock as available components
        console.log('✅ Medical equipment also processed for stock as available component')
      }

      // Only if the technical service checkbox is marked: also send to technical inventory
      if (producto.paraServicioTecnico) {
        if (producto.tipoProducto === 'Equipo Médico') {
          // Already processed above as equipment, no additional action needed
          console.log('✅ Medical equipment already in equipment module')
          
          // Process subitems marked for technical inventory
          if (producto.subitems && producto.subitems.length > 0) {
            for (const subitem of producto.subitems) {
              if (subitem.paraServicioTecnico) {
                const componenteSubitem = await createComponenteInventarioTecnicoFromSubitem(
                  subitem,
                  productoDB,
                  carga
                )
                if (componenteSubitem) {
                  console.log('✅ Subitem sent to Technical Inventory:', subitem.nombre)
                }
              }
            }
          }
        } else {
          // Only non-medical products marked for technical service go to technical inventory
          const componenteCreado = await createComponenteInventarioTecnico(productoDB, carga)
          if (componenteCreado) {
            console.log('🔧 Component sent to Technical Inventory (marked for service):', producto.producto)
          }
        }
      } else {
        console.log('⏭️ Product NOT marked for technical service, only goes to normal stock:', producto.producto)
      }
    }

    console.log('✅ Carga mercadería created successfully:', codigoCarga)

    // 7. Return complete load
    return await getCargaCompleta(carga.id)

  } catch (error) {
    console.error('❌ Error in createCargaMercaderia:', error)
    throw error
  }
}

export async function getCargaCompleta(cargaId: string): Promise<CargaMercaderia> {
  try {
    const { data: carga, error: cargaError } = await supabase
      .from('cargas_mercaderia')
      .select(`
        *,
        productos_carga (
          *,
          subitems (*)
        )
      `)
      .eq('id', cargaId)
      .single()

    if (cargaError) {
      console.error('❌ Error getting carga completa:', cargaError)
      throw cargaError
    }

    // Convert to frontend format
    const esStock = carga.destino === 'Stock/Inventario General';
    const esReparacion = carga.destino.startsWith('🔧 REPARACIÓN -');

    let cliente, ubicacionServicio;
    if (esStock) {
      cliente = undefined;
      ubicacionServicio = undefined;
    } else if (esReparacion) {
      // For repairs: "🔧 REPARACIÓN - Cliente - Ubicación"
      const partesReparacion = carga.destino.replace('🔧 REPARACIÓN - ', '').split(' - ', 2);
      cliente = partesReparacion[0];
      ubicacionServicio = partesReparacion[1];
    } else {
      // For normal client: "Cliente - Ubicación"
      [cliente, ubicacionServicio] = carga.destino.includes(' - ')
        ? carga.destino.split(' - ', 2)
        : [carga.destino, undefined];
    }

    return {
      id: carga.id,
      codigoCarga: carga.codigo_carga,
      fechaIngreso: carga.fecha_ingreso,
      tipoCarga: esStock ? 'stock' as const : esReparacion ? 'reparacion' as const : 'cliente' as const,
      cliente,
      ubicacionServicio,
      destino: carga.destino,
      observacionesGenerales: carga.observaciones_generales,
      numeroCargaPersonalizado: carga.numero_carga_personalizado,
      productos: carga.productos_carga.map((p: any) => ({
        id: p.id,
        producto: p.producto,
        tipoProducto: p.tipo_producto,
        marca: p.marca,
        modelo: p.modelo,
        numeroSerie: p.numero_serie,
        cantidad: p.cantidad,
        observaciones: p.observaciones,
        paraServicioTecnico: p.para_servicio_tecnico || false,
        imagen: p.imagen,
        subitems: p.subitems.map((s: any) => ({
          id: s.id,
          nombre: s.nombre,
          numeroSerie: s.numero_serie,
          cantidad: s.cantidad,
          paraServicioTecnico: s.para_servicio_tecnico || false
        }))
      })),
      createdAt: carga.created_at
    }
  } catch (error) {
    console.error('❌ Error in getCargaCompleta:', error)
    throw error
  }
}

export async function getAllCargas(): Promise<CargaMercaderia[]> {
  try {
    const { data, error } = await supabase
      .from('cargas_mercaderia')
      .select(`
        *,
        productos_carga (
          *,
          subitems (*)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error getting all cargas:', error)
      throw error
    }

    return data.map((carga: any) => {
      const esStock = carga.destino === 'Stock/Inventario General';
      const esReparacion = carga.destino.startsWith('🔧 REPARACIÓN -');

      let cliente, ubicacionServicio;
      if (esStock) {
        cliente = undefined;
        ubicacionServicio = undefined;
      } else if (esReparacion) {
        // For repairs: "🔧 REPARACIÓN - Cliente - Ubicación"
        const partesReparacion = carga.destino.replace('🔧 REPARACIÓN - ', '').split(' - ', 2);
        cliente = partesReparacion[0];
        ubicacionServicio = partesReparacion[1];
      } else {
        // For normal client: "Cliente - Ubicación"
        [cliente, ubicacionServicio] = carga.destino.includes(' - ')
          ? carga.destino.split(' - ', 2)
          : [carga.destino, undefined];
      }

      return {
        id: carga.id,
        codigoCarga: carga.codigo_carga,
        fechaIngreso: carga.fecha_ingreso,
        tipoCarga: esStock ? 'stock' as const : esReparacion ? 'reparacion' as const : 'cliente' as const,
        cliente,
        ubicacionServicio,
        destino: carga.destino,
        observacionesGenerales: carga.observaciones_generales,
        numeroCargaPersonalizado: carga.numero_carga_personalizado,
        productos: carga.productos_carga.map((p: any) => ({
          id: p.id,
          producto: p.producto,
          tipoProducto: p.tipo_producto,
          marca: p.marca,
          modelo: p.modelo,
          numeroSerie: p.numero_serie,
          cantidad: p.cantidad,
          observaciones: p.observaciones,
          paraServicioTecnico: p.para_servicio_tecnico || false,
          imagen: p.imagen,
          subitems: p.subitems.map((s: any) => ({
            id: s.id,
            nombre: s.nombre,
            numeroSerie: s.numero_serie,
            cantidad: s.cantidad,
            paraServicioTecnico: s.para_servicio_tecnico || false
          }))
        })),
        createdAt: carga.created_at
      }
    })
  } catch (error) {
    console.error('❌ Error in getAllCargas:', error)
    throw error
  }
}

export async function generateCodigoCarga(): Promise<string> {
  try {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')

    const todayPrefix = `ENTRADA-${year}${month}${day}`

    const { data, error } = await supabase
      .from('cargas_mercaderia')
      .select('codigo_carga')
      .like('codigo_carga', `${todayPrefix}%`)
      .order('codigo_carga', { ascending: false })
      .limit(1)

    if (error) {
      console.error('❌ Error generating codigo carga:', error)
      throw error
    }

    const nextNumber = data.length > 0
      ? parseInt(data[0].codigo_carga.split('-')[2]) + 1
      : 1

    return `${todayPrefix}-${String(nextNumber).padStart(3, '0')}`
  } catch (error) {
    console.error('❌ Error in generateCodigoCarga:', error)
    throw error
  }
}



export async function deleteCargaMercaderia(cargaId: string): Promise<void> {
  try {
    console.log('🔄 Deleting carga mercadería:', cargaId)

    // Delete in correct order due to foreign key constraints
    // 1. First, get the producto IDs to delete subitems
    const { data: productos, error: productosSelectError } = await supabase
      .from('productos_carga')
      .select('id')
      .eq('carga_id', cargaId)

    if (productosSelectError) {
      console.error('❌ Error getting productos for deletion:', productosSelectError)
      throw productosSelectError
    }

    // 2. Delete subitems if there are productos
    if (productos && productos.length > 0) {
      const productoIds = productos.map(p => p.id)
      
      const { error: subitemsError } = await supabase
        .from('subitems')
        .delete()
        .in('producto_id', productoIds)

      if (subitemsError) {
        console.error('❌ Error deleting subitems:', subitemsError)
        throw subitemsError
      }
    }

    // 3. Delete productos_carga
    const { error: productosError } = await supabase
      .from('productos_carga')
      .delete()
      .eq('carga_id', cargaId)

    if (productosError) {
      console.error('❌ Error deleting productos:', productosError)
      throw productosError
    }

    // 4. Delete main carga
    const { error: cargaError } = await supabase
      .from('cargas_mercaderia')
      .delete()
      .eq('id', cargaId)

    if (cargaError) {
      console.error('❌ Error deleting carga:', cargaError)
      throw cargaError
    }

    console.log('✅ Carga mercadería deleted successfully:', cargaId)
  } catch (error) {
    console.error('❌ Error in deleteCargaMercaderia:', error)
    throw error
  }
}

// ===============================================
// STOCK PROCESSING FUNCTIONS
// ===============================================

export async function createOrUpdateStockFromProduct(cargaId: string, producto: any, tipoCarga: string = 'stock'): Promise<void> {
  try {
    console.log('🔄 Processing product for stock with automatic organization...', {
      cargaId,
      producto: producto.producto,
      tipoCarga,
      marca: producto.marca
    })

    // Process product for stock using the existing stock-flow function
    await procesarProductoParaStock(cargaId, producto, tipoCarga)

    console.log('✅ Product processed for stock successfully')
  } catch (error) {
    console.error('❌ Error in createOrUpdateStockFromProduct:', error)
    throw error
  }
}

export async function createOrUpdateStockFromSubitem(cargaId: string, producto: any, subitem: any, tipoCarga: string = 'stock'): Promise<void> {
  try {
    console.log('🔄 Processing subitem for stock...', {
      cargaId,
      subitem: subitem.nombre,
      productoPadre: producto.producto
    })

    // Create a product-like object from the subitem
    const subitemAsProduct = {
      producto: subitem.nombre,
      marca: producto.marca, // Inherit brand from parent product
      modelo: producto.modelo, // Inherit model from parent product
      numeroSerie: subitem.numeroSerie,
      cantidad: subitem.cantidad,
      tipoProducto: 'Accesorio', // Subitems are accessories
      observaciones: `Subitem de: ${producto.producto}. ${subitem.observaciones || ''}`
    }

    // Process subitem for stock using the existing stock-flow function
    await procesarProductoParaStock(cargaId, subitemAsProduct, tipoCarga)

    console.log('✅ Subitem processed for stock successfully')
  } catch (error) {
    console.error('❌ Error in createOrUpdateStockFromSubitem:', error)
    throw error
  }
}

// ===============================================
// PERFORMANCE-MONITORED EXPORTS
// ===============================================

// Export performance-monitored versions of critical functions
export const createCargaMercaderia = withPerformanceMonitoring(
  'mercaderias.createCargaMercaderia',
  _createCargaMercaderia
);

// Note: getCargaCompleta, getAllCargas, and deleteCargaMercaderia are already exported above
// with performance monitoring if needed in the future

