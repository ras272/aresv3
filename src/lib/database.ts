import { supabase } from './supabase'
import type { CargaMercaderia, ProductoCarga, SubItem, Equipo, ComponenteEquipo, Mantenimiento, DocumentoCarga } from '@/types'
import { procesarProductoParaStock } from './stock-flow'
import { error } from 'console'
import { error } from 'console'

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
    paraStock?: boolean // ✅ Checkbox para enviar al stock
    paraServicioTecnico?: boolean // ✅ Control manual para servicio técnico
    imagen?: string
    subitems?: Array<{
      nombre: string
      numeroSerie?: string
      cantidad: number
      paraStock?: boolean // 🎯 NUEVO: Control por subitem
      paraServicioTecnico?: boolean
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

    // 5. 🎯 PROCESAR TODOS LOS PRODUCTOS PARA STOCK (con carpetas por marca)
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

      // 🎯 TODOS LOS PRODUCTOS VAN AL STOCK (creando carpetas por marca)
      await procesarProductoParaStock(carga.codigo_carga, producto, cargaData.tipoCarga)

      // 🎯 TODOS LOS EQUIPOS MÉDICOS VAN AUTOMÁTICAMENTE AL MÓDULO DE EQUIPOS Y AL STOCK
      if (producto.tipoProducto === 'Equipo Médico') {
        // Equipos médicos completos van como equipos al servicio técnico
        const equipoCreado = await createEquipoFromMercaderia(productoDB, carga, producto.subitems || [])
        if (equipoCreado) {
          console.log('✅ Equipo médico enviado automáticamente al módulo de Equipos')
        }
        
        // Los equipos médicos TAMBIÉN van al stock como componentes disponibles
        console.log('✅ Equipo médico también procesado para stock como componente disponible')
      }

      // 🎯 SOLO SI ESTÁ MARCADO EL CHECKBOX DE SERVICIO TÉCNICO: enviar TAMBIÉN al inventario técnico
      if (producto.paraServicioTecnico) {
        if (producto.tipoProducto === 'Equipo Médico') {
          // Ya se procesó arriba como equipo, no hacer nada adicional
          console.log('✅ Equipo médico ya está en el módulo de equipos')
          
          // Procesar subitems marcados para inventario técnico
          if (producto.subitems && producto.subitems.length > 0) {
            for (const subitem of producto.subitems) {
              if (subitem.paraServicioTecnico) {
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
        } else {
          // 🔧 SOLO productos NO médicos marcados para servicio técnico van al inventario técnico
          const componenteCreado = await createComponenteInventarioTecnico(productoDB, carga)
          if (componenteCreado) {
            console.log('🔧 Componente enviado al Inventario Técnico (marcado para servicio):', producto.producto)
          }
        }
      } else {
        console.log('⏭️ Producto NO marcado para servicio técnico, solo va al stock normal:', producto.producto)
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
    // TODOS los equipos médicos se envían automáticamente al módulo de equipos
    console.log('✅ Enviando equipo médico al módulo de equipos automáticamente');

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
    precioServicio: m.precio_servicio ? parseFloat(m.precio_servicio) : undefined, // 💰 Precio del servicio
    
    // 🔧 Repuestos utilizados en el servicio
    repuestosUtilizados: (() => {
      try {
        return m.repuestos_utilizados ? JSON.parse(m.repuestos_utilizados) : [];
      } catch (error) {
        console.warn('Error parsing repuestos_utilizados for mantenimiento:', m.id, error);
        return [];
      }
    })(),
    
    // 📋 Tracking de facturación externa
    estadoFacturacion: m.estado_facturacion || 'Pendiente',
    numeroFacturaExterna: m.numero_factura_externa,
    fechaFacturacion: m.fecha_facturacion,
    archivoFacturaPDF: m.archivo_factura_pdf_nombre ? {
      nombre: m.archivo_factura_pdf_nombre,
      url: m.archivo_factura_pdf_url,
      tamaño: m.archivo_factura_pdf_tamaño
    } : undefined,
    
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
  precioServicio?: number // 💰 Precio del servicio en guaraníes
  
  // 🔧 Repuestos utilizados en el servicio
  repuestosUtilizados?: Array<{
    id: string
    nombre: string
    marca: string
    modelo: string
    cantidad: number
    stockAntes: number
  }>
  
  // 📋 Tracking de facturación externa
  estadoFacturacion?: 'Pendiente' | 'Facturado' | 'Enviado'
  numeroFacturaExterna?: string
  fechaFacturacion?: string
  archivoFacturaPDF?: {
    nombre: string
    url: string
    tamaño: number
  }
  
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
        precio_servicio: updates.precioServicio, // 💰 Guardar precio del servicio
        
        // 🔧 Repuestos utilizados en el servicio
        repuestos_utilizados: updates.repuestosUtilizados ? JSON.stringify(updates.repuestosUtilizados) : undefined,
        
        // 📋 Tracking de facturación externa
        estado_facturacion: updates.estadoFacturacion,
        numero_factura_externa: updates.numeroFacturaExterna,
        fecha_facturacion: updates.fechaFacturacion,
        archivo_factura_pdf_nombre: updates.archivoFacturaPDF?.nombre,
        archivo_factura_pdf_url: updates.archivoFacturaPDF?.url,
        archivo_factura_pdf_tamaño: updates.archivoFacturaPDF?.tamaño,
        
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
// 🎯 NUEVAS FUNCIONES PARA STOCK
// ===============================================

// 🎯 NUEVA: Crear o actualizar stock desde producto marcado
export async function createOrUpdateStockFromProduct(producto: any, carga: any) {
  try {
    console.log('📦 Procesando producto para STOCK:', producto.producto);

    // 1. Buscar si ya existe un producto similar en stock (agrupación inteligente)
    const { data: existingStock, error: searchError } = await supabase
      .from('componentes_disponibles')
      .select('*')
      .eq('nombre', producto.producto)
      .eq('marca', producto.marca)
      .eq('modelo', producto.modelo)
      .eq('estado', 'Disponible')

    if (searchError) throw searchError;

    // 2. Determinar tipo de componente
    const tipoComponente = determinarTipoComponenteStock(producto.producto);

    if (existingStock && existingStock.length > 0) {
      // 🔄 ACTUALIZAR: Producto existente - SUMAR cantidades
      const stockExistente = existingStock[0];
      const nuevaCantidad = stockExistente.cantidad_disponible + producto.cantidad;

      const { data: stockActualizado, error: updateError } = await supabase
        .from('componentes_disponibles')
        .update({
          cantidad_disponible: nuevaCantidad,
          cantidad_original: stockExistente.cantidad_original + producto.cantidad,
          observaciones: `${stockExistente.observaciones || ''} | Actualizado desde carga ${carga.codigo_carga} (+${producto.cantidad})`,
          updated_at: new Date().toISOString()
        })
        .eq('id', stockExistente.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Registrar transacción de entrada
      await createTransaccionStock({
        componenteId: stockExistente.id,
        tipo: 'ENTRADA',
        cantidad: producto.cantidad,
        cantidadAnterior: stockExistente.cantidad_disponible,
        cantidadNueva: nuevaCantidad,
        motivo: `Ingreso desde mercaderías - Carga ${carga.codigo_carga}`,
        referencia: carga.codigo_carga,
        observaciones: producto.observaciones
      });

      console.log('✅ Stock ACTUALIZADO (agrupado):', {
        producto: producto.producto,
        cantidadAnterior: stockExistente.cantidad_disponible,
        cantidadAgregada: producto.cantidad,
        cantidadNueva: nuevaCantidad
      });

      return stockActualizado;

    } else {
      // 🆕 CREAR: Nuevo producto en stock
      const { data: nuevoStock, error: createError } = await supabase
        .from('componentes_disponibles')
        .insert({
          producto_carga_id: producto.id,
          nombre: producto.producto,
          marca: producto.marca,
          modelo: producto.modelo,
          numero_serie: producto.numero_serie, // Puede ser null
          tipo_componente: tipoComponente,
          cantidad_disponible: producto.cantidad,
          cantidad_original: producto.cantidad,
          ubicacion_fisica: determinarUbicacionPorMarca(producto.marca),
          estado: 'Disponible',
          observaciones: `Ingresado al stock desde mercaderías. Código: ${carga.codigo_carga}. ${producto.observaciones || ''}`,
          codigo_carga_origen: carga.codigo_carga
        })
        .select()
        .single();

      if (createError) throw createError;

      // Registrar transacción de entrada inicial
      await createTransaccionStock({
        componenteId: nuevoStock.id,
        tipo: 'ENTRADA',
        cantidad: producto.cantidad,
        cantidadAnterior: 0,
        cantidadNueva: producto.cantidad,
        motivo: `Ingreso inicial desde mercaderías - Carga ${carga.codigo_carga}`,
        referencia: carga.codigo_carga,
        observaciones: producto.observaciones
      });

      console.log('✅ Nuevo producto CREADO en stock:', {
        producto: producto.producto,
        marca: producto.marca,
        cantidad: producto.cantidad,
        ubicacion: determinarUbicacionPorMarca(producto.marca)
      });

      return nuevoStock;
    }

  } catch (error) {
    console.error('❌ Error creating/updating stock from product:', error);
    throw error;
  }
}

// 🎯 NUEVA: Crear o actualizar stock desde subitem marcado
export async function createOrUpdateStockFromSubitem(subitem: any, producto: any, carga: any) {
  try {
    console.log('📦 Procesando subitem para STOCK:', subitem.nombre);

    // 1. Buscar si ya existe un subitem similar en stock
    const { data: existingStock, error: searchError } = await supabase
      .from('componentes_disponibles')
      .select('*')
      .eq('nombre', subitem.nombre)
      .eq('marca', producto.marca) // Usar marca del producto padre
      .eq('modelo', subitem.nombre) // El modelo es el nombre del subitem
      .eq('estado', 'Disponible')

    if (searchError) throw searchError;

    // 2. Determinar tipo de componente
    const tipoComponente = determinarTipoComponenteStock(subitem.nombre);

    if (existingStock && existingStock.length > 0) {
      // 🔄 ACTUALIZAR: Subitem existente - SUMAR cantidades
      const stockExistente = existingStock[0];
      const nuevaCantidad = stockExistente.cantidad_disponible + subitem.cantidad;

      const { data: stockActualizado, error: updateError } = await supabase
        .from('componentes_disponibles')
        .update({
          cantidad_disponible: nuevaCantidad,
          cantidad_original: stockExistente.cantidad_original + subitem.cantidad,
          observaciones: `${stockExistente.observaciones || ''} | Actualizado desde carga ${carga.codigo_carga} (+${subitem.cantidad})`,
          updated_at: new Date().toISOString()
        })
        .eq('id', stockExistente.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Registrar transacción de entrada
      await createTransaccionStock({
        componenteId: stockExistente.id,
        tipo: 'ENTRADA',
        cantidad: subitem.cantidad,
        cantidadAnterior: stockExistente.cantidad_disponible,
        cantidadNueva: nuevaCantidad,
        motivo: `Ingreso subitem desde mercaderías - Carga ${carga.codigo_carga}`,
        referencia: carga.codigo_carga,
        observaciones: `Subitem de ${producto.producto}`
      });

      console.log('✅ Stock subitem ACTUALIZADO (agrupado):', {
        subitem: subitem.nombre,
        productoPadre: producto.producto,
        cantidadAnterior: stockExistente.cantidad_disponible,
        cantidadAgregada: subitem.cantidad,
        cantidadNueva: nuevaCantidad
      });

      return stockActualizado;

    } else {
      // 🆕 CREAR: Nuevo subitem en stock
      const { data: nuevoStock, error: createError } = await supabase
        .from('componentes_disponibles')
        .insert({
          producto_carga_id: producto.id, // Relacionar con producto padre
          nombre: subitem.nombre,
          marca: producto.marca, // Usar marca del producto padre
          modelo: subitem.nombre, // El modelo es el nombre del subitem
          numero_serie: subitem.numeroSerie, // Puede ser null
          tipo_componente: tipoComponente,
          cantidad_disponible: subitem.cantidad,
          cantidad_original: subitem.cantidad,
          ubicacion_fisica: determinarUbicacionPorMarca(producto.marca),
          estado: 'Disponible',
          observaciones: `Subitem de ${producto.producto}. Ingresado al stock desde mercaderías. Código: ${carga.codigo_carga}.`,
          codigo_carga_origen: carga.codigo_carga
        })
        .select()
        .single();

      if (createError) throw createError;

      // Registrar transacción de entrada inicial
      await createTransaccionStock({
        componenteId: nuevoStock.id,
        tipo: 'ENTRADA',
        cantidad: subitem.cantidad,
        cantidadAnterior: 0,
        cantidadNueva: subitem.cantidad,
        motivo: `Ingreso inicial subitem desde mercaderías - Carga ${carga.codigo_carga}`,
        referencia: carga.codigo_carga,
        observaciones: `Subitem de ${producto.producto}`
      });

      console.log('✅ Nuevo subitem CREADO en stock:', {
        subitem: subitem.nombre,
        productoPadre: producto.producto,
        marca: producto.marca,
        cantidad: subitem.cantidad,
        ubicacion: determinarUbicacionPorMarca(producto.marca)
      });

      return nuevoStock;
    }

  } catch (error) {
    console.error('❌ Error creating/updating stock from subitem:', error);
    throw error;
  }
}

// Función auxiliar para determinar tipo de componente para stock
function determinarTipoComponenteStock(nombreProducto: string): string {
  const nombre = nombreProducto.toLowerCase();

  if (nombre.includes('kit') && nombre.includes('hydra')) {
    return 'Equipo Médico';
  }
  if (nombre.includes('ultraformer')) {
    return 'Equipo Médico';
  }
  if (nombre.includes('cryo')) {
    return 'Equipo Médico';
  }
  if (nombre.includes('transductor') || nombre.includes('transducer')) {
    return 'Accesorio';
  }
  if (nombre.includes('aplicador')) {
    return 'Accesorio';
  }
  if (nombre.includes('cable')) {
    return 'Accesorio';
  }
  if (nombre.includes('gel') || nombre.includes('conductor')) {
    return 'Insumo';
  }
  if (nombre.includes('repuesto') || nombre.includes('pieza')) {
    return 'Repuesto';
  }

  // Por defecto
  return 'Insumo';
}

// Función auxiliar para determinar ubicación por marca
function determinarUbicacionPorMarca(marca: string): string {
  const marcaLower = marca.toLowerCase();

  if (marcaLower.includes('ares')) {
    return 'Almacén A - Estante 1';
  }
  if (marcaLower.includes('classys')) {
    return 'Almacén A - Estante 3';
  }
  if (marcaLower.includes('zimmer')) {
    return 'Almacén B - Estante 2';
  }
  if (marcaLower.includes('philips')) {
    return 'Almacén C - Estante 1';
  }
  if (marcaLower.includes('siemens')) {
    return 'Almacén C - Estante 2';
  }

  // Por defecto
  return 'Almacén General - Estante 1';
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
      .or('carpeta_principal.eq.Servicio Técnico,marca.eq.Servicio Técnico')
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
      carpetaPrincipal: comp.carpeta_principal,
      rutaCarpeta: comp.ruta_carpeta,
      tipoDestino: comp.tipo_destino,
      createdAt: comp.created_at
    }))
  } catch (error) {
    console.error('Error fetching componentes disponibles:', error)
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
    console.log('🔄 Iniciando asignación de componente:', {
      componenteId,
      equipoId,
      cantidadAsignada,
      motivo
    });

    // 1. Obtener los datos del componente original del inventario
    const { data: componenteOriginal, error: componenteError } = await supabase
      .from('componentes_disponibles')
      .select('*')
      .eq('id', componenteId)
      .single()

    if (componenteError || !componenteOriginal) {
      console.error('❌ Error obteniendo componente:', componenteError);
      throw new Error('No se pudo encontrar el componente en el inventario')
    }

    console.log('📦 Componente encontrado:', {
      nombre: componenteOriginal.nombre,
      cantidadDisponible: componenteOriginal.cantidad_disponible,
      cantidadOriginal: componenteOriginal.cantidad_original
    });

    // 2. Verificar disponibilidad directamente desde el componente
    const disponibilidadActual = componenteOriginal.cantidad_disponible;

    if (disponibilidadActual < cantidadAsignada) {
      console.error('❌ Stock insuficiente:', {
        disponible: disponibilidadActual,
        solicitado: cantidadAsignada
      });
      throw new Error(`Solo hay ${disponibilidadActual} unidades disponibles`)
    }

    // 3. Calcular nueva cantidad disponible
    const nuevaCantidadDisponible = disponibilidadActual - cantidadAsignada;
    const nuevoEstado = nuevaCantidadDisponible === 0 ? 'Asignado' : 'Disponible';

    console.log('🔢 Calculando nueva cantidad:', {
      cantidadAnterior: disponibilidadActual,
      cantidadAsignada,
      nuevaCantidadDisponible,
      nuevoEstado
    });

    // 4. Actualizar cantidad disponible PRIMERO
    const { error: updateError } = await supabase
      .from('componentes_disponibles')
      .update({
        cantidad_disponible: nuevaCantidadDisponible,
        estado: nuevoEstado,
        updated_at: new Date().toISOString()
      })
      .eq('id', componenteId)

    if (updateError) {
      console.error('❌ Error actualizando stock:', updateError);
      throw updateError;
    }

    console.log('✅ Stock actualizado exitosamente:', {
      componenteId,
      cantidadAnterior: disponibilidadActual,
      cantidadNueva: nuevaCantidadDisponible,
      estado: nuevoEstado
    });

    // 5. Crear asignación en el historial
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

    if (asignacionError) {
      console.error('❌ Error creando asignación:', asignacionError);
      throw asignacionError;
    }

    // 6. Registrar transacción de stock
    await createTransaccionStock({
      componenteId: componenteId,
      tipo: 'SALIDA',
      cantidad: cantidadAsignada,
      cantidadAnterior: disponibilidadActual,
      cantidadNueva: nuevaCantidadDisponible,
      motivo: `Asignación a equipo - ${motivo}`,
      referencia: equipoId,
      tecnicoResponsable: tecnicoResponsable,
      observaciones: observaciones,
      fecha: new Date().toISOString()
    });

    // 7. Crear componente en el equipo con datos reales del inventario
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

    if (componenteEquipoError) {
      console.error('❌ Error creando componente en equipo:', componenteEquipoError);
      throw componenteEquipoError;
    }

    console.log('✅ Componente asignado exitosamente:', {
      componenteId,
      equipoId,
      cantidadAsignada,
      motivo,
      componenteOriginal: componenteOriginal.nombre,
      numeroSerieAsignado: numeroSerieReal,
      stockAnterior: disponibilidadActual,
      stockNuevo: nuevaCantidadDisponible
    })

    return asignacion

  } catch (error) {
    console.error('❌ Error asignando componente:', error)
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

// ===============================================
// FUNCIONES PARA CLÍNICAS
// ===============================================

export async function getAllClinicas() {
  try {
    const { data, error } = await supabase
      .from('clinicas')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map((clinica: any) => ({
      id: clinica.id,
      nombre: clinica.nombre,
      direccion: clinica.direccion,
      ciudad: clinica.ciudad,
      telefono: clinica.telefono,
      email: clinica.email,
      contactoPrincipal: clinica.contacto_principal,
      observaciones: clinica.observaciones,
      activa: clinica.activa,
      createdAt: clinica.created_at,
      updatedAt: clinica.updated_at
    }))
  } catch (error) {
    console.error('❌ Error loading clínicas:', error)
    throw error
  }
}

export async function createClinica(clinicaData: {
  nombre: string
  direccion: string
  ciudad: string
  telefono?: string
  email?: string
  contactoPrincipal?: string
  observaciones?: string
  activa?: boolean
}) {
  try {
    const { data, error } = await supabase
      .from('clinicas')
      .insert({
        nombre: clinicaData.nombre,
        direccion: clinicaData.direccion,
        ciudad: clinicaData.ciudad,
        telefono: clinicaData.telefono,
        email: clinicaData.email,
        contacto_principal: clinicaData.contactoPrincipal,
        observaciones: clinicaData.observaciones,
        activa: clinicaData.activa ?? true
      })
      .select()
      .single()

    if (error) throw error

    console.log('✅ Clínica creada exitosamente:', data)

    return {
      id: data.id,
      nombre: data.nombre,
      direccion: data.direccion,
      ciudad: data.ciudad,
      telefono: data.telefono,
      email: data.email,
      contactoPrincipal: data.contacto_principal,
      observaciones: data.observaciones,
      activa: data.activa,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  } catch (error) {
    console.error('❌ Error creating clínica:', error)
    throw error
  }
}

export async function updateClinica(clinicaId: string, updates: {
  nombre?: string
  direccion?: string
  ciudad?: string
  telefono?: string
  email?: string
  contactoPrincipal?: string
  observaciones?: string
  activa?: boolean
}) {
  try {
    const { data, error } = await supabase
      .from('clinicas')
      .update({
        nombre: updates.nombre,
        direccion: updates.direccion,
        ciudad: updates.ciudad,
        telefono: updates.telefono,
        email: updates.email,
        contacto_principal: updates.contactoPrincipal,
        observaciones: updates.observaciones,
        activa: updates.activa
      })
      .eq('id', clinicaId)
      .select()
      .single()

    if (error) throw error

    console.log('✅ Clínica actualizada exitosamente:', data)
    return data
  } catch (error) {
    console.error('❌ Error updating clínica:', error)
    throw error
  }
}

export async function deleteClinica(clinicaId: string) {
  try {
    const { error } = await supabase
      .from('clinicas')
      .delete()
      .eq('id', clinicaId)

    if (error) throw error

    console.log('✅ Clínica eliminada exitosamente')
    return true
  } catch (error) {
    console.error('❌ Error deleting clínica:', error)
    throw error
  }
}

// ===============================================
// FUNCIONES PARA REMISIONES
// ===============================================

export async function getAllRemisiones() {
  try {
    const { data, error } = await supabase
      .from('remisiones')
      .select(`
        *,
        productos_remision (*)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map((remision: any) => ({
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
    }))
  } catch (error) {
    console.error('❌ Error loading remisiones:', error)
    throw error
  }
}

export async function createRemision(remisionData: {
  numeroFactura?: string
  fecha: string
  cliente: string
  direccionEntrega: string
  contacto?: string
  telefono?: string
  tipoRemision: 'Instalación' | 'Mantenimiento' | 'Reparación' | 'Entrega'
  tecnicoResponsable: string
  productos: Array<{
    componenteId: string
    nombre: string
    marca: string
    modelo: string
    numeroSerie?: string
    cantidadSolicitada: number
    cantidadDisponible: number
    observaciones?: string
  }>
  descripcionGeneral?: string
  estado: 'Borrador' | 'Confirmada' | 'En tránsito' | 'Entregada' | 'Cancelada'
}) {
  try {
    // 1. Generar número de remisión
    const numeroRemision = await generateNumeroRemision()

    // 2. Crear remisión principal
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
      .single()

    if (remisionError) throw remisionError

    // 3. Crear productos de la remisión
    const productosParaInsertar = remisionData.productos.map(producto => ({
      remision_id: remision.id,
      // 🔧 CORRECCIÓN: Usar componenteId O stockItemId según corresponda
      componente_id: producto.componenteId || producto.stockItemId, // Usar el ID correcto
      nombre: producto.nombre,
      marca: producto.marca,
      modelo: producto.modelo,
      numero_serie: producto.numeroSerie,
      cantidad_solicitada: producto.cantidadSolicitada,
      cantidad_disponible: producto.cantidadDisponible,
      observaciones: producto.observaciones
    }))

    const { error: productosError } = await supabase
      .from('productos_remision')
      .insert(productosParaInsertar)

    if (productosError) throw productosError

    // El stock se procesará automáticamente desde el store usando procesarSalidaStock

    console.log('✅ Remisión creada exitosamente:', {
      numeroRemision,
      cliente: remisionData.cliente,
      productos: remisionData.productos.length,
      stockReducido: remisionData.estado === 'Confirmada'
    })

    return {
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
      productos: remisionData.productos,
      descripcionGeneral: remision.descripcion_general,
      estado: remision.estado,
      fechaEntrega: remision.fecha_entrega,
      observacionesEntrega: remision.observaciones_entrega,
      createdAt: remision.created_at,
      updatedAt: remision.updated_at
    }
  } catch (error) {
    console.error('❌ Error creating remisión:', error)
    throw error
  }
}

export async function updateRemision(remisionId: string, updates: {
  numeroFactura?: string
  estado?: 'Borrador' | 'Confirmada' | 'En tránsito' | 'Entregada' | 'Cancelada'
  fechaEntrega?: string
  observacionesEntrega?: string
  descripcionGeneral?: string
}) {
  try {
    // 1. Obtener remisión actual para verificar cambio de estado
    const { data: remisionActual, error: getError } = await supabase
      .from('remisiones')
      .select(`
        *,
        productos_remision (*)
      `)
      .eq('id', remisionId)
      .single();

    if (getError) throw getError;

    // 2. Actualizar remisión
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
      .single()

    if (error) throw error

    // 🎯 NUEVO: Si se cambió el estado a "Confirmada", reducir stock automáticamente
    if (updates.estado === 'Confirmada' && remisionActual.estado !== 'Confirmada') {
      console.log('🎯 Estado cambiado a Confirmada - Reduciendo stock automáticamente');

      // Convertir productos de remisión al formato esperado
      const productosParaReducir = remisionActual.productos_remision.map((p: any) => ({
        componenteId: p.componente_id,
        nombre: p.nombre,
        cantidadSolicitada: p.cantidad_solicitada,
        observaciones: p.observaciones
      }));

      await reducirStockPorRemision(data, productosParaReducir);
    }

    console.log('✅ Remisión actualizada exitosamente:', {
      id: data.id,
      numeroRemision: data.numero_remision,
      estadoAnterior: remisionActual.estado,
      estadoNuevo: data.estado,
      stockReducido: updates.estado === 'Confirmada' && remisionActual.estado !== 'Confirmada'
    })
    return data
  } catch (error) {
    console.error('❌ Error updating remisión:', error)
    throw error
  }
}

export async function deleteRemision(remisionId: string) {
  try {
    // Los productos se eliminan automáticamente por CASCADE
    const { error } = await supabase
      .from('remisiones')
      .delete()
      .eq('id', remisionId)

    if (error) throw error

    console.log('✅ Remisión eliminada exitosamente')
    return true
  } catch (error) {
    console.error('❌ Error deleting remisión:', error)
    throw error
  }
}

// 🆕 Nueva función para eliminar remisión con motivo y restauración de stock
export async function deleteRemisionConRestauracion(remisionId: string, motivo: string) {
  try {
    console.log('🔄 Iniciando eliminación de remisión con restauración de stock...', remisionId);

    // 1. Obtener la remisión completa con sus productos
    const { data: remision, error: remisionError } = await supabase
      .from('remisiones')
      .select(`
        *,
        productos_remision (
          id,
          componente_id,
          nombre,
          marca,
          modelo,
          cantidad_solicitada
        )
      `)
      .eq('id', remisionId)
      .single();

    if (remisionError) throw remisionError;
    if (!remision) throw new Error('Remisión no encontrada');

    // 2. Restaurar stock de productos que tengan componente_id
    const productosConStock = remision.productos_remision.filter(p => p.componente_id);
    
    for (const producto of productosConStock) {
      console.log(`🔄 Restaurando stock para producto: ${producto.nombre}`);
      
      // Detectar automáticamente la tabla origen (igual que en otras funciones)
      const { data: stockItem } = await supabase
        .from('stock_items')
        .select('id, cantidad_actual')
        .eq('id', producto.componente_id)
        .single();

      const tableName = stockItem ? 'stock_items' : 'componentes_disponibles';
      const cantidadField = stockItem ? 'cantidad_actual' : 'cantidad_disponible';

      // Obtener cantidad actual
      const { data: currentItem, error: getCurrentError } = await supabase
        .from(tableName)
        .select(cantidadField)
        .eq('id', producto.componente_id)
        .single();

      if (getCurrentError) {
        console.error(`❌ Error obteniendo cantidad actual para ${producto.nombre}:`, getCurrentError);
        continue;
      }

      const cantidadActual = currentItem[cantidadField];
      const nuevaCantidad = cantidadActual + producto.cantidad_solicitada;

      // Actualizar cantidad en la tabla correcta
      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          [cantidadField]: nuevaCantidad,
          updated_at: new Date().toISOString()
        })
        .eq('id', producto.componente_id);

      if (updateError) {
        console.error(`❌ Error actualizando stock para ${producto.nombre}:`, updateError);
        continue;
      }

      // 3. Registrar movimiento de restauración
      await registrarMovimientoStock({
        itemId: producto.componente_id,
        itemType: stockItem ? 'stock_item' : 'componente_disponible',
        productoNombre: producto.nombre,
        productoMarca: producto.marca,
        productoModelo: producto.modelo,
        tipoMovimiento: 'Entrada',
        cantidad: producto.cantidad_solicitada,
        cantidadAnterior: cantidadActual,
        cantidadNueva: nuevaCantidad,
        motivo: `Restauración por cancelación de remisión ${remision.numero_remision}`,
        destinoOrigen: 'Stock General',
        responsable: 'Sistema',
        observaciones: `Motivo de cancelación: ${motivo}`
      });

      console.log(`✅ Stock restaurado para ${producto.nombre}: ${cantidadActual} → ${nuevaCantidad}`);
    }

    // 4. Eliminar la remisión (los productos se eliminan automáticamente por CASCADE)
    const { error: deleteError } = await supabase
      .from('remisiones')
      .delete()
      .eq('id', remisionId);

    if (deleteError) throw deleteError;

    console.log(`✅ Remisión ${remision.numero_remision} eliminada exitosamente con restauración de stock`);
    console.log(`📊 Productos restaurados: ${productosConStock.length}`);
    
    return {
      success: true,
      productosRestaurados: productosConStock.length,
      numeroRemision: remision.numero_remision
    };

  } catch (error) {
    console.error('❌ Error eliminando remisión con restauración:', error);
    throw error;
  }
}

export async function generateNumeroRemision(): Promise<string> {
  try {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')

    const todayPrefix = `REM-${year}${month}${day}`

    const { data, error } = await supabase
      .from('remisiones')
      .select('numero_remision')
      .like('numero_remision', `${todayPrefix}%`)
      .order('numero_remision', { ascending: false })
      .limit(1)

    if (error) throw error

    const nextNumber = data.length > 0
      ? parseInt(data[0].numero_remision.split('-')[2]) + 1
      : 1

    return `${todayPrefix}-${String(nextNumber).padStart(3, '0')}`
  } catch (error) {
    console.error('❌ Error generating número remisión:', error)
    throw error
  }
}

// 🎯 NUEVA: Reducir stock automáticamente cuando se confirma una remisión
export async function reducirStockPorRemision(remision: any, productos: any[]) {
  try {
    console.log('📦 Reduciendo stock por remisión confirmada:', remision.numero_remision);

    for (const producto of productos) {
      if (producto.componenteId) {
        // 1. Obtener stock actual
        const { data: stockActual, error: stockError } = await supabase
          .from('componentes_disponibles')
          .select('*')
          .eq('id', producto.componenteId)
          .single();

        if (stockError) {
          console.error('❌ Error obteniendo stock:', stockError);
          continue;
        }

        // 2. Verificar stock suficiente
        if (stockActual.cantidad_disponible < producto.cantidadSolicitada) {
          console.warn('⚠️ Stock insuficiente:', {
            producto: producto.nombre,
            disponible: stockActual.cantidad_disponible,
            solicitado: producto.cantidadSolicitada
          });
          // Continuar con la cantidad disponible
        }

        // 3. Calcular nueva cantidad (no permitir negativo)
        const cantidadAReducir = Math.min(producto.cantidadSolicitada, stockActual.cantidad_disponible);
        const nuevaCantidad = stockActual.cantidad_disponible - cantidadAReducir;

        // 4. Actualizar stock
        const { error: updateError } = await supabase
          .from('componentes_disponibles')
          .update({
            cantidad_disponible: nuevaCantidad,
            updated_at: new Date().toISOString()
          })
          .eq('id', producto.componenteId);

        if (updateError) {
          console.error('❌ Error actualizando stock:', updateError);
          continue;
        }

        // 5. Registrar transacción de salida
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

        console.log('✅ Stock reducido exitosamente:', {
          producto: producto.nombre,
          cantidadAnterior: stockActual.cantidad_disponible,
          cantidadReducida: cantidadAReducir,
          cantidadNueva: nuevaCantidad,
          remision: remision.numero_remision
        });
      }
    }

    console.log('✅ Stock reducido completamente para remisión:', remision.numero_remision);

  } catch (error) {
    console.error('❌ Error reduciendo stock por remisión:', error);
    throw error;
  }
}

// ===============================================
// FUNCIONES PARA TRANSACCIONES DE STOCK
// ===============================================

export async function getAllTransaccionesStock() {
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

export async function createTransaccionStock(transaccionData: {
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

    console.log('✅ Transacción de stock registrada:', {
      tipo: transaccionData.tipo,
      cantidad: transaccionData.cantidad,
      referencia: transaccionData.referencia,
      cliente: transaccionData.cliente
    })

    return data
  } catch (error) {
    console.error('❌ Error creating transacción stock:', error)
    throw error
  }
}

export async function procesarSalidaStock(
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
    await createTransaccionStock({
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

    console.log('✅ Salida de stock procesada exitosamente:', {
      componenteId,
      cantidad,
      cantidadAnterior,
      cantidadNueva,
      referencia,
      cliente
    })

    return true
  } catch (error) {
    console.error('❌ Error procesando salida de stock:', error)
    throw error
  }
}

// ===============================================
// FUNCIONES PARA GESTIÓN DOCUMENTAL
// ===============================================

export async function createDocumentoCarga(documentoData: {
  cargaId: string;
  codigoCarga: string;
  nombre: string;
  tipoDocumento: string;
  archivo: {
    nombre: string;
    tamaño: number;
    tipo: string;
    url: string;
  };
  observaciones?: string;
  fechaSubida: string;
  subidoPor?: string;
}): Promise<DocumentoCarga> {
  try {
    const { data, error } = await supabase
      .from('documentos_carga')
      .insert({
        carga_id: documentoData.cargaId,
        codigo_carga: documentoData.codigoCarga,
        nombre: documentoData.nombre,
        tipo_documento: documentoData.tipoDocumento,
        archivo_nombre: documentoData.archivo.nombre,
        archivo_tamaño: documentoData.archivo.tamaño,
        archivo_tipo: documentoData.archivo.tipo,
        archivo_url: documentoData.archivo.url,
        observaciones: documentoData.observaciones,
        fecha_subida: documentoData.fechaSubida,
        subido_por: documentoData.subidoPor
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      cargaId: data.carga_id,
      codigoCarga: data.codigo_carga,
      nombre: data.nombre,
      tipoDocumento: data.tipo_documento,
      archivo: {
        nombre: data.archivo_nombre,
        tamaño: data.archivo_tamaño,
        tipo: data.archivo_tipo,
        url: data.archivo_url
      },
      observaciones: data.observaciones,
      fechaSubida: data.fecha_subida,
      subidoPor: data.subido_por,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Error creating documento carga:', error);
    throw error;
  }
}

export async function getAllDocumentosCarga(): Promise<DocumentoCarga[]> {
  try {
    const { data, error } = await supabase
      .from('documentos_carga')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((doc: any) => ({
      id: doc.id,
      cargaId: doc.carga_id,
      codigoCarga: doc.codigo_carga,
      nombre: doc.nombre,
      tipoDocumento: doc.tipo_documento,
      archivo: {
        nombre: doc.archivo_nombre,
        tamaño: doc.archivo_tamaño,
        tipo: doc.archivo_tipo,
        url: doc.archivo_url
      },
      observaciones: doc.observaciones,
      fechaSubida: doc.fecha_subida,
      subidoPor: doc.subido_por,
      createdAt: doc.created_at
    }));
  } catch (error) {
    console.error('Error getting documentos carga:', error);
    throw error;
  }
}

export async function getDocumentosByCarga(cargaId: string): Promise<DocumentoCarga[]> {
  try {
    const { data, error } = await supabase
      .from('documentos_carga')
      .select('*')
      .eq('carga_id', cargaId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((doc: any) => ({
      id: doc.id,
      cargaId: doc.carga_id,
      codigoCarga: doc.codigo_carga,
      nombre: doc.nombre,
      tipoDocumento: doc.tipo_documento,
      archivo: {
        nombre: doc.archivo_nombre,
        tamaño: doc.archivo_tamaño,
        tipo: doc.archivo_tipo,
        url: doc.archivo_url
      },
      observaciones: doc.observaciones,
      fechaSubida: doc.fecha_subida,
      subidoPor: doc.subido_por,
      createdAt: doc.created_at
    }));
  } catch (error) {
    console.error('Error getting documentos by carga:', error);
    throw error;
  }
}

export async function deleteDocumentoCarga(documentoId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('documentos_carga')
      .delete()
      .eq('id', documentoId);

    if (error) throw error;

    console.log('✅ Documento eliminado exitosamente');
  } catch (error) {
    console.error('Error deleting documento carga:', error);
    throw error;
  }
}


// ===============================================
// FUNCIONES PARA STOCK GENERAL
// ===============================================

export async function getAllStockItems() {
  try {
    console.log('🔄 Obteniendo stock desde ambas tablas (componentes_disponibles + stock_items)...');
    
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

    console.log(`✅ Obtenidos ${componentes?.length || 0} componentes + ${stockItems?.length || 0} stock items`);

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
      imagen: null,
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

    console.log('✅ Stock items combinados correctamente:', {
      componentes: componentesFormateados.length,
      stockItems: stockItemsFormateados.length,
      total: todosLosItems.length,
      marcas: [...new Set(todosLosItems.map(item => item.marca))]
    });

    return todosLosItems;
  } catch (error) {
    console.error('❌ Error getting stock items:', error);
    throw error;
  }
}

// ===============================================
// FUNCIONES PARA ACTUALIZAR PRODUCTOS CON IMAGEN
// ===============================================

export async function updateStockItemDetails(productId: string, updates: {
  imagen?: string;
  observaciones?: string;
}) {
  try {
    // Encontrar todos los componentes que corresponden a este producto agrupado
    const { data: componentes, error: fetchError } = await supabase
      .from('componentes_disponibles')
      .select('*')

    if (fetchError) throw fetchError;

    // Filtrar los items que corresponden al producto
    const itemsDelProducto = componentes.filter(item => {
      const productoId = `${item.nombre}-${item.marca}-${item.modelo}`.toLowerCase().replace(/\s+/g, '-');
      return productoId === productId;
    });

    if (itemsDelProducto.length === 0) {
      throw new Error('Producto no encontrado en stock');
    }

    // Actualizar todos los items relacionados
    const updatePromises = itemsDelProducto.map(item =>
      supabase
        .from('componentes_disponibles')
        .update({
          observaciones: updates.observaciones,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id)
    );

    const results = await Promise.all(updatePromises);

    // Verificar si hubo errores
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      throw new Error(`Error actualizando ${errors.length} items`);
    }

    console.log('✅ Producto actualizado exitosamente:', {
      productId,
      itemsActualizados: itemsDelProducto.length,
      imagen: updates.imagen ? 'Actualizada' : 'Sin cambios',
      observaciones: updates.observaciones ? 'Actualizadas' : 'Sin cambios'
    });

    return true;

  } catch (error) {
    console.error('❌ Error actualizando detalles del producto:', error);
    throw error;
  }
}

export async function updateComponenteDisponibleDetails(productId: string, updates: {
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

    console.log('✅ Componentes actualizados exitosamente:', {
      productId,
      componentesActualizados: componentesDelProducto.length,
      imagen: updates.imagen ? 'Actualizada' : 'Sin cambios',
      observaciones: updates.observaciones ? 'Actualizadas' : 'Sin cambios'
    });

    return true;

  } catch (error) {
    console.error('❌ Error actualizando detalles de componentes:', error);
    throw error;
  }
}

// ===============================================
// FUNCIONES PARA TRAZABILIDAD Y MOVIMIENTOS DE STOCK
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

export async function registrarMovimientoStock(movimiento: {
  itemId?: string;
  itemType?: 'stock_item' | 'componente_disponible';
  productoNombre: string;
  productoMarca?: string;
  productoModelo?: string;
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

    console.log('✅ Movimiento de stock registrado:', {
      tipo: movimiento.tipoMovimiento,
      producto: movimiento.productoNombre,
      cantidad: movimiento.cantidad,
      motivo: movimiento.motivo,
      itemType: movimiento.itemType
    });

    return data;

  } catch (error) {
    console.error('❌ Error registrando movimiento de stock:', error);
    throw error;
  }
}

export async function getAllMovimientosStock(): Promise<MovimientoStock[]> {
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

export async function getMovimientosByProducto(productoNombre: string, productoMarca?: string): Promise<MovimientoStock[]> {
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

export async function getMovimientosByCarpeta(carpeta: string): Promise<MovimientoStock[]> {
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

export async function getEstadisticasTrazabilidad() {
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

// ===============================================
// 🎯 FUNCIÓN HÍBRIDA PARA REPORTES DE SERVICIO TÉCNICO
// ===============================================

export async function registrarSalidaStockReporte(salidaData: {
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
    console.log('🔧 Registrando salida de stock para reporte de servicio técnico:', salidaData);

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
    await registrarMovimientoStock({
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

    console.log('✅ Salida de stock para reporte registrada exitosamente:', {
      producto: salidaData.productoNombre,
      cantidad: salidaData.cantidad,
      mantenimiento: salidaData.mantenimientoId,
      trazabilidadCompleta: true
    });

    return true;

  } catch (error) {
    console.error('❌ Error registrando salida de stock para reporte:', error);
    throw error;
  }
}

// ===============================================
// 🔄 FUNCIÓN HÍBRIDA PARA DEVOLUCIÓN DE REPUESTOS
// ===============================================

export async function devolverRepuestosAlStockReporte(devolucionData: {
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
    console.log('🔄 Devolviendo repuestos al stock desde reporte:', devolucionData);

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
    await registrarMovimientoStock({
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

    console.log('✅ Devolución de repuestos registrada exitosamente:', {
      producto: devolucionData.productoNombre,
      cantidad: devolucionData.cantidad,
      mantenimiento: devolucionData.mantenimientoId,
      trazabilidadCompleta: true
    });

    return true;

  } catch (error) {
    console.error('❌ Error devolviendo repuestos al stock:', error);
    throw error;
  }
}

export async function registrarSalidaStock(salidaData: {
  itemId: string;
  productoNombre: string;
  productoMarca?: string;
  productoModelo?: string;
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
    // 🔧 CORRECCIÓN: Detectar automáticamente si el producto está en stock_items o componentes_disponibles
    const { data: stockItem } = await supabase
      .from('stock_items')
      .select('id')
      .eq('id', salidaData.itemId)
      .single();

    const itemType = stockItem ? 'stock_item' : 'componente_disponible';
    const tableName = stockItem ? 'stock_items' : 'componentes_disponibles';
    const cantidadField = stockItem ? 'cantidad_actual' : 'cantidad_disponible';



    // 1. Registrar el movimiento de salida
    await registrarMovimientoStock({
      itemId: salidaData.itemId,
      itemType: itemType,
      productoNombre: salidaData.productoNombre,
      productoMarca: salidaData.productoMarca,
      productoModelo: salidaData.productoModelo,
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
    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        [cantidadField]: salidaData.cantidadAnterior - salidaData.cantidad,
        updated_at: new Date().toISOString()
      })
      .eq('id', salidaData.itemId);

    if (updateError) throw updateError;

    console.log('✅ Salida de stock registrada exitosamente:', {
      producto: salidaData.productoNombre,
      cantidad: salidaData.cantidad,
      destino: salidaData.destino
    });

    return true;

  } catch (error) {
    console.error('❌ Error registrando salida de stock:', error);
    throw error;
  }
}