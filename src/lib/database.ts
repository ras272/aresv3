import { supabase } from './supabase'
import type { CargaMercaderia, ProductoCarga, SubItem, Equipo, ComponenteEquipo, Mantenimiento } from '@/types'

// ===============================================
// FUNCIONES PARA CARGAS DE MERCADERÍA
// ===============================================

export async function createCargaMercaderia(cargaData: {
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
    paraServicioTecnico?: boolean // 🎯 NUEVO: Control manual para servicio técnico
    imagen?: string
    subitems?: Array<{
      nombre: string
      numeroSerie?: string // 🔧 OPCIONAL - No todos los accesorios tienen número de serie
      cantidad: number
      paraServicioTecnico?: boolean // 🎯 NUEVO: Control manual para servicio técnico
    }>
  }>
}) {
  try {
    // 1. Generar código de carga
    const codigoCarga = await generateCodigoCarga()
    
    // 2. Calcular destino para compatibilidad con base de datos existente
    const destino = cargaData.tipoCarga === 'stock' 
      ? 'Stock/Inventario General' 
      : cargaData.tipoCarga === 'reparacion'
        ? `🔧 REPARACIÓN - ${cargaData.cliente} - ${cargaData.ubicacionServicio}`
        : `${cargaData.cliente} - ${cargaData.ubicacionServicio}`;
    
    // 3. Crear carga principal
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

    if (cargaError) throw cargaError

    // 3. Crear productos
    const productosParaInsertar = cargaData.productos.map(producto => ({
      carga_id: carga.id,
      producto: producto.producto,
      tipo_producto: producto.tipoProducto,
      marca: producto.marca,
      modelo: producto.modelo,
      numero_serie: producto.numeroSerie,
      cantidad: producto.cantidad,
      observaciones: producto.observaciones,
      para_servicio_tecnico: producto.paraServicioTecnico || false, // 🎯 NUEVO: Control manual
      imagen: producto.imagen
    }))

    const { data: productos, error: productosError } = await supabase
      .from('productos_carga')
      .insert(productosParaInsertar)
      .select()

    if (productosError) throw productosError

    // 4. Crear subitems para equipos médicos
    const subitemsParaInsertar: any[] = []
    
    for (let i = 0; i < cargaData.productos.length; i++) {
      const producto = cargaData.productos[i]
      const productoDB = productos[i]
      
      if (producto.tipoProducto === 'Equipo Médico' && producto.subitems) {
        for (const subitem of producto.subitems) {
          subitemsParaInsertar.push({
            producto_id: productoDB.id,
            nombre: subitem.nombre,
            numero_serie: subitem.numeroSerie || '', // 🔧 Cadena vacía si no tiene número de serie
            cantidad: subitem.cantidad,
            para_servicio_tecnico: subitem.paraServicioTecnico || false // 🎯 NUEVO: Control manual
          })
        }
      }
    }

    if (subitemsParaInsertar.length > 0) {
      const { error: subitemsError } = await supabase
        .from('subitems')
        .insert(subitemsParaInsertar)

      if (subitemsError) throw subitemsError
    }

    // 5. Procesar productos para Servicio Técnico
    for (let i = 0; i < cargaData.productos.length; i++) {
      const producto = cargaData.productos[i]
      const productoDB = productos[i]
      
      // 🔧 CASO ESPECIAL: Si es entrada de REPARACIÓN, todos los productos van al inventario técnico como "En reparación"
      if (cargaData.tipoCarga === 'reparacion') {
        const componenteReparacion = await createComponenteInventarioTecnicoReparacion(productoDB, carga)
        if (componenteReparacion) {
          console.log('🔧 Producto enviado al Inventario Técnico para REPARACIÓN:', producto.producto)
        }
        continue; // Saltar el resto de la lógica para este producto
      }
      
      if (producto.tipoProducto === 'Equipo Médico') {
        // Equipos médicos completos van como equipos al servicio técnico
        const equipoCreado = await createEquipoFromMercaderia(productoDB, carga, producto.subitems || [])
        if (equipoCreado) {
          console.log('✅ Equipo médico enviado automáticamente al módulo de Servicio Técnico')
        } else {
          console.log('📦 Equipo médico guardado en stock/inventario')
        }

        // 🎯 NUEVO: Procesar subitems marcados para inventario técnico
        if (producto.subitems && producto.subitems.length > 0) {
          for (const subitem of producto.subitems) {
            if (subitem.paraServicioTecnico) {
              // Crear entrada en inventario técnico para el subitem
              const componenteSubitem = await createComponenteInventarioTecnicoFromSubitem(
                subitem, 
                productoDB, 
                carga
              )
              if (componenteSubitem) {
                console.log('✅ Subitem enviado al Inventario Técnico:', subitem.nombre)
              }
            }
          }
        }
      } else if (producto.paraServicioTecnico) {
        // 🎯 NUEVO: Componentes/Repuestos marcados van al inventario técnico (NO como equipos)
        const componenteCreado = await createComponenteInventarioTecnico(productoDB, carga)
        if (componenteCreado) {
          console.log('✅ Componente enviado al Inventario Técnico:', producto.producto)
        }
      }
    }

    // 6. Retornar carga completa
    return await getCargaCompleta(carga.id)

  } catch (error) {
    console.error('Error creating carga mercadería:', error)
    throw error
  }
}

export async function getCargaCompleta(cargaId: string): Promise<CargaMercaderia> {
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

  if (cargaError) throw cargaError

  // Convertir a formato del frontend
  const esStock = carga.destino === 'Stock/Inventario General';
  const esReparacion = carga.destino.startsWith('🔧 REPARACIÓN -');
  
  let cliente, ubicacionServicio;
  if (esStock) {
    cliente = undefined;
    ubicacionServicio = undefined;
  } else if (esReparacion) {
    // Para reparaciones: "🔧 REPARACIÓN - Cliente - Ubicación"
    const partesReparacion = carga.destino.replace('🔧 REPARACIÓN - ', '').split(' - ', 2);
    cliente = partesReparacion[0];
    ubicacionServicio = partesReparacion[1];
  } else {
    // Para cliente normal: "Cliente - Ubicación"
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
    destino: carga.destino, // Mantener para compatibilidad
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
      paraServicioTecnico: p.para_servicio_tecnico || false, // 🎯 NUEVO: Control manual
      imagen: p.imagen,
      subitems: p.subitems.map((s: any) => ({
        id: s.id,
        nombre: s.nombre,
        numeroSerie: s.numero_serie,
        cantidad: s.cantidad,
        paraServicioTecnico: s.para_servicio_tecnico || false // 🎯 NUEVO: Control manual
      }))
    })),
    createdAt: carga.created_at
  }
}

export async function getAllCargas(): Promise<CargaMercaderia[]> {
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

  if (error) throw error

  return data.map((carga: any) => {
    const esStock = carga.destino === 'Stock/Inventario General';
    const esReparacion = carga.destino.startsWith('🔧 REPARACIÓN -');
    
    let cliente, ubicacionServicio;
    if (esStock) {
      cliente = undefined;
      ubicacionServicio = undefined;
    } else if (esReparacion) {
      // Para reparaciones: "🔧 REPARACIÓN - Cliente - Ubicación"
      const partesReparacion = carga.destino.replace('🔧 REPARACIÓN - ', '').split(' - ', 2);
      cliente = partesReparacion[0];
      ubicacionServicio = partesReparacion[1];
    } else {
      // Para cliente normal: "Cliente - Ubicación"
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
      destino: carga.destino, // Mantener para compatibilidad
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
        paraServicioTecnico: p.para_servicio_tecnico || false, // 🎯 NUEVO: Control manual
        imagen: p.imagen,
        subitems: p.subitems.map((s: any) => ({
          id: s.id,
          nombre: s.nombre,
          numeroSerie: s.numero_serie,
          cantidad: s.cantidad,
          paraServicioTecnico: s.para_servicio_tecnico || false // 🎯 NUEVO: Control manual
        }))
      })),
      createdAt: carga.created_at
    }
  })
}

export async function generateCodigoCarga(): Promise<string> {
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

  if (error) throw error

  const nextNumber = data.length > 0 
    ? parseInt(data[0].codigo_carga.split('-')[2]) + 1 
    : 1

  return `${todayPrefix}-${String(nextNumber).padStart(3, '0')}`
}

// ===============================================
// FUNCIONES PARA SERVICIO TÉCNICO
// ===============================================

// 🔧 NUEVA: Crear componente en inventario técnico para REPARACIÓN
export async function createComponenteInventarioTecnicoReparacion(
  producto: any, 
  carga: any
) {
  try {
    // Determinar tipo de componente basado en el nombre del producto
    const tipoComponente = determinarTipoComponente(producto.producto);

    const { data: componente, error: componenteError } = await supabase
      .from('componentes_disponibles')
      .insert({
        producto_carga_id: producto.id,
        nombre: producto.producto,
        marca: producto.marca,
        modelo: producto.modelo,
        numero_serie: producto.numero_serie,
        tipo_componente: tipoComponente,
        cantidad_disponible: producto.cantidad,
        cantidad_original: producto.cantidad,
        ubicacion_fisica: 'Taller de Reparación',
        estado: 'En reparación', // 🔧 Estado específico para reparaciones
        observaciones: `🔧 EQUIPO EN REPARACIÓN. Ingresado desde mercaderías. Código: ${carga.codigo_carga}. ${producto.observaciones || ''}`,
        codigo_carga_origen: carga.codigo_carga
      })
      .select()
      .single()

    if (componenteError) throw componenteError

    console.log('🔧 Componente agregado al inventario técnico para REPARACIÓN:', {
      codigoCarga: carga.codigo_carga,
      componente: producto.producto,
      tipo: tipoComponente,
      cantidad: producto.cantidad,
      estado: 'En reparación'
    })

    return componente

  } catch (error) {
    console.error('Error creating componente reparación inventario técnico:', error)
    throw error
  }
}

// 🎯 NUEVA: Crear componente en inventario técnico (NO como equipo)
export async function createComponenteInventarioTecnico(
  producto: any, 
  carga: any
) {
  try {
    // Solo procesar si NO es para stock general
    if (carga.destino === 'Stock/Inventario General') {
      console.log('⚠️ Componente marcado para stock - no se envía al inventario técnico');
      return null;
    }

    // Determinar tipo de componente basado en el nombre del producto
    const tipoComponente = determinarTipoComponente(producto.producto);

    const { data: componente, error: componenteError } = await supabase
      .from('componentes_disponibles')
      .insert({
        producto_carga_id: producto.id,
        nombre: producto.producto,
        marca: producto.marca,
        modelo: producto.modelo,
        numero_serie: producto.numero_serie,
        tipo_componente: tipoComponente,
        cantidad_disponible: producto.cantidad,
        cantidad_original: producto.cantidad,
        ubicacion_fisica: 'Almacén Servicio Técnico',
        estado: 'Disponible',
        observaciones: `Ingresado desde mercaderías. Código: ${carga.codigo_carga}. ${producto.observaciones || ''}`,
        codigo_carga_origen: carga.codigo_carga
      })
      .select()
      .single()

    if (componenteError) throw componenteError

    console.log('✅ Componente agregado al inventario técnico:', {
      codigoCarga: carga.codigo_carga,
      componente: producto.producto,
      tipo: tipoComponente,
      cantidad: producto.cantidad
    })

    return componente

  } catch (error) {
    console.error('Error creating componente inventario técnico:', error)
    throw error
  }
}

// 🎯 NUEVA: Crear componente en inventario técnico desde subitem
export async function createComponenteInventarioTecnicoFromSubitem(
  subitem: any,
  producto: any, 
  carga: any
) {
  try {
    // Solo procesar si NO es para stock general
    if (carga.destino === 'Stock/Inventario General') {
      console.log('⚠️ Subitem marcado para stock - no se envía al inventario técnico');
      return null;
    }

    // Determinar tipo de componente basado en el nombre del subitem
    const tipoComponente = determinarTipoComponente(subitem.nombre);

    const { data: componente, error: componenteError } = await supabase
      .from('componentes_disponibles')
      .insert({
        producto_carga_id: producto.id, // Relacionar con el producto padre
        nombre: subitem.nombre,
        marca: producto.marca, // Usar marca del producto padre
        modelo: subitem.nombre, // El modelo es el nombre del subitem
        numero_serie: subitem.numeroSerie || '', // Número de serie del subitem
        tipo_componente: tipoComponente,
        cantidad_disponible: subitem.cantidad,
        cantidad_original: subitem.cantidad,
        ubicacion_fisica: 'Almacén Servicio Técnico',
        estado: 'Disponible',
        observaciones: `Subitem de ${producto.producto}. Ingresado desde mercaderías. Código: ${carga.codigo_carga}.`,
        codigo_carga_origen: carga.codigo_carga
      })
      .select()
      .single()

    if (componenteError) throw componenteError

    console.log('✅ Subitem agregado al inventario técnico:', {
      codigoCarga: carga.codigo_carga,
      subitem: subitem.nombre,
      productoPadre: producto.producto,
      tipo: tipoComponente,
      cantidad: subitem.cantidad,
      numeroSerie: subitem.numeroSerie || 'Sin número de serie'
    })

    return componente

  } catch (error) {
    console.error('Error creating subitem inventario técnico:', error)
    throw error
  }
}

// Función auxiliar para determinar el tipo de componente
function determinarTipoComponente(nombreProducto: string): string {
  const nombre = nombreProducto.toLowerCase();
  
  if (nombre.includes('pieza de mano') || nombre.includes('handpiece')) {
    return 'Pieza de mano';
  }
  if (nombre.includes('cartucho') || nombre.includes('cartridge')) {
    return 'Cartucho';
  }
  if (nombre.includes('transductor') || nombre.includes('transducer')) {
    return 'Transductor';
  }
  if (nombre.includes('cable') && (nombre.includes('especializado') || nombre.includes('técnico'))) {
    return 'Cable especializado';
  }
  if (nombre.includes('sensor')) {
    return 'Sensor';
  }
  if (nombre.includes('aplicador')) {
    return 'Aplicador';
  }
  if (nombre.includes('punta') || nombre.includes('tip')) {
    return 'Punta/Tip';
  }
  
  // Por defecto
  return 'Componente técnico';
}

// 🎯 NUEVA: Crear equipo manual desde formulario /equipos/nuevo
export async function createEquipo(equipoData: {
  cliente: string;
  ubicacion: string;
  nombreEquipo: string;
  tipoEquipo: string;
  marca: string;
  modelo: string;
  numeroSerieBase: string;
  componentes: Array<{
    nombre: string;
    numeroSerie: string;
    estado: 'Operativo' | 'En reparacion' | 'Fuera de servicio';
    observaciones?: string;
  }>;
  accesorios?: string;
  fechaEntrega: string;
  observaciones?: string;
}) {
  try {
    console.log('🔄 Creando equipo manual...', equipoData);

    // 1. Crear equipo principal
    const { data: equipo, error: equipoError } = await supabase
      .from('equipos')
      .insert({
        cliente: equipoData.cliente,
        ubicacion: equipoData.ubicacion,
        nombre_equipo: equipoData.nombreEquipo,
        tipo_equipo: equipoData.tipoEquipo,
        marca: equipoData.marca,
        modelo: equipoData.modelo,
        numero_serie_base: equipoData.numeroSerieBase,
        accesorios: equipoData.accesorios,
        fecha_entrega: equipoData.fechaEntrega,
        observaciones: equipoData.observaciones,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (equipoError) {
      console.error('❌ Error creating equipo:', equipoError);
      throw equipoError;
    }

    console.log('✅ Equipo creado exitosamente:', equipo);

    // 2. Crear componentes del equipo
    if (equipoData.componentes && equipoData.componentes.length > 0) {
      const componentesParaInsertar = equipoData.componentes.map(componente => ({
        equipo_id: equipo.id,
        nombre: componente.nombre,
        numero_serie: componente.numeroSerie,
        estado: componente.estado,
        observaciones: componente.observaciones
      }));

      const { error: componentesError } = await supabase
        .from('componentes_equipo')
        .insert(componentesParaInsertar);

      if (componentesError) {
        console.error('❌ Error creating componentes:', componentesError);
        // No lanzar error, el equipo ya se creó
      } else {
        console.log('✅ Componentes creados exitosamente');
      }
    }

    console.log('✅ Equipo manual creado completamente:', {
      equipoId: equipo.id,
      nombreEquipo: equipoData.nombreEquipo,
      cliente: equipoData.cliente,
      componentes: equipoData.componentes.length
    });

    return equipo;

  } catch (error) {
    console.error('❌ Error creating equipo manual:', error);
    throw error;
  }
}

export async function createEquipoFromMercaderia(
  producto: any, 
  carga: any, 
  subitems: Array<{ nombre: string; numeroSerie?: string; cantidad: number; paraServicioTecnico?: boolean }> // 🔧 + 🎯 NUEVO
) {
  try {
    // Solo crear equipos para cargas de cliente específico
    if (carga.destino === 'Stock/Inventario General') {
      console.log('⚠️ Equipo médico en stock - no se envía automáticamente a Servicio Técnico');
      return null;
    }

    // 1. Crear equipo
    const { data: equipo, error: equipoError } = await supabase
      .from('equipos')
      .insert({
        cliente: carga.destino.split(' - ')[0] || carga.destino,
        ubicacion: carga.destino,
        nombre_equipo: `${producto.producto}-${carga.codigo_carga}`,
        tipo_equipo: producto.producto,
        marca: producto.marca,
        modelo: producto.modelo,
        numero_serie_base: producto.numero_serie || 'SIN-SERIE',
        accesorios: subitems.map(s => s.nombre).join(', ') || 'Sin accesorios específicos',
        fecha_entrega: carga.fecha_ingreso,
        observaciones: `Ingresado automáticamente desde el módulo de mercaderías. Código de carga: ${carga.codigo_carga}. ${carga.observaciones_generales || ''} ${producto.observaciones || ''}`,
        codigo_carga_origen: carga.codigo_carga
      })
      .select()
      .single()

    if (equipoError) throw equipoError

    // 2. Crear componentes - Solo los marcados para servicio técnico
    const subitemsParaServicio = subitems.filter(subitem => subitem.paraServicioTecnico === true);
    
    const componentesParaInsertar = [
      {
        equipo_id: equipo.id,
        nombre: 'Equipo Principal',
        numero_serie: producto.numero_serie || 'SIN-SERIE',
        estado: 'Operativo' as const,
        observaciones: `Cantidad: ${producto.cantidad}. ${producto.observaciones || ''}`
      },
      // 🎯 Solo subitems marcados para servicio técnico
      ...subitemsParaServicio.map(subitem => ({
        equipo_id: equipo.id,
        nombre: subitem.nombre,
        numero_serie: subitem.numeroSerie || 'SIN-SERIE',
        estado: 'Operativo' as const,
        observaciones: `Cantidad: ${subitem.cantidad}. Marcado para mantenimiento técnico.`
      }))
    ]

    const { error: componentesError } = await supabase
      .from('componentes_equipo')
      .insert(componentesParaInsertar)

    if (componentesError) throw componentesError

    console.log('✅ Equipo médico enviado inteligentemente al módulo de Servicio Técnico:', {
      codigoCarga: carga.codigo_carga,
      producto: producto.producto,
      destino: carga.destino,
      totalSubitems: subitems.length,
      subitemsParaServicio: subitemsParaServicio.length,
      componentesTotales: componentesParaInsertar.length
    })

    return equipo

  } catch (error) {
    console.error('Error creating equipo from mercadería:', error)
    throw error
  }
}

export async function getAllEquipos(): Promise<Equipo[]> {
  const { data, error } = await supabase
    .from('equipos')
    .select(`
      *,
      componentes_equipo (*)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data.map((equipo: any) => ({
    id: equipo.id,
    cliente: equipo.cliente,
    ubicacion: equipo.ubicacion,
    nombreEquipo: equipo.nombre_equipo,
    tipoEquipo: equipo.tipo_equipo,
    marca: equipo.marca,
    modelo: equipo.modelo,
    numeroSerieBase: equipo.numero_serie_base,
    componentes: equipo.componentes_equipo.map((c: any) => ({
      id: c.id,
      nombre: c.nombre,
      numeroSerie: c.numero_serie,
      estado: c.estado,
      observaciones: c.observaciones
    })),
    accesorios: equipo.accesorios,
    fechaEntrega: equipo.fecha_entrega,
    observaciones: equipo.observaciones,
    createdAt: equipo.created_at
  }))
}

export async function createMantenimiento(mantenimientoData: {
  equipoId: string
  componenteId?: string
  descripcion: string
  estado: 'Pendiente' | 'En proceso' | 'Finalizado'
  comentarios?: string
  archivo?: {
    nombre: string
    tamaño: number
    tipo: string
  }
}) {
  const { data, error } = await supabase
    .from('mantenimientos')
    .insert({
      equipo_id: mantenimientoData.equipoId,
      componente_id: mantenimientoData.componenteId,
      descripcion: mantenimientoData.descripcion,
      estado: mantenimientoData.estado,
      comentarios: mantenimientoData.comentarios,
      archivo_nombre: mantenimientoData.archivo?.nombre,
      archivo_tamaño: mantenimientoData.archivo?.tamaño,
      archivo_tipo: mantenimientoData.archivo?.tipo
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getAllMantenimientos(): Promise<Mantenimiento[]> {
  const { data, error } = await supabase
    .from('mantenimientos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  return data.map((m: any) => ({
    id: m.id,
    equipoId: m.equipo_id,
    componenteId: m.componente_id,
    fecha: m.fecha,
    descripcion: m.descripcion,
    estado: m.estado,
    comentarios: m.comentarios,
    reporteGenerado: m.reporte_generado || false,
    archivo: m.archivo_nombre ? {
      nombre: m.archivo_nombre,
      tamaño: m.archivo_tamaño,
      tipo: m.archivo_tipo
    } : undefined,
    createdAt: m.created_at
  }))
}

export async function updateComponente(componenteId: string, updates: {
  estado?: 'Operativo' | 'En reparacion' | 'Fuera de servicio'
  observaciones?: string
}) {
  const { data, error } = await supabase
    .from('componentes_equipo')
    .update({
      estado: updates.estado,
      observaciones: updates.observaciones
    })
    .eq('id', componenteId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateMantenimiento(mantenimientoId: string, updates: {
  estado?: 'Pendiente' | 'En proceso' | 'Finalizado'
  comentarios?: string
  reporteGenerado?: boolean
  archivo?: {
    nombre: string
    tamaño: number
    tipo: string
  }
}) {
  try {
    const { data, error } = await supabase
      .from('mantenimientos')
      .update({
        estado: updates.estado,
        comentarios: updates.comentarios,
        reporte_generado: updates.reporteGenerado,
        archivo_nombre: updates.archivo?.nombre,
        archivo_tamaño: updates.archivo?.tamaño,
        archivo_tipo: updates.archivo?.tipo,
        updated_at: new Date().toISOString()
      })
      .eq('id', mantenimientoId)
      .select()
      .single()

    if (error) throw error
    
    console.log('✅ Mantenimiento actualizado en Supabase:', data)
    return data
  } catch (error) {
    console.error('❌ Error updating mantenimiento:', error)
    throw error
  }
}

export async function deleteMantenimiento(mantenimientoId: string) {
  try {
    const { error } = await supabase
      .from('mantenimientos')
      .delete()
      .eq('id', mantenimientoId)

    if (error) throw error
    
    console.log('✅ Mantenimiento eliminado exitosamente')
    return true
  } catch (error) {
    console.error('❌ Error deleting mantenimiento:', error)
    throw error
  }
}

export async function deleteCargaMercaderia(cargaId: string) {
  // Las eliminaciones en cascada están configuradas en el schema
  // Al eliminar la carga, se eliminan automáticamente:
  // - productos_carga
  // - subitems
  const { error } = await supabase
    .from('cargas_mercaderia')
    .delete()
    .eq('id', cargaId)

  if (error) throw error
  
  console.log('✅ Carga eliminada exitosamente')
  return true
}

export async function deleteEquipo(equipoId: string) {
  // Las eliminaciones en cascada están configuradas en el schema
  // Al eliminar el equipo, se eliminan automáticamente:
  // - componentes_equipo
  // - mantenimientos
  const { error } = await supabase
    .from('equipos')
    .delete()
    .eq('id', equipoId)

  if (error) throw error
  
  console.log('✅ Equipo eliminado exitosamente')
  return true
}

// ===============================================
// FUNCIONES PARA INVENTARIO TÉCNICO
// ===============================================

export async function getAllComponentesDisponibles() {
  try {
    const { data, error } = await supabase
      .from('componentes_disponibles')
      .select(`
        *,
        productos_carga (
          carga_id,
          cargas_mercaderia (
            codigo_carga,
            fecha_ingreso
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map((comp: any) => ({
      id: comp.id,
      nombre: comp.nombre,
      marca: comp.marca,
      modelo: comp.modelo,
      numeroSerie: comp.numero_serie,
      tipoComponente: comp.tipo_componente,
      cantidadDisponible: comp.cantidad_disponible,
      cantidadOriginal: comp.cantidad_original,
      ubicacionFisica: comp.ubicacion_fisica,
      estado: comp.estado,
      observaciones: comp.observaciones,
      fechaIngreso: comp.fecha_ingreso,
      codigoCargaOrigen: comp.codigo_carga_origen,
      cargaInfo: comp.productos_carga?.cargas_mercaderia ? {
        codigoCarga: comp.productos_carga.cargas_mercaderia.codigo_carga,
        fechaIngreso: comp.productos_carga.cargas_mercaderia.fecha_ingreso
      } : null,
      createdAt: comp.created_at
    }))

  } catch (error) {
    console.error('Error getting componentes disponibles:', error)
    throw error
  }
}

export async function asignarComponenteAEquipo(
  componenteId: string,
  equipoId: string,
  cantidadAsignada: number,
  motivo: string = 'Instalación',
  tecnicoResponsable?: string,
  observaciones?: string
) {
  try {
    // 1. Obtener los datos del componente original del inventario
    const { data: componenteOriginal, error: componenteError } = await supabase
      .from('componentes_disponibles')
      .select('*')
      .eq('id', componenteId)
      .single()

    if (componenteError || !componenteOriginal) {
      throw new Error('No se pudo encontrar el componente en el inventario')
    }

    // 2. Verificar disponibilidad
    const { data: disponibilidad } = await supabase
      .rpc('get_componente_disponibilidad', { componente_uuid: componenteId })

    if (!disponibilidad || disponibilidad < cantidadAsignada) {
      throw new Error(`Solo hay ${disponibilidad || 0} unidades disponibles`)
    }

    // 3. Crear asignación
    const { data: asignacion, error: asignacionError } = await supabase
      .from('asignaciones_componentes')
      .insert({
        componente_id: componenteId,
        equipo_id: equipoId,
        cantidad_asignada: cantidadAsignada,
        motivo,
        tecnico_responsable: tecnicoResponsable,
        observaciones
      })
      .select()
      .single()

    if (asignacionError) throw asignacionError

    // 4. Actualizar cantidad disponible
    const { error: updateError } = await supabase
      .from('componentes_disponibles')
      .update({
        cantidad_disponible: disponibilidad - cantidadAsignada,
        estado: disponibilidad - cantidadAsignada === 0 ? 'Asignado' : 'Disponible'
      })
      .eq('id', componenteId)

    if (updateError) throw updateError

    // 5. Crear componente en el equipo con datos reales del inventario
    const numeroSerieReal = componenteOriginal.numero_serie || 
                           `${componenteOriginal.nombre.replace(/\s+/g, '-').toUpperCase()}-${componenteOriginal.codigo_carga_origen || 'SIN-CODIGO'}`

    const { data: componente, error: componenteEquipoError } = await supabase
      .from('componentes_equipo')
      .insert({
        equipo_id: equipoId,
        nombre: componenteOriginal.nombre, // 🎯 Usar nombre real del componente
        numero_serie: numeroSerieReal, // 🎯 Usar número de serie real o generar uno descriptivo
        estado: 'Operativo',
        observaciones: `🔧 ${motivo} desde inventario técnico. Marca: ${componenteOriginal.marca}, Modelo: ${componenteOriginal.modelo}. Cantidad: ${cantidadAsignada}. ${observaciones || ''}`
      })
      .select()
      .single()

    if (componenteEquipoError) throw componenteEquipoError

    console.log('✅ Componente asignado exitosamente:', {
      componenteId,
      equipoId,
      cantidadAsignada,
      motivo,
      componenteOriginal: componenteOriginal.nombre,
      numeroSerieAsignado: numeroSerieReal
    })

    return asignacion

  } catch (error) {
    console.error('Error asignando componente:', error)
    throw error
  }
}

export async function getHistorialAsignaciones(componenteId?: string, equipoId?: string) {
  try {
    let query = supabase
      .from('asignaciones_componentes')
      .select(`
        *,
        componentes_disponibles (
          nombre,
          marca,
          modelo,
          tipo_componente
        ),
        equipos (
          nombre_equipo,
          cliente,
          ubicacion
        )
      `)
      .order('created_at', { ascending: false })

    if (componenteId) {
      query = query.eq('componente_id', componenteId)
    }
    if (equipoId) {
      query = query.eq('equipo_id', equipoId)
    }

    const { data, error } = await query

    if (error) throw error

    return data.map((asig: any) => ({
      id: asig.id,
      componenteId: asig.componente_id,
      equipoId: asig.equipo_id,
      cantidadAsignada: asig.cantidad_asignada,
      fechaAsignacion: asig.fecha_asignacion,
      tecnicoResponsable: asig.tecnico_responsable,
      motivo: asig.motivo,
      observaciones: asig.observaciones,
      componente: asig.componentes_disponibles,
      equipo: asig.equipos,
      createdAt: asig.created_at
    }))

  } catch (error) {
    console.error('Error getting historial asignaciones:', error)
    throw error
  }
}

// ===============================================
// FUNCIONES DE UTILIDAD
// ===============================================

export async function getEstadisticasDashboard() {
  try {
    // Cargas totales
    const { count: totalCargas } = await supabase
      .from('cargas_mercaderia')
      .select('*', { count: 'exact', head: true })

    // Cargas de hoy
    const today = new Date().toISOString().split('T')[0]
    const { count: cargasHoy } = await supabase
      .from('cargas_mercaderia')
      .select('*', { count: 'exact', head: true })
      .eq('fecha_ingreso', today)

    // Total productos
    const { count: totalProductos } = await supabase
      .from('productos_carga')
      .select('*', { count: 'exact', head: true })

    // Equipos médicos
    const { count: equiposMedicos } = await supabase
      .from('productos_carga')
      .select('*', { count: 'exact', head: true })
      .eq('tipo_producto', 'Equipo Médico')

    return {
      totalCargas: totalCargas || 0,
      cargasHoy: cargasHoy || 0,
      totalProductos: totalProductos || 0,
      equiposMedicos: equiposMedicos || 0
    }
  } catch (error) {
    console.error('Error getting dashboard stats:', error)
    return {
      totalCargas: 0,
      cargasHoy: 0,
      totalProductos: 0,
      equiposMedicos: 0
    }
  }
} 