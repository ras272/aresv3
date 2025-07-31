import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Equipo,
  Mantenimiento,
  ComponenteEquipo,
  CargaMercaderia,
  ProductoCarga,
  ComponenteDisponible,
  AsignacionComponente,
  PlanMantenimiento,
  Tecnico,
  AppState,
  PermisosRol,
  Usuario,
} from "@/types";
import { EquipoFormData, CargaMercaderiaFormData } from "@/lib/schemas";
import {
  createCargaMercaderia,
  getAllCargas,
  generateCodigoCarga as dbGenerateCodigoCarga,
  getAllEquipos,
  createEquipo,
  createMantenimiento,
  getAllMantenimientos,
  getEstadisticasDashboard,
  updateComponente as dbUpdateComponente,
  updateMantenimiento as dbUpdateMantenimiento,
  deleteMantenimiento as dbDeleteMantenimiento,
  deleteCargaMercaderia,
  deleteEquipo,
  getAllComponentesDisponibles,
  getAllStockItems,
  asignarComponenteAEquipo,
  getHistorialAsignaciones as dbGetHistorialAsignaciones,
  getAllClinicas,
  createClinica,
  updateClinica,
  deleteClinica,
  getAllRemisiones,
  createRemision,
  updateRemision,
  deleteRemision,
  generateNumeroRemision,
  getAllTransaccionesStock,
  createTransaccionStock,
  createDocumentoCarga,
  getAllDocumentosCarga,
  getDocumentosByCarga,
  deleteDocumentoCarga as dbDeleteDocumentoCarga,
  getAllMovimientosStock,
  getMovimientosByProducto,
  getMovimientosByCarpeta,
  getEstadisticasTrazabilidad,
  registrarSalidaStock,
  registrarSalidaStockReporte,
  devolverRepuestosAlStockReporte,
  type MovimientoStock,
} from "@/lib/database";
import { procesarProductoParaStock } from "@/lib/stock-flow";
import { supabase } from "@/lib/supabase";

// Sistema inicializado vacío - Los datos se cargan desde Supabase
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      return {
        // Hydration state
        isHydrated: false,
        isDataLoaded: false, // 🎯 Flag para evitar cargas múltiples
        equipos: [],
        mantenimientos: [],
        cargasMercaderia: [],
        documentosCarga: [],
        componentesDisponibles: [],
        stockItems: [], // 🎯 NUEVO: Campo separado para stock general
        movimientosStock: [], // 🎯 NUEVO: Para trazabilidad completa
        historialAsignaciones: [],
        remisiones: [],
        clinicas: [],
        transaccionesStock: [],

        // 🆕 NUEVOS ARRAYS PARA CALENDARIO
        planesMantenimiento: [],
        tecnicos: [],

        // ===============================================
        // FUNCIONES DE CARGA DE DATOS
        // ===============================================
        loadAllData: async () => {
          const { isDataLoaded } = get();

          // 🎯 Evitar cargas múltiples
          if (isDataLoaded) {
            console.log("⚠️ Datos ya cargados, saltando carga...");
            return;
          }

          try {
            console.log("🔄 Cargando todos los datos desde Supabase...");
            set({ isDataLoaded: true }); // Marcar como cargado inmediatamente

            // Intentar cargar datos reales, si falla usar datos de prueba
            let equipos = [];
            let mantenimientos = [];

            try {
              // 🔧 Cargar equipos y mantenimientos primero para debug
              console.log("🔄 Cargando equipos desde la base de datos...");
              const equiposDB = await getAllEquipos();
              console.log("✅ Equipos cargados:", equiposDB.length, equiposDB);

              const mantenimientosDB = await getAllMantenimientos();
              console.log(
                "✅ Mantenimientos cargados:",
                mantenimientosDB.length
              );

              equipos = equiposDB;
              mantenimientos = mantenimientosDB;

              // Cargar el resto de datos
              const [
                cargas,
                componentes,
                historial,
                clinicas,
                remisiones,
                transacciones,
                documentos,
                stockItems,
                movimientos,
              ] = await Promise.all([
                getAllCargas(),
                getAllComponentesDisponibles(),
                dbGetHistorialAsignaciones(),
                getAllClinicas(),
                getAllRemisiones(),
                getAllTransaccionesStock(),
                getAllDocumentosCarga(),
                getAllStockItems(),
                getAllMovimientosStock(),
              ]);

              set({
                cargasMercaderia: cargas,
                equipos: equipos,
                mantenimientos: mantenimientos,
                componentesDisponibles: componentes,
                historialAsignaciones: historial,
                clinicas: clinicas,
                remisiones: remisiones,
                transaccionesStock: transacciones,
                documentosCarga: documentos,
                stockItems: stockItems,
                movimientosStock: movimientos,
              });
            } catch (dbError) {
              console.warn(
                "⚠️ Error cargando desde DB, usando datos de prueba:",
                dbError
              );

              // 🎯 DATOS DE PRUEBA PARA DESARROLLO
              // 🚫 EQUIPOS DE DEMO ELIMINADOS - Solo cargar desde base de datos
              const equiposReales = await getAllEquipos();
              const mantenimientosReales = await getAllMantenimientos();

              set({
                equipos: equiposReales,
                mantenimientos: mantenimientosReales,
                cargasMercaderia: [],
                componentesDisponibles: [],
                historialAsignaciones: [],
                clinicas: [],
                remisiones: [],
                transaccionesStock: [],
                documentosCarga: [],
                stockItems: [],
                movimientosStock: [],
              });
            }

            console.log("✅ Datos cargados Existosamente:", {
              equipos: equipos.length,
              mantenimientos: mantenimientos.length,
            });
          } catch (error) {
            console.error("❌ Error loading data:", error);
          }
        },

        // ===============================================
        // FUNCIONES DE STOCK GENERAL
        // ===============================================
        loadStock: async () => {
          try {
            console.log("🔄 Cargando stock general desde Supabase...");
            const stockItems = await getAllStockItems();
            set({
              stockItems: stockItems,
            });
            console.log("✅ Stock general cargado exitosamente:", {
              items: stockItems.length,
            });
          } catch (error) {
            console.error("❌ Error loading stock:", error);
          }
        },

        updateStockItem: async (
          itemId: string,
          nuevaCantidad: number,
          motivo: string
        ) => {
          try {
            const { error } = await supabase
              .from("componentes_disponibles")
              .update({
                cantidad_disponible: nuevaCantidad,
                updated_at: new Date().toISOString(),
              })
              .eq("id", itemId);

            if (error) throw error;

            // Recargar datos
            await get().loadStock();
            console.log("✅ Stock item actualizado exitosamente");
          } catch (error) {
            console.error("❌ Error updating stock item:", error);
            throw error;
          }
        },

        updateStockItemDetails: async (
          productId: string,
          updates: { imagen?: string; observaciones?: string }
        ) => {
          try {
            const { updateStockItemDetails } = await import("@/lib/database");

            // Actualizar solo en componentes_disponibles (donde están los datos reales)
            await updateStockItemDetails(productId, updates);

            // Recargar datos
            await Promise.all([
              get().loadStock(),
              get().loadInventarioTecnico(),
            ]);

            console.log("✅ Detalles del producto actualizados exitosamente");
          } catch (error) {
            console.error("❌ Error updating product details:", error);
            throw error;
          }
        },

        createStockItemManual: async (itemData: {
          nombre: string;
          marca: string;
          modelo?: string;
          tipoComponente: "Insumo" | "Repuesto" | "Equipo Médico" | "Accesorio";
          numeroSerie?: string;
          cantidad: number;
          cantidadMinima: number;
          ubicacionFisica?: string;
          observaciones?: string;
          imagen?: string;
        }) => {
          try {
            console.log("🔄 Creando item de stock manual...", itemData);

            // Determinar ubicación física automáticamente si no se proporciona
            let ubicacionFinal = itemData.ubicacionFisica;
            if (!ubicacionFinal) {
              // Usar la misma lógica que el sistema automático
              const { determinarUbicacionPorMarca } = await import(
                "@/lib/stock-flow"
              );
              ubicacionFinal = determinarUbicacionPorMarca(
                itemData.marca,
                "stock"
              );
            }

            // Generar código único para el item
            const codigoItem = `MANUAL-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`;

            // Crear el item en la base de datos
            const { data: nuevoItem, error } = await supabase
              .from("stock_items")
              .insert({
                codigo_item: codigoItem,
                nombre: itemData.nombre,
                marca: itemData.marca,
                modelo: itemData.modelo || "",
                numero_serie: itemData.numeroSerie || null,
                cantidad_actual: itemData.cantidad,
                cantidad_minima: itemData.cantidadMinima,
                estado: "Disponible",
                observaciones: itemData.observaciones || null,
                codigo_carga_origen: codigoItem,
                fecha_ingreso: new Date().toISOString().split("T")[0],
              })
              .select()
              .single();

            if (error) throw error;

            // Registrar movimiento para trazabilidad
            await supabase.from("movimientos_stock").insert({
              item_id: nuevoItem.id,
              producto_nombre: itemData.nombre,
              producto_marca: itemData.marca,
              producto_modelo: itemData.modelo || null,
              tipo_movimiento: "Entrada",
              cantidad: itemData.cantidad,
              cantidad_anterior: 0,
              cantidad_nueva: itemData.cantidad,
              motivo: "Creación manual",
              responsable: "Sistema",
              carpeta_destino: itemData.marca,
              ubicacion_destino: ubicacionFinal,
              observaciones: `Item creado manualmente: ${
                itemData.observaciones || ""
              }`,
            });

            // Recargar datos
            await Promise.all([
              get().loadStock(),
              get().loadMovimientosStock(),
            ]);

            console.log(
              "✅ Item de stock manual creado exitosamente:",
              nuevoItem
            );
            return nuevoItem;
          } catch (error) {
            console.error("❌ Error creating manual stock item:", error);
            throw error;
          }
        },

        getEstadisticasStockGeneral: () => {
          const { stockItems } = get();

          const totalProductos = stockItems.length;
          const productosConStockBajo = stockItems.filter(
            (item) =>
              item.cantidadDisponible <= 5 && item.cantidadDisponible > 0
          ).length;

          return {
            totalProductos,
            productosConStockBajo,
            entradasMes: 0,
            salidasMes: 0,
          };
        },

        // ===============================================
        // FUNCIONES DE TRAZABILIDAD Y MOVIMIENTOS
        // ===============================================
        loadMovimientosStock: async () => {
          try {
            console.log("🔄 Cargando movimientos de stock desde Supabase...");
            const movimientos = await getAllMovimientosStock();
            set({ movimientosStock: movimientos });
            console.log(
              "✅ Movimientos de stock cargados exitosamente:",
              movimientos.length
            );
          } catch (error) {
            console.error("❌ Error loading movimientos stock:", error);
          }
        },

        getMovimientosByProducto: async (
          productoNombre: string,
          productoMarca?: string
        ) => {
          try {
            return await getMovimientosByProducto(
              productoNombre,
              productoMarca
            );
          } catch (error) {
            console.error("❌ Error getting movimientos by producto:", error);
            return [];
          }
        },

        getMovimientosByCarpeta: async (carpeta: string) => {
          try {
            return await getMovimientosByCarpeta(carpeta);
          } catch (error) {
            console.error("❌ Error getting movimientos by carpeta:", error);
            return [];
          }
        },

        getEstadisticasTrazabilidad: async () => {
          try {
            return await getEstadisticasTrazabilidad();
          } catch (error) {
            console.error("❌ Error getting estadísticas trazabilidad:", error);
            return {
              totalMovimientos: 0,
              movimientosHoy: 0,
              movimientosMes: 0,
              entradas: { total: 0, mes: 0, valorTotal: 0 },
              salidas: { total: 0, mes: 0, valorTotal: 0 },
              ajustes: { total: 0, mes: 0 },
              productosConMasMovimientos: [],
              carpetasConMasActividad: [],
            };
          }
        },

        registrarSalidaStock: async (salidaData: {
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
        }) => {
          try {
            await registrarSalidaStock(salidaData);

            // Recargar datos
            await Promise.all([
              get().loadStock(),
              get().loadMovimientosStock(),
            ]);

            console.log("✅ Salida de stock registrada exitosamente");
          } catch (error) {
            console.error("❌ Error registrando salida stock:", error);
            throw error;
          }
        },

        // 🎯 NUEVAS FUNCIONES HÍBRIDAS PARA REPORTES DE SERVICIO TÉCNICO
        registrarSalidaStockReporte: async (salidaData: {
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
        }) => {
          try {
            // 👤 Obtener usuario actual para tracking
            const currentUser =
              typeof window !== "undefined"
                ? JSON.parse(
                    localStorage.getItem("ares_current_user") || "null"
                  )
                : null;

            const salidaDataConUsuario = {
              ...salidaData,
              tecnicoResponsable:
                salidaData.tecnicoResponsable || currentUser?.name || "Sistema",
            };

            await registrarSalidaStockReporte(salidaDataConUsuario);

            // Recargar datos para mantener consistencia
            await Promise.all([
              get().loadInventarioTecnico(),
              get().loadMovimientosStock(),
            ]);

            console.log(
              "✅ Salida de stock para reporte registrada exitosamente por:",
              currentUser?.name
            );
          } catch (error) {
            console.error(
              "❌ Error registrando salida stock para reporte:",
              error
            );
            throw error;
          }
        },

        devolverRepuestosAlStockReporte: async (devolucionData: {
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
        }) => {
          try {
            await devolverRepuestosAlStockReporte(devolucionData);

            // Recargar datos para mantener consistencia
            await Promise.all([
              get().loadInventarioTecnico(),
              get().loadMovimientosStock(),
            ]);

            console.log("✅ Devolución de repuestos registrada exitosamente");
          } catch (error) {
            console.error("❌ Error devolviendo repuestos al stock:", error);
            throw error;
          }
        },

        getEstadisticasPorCarpeta: (carpeta: string) => {
          const { movimientosStock } = get();

          const movimientosCarpeta = movimientosStock.filter(
            (mov) =>
              mov.carpetaOrigen === carpeta || mov.carpetaDestino === carpeta
          );

          const entradas = movimientosCarpeta.filter(
            (mov) => mov.tipoMovimiento === "Entrada"
          );
          const salidas = movimientosCarpeta.filter(
            (mov) => mov.tipoMovimiento === "Salida"
          );

          return {
            totalMovimientos: movimientosCarpeta.length,
            entradas: {
              total: entradas.length,
              cantidad: entradas.reduce((sum, mov) => sum + mov.cantidad, 0),
              valorTotal: entradas.reduce(
                (sum, mov) => sum + (mov.valorTotal || 0),
                0
              ),
            },
            salidas: {
              total: salidas.length,
              cantidad: salidas.reduce((sum, mov) => sum + mov.cantidad, 0),
              valorTotal: salidas.reduce(
                (sum, mov) => sum + (mov.valorTotal || 0),
                0
              ),
            },
            productosUnicos: [
              ...new Set(movimientosCarpeta.map((mov) => mov.productoNombre)),
            ].length,
            ultimoMovimiento: movimientosCarpeta[0]?.fechaMovimiento || null,
          };
        },

        // ===============================================
        // FUNCIONES BÁSICAS (SIMPLIFICADAS)
        // ===============================================
        addEquipo: async (equipoData: any) => {
          try {
            console.log("🔄 Agregando equipo manual...", equipoData);
            const equipoCreado = await createEquipo(equipoData);
            const equipos = await getAllEquipos();
            set({ equipos });
            console.log("✅ Equipo agregado exitosamente y lista actualizada");
            return equipoCreado;
          } catch (error) {
            console.error("❌ Error adding equipo:", error);
            throw error;
          }
        },

        addCargaMercaderia: async (cargaData: CargaMercaderiaFormData) => {
          try {
            const nuevaCarga = await createCargaMercaderia(cargaData);
            const cargas = await getAllCargas();
            set({ cargasMercaderia: cargas });
            return nuevaCarga;
          } catch (error) {
            console.error("Error adding carga mercadería:", error);
            throw error;
          }
        },

        getCargasMercaderia: () => {
          const { cargasMercaderia } = get();
          return cargasMercaderia.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        },

        generateCodigoCarga: async () => {
          try {
            return await dbGenerateCodigoCarga();
          } catch (error) {
            console.error("Error generating codigo carga:", error);
            const timestamp = Date.now();
            const random = String(Math.floor(timestamp % 999) + 1).padStart(
              3,
              "0"
            );
            return `ENTRADA-FALLBACK-${random}`;
          }
        },

        deleteCarga: async (cargaId: string) => {
          try {
            await deleteCargaMercaderia(cargaId);
            const cargas = await getAllCargas();
            set({ cargasMercaderia: cargas });
            console.log("✅ Carga eliminada exitosamente");
          } catch (error) {
            console.error("❌ Error deleting carga:", error);
            throw error;
          }
        },

        deleteEquipo: async (equipoId: string) => {
          try {
            await deleteEquipo(equipoId);
            const equipos = await getAllEquipos();
            set({ equipos });
            console.log("✅ Equipo eliminado exitosamente");
          } catch (error) {
            console.error("❌ Error deleting equipo:", error);
            throw error;
          }
        },

        getEstadisticas: async () => {
          try {
            return await getEstadisticasDashboard();
          } catch (error) {
            console.error("Error getting estadísticas:", error);
            const { cargasMercaderia } = get();
            const totalCargas = cargasMercaderia.length;
            const cargasHoy = cargasMercaderia.filter(
              (carga) =>
                carga.fechaIngreso === new Date().toISOString().split("T")[0]
            ).length;
            const totalProductos = cargasMercaderia.reduce(
              (acc, carga) => acc + carga.productos.length,
              0
            );
            const equiposMedicos = cargasMercaderia.reduce((acc, carga) => {
              return (
                acc +
                carga.productos.filter(
                  (producto) => producto.tipoProducto === "Equipo Médico"
                ).length
              );
            }, 0);
            return {
              totalCargas,
              cargasHoy,
              totalProductos,
              equiposMedicos,
            };
          }
        },

        // ===============================================
        // FUNCIONES DE INVENTARIO TÉCNICO
        // ===============================================
        loadInventarioTecnico: async () => {
          try {
            console.log("🔄 Cargando inventario técnico desde Supabase...");
            const [componentes, historial] = await Promise.all([
              getAllComponentesDisponibles(),
              dbGetHistorialAsignaciones(),
            ]);
            set({
              componentesDisponibles: componentes,
              historialAsignaciones: historial,
            });
            console.log("✅ Inventario técnico cargado exitosamente:", {
              componentes: componentes.length,
              asignaciones: historial.length,
            });
          } catch (error) {
            console.error("❌ Error loading inventario técnico:", error);
          }
        },

        asignarComponente: async (
          componenteId: string,
          equipoId: string,
          cantidadAsignada: number,
          motivo: string,
          tecnicoResponsable?: string,
          observaciones?: string
        ) => {
          try {
            await asignarComponenteAEquipo(
              componenteId,
              equipoId,
              cantidadAsignada,
              motivo,
              tecnicoResponsable,
              observaciones
            );
            const [componentes, historial, equipos] = await Promise.all([
              getAllComponentesDisponibles(),
              dbGetHistorialAsignaciones(),
              getAllEquipos(),
            ]);
            set({
              componentesDisponibles: componentes,
              historialAsignaciones: historial,
              equipos: equipos,
            });
            console.log("✅ Componente asignado exitosamente");
          } catch (error) {
            console.error("❌ Error asignando componente:", error);
            throw error;
          }
        },

        getComponentesDisponibles: () => {
          const { componentesDisponibles } = get();
          return componentesDisponibles.filter(
            (comp) =>
              comp.estado === "Disponible" && comp.cantidadDisponible > 0
          );
        },

        getHistorialAsignaciones: (
          componenteId?: string,
          equipoId?: string
        ) => {
          const { historialAsignaciones } = get();
          if (componenteId && equipoId) {
            return historialAsignaciones.filter(
              (asig) =>
                asig.componenteId === componenteId && asig.equipoId === equipoId
            );
          } else if (componenteId) {
            return historialAsignaciones.filter(
              (asig) => asig.componenteId === componenteId
            );
          } else if (equipoId) {
            return historialAsignaciones.filter(
              (asig) => asig.equipoId === equipoId
            );
          }
          return historialAsignaciones;
        },

        // ===============================================
        // HYDRATION FUNCTIONS
        // ===============================================
        setHydrated: () => {
          set({ isHydrated: true });
        },

        // ===============================================
        // FUNCIONES DE AUTENTICACIÓN
        // ===============================================
        usuarios: [],
        sesionActual: null,

        loadUsuarios: async () => {
          try {
            console.log("🔄 Cargando usuarios desde Supabase...");
            const { data, error } = await supabase
              .from("sistema_usuarios")
              .select("*")
              .eq("activo", true)
              .order("created_at", { ascending: false });

            if (error) throw error;

            const usuarios = data.map((user) => ({
              id: user.id,
              nombre: user.nombre,
              email: user.email,
              rol: user.rol as Usuario["rol"],
              activo: user.activo,
              ultimoAcceso: user.ultimo_acceso,
              createdAt: user.created_at,
              updatedAt: user.updated_at,
            }));

            set({ usuarios });
            console.log("✅ Usuarios cargados exitosamente:", usuarios.length);
          } catch (error) {
            console.error("❌ Error loading usuarios:", error);
          }
        },

        login: async (email: string, password: string) => {
          try {
            console.log("🔄 Intentando login...", { email });

            // Buscar usuario en la base de datos
            const { data, error } = await supabase
              .from("sistema_usuarios")
              .select("*")
              .eq("email", email)
              .eq("activo", true)
              .single();

            if (error || !data) {
              throw new Error("Usuario no encontrado o inactivo");
            }

            // En un sistema real, aquí verificarías el password hash
            // Por ahora, aceptamos cualquier password para la demo

            const usuario: Usuario = {
              id: data.id,
              nombre: data.nombre,
              email: data.email,
              rol: data.rol as Usuario["rol"],
              activo: data.activo,
              ultimoAcceso: data.ultimo_acceso,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
            };

            // Actualizar último acceso
            await supabase
              .from("sistema_usuarios")
              .update({ ultimo_acceso: new Date().toISOString() })
              .eq("id", data.id);

            // Crear sesión
            const sesion: SesionUsuario = {
              usuario: usuario,
              token: `token-${Date.now()}`,
              fechaInicio: new Date().toISOString(),
              activa: true,
            };

            set({ sesionActual: sesion });
            console.log(
              "✅ Login exitoso:",
              usuario.nombre,
              "Rol:",
              usuario.rol
            );

            return sesion;
          } catch (error) {
            console.error("❌ Error en login:", error);
            throw error;
          }
        },

        logout: () => {
          set({ sesionActual: null });
          console.log("✅ Logout exitoso");
        },

        getCurrentUser: () => {
          const { sesionActual } = get();
          return sesionActual?.usuario || null;
        },

        getUserPermissions: (rol: Usuario["rol"]) => {
          // Definición de permisos por rol según los requerimientos
          const permisos: Record<Usuario["rol"], PermisosRol> = {
            super_admin: {
              // Super Admin: Acceso completo a todo
              dashboard: { leer: true, escribir: true },
              equipos: { leer: true, escribir: true },
              inventarioTecnico: { leer: true, escribir: true },
              calendario: { leer: true, escribir: true },
              mercaderias: { leer: true, escribir: true },
              documentos: { leer: true, escribir: true },
              remisiones: { leer: true, escribir: true },
              facturacion: { leer: true, escribir: true },
              archivos: { leer: true, escribir: true },
              tareas: { leer: true, escribir: true },
              clinicas: { leer: true, escribir: true },
              stock: { leer: true, escribir: true },
              reportes: { leer: true, escribir: true },
              configuracion: { leer: true, escribir: true },
            },
            contabilidad: {
              // Contabilidad: Facturación, archivos, gestión documental, clínicas, tareas
              dashboard: { leer: true, escribir: false },
              equipos: { leer: false, escribir: false },
              inventarioTecnico: { leer: false, escribir: false },
              calendario: { leer: false, escribir: false },
              mercaderias: { leer: false, escribir: false },
              documentos: { leer: true, escribir: true },
              remisiones: { leer: false, escribir: false },
              facturacion: { leer: true, escribir: true },
              archivos: { leer: true, escribir: true },
              tareas: { leer: true, escribir: true },
              clinicas: { leer: true, escribir: true },
              stock: { leer: false, escribir: false },
              reportes: { leer: true, escribir: false },
              configuracion: { leer: false, escribir: false },
            },
            tecnico: {
              // Técnico: Dashboard (solo lectura), equipos (solo lectura), inventario técnico (solo lectura), calendario
              dashboard: { leer: true, escribir: false },
              equipos: { leer: true, escribir: false },
              inventarioTecnico: { leer: true, escribir: false },
              calendario: { leer: true, escribir: true },
              mercaderias: { leer: false, escribir: false },
              documentos: { leer: false, escribir: false },
              remisiones: { leer: false, escribir: false },
              facturacion: { leer: false, escribir: false },
              archivos: { leer: false, escribir: false },
              tareas: { leer: false, escribir: false },
              clinicas: { leer: false, escribir: false },
              stock: { leer: false, escribir: false },
              reportes: { leer: false, escribir: false },
              configuracion: { leer: false, escribir: false },
            },
          };

          return permisos[rol] || permisos.tecnico;
        },

        hasPermission: (modulo: keyof PermisosRol) => {
          const usuario = get().getCurrentUser();
          if (!usuario) return false;

          const permisos = get().getUserPermissions(usuario.rol);
          return permisos[modulo]?.leer || false;
        },

        hasWritePermission: (modulo: keyof PermisosRol) => {
          const usuario = get().getCurrentUser();
          if (!usuario) return false;

          const permisos = get().getUserPermissions(usuario.rol);
          return permisos[modulo]?.escribir || false;
        },

        // ===============================================
        // FUNCIONES BÁSICAS REQUERIDAS POR LOS TIPOS
        // ===============================================
        addMantenimiento: async (mantenimientoData: any) => {
          try {
            const nuevoMantenimiento = await createMantenimiento(
              mantenimientoData
            );
            set((state) => ({
              mantenimientos: [...state.mantenimientos, nuevoMantenimiento],
            }));
            return nuevoMantenimiento;
          } catch (error) {
            console.error("Error al crear mantenimiento:", error);
            throw error;
          }
        },
        updateMantenimiento: async (mantenimientoId: string, updates: any) => {
          try {
            await dbUpdateMantenimiento(mantenimientoId, updates);
            const mantenimientos = await getAllMantenimientos();
            set({ mantenimientos });
            console.log("✅ Mantenimiento actualizado exitosamente");
          } catch (error) {
            console.error("❌ Error updating mantenimiento:", error);
            throw error;
          }
        },

        deleteMantenimiento: async (mantenimientoId: string) => {
          try {
            await dbDeleteMantenimiento(mantenimientoId);
            const mantenimientos = await getAllMantenimientos();
            set({ mantenimientos });
            console.log("✅ Mantenimiento eliminado exitosamente");
          } catch (error) {
            console.error("❌ Error deleting mantenimiento:", error);
            throw error;
          }
        },

        updateComponente: async (
          equipoId: string,
          componenteId: string,
          updates: any
        ) => {
          try {
            // La función dbUpdateComponente solo necesita componenteId y updates
            await dbUpdateComponente(componenteId, updates);
            const equipos = await getAllEquipos();
            set({ equipos });
            console.log("✅ Componente actualizado exitosamente");
          } catch (error) {
            console.error("❌ Error updating componente:", error);
            throw error;
          }
        },

        getMantenimientosByEquipo: (equipoId: string) => {
          const { mantenimientos } = get();
          return mantenimientos.filter((m) => m.equipoId === equipoId);
        },

        searchEquipos: (searchTerm: string) => {
          const { equipos } = get();
          const term = searchTerm.toLowerCase();
          return equipos.filter(
            (equipo) =>
              equipo.nombreEquipo.toLowerCase().includes(term) ||
              equipo.cliente.toLowerCase().includes(term) ||
              equipo.ubicacion.toLowerCase().includes(term) ||
              equipo.marca.toLowerCase().includes(term) ||
              equipo.modelo.toLowerCase().includes(term) ||
              equipo.numeroSerieBase.toLowerCase().includes(term)
          );
        },
        loadTecnicos: async () => {},
        addTecnico: async () => {},
        updateTecnico: async () => {},
        getTecnicosDisponibles: () => [],
        loadPlanesMantenimiento: async () => {},
        addPlanMantenimiento: async () => {},
        addMantenimientoProgramado: async () => {},
        getMantenimientosProgramados: () => [],
        getMantenimientosByTecnico: () => [],
        getMantenimientosVencidos: () => [],
        loadClinicas: async () => {
          try {
            console.log("🔄 Cargando clínicas desde Supabase...");
            const clinicas = await getAllClinicas();
            set({ clinicas });
            console.log("✅ Clínicas cargadas exitosamente:", clinicas.length);
          } catch (error) {
            console.error("❌ Error loading clínicas:", error);
          }
        },
        addClinica: async (
          clinicaData: Omit<Clinica, "id" | "createdAt" | "updatedAt">
        ) => {
          try {
            const nuevaClinica = await createClinica(clinicaData);
            const clinicas = await getAllClinicas();
            set({ clinicas });
            console.log("✅ Clínica agregada exitosamente");
            return nuevaClinica;
          } catch (error) {
            console.error("❌ Error adding clínica:", error);
            throw error;
          }
        },
        updateClinica: async (id: string, updates: Partial<Clinica>) => {
          try {
            await updateClinica(id, updates);
            const clinicas = await getAllClinicas();
            set({ clinicas });
            console.log("✅ Clínica actualizada exitosamente");
          } catch (error) {
            console.error("❌ Error updating clínica:", error);
            throw error;
          }
        },
        deleteClinica: async (id: string) => {
          try {
            await deleteClinica(id);
            const clinicas = await getAllClinicas();
            set({ clinicas });
            console.log("✅ Clínica eliminada exitosamente");
          } catch (error) {
            console.error("❌ Error deleting clínica:", error);
            throw error;
          }
        },
        getClinicas: () => {
          const { clinicas } = get();
          return clinicas || [];
        },
        getClinicasActivas: () => {
          const { clinicas } = get();
          return (clinicas || []).filter((c) => c.activa);
        },
        loadTransaccionesStock: async () => {},
        addTransaccionStock: async () => {},
        getTransaccionesStock: () => [],
        getTransaccionesByComponente: () => [],
        getEstadisticasStock: () => ({
          totalProductos: 0,
          productosConStockBajo: 0,
          transaccionesHoy: 0,
          entradasMes: 0,
          salidasMes: 0,
          valorTotalStock: 0,
        }),
        procesarSalidaStock: async (
          itemId: string | null,
          stockItemId: string | null,
          cantidad: number,
          motivo: string,
          numeroRemision?: string,
          numeroFactura?: string,
          cliente?: string
        ) => {
          try {
            console.log("🔄 Procesando salida de stock...", {
              itemId,
              stockItemId,
              cantidad,
              motivo,
              numeroRemision,
              cliente,
            });

            // Determinar si es del inventario técnico o stock general
            if (itemId) {
              // Es del inventario técnico (componentes_disponibles)
              const componente = get().componentesDisponibles.find(
                (c) => c.id === itemId
              );
              if (componente) {
                await get().registrarSalidaStock({
                  itemId: itemId,
                  productoNombre: componente.nombre,
                  productoMarca: componente.marca,
                  productoModelo: componente.modelo,
                  cantidad: cantidad,
                  cantidadAnterior: componente.cantidadDisponible,
                  motivo: motivo,
                  destino: cliente || "Cliente",
                  responsable: "Sistema - Remisión",
                  cliente: cliente,
                  numeroFactura: numeroFactura,
                  observaciones: `Remisión: ${numeroRemision || "N/A"}`,
                  carpetaOrigen: componente.marca,
                });

                // Actualizar cantidad en componentes_disponibles
                const nuevaCantidad = Math.max(
                  0,
                  componente.cantidadDisponible - cantidad
                );
                await supabase
                  .from("componentes_disponibles")
                  .update({
                    cantidad_disponible: nuevaCantidad,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", itemId);
              }
            } else if (stockItemId) {
              // Es del stock general (stock_items)
              const stockItem = get().stockItems.find(
                (s) => s.id === stockItemId
              );
              if (stockItem) {
                await get().registrarSalidaStock({
                  itemId: stockItemId,
                  productoNombre: stockItem.nombre,
                  productoMarca: stockItem.marca,
                  productoModelo: stockItem.modelo,
                  cantidad: cantidad,
                  cantidadAnterior: stockItem.cantidadDisponible,
                  motivo: motivo,
                  destino: cliente || "Cliente",
                  responsable: "Sistema - Remisión",
                  cliente: cliente,
                  numeroFactura: numeroFactura,
                  observaciones: `Remisión: ${numeroRemision || "N/A"}`,
                  carpetaOrigen: stockItem.marca,
                });

                // Actualizar cantidad en stock_items
                const nuevaCantidad = Math.max(
                  0,
                  stockItem.cantidadDisponible - cantidad
                );
                await supabase
                  .from("stock_items")
                  .update({
                    cantidad_actual: nuevaCantidad,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", stockItemId);
              }
            }

            // Recargar inventarios
            await Promise.all([
              get().loadInventarioTecnico(),
              get().loadStock(),
              get().loadMovimientosStock(),
            ]);

            console.log("✅ Salida de stock procesada exitosamente");
          } catch (error) {
            console.error("❌ Error procesando salida stock:", error);
            throw error;
          }
        },
        loadRemisiones: async () => {
          try {
            console.log("🔄 Cargando remisiones desde Supabase...");
            const remisiones = await getAllRemisiones();
            set({ remisiones });
            console.log(
              "✅ Remisiones cargadas exitosamente:",
              remisiones.length
            );
          } catch (error) {
            console.error("❌ Error loading remisiones:", error);
          }
        },
        addRemision: async (remisionData: any) => {
          try {
            console.log("🔄 Creando nueva remisión...", remisionData);
            const nuevaRemision = await createRemision(remisionData);

            // Recargar la lista de remisiones después de crear
            const remisiones = await getAllRemisiones();
            set({ remisiones });

            console.log("✅ Remisión creada exitosamente:", nuevaRemision);
            return nuevaRemision;
          } catch (error) {
            console.error("❌ Error creating remisión:", error);
            throw error;
          }
        },
        updateRemision: async (id: string, updates: any) => {
          try {
            console.log("🔄 Actualizando remisión...", { id, updates });
            await updateRemision(id, updates);

            // Recargar la lista de remisiones después de actualizar
            const remisiones = await getAllRemisiones();
            set({ remisiones });

            console.log("✅ Remisión actualizada exitosamente");
          } catch (error) {
            console.error("❌ Error updating remisión:", error);
            throw error;
          }
        },
        deleteRemision: async (id: string) => {
          try {
            console.log("🔄 Eliminando remisión...", id);
            await deleteRemision(id);

            // Recargar la lista de remisiones después de eliminar
            const remisiones = await getAllRemisiones();
            set({ remisiones });

            console.log("✅ Remisión eliminada exitosamente");
          } catch (error) {
            console.error("❌ Error deleting remisión:", error);
            throw error;
          }
        },
        getRemisiones: () => {
          const { remisiones } = get();
          return remisiones.sort(
            (a, b) =>
              new Date(b.createdAt || b.fecha).getTime() -
              new Date(a.createdAt || a.fecha).getTime()
          );
        },
        getRemisionesByCliente: (cliente: string) => {
          const { remisiones } = get();
          return remisiones.filter((r) => r.cliente === cliente);
        },
        generateNumeroRemision: async () => {
          try {
            return await generateNumeroRemision();
          } catch (error) {
            console.error("❌ Error generating numero remision:", error);
            // Fallback: generar número local
            const timestamp = Date.now();
            const random = String(Math.floor(timestamp % 999) + 1).padStart(
              3,
              "0"
            );
            return `REM-${random}`;
          }
        },
        loadDocumentosCarga: async () => {},
        addDocumentoCarga: async () => {
          return {} as any;
        },
        deleteDocumentoCarga: async () => {},
        getDocumentosByCarga: () => [],
        getCargasConDocumentos: () => [],
      };
    },
    {
      name: "app-store",
      partialize: (state) => ({
        sesionActual: state.sesionActual,
        planesMantenimiento: state.planesMantenimiento,
        tecnicos: state.tecnicos,
      }),
    }
  )
);

export default useAppStore;
