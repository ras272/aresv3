import { supabase } from './supabase';
import {
  ejecutarConManejoErrores,
  validarDatosProducto,
  validarTipoCarga,
  logOperacionCarpeta,
  errorHandler,
  FolderErrorType
} from './folder-error-handling';

// ===============================================
// TIPOS E INTERFACES
// ===============================================

interface CarpetaInfo {
  carpetaPrincipal: string;
  subcarpeta?: string;
  ubicacionFisica: string;
  rutaCompleta: string;
  tipoDestino: string;
}

// ===============================================
// FUNCIONES DE ORGANIZACIÓN POR CARPETAS
// ===============================================

function determinarCarpetaYUbicacion(marca: string, tipoCarga: string): CarpetaInfo {
  const marcaNormalizada = normalizarNombreMarca(marca);

  // Usar la función mejorada para determinar ubicación física
  const ubicacionFisica = determinarUbicacionPorMarca(marca, tipoCarga);

  switch (tipoCarga) {
    case 'stock':
      return {
        carpetaPrincipal: marcaNormalizada,
        ubicacionFisica: ubicacionFisica,
        rutaCompleta: marcaNormalizada,
        tipoDestino: 'stock'
      };

    case 'cliente':
      return {
        carpetaPrincipal: marcaNormalizada,
        subcarpeta: 'Cliente Específico',
        ubicacionFisica: ubicacionFisica,
        rutaCompleta: `${marcaNormalizada}/Cliente Específico`,
        tipoDestino: 'cliente'
      };

    case 'reparacion':
      return {
        carpetaPrincipal: 'Servicio Técnico',
        subcarpeta: marcaNormalizada,
        ubicacionFisica: ubicacionFisica,
        rutaCompleta: `Servicio Técnico/${marcaNormalizada}`,
        tipoDestino: 'reparacion'
      };

    default:
      return {
        carpetaPrincipal: marcaNormalizada,
        ubicacionFisica: ubicacionFisica,
        rutaCompleta: marcaNormalizada,
        tipoDestino: 'stock'
      };
  }
}

function normalizarNombreMarca(marca: string): string {
  // Normalizar nombres de marca para consistencia
  const marcasEspeciales: Record<string, string> = {
    'servicio tecnico': 'Servicio Técnico',
    'servicio técnico': 'Servicio Técnico',
    'ares': 'Ares',
    'classys': 'Classys',
    'philips': 'Philips',
    'siemens': 'Siemens',
    'hydrafacial': 'Hydrafacial',
    'venus': 'Venus',
    'endymed': 'Endymed',
    'candela': 'Candela',
    'fotona': 'Fotona',
    'lumenis': 'Lumenis',
    'bodyhealth': 'BodyHealth',
    'intermedic': 'Intermedic'
  };

  const marcaLower = marca.toLowerCase().trim();
  return marcasEspeciales[marcaLower] || marca.trim();
}

// ===============================================
// FLUJO MERCADERÍAS → STOCK
// ===============================================

export async function procesarProductoParaStock(cargaId: string, producto: any, tipoCarga: string = 'stock') {
  const startTime = Date.now();

  return await ejecutarConManejoErrores(async () => {
    console.log('🔄 Procesando producto para stock con organización automática...', {
      cargaId,
      producto: producto.producto,
      tipoCarga,
      marca: producto.marca
    });

    console.log('✅ Procesando producto para stock general (carpetas por marca)...');

    // 1. Validar datos del producto
    const validacionProducto = validarDatosProducto(producto);
    if (!validacionProducto.valid) {
      // Intentar recuperación automática para errores de validación
      for (const error of validacionProducto.errors) {
        if (error.type === FolderErrorType.MISSING_MARCA) {
          // Intentar inferir marca desde el nombre
          const marcaInferida = inferirMarcaDesdeNombre(producto.producto || producto.nombre);
          if (marcaInferida) {
            producto.marca = marcaInferida;
            console.warn(`⚠️ Marca inferida automáticamente: ${marcaInferida}`);
          } else {
            producto.marca = 'Sin Marca';
            console.warn(`⚠️ Usando marca por defecto: Sin Marca`);
          }
        }
      }
    }

    // 2. Validar tipo de carga
    const validacionTipo = validarTipoCarga(tipoCarga);
    if (!validacionTipo.valid) {
      tipoCarga = 'stock'; // Fallback a stock por defecto
      console.warn(`⚠️ Tipo de carga inválido, usando por defecto: stock`);
    }

    // 3. Determinar carpeta y ubicación con manejo de errores
    let carpetaInfo: CarpetaInfo;
    try {
      carpetaInfo = determinarCarpetaYUbicacion(producto.marca, tipoCarga);
    } catch (error) {
      // Fallback: crear carpeta básica
      carpetaInfo = {
        carpetaPrincipal: producto.marca || 'Sin Marca',
        ubicacionFisica: `Almacén General - Estante ${producto.marca || 'General'}`,
        rutaCompleta: producto.marca || 'Sin Marca',
        tipoDestino: 'stock'
      };
      console.warn(`⚠️ Error determinando carpeta, usando configuración básica:`, carpetaInfo);
    }

    // 4. Procesar producto con información de carpeta
    await procesarProductoIndividualConCarpetaConErrores(cargaId, producto, carpetaInfo);

    // 5. Procesar subitems si existen
    if (producto.subitems && producto.subitems.length > 0) {
      for (const subitem of producto.subitems) {
        if (subitem.paraServicioTecnico) { // 🎯 CAMBIO: Verificar paraServicioTecnico en lugar de paraStock
          try {
            await procesarSubitemParaStock(cargaId, producto, subitem, carpetaInfo);
          } catch (subitemError) {
            console.error(`❌ Error procesando subitem ${subitem.nombre}:`, subitemError);
            // Continuar con otros subitems en caso de error
          }
        }
      }
    }

    const executionTime = Date.now() - startTime;
    logOperacionCarpeta('procesarProductoParaStock', true, {
      producto: producto.producto,
      carpeta: carpetaInfo.rutaCompleta
    }, executionTime);

    console.log('✅ Producto procesado y organizado en carpeta exitosamente');
  }, 'procesarProductoParaStock', { cargaId, producto, tipoCarga });
}

// Función auxiliar para inferir marca desde nombre
function inferirMarcaDesdeNombre(nombre: string): string | null {
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

// Función con manejo integral de errores
async function procesarProductoIndividualConCarpetaConErrores(cargaId: string, producto: any, carpetaInfo: CarpetaInfo) {
  return await ejecutarConManejoErrores(async () => {
    await procesarProductoIndividualConCarpeta(cargaId, producto, carpetaInfo);
  }, 'procesarProductoIndividualConCarpeta', { cargaId, producto, carpetaInfo });
}

async function procesarProductoIndividualConCarpeta(cargaId: string, producto: any, carpetaInfo: CarpetaInfo) {
  try {
    console.log('🔄 Procesando producto individual con carpeta:', {
      cargaId,
      producto: producto.producto,
      marca: producto.marca,
      carpeta: carpetaInfo.rutaCompleta
    });

    // 🎯 USAR TABLA componentes_disponibles PARA COMPATIBILIDAD (fallback a stock_items si existe)
    
    // Primero intentar con componentes_disponibles (tabla existente)
    const { data: existentesComponentes, error: buscarErrorComponentes } = await supabase
      .from('componentes_disponibles')
      .select('*')
      .eq('marca', producto.marca)
      .eq('nombre', producto.producto);

    if (buscarErrorComponentes) {
      console.warn('⚠️ Error buscando en componentes_disponibles:', buscarErrorComponentes);
    }

    // Buscar coincidencia exacta en componentes_disponibles
    const existenteComponente = existentesComponentes?.find(item => {
      const nombreSimilar = item.nombre.toLowerCase().trim() === producto.producto.toLowerCase().trim();
      const marcaSimilar = item.marca?.toLowerCase().trim() === producto.marca?.toLowerCase().trim();
      const serieSimilar = (!item.numero_serie && !producto.numeroSerie) || 
                          (item.numero_serie === producto.numeroSerie);
      return nombreSimilar && marcaSimilar && serieSimilar;
    }) || null;

    if (existenteComponente) {
      // ✅ EXISTE EN COMPONENTES: Sumar cantidades
      const nuevaCantidad = existenteComponente.cantidad_disponible + producto.cantidad;

      const { error: updateError } = await supabase
        .from('componentes_disponibles')
        .update({
          cantidad_disponible: nuevaCantidad,
          updated_at: new Date().toISOString()
        })
        .eq('id', existenteComponente.id);

      if (updateError) {
        console.error('❌ Error actualizando componente existente:', updateError);
        throw updateError;
      }

      console.log(`✅ Stock actualizado en componentes_disponibles: ${producto.producto} (${existenteComponente.cantidad_disponible} → ${nuevaCantidad}) en carpeta ${carpetaInfo.rutaCompleta}`);
    } else {
      // ✅ NO EXISTE: Crear nuevo item en componentes_disponibles
      const nuevoComponente = {
        nombre: producto.producto,
        marca: producto.marca,
        modelo: producto.modelo,
        numero_serie: producto.numeroSerie || null,
        cantidad_disponible: producto.cantidad,
        cantidad_original: producto.cantidad,
        ubicacion_fisica: carpetaInfo.ubicacionFisica,
        estado: 'Disponible',
        observaciones: `${producto.observaciones || ''}. Carpeta: ${carpetaInfo.rutaCompleta}`,
        codigo_carga_origen: cargaId,
        tipo_componente: determinarTipoComponenteBasico(producto.producto),
        // Campos adicionales para organización por carpetas
        carpeta_principal: carpetaInfo.carpetaPrincipal,
        subcarpeta: carpetaInfo.subcarpeta || null,
        ruta_carpeta: carpetaInfo.rutaCompleta,
        tipo_destino: carpetaInfo.tipoDestino
      };

      const { data: nuevoItem, error: createError } = await supabase
        .from('componentes_disponibles')
        .insert(nuevoComponente)
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creando nuevo componente:', createError);
        console.error('❌ Datos del componente:', nuevoComponente);
        throw createError;
      }

      console.log(`✅ Nuevo producto en componentes_disponibles: ${producto.producto} (${producto.cantidad} unidades) organizado en carpeta ${carpetaInfo.rutaCompleta}`);
    }

    // 🎯 TODOS LOS EQUIPOS MÉDICOS VAN AL STOCK Y AL MÓDULO DE EQUIPOS
    if (producto.tipoProducto === 'Equipo Médico') {
      console.log('🏥 Equipo Médico procesado para stock - también será enviado al módulo de equipos por createEquipoFromMercaderia');
    }

  } catch (error) {
    console.error('❌ Error en procesarProductoIndividualConCarpeta:', error);
    console.error('❌ Contexto:', { cargaId, producto, carpetaInfo });
    throw error;
  }
}

// Función auxiliar para determinar tipo de componente básico
function determinarTipoComponenteBasico(nombreProducto: string): string {
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
  if (nombre.includes('cable')) {
    return 'Cable';
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
  return 'Componente';
}

// Mantener función original para compatibilidad con código existente
async function procesarProductoIndividual(cargaId: string, producto: any) {
  // Usar función nueva con carpeta por defecto basada en marca
  const carpetaInfo = determinarCarpetaYUbicacion(producto.marca, 'stock');
  await procesarProductoIndividualConCarpeta(cargaId, producto, carpetaInfo);
}

async function procesarSubitemParaStock(cargaId: string, producto: any, subitem: any, carpetaInfo: CarpetaInfo) {
  // Procesar subitem como producto independiente con la misma información de carpeta
  await procesarProductoIndividualConCarpeta(cargaId, {
    producto: subitem.nombre,
    marca: producto.marca, // Hereda marca del producto padre
    modelo: producto.modelo, // Hereda modelo del producto padre
    numeroSerie: subitem.numeroSerie,
    cantidad: subitem.cantidad,
    tipoProducto: 'Accesorio', // Los subitems son accesorios
    observaciones: `Subitem de: ${producto.producto}. ${subitem.observaciones || ''}`
  }, carpetaInfo);
}

export function determinarUbicacionPorMarca(marca: string, tipoDestino: string = 'stock'): string {
  // Normalizar marca para consistencia
  const marcaNormalizada = normalizarNombreMarca(marca);

  // Validar formato de entrada
  if (!marca || marca.trim() === '') {
    console.warn('⚠️ Marca vacía o inválida, usando ubicación por defecto');
    return 'Almacén General - Estante General';
  }

  // Determinar ubicación según tipo de destino y marca
  switch (tipoDestino) {
    case 'reparacion':
      // Productos para reparación van a Servicio Técnico
      return `Servicio Técnico - Estante ${marcaNormalizada}`;

    case 'cliente':
      // Productos para cliente específico van al almacén general pero organizados por marca
      return `Almacén General - Estante ${marcaNormalizada}`;

    case 'stock':
    default:
      // Stock normal organizado por marca con asignación inteligente de almacén
      return determinarAlmacenPorMarca(marcaNormalizada);
  }
}

function determinarAlmacenPorMarca(marca: string): string {
  // Asignación inteligente de almacenes según marca para optimizar espacio
  const asignacionAlmacenes: Record<string, string> = {
    // Almacén A - Marcas principales de estética
    'Ares': 'Almacén A - Estante Ares',
    'Classys': 'Almacén A - Estante Classys',
    'Hydrafacial': 'Almacén A - Estante Hydrafacial',
    'Venus': 'Almacén A - Estante Venus',

    // Almacén B - Marcas de láser y tecnología avanzada
    'Candela': 'Almacén B - Estante Candela',
    'Fotona': 'Almacén B - Estante Fotona',
    'Lumenis': 'Almacén B - Estante Lumenis',
    'Zimmer': 'Almacén B - Estante Zimmer',

    // Almacén C - Marcas médicas y accesorios
    'Philips': 'Almacén C - Estante Philips',
    'Siemens': 'Almacén C - Estante Siemens',
    'Endymed': 'Almacén C - Estante Endymed',
    'BodyHealth': 'Almacén C - Estante BodyHealth',
    'Intermedic': 'Almacén C - Estante Intermedic'
  };

  // Validar formato de ubicación
  const ubicacion = asignacionAlmacenes[marca] || `Almacén General - Estante ${marca}`;

  // Validar que la ubicación tenga el formato correcto
  if (!validarFormatoUbicacion(ubicacion)) {
    console.warn(`⚠️ Formato de ubicación inválido para marca ${marca}: ${ubicacion}`);
    return `Almacén General - Estante ${marca}`;
  }

  return ubicacion;
}

function validarFormatoUbicacion(ubicacion: string): boolean {
  // Validar que la ubicación tenga el formato: "Almacén [X] - Estante [Marca]" o "Servicio Técnico - Estante [Marca]"
  const formatoAlmacen = /^Almacén [A-Z]+ - Estante .+$/;
  const formatoServicio = /^Servicio Técnico - Estante .+$/;

  return formatoAlmacen.test(ubicacion) || formatoServicio.test(ubicacion);
}

// Función para manejar casos especiales de Servicio Técnico
function manejarUbicacionServicioTecnico(marca: string): string {
  const marcaNormalizada = normalizarNombreMarca(marca);

  // Casos especiales para Servicio Técnico
  const ubicacionesEspeciales: Record<string, string> = {
    'Servicio Técnico': 'Servicio Técnico - Estante General',
    'Reparación': 'Servicio Técnico - Estante Reparación',
    'Mantenimiento': 'Servicio Técnico - Estante Mantenimiento'
  };

  if (ubicacionesEspeciales[marcaNormalizada]) {
    return ubicacionesEspeciales[marcaNormalizada];
  }

  return `Servicio Técnico - Estante ${marcaNormalizada}`;
}

async function registrarTransaccionStock(componenteId: string, tipo: string, cantidad: number, cantidadAnterior: number, cantidadNueva: number, motivo: string) {
  const { error } = await supabase
    .from('transacciones_stock')
    .insert({
      componente_id: componenteId,
      tipo: tipo,
      cantidad: cantidad,
      cantidad_anterior: cantidadAnterior,
      cantidad_nueva: cantidadNueva,
      motivo: motivo,
      fecha: new Date().toISOString()
    });

  if (error) {
    console.error('❌ Error registrando transacción:', error);
    throw error;
  }
}

// ===============================================
// FLUJO REMISIONES → STOCK (SALIDA)
// ===============================================

export async function procesarRemisionParaStock(remisionId: string, productos: any[]) {
  try {
    console.log('🔄 Procesando remisión para reducir stock...', { remisionId, productos: productos.length });

    for (const producto of productos) {
      await reducirStockPorRemision(remisionId, producto);
    }

    console.log('✅ Stock reducido por remisión exitosamente');
  } catch (error) {
    console.error('❌ Error procesando remisión para stock:', error);
    throw error;
  }
}

async function reducirStockPorRemision(remisionId: string, producto: any) {
  // Buscar el componente en stock
  const { data: componente, error: buscarError } = await supabase
    .from('stock_items')
    .select('*')
    .eq('id', producto.componenteId)
    .single();

  if (buscarError) throw buscarError;

  // Verificar stock suficiente
  if (componente.cantidad_disponible < producto.cantidadSolicitada) {
    throw new Error(`Stock insuficiente para ${componente.nombre}. Disponible: ${componente.cantidad_disponible}, Solicitado: ${producto.cantidadSolicitada}`);
  }

  // Reducir stock
  const nuevaCantidad = componente.cantidad_disponible - producto.cantidadSolicitada;

  const { error: updateError } = await supabase
    .from('stock_items')
    .update({
      cantidad_disponible: nuevaCantidad,
      updated_at: new Date().toISOString()
    })
    .eq('id', componente.id);

  if (updateError) throw updateError;

  // Registrar transacción de salida
  await registrarTransaccionStock(
    componente.id,
    'SALIDA',
    producto.cantidadSolicitada,
    componente.cantidad_disponible,
    nuevaCantidad,
    `Salida por remisión: ${remisionId}`
  );

  console.log(`✅ Stock reducido: ${componente.nombre} (${componente.cantidad_disponible} → ${nuevaCantidad})`);
}

// ===============================================
// FUNCIONES DE CONSULTA PARA STOCK AGRUPADO
// ===============================================

export async function obtenerStockAgrupado() {
  try {
    const { data: componentes, error } = await supabase
      .from('stock_items')
      .select('*')
      .gt('cantidad_disponible', 0)
      .order('marca', { ascending: true })
      .order('nombre', { ascending: true });

    if (error) throw error;

    // Agrupar productos inteligentemente
    const agrupados = agruparProductosInteligente(componentes);

    return agrupados;
  } catch (error) {
    console.error('❌ Error obteniendo stock agrupado:', error);
    throw error;
  }
}

function agruparProductosInteligente(componentes: any[]) {
  const grupos: Record<string, any> = {};

  componentes.forEach(comp => {
    const key = `${comp.nombre}-${comp.marca}-${comp.modelo}`;

    if (!grupos[key]) {
      grupos[key] = {
        id: key,
        nombre: comp.nombre,
        marca: comp.marca,
        modelo: comp.modelo,
        tipoComponente: comp.tipo_componente,
        cantidadTotal: 0,
        ubicaciones: [],
        detallesNumerosSerie: {
          sinNumeroSerie: 0,
          conNumeroSerie: []
        },
        imagen: comp.imagen,
        observaciones: comp.observaciones
      };
    }

    grupos[key].cantidadTotal += comp.cantidad_disponible;

    // Agrupar por ubicación
    const ubicacionExistente = grupos[key].ubicaciones.find(
      (u: any) => u.ubicacion === (comp.ubicacion_fisica || 'Sin ubicación')
    );

    if (ubicacionExistente) {
      ubicacionExistente.cantidad += comp.cantidad_disponible;
      ubicacionExistente.componenteIds.push(comp.id);
    } else {
      grupos[key].ubicaciones.push({
        ubicacion: comp.ubicacion_fisica || 'Sin ubicación',
        cantidad: comp.cantidad_disponible,
        componenteIds: [comp.id]
      });
    }

    // Manejar números de serie (Agrupación Inteligente)
    if (comp.numero_serie) {
      grupos[key].detallesNumerosSerie.conNumeroSerie.push({
        numeroSerie: comp.numero_serie,
        cantidad: comp.cantidad_disponible,
        componenteId: comp.id
      });
    } else {
      grupos[key].detallesNumerosSerie.sinNumeroSerie += comp.cantidad_disponible;
    }
  });

  return Object.values(grupos);
}

export async function obtenerProductosDisponiblesParaRemision() {
  try {
    const stockAgrupado = await obtenerStockAgrupado();

    // Formatear para selector de remisiones
    return stockAgrupado.map((producto: any) => ({
      id: producto.id,
      nombre: producto.nombre,
      marca: producto.marca,
      modelo: producto.modelo,
      cantidadDisponible: producto.cantidadTotal,
      detallesNumerosSerie: producto.detallesNumerosSerie,
      ubicaciones: producto.ubicaciones
    }));
  } catch (error) {
    console.error('❌ Error obteniendo productos para remisión:', error);
    throw error;
  }
}
// ===============================================
// FUNCIONES DE MIGRACIÓN Y VALIDACIÓN
// ===============================================

// Función para migrar productos existentes a estructura de carpetas
export async function migrarProductosAEstructuraCarpetas() {
  try {
    console.log('🔄 Migrando productos existentes a estructura de carpetas...');

    const { data: productos, error } = await supabase
      .from('stock_items')
      .select('*')
      .is('carpeta_principal', null); // Productos sin organizar

    if (error) throw error;

    if (!productos || productos.length === 0) {
      console.log('✅ No hay productos para migrar');
      return { migrados: 0, errores: [] };
    }

    let migrados = 0;
    const errores: string[] = [];

    for (const producto of productos) {
      try {
        const carpetaInfo = determinarCarpetaPorUbicacion(producto.ubicacion_fisica, producto.marca);

        await supabase
          .from('stock_items')
          .update({
            carpeta_principal: carpetaInfo.carpetaPrincipal,
            subcarpeta: carpetaInfo.subcarpeta,
            ruta_carpeta: carpetaInfo.rutaCompleta,
            tipo_destino: inferirTipoDestino(producto.ubicacion_fisica),
            updated_at: new Date().toISOString()
          })
          .eq('id', producto.id);

        migrados++;
        console.log(`✅ Migrado: ${producto.nombre} → ${carpetaInfo.rutaCompleta}`);
      } catch (error) {
        const errorMsg = `Error migrando ${producto.nombre}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
        errores.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log(`✅ Migración completada: ${migrados} productos migrados, ${errores.length} errores`);
    return { migrados, errores };
  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  }
}

function determinarCarpetaPorUbicacion(ubicacion: string, marca: string): CarpetaInfo {
  if (ubicacion?.includes('Servicio Técnico')) {
    return {
      carpetaPrincipal: 'Servicio Técnico',
      subcarpeta: marca,
      rutaCompleta: `Servicio Técnico/${marca}`,
      ubicacionFisica: ubicacion,
      tipoDestino: 'reparacion'
    };
  } else {
    return {
      carpetaPrincipal: marca || 'Sin Marca',
      rutaCompleta: marca || 'Sin Marca',
      ubicacionFisica: ubicacion || `Almacén General - Estante ${marca || 'General'}`,
      tipoDestino: 'stock'
    };
  }
}

function inferirTipoDestino(ubicacion: string): string {
  if (ubicacion?.includes('Servicio Técnico')) {
    return 'reparacion';
  } else if (ubicacion?.includes('Cliente')) {
    return 'cliente';
  } else {
    return 'stock';
  }
}

// Validación de consistencia de carpetas
export async function validarConsistenciaCarpetas(): Promise<{
  inconsistencias: string[];
  carpetasVacias: string[];
  productosDesorganizados: string[];
}> {
  const inconsistencias: string[] = [];
  const carpetasVacias: string[] = [];
  const productosDesorganizados: string[] = [];

  try {
    const { data: productos } = await supabase
      .from('stock_items')
      .select('*');

    productos?.forEach(producto => {
      // Validar que tenga carpeta asignada
      if (!producto.carpeta_principal) {
        productosDesorganizados.push(producto.nombre);
        return;
      }

      // Validar que la ruta de carpeta coincida con ubicación física
      const rutaEsperada = determinarRutaCarpetaEsperada(producto);
      if (producto.ruta_carpeta !== rutaEsperada) {
        inconsistencias.push(`${producto.nombre}: ruta ${producto.ruta_carpeta} vs esperada ${rutaEsperada}`);
      }

      // Validar consistencia entre carpeta_principal y ubicacion_fisica
      if (producto.carpeta_principal === 'Servicio Técnico' && !producto.ubicacion_fisica?.includes('Servicio Técnico')) {
        inconsistencias.push(`${producto.nombre}: carpeta "Servicio Técnico" pero ubicación "${producto.ubicacion_fisica}"`);
      }
    });

    // Buscar carpetas vacías (opcional - para futuras mejoras)
    const { data: estadisticas } = await supabase
      .from('vista_estadisticas_carpetas')
      .select('*')
      .eq('total_productos', 0);

    estadisticas?.forEach(stat => {
      carpetasVacias.push(stat.ruta_carpeta);
    });

    return { inconsistencias, carpetasVacias, productosDesorganizados };
  } catch (error) {
    console.error('Error validando consistencia:', error);
    throw error;
  }
}

function determinarRutaCarpetaEsperada(producto: any): string {
  if (producto.ubicacion_fisica?.includes('Servicio Técnico')) {
    return `Servicio Técnico/${producto.marca || 'Sin Marca'}`;
  } else {
    return producto.marca || 'Sin Marca';
  }
}

// ===============================================
// FUNCIONES DE ACTUALIZACIÓN AUTOMÁTICA DE UBICACIONES
// ===============================================

// Función para actualizar ubicación cuando cambia la marca de un producto
export async function actualizarUbicacionPorCambioMarca(componenteId: string, nuevaMarca: string, tipoDestino?: string) {
  try {
    console.log(`🔄 Actualizando ubicación por cambio de marca: ${componenteId} → ${nuevaMarca}`);

    // Obtener información actual del producto
    const { data: producto, error: fetchError } = await supabase
      .from('stock_items')
      .select('*')
      .eq('id', componenteId)
      .single();

    if (fetchError) throw fetchError;

    // Determinar nuevo tipo de destino si no se proporciona
    const tipoDestinoFinal = tipoDestino || producto.tipo_destino || 'stock';

    // Calcular nueva información de carpeta y ubicación
    const nuevaCarpetaInfo = determinarCarpetaYUbicacion(nuevaMarca, tipoDestinoFinal);

    // Validar que la nueva ubicación sea diferente
    if (producto.ubicacion_fisica === nuevaCarpetaInfo.ubicacionFisica &&
      producto.carpeta_principal === nuevaCarpetaInfo.carpetaPrincipal) {
      console.log('✅ No se requiere actualización - ubicación ya es correcta');
      return { actualizado: false, razon: 'ubicacion_ya_correcta' };
    }

    // Actualizar en la base de datos
    const { error: updateError } = await supabase
      .from('stock_items')
      .update({
        marca: normalizarNombreMarca(nuevaMarca),
        carpeta_principal: nuevaCarpetaInfo.carpetaPrincipal,
        subcarpeta: nuevaCarpetaInfo.subcarpeta || null,
        ruta_carpeta: nuevaCarpetaInfo.rutaCompleta,
        ubicacion_fisica: nuevaCarpetaInfo.ubicacionFisica,
        tipo_destino: nuevaCarpetaInfo.tipoDestino,
        updated_at: new Date().toISOString()
      })
      .eq('id', componenteId);

    if (updateError) throw updateError;

    // Registrar transacción de cambio de ubicación
    await registrarTransaccionStock(
      componenteId,
      'CAMBIO_UBICACION',
      0,
      producto.cantidad_disponible,
      producto.cantidad_disponible,
      `Cambio de marca: ${producto.marca} → ${nuevaMarca}. Ubicación: ${producto.ubicacion_fisica} → ${nuevaCarpetaInfo.ubicacionFisica}`
    );

    console.log(`✅ Ubicación actualizada: ${producto.nombre} movido a ${nuevaCarpetaInfo.rutaCompleta}`);
    return {
      actualizado: true,
      ubicacionAnterior: producto.ubicacion_fisica,
      ubicacionNueva: nuevaCarpetaInfo.ubicacionFisica,
      carpetaAnterior: producto.ruta_carpeta,
      carpetaNueva: nuevaCarpetaInfo.rutaCompleta
    };
  } catch (error) {
    console.error('❌ Error actualizando ubicación por cambio de marca:', error);
    throw error;
  }
}

// Función para actualizar ubicación cuando un producto cambia de tipo de destino
export async function actualizarUbicacionPorCambioTipo(componenteId: string, nuevoTipoDestino: string) {
  try {
    console.log(`🔄 Actualizando ubicación por cambio de tipo: ${componenteId} → ${nuevoTipoDestino}`);

    // Obtener información actual del producto
    const { data: producto, error: fetchError } = await supabase
      .from('stock_items')
      .select('*')
      .eq('id', componenteId)
      .single();

    if (fetchError) throw fetchError;

    // Validar tipo de destino
    if (!['stock', 'cliente', 'reparacion'].includes(nuevoTipoDestino)) {
      throw new Error(`Tipo de destino inválido: ${nuevoTipoDestino}`);
    }

    // Calcular nueva información de carpeta y ubicación
    const nuevaCarpetaInfo = determinarCarpetaYUbicacion(producto.marca, nuevoTipoDestino);

    // Validar que la nueva ubicación sea diferente
    if (producto.tipo_destino === nuevoTipoDestino) {
      console.log('✅ No se requiere actualización - tipo de destino ya es correcto');
      return { actualizado: false, razon: 'tipo_ya_correcto' };
    }

    // Actualizar en la base de datos
    const { error: updateError } = await supabase
      .from('stock_items')
      .update({
        carpeta_principal: nuevaCarpetaInfo.carpetaPrincipal,
        subcarpeta: nuevaCarpetaInfo.subcarpeta || null,
        ruta_carpeta: nuevaCarpetaInfo.rutaCompleta,
        ubicacion_fisica: nuevaCarpetaInfo.ubicacionFisica,
        tipo_destino: nuevaCarpetaInfo.tipoDestino,
        updated_at: new Date().toISOString()
      })
      .eq('id', componenteId);

    if (updateError) throw updateError;

    // Registrar transacción de cambio de ubicación
    await registrarTransaccionStock(
      componenteId,
      'CAMBIO_TIPO',
      0,
      producto.cantidad_disponible,
      producto.cantidad_disponible,
      `Cambio de tipo: ${producto.tipo_destino} → ${nuevoTipoDestino}. Ubicación: ${producto.ubicacion_fisica} → ${nuevaCarpetaInfo.ubicacionFisica}`
    );

    console.log(`✅ Tipo y ubicación actualizados: ${producto.nombre} movido de ${producto.tipo_destino} a ${nuevoTipoDestino}`);
    return {
      actualizado: true,
      tipoAnterior: producto.tipo_destino,
      tipoNuevo: nuevoTipoDestino,
      ubicacionAnterior: producto.ubicacion_fisica,
      ubicacionNueva: nuevaCarpetaInfo.ubicacionFisica
    };
  } catch (error) {
    console.error('❌ Error actualizando ubicación por cambio de tipo:', error);
    throw error;
  }
}

// Función para validar y prevenir inconsistencias de ubicación
export async function validarYCorregirUbicacionProducto(componenteId: string): Promise<{
  esConsistente: boolean;
  inconsistencias: string[];
  corregido: boolean;
}> {
  try {
    const { data: producto, error } = await supabase
      .from('stock_items')
      .select('*')
      .eq('id', componenteId)
      .single();

    if (error) throw error;

    const inconsistencias: string[] = [];
    let esConsistente = true;

    // Validar que la ubicación física coincida con la carpeta
    const ubicacionEsperada = determinarUbicacionPorMarca(producto.marca, producto.tipo_destino);
    if (producto.ubicacion_fisica !== ubicacionEsperada) {
      inconsistencias.push(`Ubicación física incorrecta: "${producto.ubicacion_fisica}" vs esperada "${ubicacionEsperada}"`);
      esConsistente = false;
    }

    // Validar que la ruta de carpeta sea consistente
    const carpetaEsperada = determinarCarpetaYUbicacion(producto.marca, producto.tipo_destino);
    if (producto.ruta_carpeta !== carpetaEsperada.rutaCompleta) {
      inconsistencias.push(`Ruta de carpeta incorrecta: "${producto.ruta_carpeta}" vs esperada "${carpetaEsperada.rutaCompleta}"`);
      esConsistente = false;
    }

    // Validar formato de ubicación
    if (!validarFormatoUbicacion(producto.ubicacion_fisica)) {
      inconsistencias.push(`Formato de ubicación inválido: "${producto.ubicacion_fisica}"`);
      esConsistente = false;
    }

    // Si hay inconsistencias, intentar corregir
    let corregido = false;
    if (!esConsistente) {
      try {
        await supabase
          .from('stock_items')
          .update({
            carpeta_principal: carpetaEsperada.carpetaPrincipal,
            subcarpeta: carpetaEsperada.subcarpeta || null,
            ruta_carpeta: carpetaEsperada.rutaCompleta,
            ubicacion_fisica: carpetaEsperada.ubicacionFisica,
            updated_at: new Date().toISOString()
          })
          .eq('id', componenteId);

        corregido = true;
        console.log(`✅ Inconsistencias corregidas para producto: ${producto.nombre}`);
      } catch (correctionError) {
        console.error(`❌ Error corrigiendo inconsistencias para ${producto.nombre}:`, correctionError);
      }
    }

    return { esConsistente, inconsistencias, corregido };
  } catch (error) {
    console.error('❌ Error validando ubicación de producto:', error);
    throw error;
  }
}

// Función para actualización masiva de ubicaciones para consistencia
export async function actualizarUbicacionesMasivamente(filtros?: {
  marca?: string;
  tipoDestino?: string;
  soloInconsistentes?: boolean;
}): Promise<{
  procesados: number;
  actualizados: number;
  errores: string[];
}> {
  try {
    console.log('🔄 Iniciando actualización masiva de ubicaciones...');

    // Construir query con filtros
    let query = supabase.from('stock_items').select('*');

    if (filtros?.marca) {
      query = query.eq('marca', filtros.marca);
    }

    if (filtros?.tipoDestino) {
      query = query.eq('tipo_destino', filtros.tipoDestino);
    }

    const { data: productos, error } = await query;
    if (error) throw error;

    if (!productos || productos.length === 0) {
      console.log('✅ No hay productos para procesar');
      return { procesados: 0, actualizados: 0, errores: [] };
    }

    let procesados = 0;
    let actualizados = 0;
    const errores: string[] = [];

    for (const producto of productos) {
      try {
        procesados++;

        // Si solo queremos inconsistentes, validar primero
        if (filtros?.soloInconsistentes) {
          const validacion = await validarYCorregirUbicacionProducto(producto.id);
          if (validacion.esConsistente) {
            continue; // Saltar productos ya consistentes
          }
          if (validacion.corregido) {
            actualizados++;
          }
        } else {
          // Actualizar todos los productos
          const carpetaEsperada = determinarCarpetaYUbicacion(producto.marca, producto.tipo_destino || 'stock');

          // Solo actualizar si hay cambios
          if (producto.ubicacion_fisica !== carpetaEsperada.ubicacionFisica ||
            producto.ruta_carpeta !== carpetaEsperada.rutaCompleta) {

            await supabase
              .from('stock_items')
              .update({
                carpeta_principal: carpetaEsperada.carpetaPrincipal,
                subcarpeta: carpetaEsperada.subcarpeta || null,
                ruta_carpeta: carpetaEsperada.rutaCompleta,
                ubicacion_fisica: carpetaEsperada.ubicacionFisica,
                updated_at: new Date().toISOString()
              })
              .eq('id', producto.id);

            actualizados++;
            console.log(`✅ Actualizado: ${producto.nombre} → ${carpetaEsperada.rutaCompleta}`);
          }
        }
      } catch (error) {
        const errorMsg = `Error procesando ${producto.nombre}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
        errores.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log(`✅ Actualización masiva completada: ${actualizados}/${procesados} productos actualizados`);
    return { procesados, actualizados, errores };
  } catch (error) {
    console.error('❌ Error en actualización masiva:', error);
    throw error;
  }
}

// Función para prevenir inconsistencias antes de guardar cambios
export function validarConsistenciaAntesDeGuardar(marca: string, tipoDestino: string, ubicacionFisica?: string): {
  esValido: boolean;
  errores: string[];
  ubicacionCorrecta: string;
} {
  const errores: string[] = [];
  let esValido = true;

  // Validar marca
  if (!marca || marca.trim() === '') {
    errores.push('La marca es requerida');
    esValido = false;
  }

  // Validar tipo de destino
  if (!['stock', 'cliente', 'reparacion'].includes(tipoDestino)) {
    errores.push(`Tipo de destino inválido: ${tipoDestino}`);
    esValido = false;
  }

  // Calcular ubicación correcta
  const ubicacionCorrecta = determinarUbicacionPorMarca(marca, tipoDestino);

  // Validar ubicación física si se proporciona
  if (ubicacionFisica && ubicacionFisica !== ubicacionCorrecta) {
    errores.push(`Ubicación física inconsistente: "${ubicacionFisica}" vs esperada "${ubicacionCorrecta}"`);
    esValido = false;
  }

  // Validar formato de ubicación
  if (!validarFormatoUbicacion(ubicacionCorrecta)) {
    errores.push(`Formato de ubicación inválido: "${ubicacionCorrecta}"`);
    esValido = false;
  }

  return { esValido, errores, ubicacionCorrecta };
}

// Función para ejecutar migración completa con validación
export async function ejecutarMigracionCompleta() {
  try {
    console.log('🚀 Iniciando migración completa de productos a estructura de carpetas...');

    // 1. Ejecutar migración
    const resultadoMigracion = await migrarProductosAEstructuraCarpetas();

    // 2. Validar consistencia
    const validacion = await validarConsistenciaCarpetas();

    // 3. Mostrar resumen
    console.log('📊 Resumen de migración:');
    console.log(`✅ Productos migrados: ${resultadoMigracion.migrados}`);
    console.log(`❌ Errores de migración: ${resultadoMigracion.errores.length}`);
    console.log(`⚠️ Inconsistencias encontradas: ${validacion.inconsistencias.length}`);
    console.log(`📁 Carpetas vacías: ${validacion.carpetasVacias.length}`);
    console.log(`🔍 Productos sin organizar: ${validacion.productosDesorganizados.length}`);

    if (resultadoMigracion.errores.length > 0) {
      console.log('❌ Errores de migración:');
      resultadoMigracion.errores.forEach(error => console.log(`  - ${error}`));
    }

    if (validacion.inconsistencias.length > 0) {
      console.log('⚠️ Inconsistencias encontradas:');
      validacion.inconsistencias.forEach(inc => console.log(`  - ${inc}`));
    }

    return {
      migracion: resultadoMigracion,
      validacion: validacion,
      exito: resultadoMigracion.errores.length === 0 && validacion.inconsistencias.length === 0
    };
  } catch (error) {
    console.error('❌ Error en migración completa:', error);
    throw error;
  }
}