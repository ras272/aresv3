import { supabase } from "./shared/supabase";
import { createLogger } from "./shared/utils";
import { Equipo, ComponenteEquipo } from "../../types";

const logger = createLogger("EquiposModule");

// ===============================================
// EQUIPOS MODULE INTERFACES
// ===============================================

export interface EquipoInput {
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
    estado: "Operativo" | "En reparacion" | "Fuera de servicio";
    observaciones?: string;
  }>;
  accesorios?: string;
  fechaEntrega: string;
  observaciones?: string;
}

export interface ComponenteDisponible {
  id: string;
  nombre: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  tipoComponente: string;
  cantidadDisponible: number;
  cantidadOriginal: number;
  ubicacionFisica: string;
  estado: string;
  observaciones: string;
  fechaIngreso: string;
  codigoCargaOrigen: string;
  carpetaPrincipal: string;
  rutaCarpeta: string;
  tipoDestino: string;
  createdAt: string;
}

export interface AsignacionComponente {
  id: string;
  componenteId: string;
  equipoId: string;
  cantidadAsignada: number;
  fechaAsignacion: string;
  tecnicoResponsable?: string;
  motivo: string;
  observaciones?: string;
  componente?: any;
  equipo?: any;
  createdAt: string;
}

// ===============================================
// CLIENT-SPECIFIC INTERFACES
// ===============================================

export interface EquipoClienteStats {
  clienteNombre: string;
  totalEquipos: number;
  equiposPorEstado: {
    operativo: number;
    enMantenimiento: number;
    fueraDeServicio: number;
    enReparacion: number;
  };
  tiposEquipos: string[];
  marcas: string[];
  ubicaciones: string[];
  ultimoEquipoInstalado: {
    id: string;
    nombre: string;
    fechaEntrega: string;
    fechaCreacion: string;
  } | null;
  totalComponentes: number;
  equiposConComponentes: number;
  fechaConsulta: string;
}

export interface ClienteEquipoSummary {
  clienteNombre: string;
  totalEquipos: number;
  equiposOperativos: number;
  equiposEnMantenimiento: number;
  equiposFueraServicio: number;
  tiposEquiposCount: number;
  ultimaInstalacion: string | null;
}

export interface EquiposModuleInterface {
  createEquipo(equipoData: EquipoInput): Promise<Equipo>;
  createEquipoFromMercaderia(
    producto: any,
    carga: any,
    subitems?: Array<any>
  ): Promise<any>;
  getAllEquipos(): Promise<Equipo[]>;
  deleteEquipo(equipoId: string): Promise<boolean>;
  getAllComponentesDisponibles(): Promise<ComponenteDisponible[]>;
  asignarComponenteAEquipo(
    componenteId: string,
    equipoId: string,
    cantidadAsignada: number,
    motivo?: string,
    tecnicoResponsable?: string,
    observaciones?: string
  ): Promise<any>;
  getHistorialAsignaciones(
    componenteId?: string,
    equipoId?: string
  ): Promise<AsignacionComponente[]>;
  updateComponente(
    componenteId: string,
    updates: {
      estado?: "Operativo" | "En reparacion" | "Fuera de servicio";
      observaciones?: string;
    }
  ): Promise<any>;
  createComponenteInventarioTecnico(producto: any, carga: any): Promise<any>;
  createComponenteInventarioTecnicoReparacion(
    producto: any,
    carga: any
  ): Promise<any>;
  createComponenteInventarioTecnicoFromSubitem(
    subitem: any,
    producto: any,
    carga: any
  ): Promise<any>;
  // Client-specific functions
  getEquiposByCliente(clienteNombre: string): Promise<Equipo[]>;
  getEstadisticasEquiposByCliente(
    clienteNombre: string
  ): Promise<EquipoClienteStats>;
  getResumenEquiposMultiplesClientes(
    clientesNombres: string[]
  ): Promise<ClienteEquipoSummary[]>;
}

// ===============================================
// EQUIPMENT MANAGEMENT FUNCTIONS
// ===============================================

/**
 * Create a new equipment manually from form data
 */
export async function createEquipo(equipoData: EquipoInput) {
  try {
    logger.info("Creating manual equipment", "createEquipo", {
      nombreEquipo: equipoData.nombreEquipo,
    });

    // 1. Create main equipment
    const { data: equipo, error: equipoError } = await supabase
      .from("equipos")
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
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (equipoError) {
      logger.error("Error creating equipment", "createEquipo", {
        error: equipoError,
      });
      throw equipoError;
    }

    logger.info("Equipment created successfully", "createEquipo", {
      equipoId: equipo.id,
    });

    // 2. Create equipment components
    if (equipoData.componentes && equipoData.componentes.length > 0) {
      const componentesParaInsertar = equipoData.componentes.map(
        (componente) => ({
          equipo_id: equipo.id,
          nombre: componente.nombre,
          numero_serie: componente.numeroSerie,
          estado: componente.estado,
          observaciones: componente.observaciones,
        })
      );

      const { error: componentesError } = await supabase
        .from("componentes_equipo")
        .insert(componentesParaInsertar);

      if (componentesError) {
        logger.error("Error creating components", "createEquipo", {
          error: componentesError,
        });
        // Don't throw error, equipment was already created
      } else {
        logger.info("Components created successfully", "createEquipo", {
          count: componentesParaInsertar.length,
        });
      }
    }

    logger.info("Manual equipment created completely", "createEquipo", {
      equipoId: equipo.id,
      nombreEquipo: equipoData.nombreEquipo,
      cliente: equipoData.cliente,
      componentes: equipoData.componentes.length,
    });

    return equipo;
  } catch (error) {
    logger.error("Error creating manual equipment", "createEquipo", { error });
    throw error;
  }
}

/**
 * Create equipment from merchandise data
 */
export async function createEquipoFromMercaderia(
  producto: any,
  carga: any,
  subitems: Array<{
    nombre: string;
    numeroSerie?: string;
    cantidad: number;
    paraServicioTecnico?: boolean;
  }> = []
) {
  try {
    logger.info(
      "Creating equipment from merchandise",
      "createEquipoFromMercaderia",
      {
        producto: producto.producto,
        codigoCarga: carga.codigo_carga,
      }
    );

    // 1. Create equipment
    const { data: equipo, error: equipoError } = await supabase
      .from("equipos")
      .insert({
        cliente: carga.destino.split(" - ")[0] || carga.destino,
        ubicacion: carga.destino,
        nombre_equipo: `${producto.producto}-${carga.codigo_carga}`,
        tipo_equipo: producto.producto,
        marca: producto.marca,
        modelo: producto.modelo,
        numero_serie_base: producto.numero_serie || "SIN-SERIE",
        accesorios:
          subitems.map((s) => s.nombre).join(", ") ||
          "Sin accesorios específicos",
        fecha_entrega: carga.fecha_ingreso,
        observaciones: `Ingresado automáticamente desde el módulo de mercaderías. Código de carga: ${
          carga.codigo_carga
        }. ${carga.observaciones_generales || ""} ${
          producto.observaciones || ""
        }`,
        codigo_carga_origen: carga.codigo_carga,
      })
      .select()
      .single();

    if (equipoError) throw equipoError;

    // 2. Create components - Only those marked for technical service
    const subitemsParaServicio = subitems.filter(
      (subitem) => subitem.paraServicioTecnico === true
    );

    const componentesParaInsertar = [
      {
        equipo_id: equipo.id,
        nombre: "Equipo Principal",
        numero_serie: producto.numero_serie || "SIN-SERIE",
        estado: "Operativo" as const,
        observaciones: `Cantidad: ${producto.cantidad}. ${
          producto.observaciones || ""
        }`,
      },
      // Only subitems marked for technical service
      ...subitemsParaServicio.map((subitem) => ({
        equipo_id: equipo.id,
        nombre: subitem.nombre,
        numero_serie: subitem.numeroSerie || "SIN-SERIE",
        estado: "Operativo" as const,
        observaciones: `Cantidad: ${subitem.cantidad}. Marcado para mantenimiento técnico.`,
      })),
    ];

    const { error: componentesError } = await supabase
      .from("componentes_equipo")
      .insert(componentesParaInsertar);

    if (componentesError) throw componentesError;

    logger.info(
      "Medical equipment sent intelligently to Technical Service module",
      "createEquipoFromMercaderia",
      {
        codigoCarga: carga.codigo_carga,
        producto: producto.producto,
        destino: carga.destino,
        totalSubitems: subitems.length,
        subitemsParaServicio: subitemsParaServicio.length,
        componentesTotales: componentesParaInsertar.length,
      }
    );

    return equipo;
  } catch (error) {
    logger.error(
      "Error creating equipment from merchandise",
      "createEquipoFromMercaderia",
      { error }
    );
    throw error;
  }
}

/**
 * Get all equipment with their components
 */
export async function getAllEquipos(): Promise<Equipo[]> {
  try {
    logger.info("Fetching all equipment", "getAllEquipos");

    const { data, error } = await supabase
      .from("equipos")
      .select(
        `
        *,
        componentes_equipo (*)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching equipment", "getAllEquipos", { error });
      throw error;
    }

    const equipos = data.map((equipo: any) => ({
      id: equipo.id,
      cliente: equipo.cliente,
      ubicacion: equipo.ubicacion,
      nombreEquipo: equipo.nombre_equipo,
      tipoEquipo: equipo.tipo_equipo,
      marca: equipo.marca,
      modelo: equipo.modelo,
      numeroSerieBase: equipo.numero_serie_base,
      componentes:
        equipo.componentes_equipo?.map((c: any) => ({
          id: c.id,
          nombre: c.nombre,
          numeroSerie: c.numero_serie,
          estado: c.estado,
          observaciones: c.observaciones,
        })) || [],
      accesorios: equipo.accesorios,
      fechaEntrega: equipo.fecha_entrega,
      observaciones: equipo.observaciones,
      createdAt: equipo.created_at,
    }));

    logger.info("Equipment fetched successfully", "getAllEquipos", {
      count: equipos.length,
    });
    return equipos;
  } catch (error) {
    logger.error("Error fetching all equipment", "getAllEquipos", { error });
    throw error;
  }
}

/**
 * Delete equipment and its components (cascade delete configured in schema)
 */
export async function deleteEquipo(equipoId: string): Promise<boolean> {
  try {
    logger.info("Deleting equipment", "deleteEquipo", { equipoId });

    // Cascade deletions are configured in the schema
    // When deleting equipment, it automatically deletes:
    // - componentes_equipo
    // - mantenimientos
    const { error } = await supabase
      .from("equipos")
      .delete()
      .eq("id", equipoId);

    if (error) {
      logger.error("Error deleting equipment", "deleteEquipo", {
        error,
        equipoId,
      });
      throw error;
    }

    logger.info("Equipment deleted successfully", "deleteEquipo", { equipoId });
    return true;
  } catch (error) {
    logger.error("Error deleting equipment", "deleteEquipo", {
      error,
      equipoId,
    });
    throw error;
  }
}

// ===============================================
// COMPONENT MANAGEMENT FUNCTIONS
// ===============================================

/**
 * Get all available components from technical inventory
 */
export async function getAllComponentesDisponibles(): Promise<
  ComponenteDisponible[]
> {
  try {
    logger.info(
      "Fetching all available components",
      "getAllComponentesDisponibles"
    );

    const { data, error } = await supabase
      .from("componentes_disponibles")
      .select(
        `
        *,
        productos_carga (
          carga_id,
          cargas_mercaderia (
            codigo_carga,
            fecha_ingreso
          )
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      logger.error(
        "Error fetching available components",
        "getAllComponentesDisponibles",
        { error }
      );
      throw error;
    }

    const componentes = data.map((comp: any) => ({
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
      createdAt: comp.created_at,
    }));

    logger.info(
      "Available components fetched successfully",
      "getAllComponentesDisponibles",
      { count: componentes.length }
    );
    return componentes;
  } catch (error) {
    logger.error(
      "Error fetching available components",
      "getAllComponentesDisponibles",
      { error }
    );
    throw error;
  }
}

/**
 * Assign a component from inventory to equipment
 */
export async function asignarComponenteAEquipo(
  componenteId: string,
  equipoId: string,
  cantidadAsignada: number,
  motivo: string = "Instalación",
  tecnicoResponsable?: string,
  observaciones?: string
) {
  try {
    logger.info("Starting component assignment", "asignarComponenteAEquipo", {
      componenteId,
      equipoId,
      cantidadAsignada,
      motivo,
    });

    // 1. Get original component data from inventory
    const { data: componenteOriginal, error: componenteError } = await supabase
      .from("componentes_disponibles")
      .select("*")
      .eq("id", componenteId)
      .single();

    if (componenteError || !componenteOriginal) {
      logger.error("Error getting component", "asignarComponenteAEquipo", {
        error: componenteError,
      });
      throw new Error("No se pudo encontrar el componente en el inventario");
    }

    logger.info("Component found", "asignarComponenteAEquipo", {
      nombre: componenteOriginal.nombre,
      cantidadDisponible: componenteOriginal.cantidad_disponible,
      cantidadOriginal: componenteOriginal.cantidad_original,
    });

    // 2. Verify availability directly from component
    const disponibilidadActual = componenteOriginal.cantidad_disponible;

    if (disponibilidadActual < cantidadAsignada) {
      logger.error("Insufficient stock", "asignarComponenteAEquipo", {
        disponible: disponibilidadActual,
        solicitado: cantidadAsignada,
      });
      throw new Error(`Solo hay ${disponibilidadActual} unidades disponibles`);
    }

    // 3. Calculate new available quantity
    const nuevaCantidadDisponible = disponibilidadActual - cantidadAsignada;
    const nuevoEstado =
      nuevaCantidadDisponible === 0 ? "Asignado" : "Disponible";

    logger.info("Calculating new quantity", "asignarComponenteAEquipo", {
      cantidadAnterior: disponibilidadActual,
      cantidadAsignada,
      nuevaCantidadDisponible,
      nuevoEstado,
    });

    // 4. Update available quantity FIRST
    const { error: updateError } = await supabase
      .from("componentes_disponibles")
      .update({
        cantidad_disponible: nuevaCantidadDisponible,
        estado: nuevoEstado,
        updated_at: new Date().toISOString(),
      })
      .eq("id", componenteId);

    if (updateError) {
      logger.error("Error updating stock", "asignarComponenteAEquipo", {
        error: updateError,
      });
      throw updateError;
    }

    logger.info("Stock updated successfully", "asignarComponenteAEquipo", {
      componenteId,
      cantidadAnterior: disponibilidadActual,
      cantidadNueva: nuevaCantidadDisponible,
      estado: nuevoEstado,
    });

    // 5. Create assignment in history
    const { data: asignacion, error: asignacionError } = await supabase
      .from("asignaciones_componentes")
      .insert({
        componente_id: componenteId,
        equipo_id: equipoId,
        cantidad_asignada: cantidadAsignada,
        motivo,
        tecnico_responsable: tecnicoResponsable,
        observaciones,
      })
      .select()
      .single();

    if (asignacionError) {
      logger.error("Error creating assignment", "asignarComponenteAEquipo", {
        error: asignacionError,
      });
      throw asignacionError;
    }

    // 6. Register stock transaction (import from stock module when available)
    // This would normally call createTransaccionStock from stock module
    // For now, we'll skip this to avoid circular dependencies

    // 7. Create component in equipment with real inventory data
    const numeroSerieReal =
      componenteOriginal.numero_serie ||
      `${componenteOriginal.nombre.replace(/\s+/g, "-").toUpperCase()}-${
        componenteOriginal.codigo_carga_origen || "SIN-CODIGO"
      }`;

    const { data: componente, error: componenteEquipoError } = await supabase
      .from("componentes_equipo")
      .insert({
        equipo_id: equipoId,
        nombre: componenteOriginal.nombre, // Use real component name
        numero_serie: numeroSerieReal, // Use real serial number or generate descriptive one
        estado: "Operativo",
        observaciones: `🔧 ${motivo} desde inventario técnico. Marca: ${
          componenteOriginal.marca
        }, Modelo: ${
          componenteOriginal.modelo
        }. Cantidad: ${cantidadAsignada}. ${observaciones || ""}`,
      })
      .select()
      .single();

    if (componenteEquipoError) {
      logger.error(
        "Error creating component in equipment",
        "asignarComponenteAEquipo",
        { error: componenteEquipoError }
      );
      throw componenteEquipoError;
    }

    logger.info("Component assigned successfully", "asignarComponenteAEquipo", {
      componenteId,
      equipoId,
      cantidadAsignada,
      motivo,
      componenteOriginal: componenteOriginal.nombre,
      numeroSerieAsignado: numeroSerieReal,
      stockAnterior: disponibilidadActual,
      stockNuevo: nuevaCantidadDisponible,
    });

    return asignacion;
  } catch (error) {
    logger.error("Error assigning component", "asignarComponenteAEquipo", {
      error,
    });
    throw error;
  }
}

/**
 * Get assignment history for components and/or equipment
 */
export async function getHistorialAsignaciones(
  componenteId?: string,
  equipoId?: string
): Promise<AsignacionComponente[]> {
  try {
    logger.info("Fetching assignment history", "getHistorialAsignaciones", {
      componenteId,
      equipoId,
    });

    let query = supabase
      .from("asignaciones_componentes")
      .select(
        `
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
      `
      )
      .order("created_at", { ascending: false });

    if (componenteId) {
      query = query.eq("componente_id", componenteId);
    }
    if (equipoId) {
      query = query.eq("equipo_id", equipoId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error(
        "Error getting assignment history",
        "getHistorialAsignaciones",
        { error }
      );
      throw error;
    }

    const historial = data.map((asig: any) => ({
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
      createdAt: asig.created_at,
    }));

    logger.info(
      "Assignment history fetched successfully",
      "getHistorialAsignaciones",
      { count: historial.length }
    );
    return historial;
  } catch (error) {
    logger.error(
      "Error getting assignment history",
      "getHistorialAsignaciones",
      { error }
    );
    throw error;
  }
}

/**
 * Update equipment component details
 */
export async function updateComponente(
  componenteId: string,
  updates: {
    estado?: "Operativo" | "En reparacion" | "Fuera de servicio";
    observaciones?: string;
  }
) {
  try {
    logger.info("Updating component", "updateComponente", {
      componenteId,
      updates,
    });

    const { data, error } = await supabase
      .from("componentes_equipo")
      .update({
        estado: updates.estado,
        observaciones: updates.observaciones,
      })
      .eq("id", componenteId)
      .select()
      .single();

    if (error) {
      logger.error("Error updating component", "updateComponente", {
        error,
        componenteId,
      });
      throw error;
    }

    logger.info("Component updated successfully", "updateComponente", {
      componenteId,
    });
    return data;
  } catch (error) {
    logger.error("Error updating component", "updateComponente", {
      error,
      componenteId,
    });
    throw error;
  }
}

// ===============================================
// TECHNICAL INVENTORY COMPONENT CREATION FUNCTIONS
// ===============================================

/**
 * Create component in technical inventory (not as equipment)
 */
export async function createComponenteInventarioTecnico(
  producto: any,
  carga: any
) {
  try {
    logger.info(
      "Processing component for technical inventory",
      "createComponenteInventarioTecnico",
      {
        producto: producto.producto,
      }
    );

    // Determine component type based on product name
    const tipoComponente = determinarTipoComponente(producto.producto);

    const { data: componente, error: componenteError } = await supabase
      .from("componentes_disponibles")
      .insert({
        producto_carga_id: producto.id,
        nombre: producto.producto,
        marca: producto.marca,
        modelo: producto.modelo,
        numero_serie: producto.numero_serie,
        tipo_componente: tipoComponente,
        cantidad_disponible: producto.cantidad,
        cantidad_original: producto.cantidad,
        ubicacion_fisica: "Almacén Servicio Técnico",
        estado: "Disponible",
        observaciones: `Ingresado desde mercaderías. Código: ${
          carga.codigo_carga
        }. ${producto.observaciones || ""}`,
        codigo_carga_origen: carga.codigo_carga,
      })
      .select()
      .single();

    if (componenteError) {
      logger.error(
        "Error creating technical inventory component",
        "createComponenteInventarioTecnico",
        { error: componenteError }
      );
      throw componenteError;
    }

    logger.info(
      "Component added to technical inventory",
      "createComponenteInventarioTecnico",
      {
        codigoCarga: carga.codigo_carga,
        componente: producto.producto,
        tipo: tipoComponente,
        cantidad: producto.cantidad,
      }
    );

    return componente;
  } catch (error) {
    logger.error(
      "Error creating technical inventory component",
      "createComponenteInventarioTecnico",
      { error }
    );
    throw error;
  }
}

/**
 * Create component in technical inventory for REPAIR
 */
export async function createComponenteInventarioTecnicoReparacion(
  producto: any,
  carga: any
) {
  try {
    logger.info(
      "Processing component for repair in technical inventory",
      "createComponenteInventarioTecnicoReparacion",
      {
        producto: producto.producto,
      }
    );

    // Determine component type based on product name
    const tipoComponente = determinarTipoComponente(producto.producto);

    const { data: componente, error: componenteError } = await supabase
      .from("componentes_disponibles")
      .insert({
        producto_carga_id: producto.id,
        nombre: producto.producto,
        marca: producto.marca,
        modelo: producto.modelo,
        numero_serie: producto.numero_serie,
        tipo_componente: tipoComponente,
        cantidad_disponible: producto.cantidad,
        cantidad_original: producto.cantidad,
        ubicacion_fisica: "Taller de Reparación",
        estado: "En reparación", // Specific state for repairs
        observaciones: `🔧 EQUIPO EN REPARACIÓN. Ingresado desde mercaderías. Código: ${
          carga.codigo_carga
        }. ${producto.observaciones || ""}`,
        codigo_carga_origen: carga.codigo_carga,
      })
      .select()
      .single();

    if (componenteError) {
      logger.error(
        "Error creating repair component in technical inventory",
        "createComponenteInventarioTecnicoReparacion",
        { error: componenteError }
      );
      throw componenteError;
    }

    logger.info(
      "Component added to technical inventory for REPAIR",
      "createComponenteInventarioTecnicoReparacion",
      {
        codigoCarga: carga.codigo_carga,
        componente: producto.producto,
        tipo: tipoComponente,
        cantidad: producto.cantidad,
        estado: "En reparación",
      }
    );

    return componente;
  } catch (error) {
    logger.error(
      "Error creating repair component in technical inventory",
      "createComponenteInventarioTecnicoReparacion",
      { error }
    );
    throw error;
  }
}

/**
 * Create component in technical inventory from subitem
 */
export async function createComponenteInventarioTecnicoFromSubitem(
  subitem: any,
  producto: any,
  carga: any
) {
  try {
    logger.info(
      "Processing subitem for technical inventory",
      "createComponenteInventarioTecnicoFromSubitem",
      {
        subitem: subitem.nombre,
      }
    );

    // Determine component type based on subitem name
    const tipoComponente = determinarTipoComponente(subitem.nombre);

    const { data: componente, error: componenteError } = await supabase
      .from("componentes_disponibles")
      .insert({
        producto_carga_id: producto.id, // Relate to parent product
        nombre: subitem.nombre,
        marca: producto.marca, // Use parent product brand
        modelo: subitem.nombre, // Model is the subitem name
        numero_serie: subitem.numeroSerie || "", // Subitem serial number
        tipo_componente: tipoComponente,
        cantidad_disponible: subitem.cantidad,
        cantidad_original: subitem.cantidad,
        ubicacion_fisica: "Almacén Servicio Técnico",
        estado: "Disponible",
        observaciones: `Subitem de ${producto.producto}. Ingresado desde mercaderías. Código: ${carga.codigo_carga}.`,
        codigo_carga_origen: carga.codigo_carga,
      })
      .select()
      .single();

    if (componenteError) {
      logger.error(
        "Error creating subitem in technical inventory",
        "createComponenteInventarioTecnicoFromSubitem",
        { error: componenteError }
      );
      throw componenteError;
    }

    logger.info(
      "Subitem added to technical inventory",
      "createComponenteInventarioTecnicoFromSubitem",
      {
        codigoCarga: carga.codigo_carga,
        subitem: subitem.nombre,
        productoPadre: producto.producto,
        tipo: tipoComponente,
        cantidad: subitem.cantidad,
        numeroSerie: subitem.numeroSerie || "Sin número de serie",
      }
    );

    return componente;
  } catch (error) {
    logger.error(
      "Error creating subitem in technical inventory",
      "createComponenteInventarioTecnicoFromSubitem",
      { error }
    );
    throw error;
  }
}

// ===============================================
// UTILITY FUNCTIONS
// ===============================================

/**
 * Determine component type based on product name
 */
function determinarTipoComponente(nombreProducto: string): string {
  const nombre = nombreProducto.toLowerCase();

  if (nombre.includes("pieza de mano") || nombre.includes("handpiece")) {
    return "Pieza de mano";
  }
  if (nombre.includes("cartucho") || nombre.includes("cartridge")) {
    return "Cartucho";
  }
  if (nombre.includes("transductor") || nombre.includes("transducer")) {
    return "Transductor";
  }
  if (
    nombre.includes("cable") &&
    (nombre.includes("especializado") || nombre.includes("técnico"))
  ) {
    return "Cable especializado";
  }
  if (nombre.includes("sensor")) {
    return "Sensor";
  }
  if (nombre.includes("aplicador")) {
    return "Aplicador";
  }
  if (nombre.includes("punta") || nombre.includes("tip")) {
    return "Punta/Tip";
  }

  // Default
  return "Componente técnico";
}

// ===============================================
// CLIENT-SPECIFIC EQUIPMENT QUERIES
// ===============================================

/**
 * Get all equipment assigned to a specific client
 * @param clienteNombre - Name of the client/clinic
 * @returns Promise<Equipo[]> - Array of equipment for the client
 */
export async function getEquiposByCliente(
  clienteNombre: string
): Promise<Equipo[]> {
  try {
    logger.info("Fetching equipment by client", "getEquiposByCliente", {
      clienteNombre,
    });

    // Validate input
    if (!clienteNombre || clienteNombre.trim() === "") {
      throw new Error("Client name is required");
    }

    const { data, error } = await supabase
      .from("equipos")
      .select(
        `
        *,
        componentes_equipo (
          id,
          nombre,
          numero_serie,
          estado,
          observaciones,
          created_at
        )
      `
      )
      .eq("cliente", clienteNombre.trim())
      .order("created_at", { ascending: false });

    if (error) {
      logger.error(
        "Error fetching equipment by client",
        "getEquiposByCliente",
        {
          error: error.message,
          clienteNombre,
        }
      );
      throw error;
    }

    const equipos = data || [];

    logger.info(
      "Equipment fetched successfully by client",
      "getEquiposByCliente",
      {
        clienteNombre,
        equiposCount: equipos.length,
        equiposIds: equipos.map((e) => e.id),
      }
    );

    return equipos;
  } catch (error) {
    logger.error("Failed to fetch equipment by client", "getEquiposByCliente", {
      error: error.message,
      clienteNombre,
    });
    throw error;
  }
}

/**
 * Get equipment statistics for a specific client
 * @param clienteNombre - Name of the client/clinic
 * @returns Promise<EquipoClienteStats> - Statistics object
 */
export async function getEstadisticasEquiposByCliente(
  clienteNombre: string
): Promise<EquipoClienteStats> {
  try {
    logger.info(
      "Calculating equipment statistics by client",
      "getEstadisticasEquiposByCliente",
      { clienteNombre }
    );

    // Get all equipment for the client
    const equipos = await getEquiposByCliente(clienteNombre);

    // Calculate statistics
    const estadisticas: EquipoClienteStats = {
      clienteNombre,
      totalEquipos: equipos.length,
      equiposPorEstado: {
        operativo: equipos.filter((e) => e.estado === "Operativo").length,
        enMantenimiento: equipos.filter((e) => e.estado === "En Mantenimiento")
          .length,
        fueraDeServicio: equipos.filter((e) => e.estado === "Fuera de Servicio")
          .length,
        enReparacion: equipos.filter((e) => e.estado === "En Reparación")
          .length,
      },
      tiposEquipos: [...new Set(equipos.map((e) => e.tipoEquipo))].filter(
        Boolean
      ),
      marcas: [...new Set(equipos.map((e) => e.marca))].filter(Boolean),
      ubicaciones: [...new Set(equipos.map((e) => e.ubicacion))].filter(
        Boolean
      ),
      ultimoEquipoInstalado:
        equipos.length > 0
          ? {
              id: equipos[0].id,
              nombre: equipos[0].nombreEquipo,
              fechaEntrega: equipos[0].fechaEntrega,
              fechaCreacion: equipos[0].createdAt,
            }
          : null,
      totalComponentes: equipos.reduce((total, equipo) => {
        return total + (equipo.componentes_equipo?.length || 0);
      }, 0),
      equiposConComponentes: equipos.filter(
        (e) => e.componentes_equipo && e.componentes_equipo.length > 0
      ).length,
      fechaConsulta: new Date().toISOString(),
    };

    logger.info(
      "Equipment statistics calculated successfully",
      "getEstadisticasEquiposByCliente",
      {
        clienteNombre,
        totalEquipos: estadisticas.totalEquipos,
        operativos: estadisticas.equiposPorEstado.operativo,
      }
    );

    return estadisticas;
  } catch (error) {
    logger.error(
      "Failed to calculate equipment statistics by client",
      "getEstadisticasEquiposByCliente",
      {
        error: error.message,
        clienteNombre,
      }
    );
    throw error;
  }
}

/**
 * Get equipment summary for multiple clients
 * @param clientesNombres - Array of client names
 * @returns Promise<ClienteEquipoSummary[]> - Array of client summaries
 */
export async function getResumenEquiposMultiplesClientes(
  clientesNombres: string[]
): Promise<ClienteEquipoSummary[]> {
  try {
    logger.info(
      "Fetching equipment summary for multiple clients",
      "getResumenEquiposMultiplesClientes",
      {
        clientesCount: clientesNombres.length,
      }
    );

    // Validate input
    if (!Array.isArray(clientesNombres) || clientesNombres.length === 0) {
      return [];
    }

    const summaries = await Promise.all(
      clientesNombres.map(async (clienteNombre) => {
        try {
          const estadisticas = await getEstadisticasEquiposByCliente(
            clienteNombre
          );

          const summary: ClienteEquipoSummary = {
            clienteNombre,
            totalEquipos: estadisticas.totalEquipos,
            equiposOperativos: estadisticas.equiposPorEstado.operativo,
            equiposEnMantenimiento:
              estadisticas.equiposPorEstado.enMantenimiento,
            equiposFueraServicio: estadisticas.equiposPorEstado.fueraDeServicio,
            tiposEquiposCount: estadisticas.tiposEquipos.length,
            ultimaInstalacion:
              estadisticas.ultimoEquipoInstalado?.fechaEntrega || null,
          };

          return summary;
        } catch (error) {
          logger.warn(
            "Failed to get summary for client",
            "getResumenEquiposMultiplesClientes",
            {
              clienteNombre,
              error: error.message,
            }
          );

          // Return empty summary for failed clients
          return {
            clienteNombre,
            totalEquipos: 0,
            equiposOperativos: 0,
            equiposEnMantenimiento: 0,
            equiposFueraServicio: 0,
            tiposEquiposCount: 0,
            ultimaInstalacion: null,
          };
        }
      })
    );

    logger.info(
      "Equipment summaries calculated successfully",
      "getResumenEquiposMultiplesClientes",
      {
        clientesProcessed: summaries.length,
        totalEquiposAllClients: summaries.reduce(
          (sum, s) => sum + s.totalEquipos,
          0
        ),
      }
    );

    return summaries;
  } catch (error) {
    logger.error(
      "Failed to fetch equipment summaries for multiple clients",
      "getResumenEquiposMultiplesClientes",
      {
        error: error.message,
      }
    );
    throw error;
  }
}

// Export the module interface implementation
export const EquiposModule: EquiposModuleInterface = {
  createEquipo,
  createEquipoFromMercaderia,
  getAllEquipos,
  deleteEquipo,
  getAllComponentesDisponibles,
  asignarComponenteAEquipo,
  getHistorialAsignaciones,
  updateComponente,
  createComponenteInventarioTecnico,
  createComponenteInventarioTecnicoReparacion,
  createComponenteInventarioTecnicoFromSubitem,
  // New client-specific functions
  getEquiposByCliente,
  getEstadisticasEquiposByCliente,
  getResumenEquiposMultiplesClientes,
};
