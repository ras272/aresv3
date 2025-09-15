import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Equipo,
  Mantenimiento,
  ComponenteEquipo,
  CargaMercaderia,
  ProductoCarga,
  ProductoStock,
  PlanMantenimiento,
  Tecnico,
  AppState,
  PermisosRol,
  Usuario,
  SesionUsuario,
  Clinica,
  CatalogoProducto,
} from "@/types";
import { EquipoFormData, CargaMercaderiaFormData } from "@/lib/schemas";
// Imports específicos por módulo (mejores prácticas)
import {
  createCargaMercaderia,
  getAllCargas,
  generateCodigoCarga as dbGenerateCodigoCarga,
  deleteCargaMercaderia,
} from "@/lib/database/mercaderias";

import {
  getAllStockItems,
  getAllTransaccionesStock,
  createTransaccionStock,
  getAllMovimientosStock,
  getMovimientosByProducto,
  getMovimientosByCarpeta,
  getEstadisticasTrazabilidad,
  registrarSalidaStock,
  registrarSalidaStockReporte,
  devolverRepuestosAlStockReporte,
  type MovimientoStock,
} from "@/lib/database/stock";

import { NumberingService } from "@/lib/services/numbering-service";

import {
  getAllEquipos,
  createEquipo,
  deleteEquipo,
  updateComponente as dbUpdateComponente,
} from "@/lib/database/equipos";

import {
  createMantenimiento,
  getAllMantenimientos,
  updateMantenimiento as dbUpdateMantenimiento,
  deleteMantenimiento as dbDeleteMantenimiento,
} from "@/lib/database/mantenimientos";

import {
  getAllClinicas,
  createClinica,
  updateClinica,
  deleteClinica,
} from "@/lib/database/clinicas";

import {
  getAllRemisiones,
  createRemision,
  updateRemision,
  deleteRemision,
  deleteRemisionConRestauracion,
  generateNumeroRemision,
} from "@/lib/database/remisiones";

import { getEstadisticasDashboard } from "@/lib/database";
import {
  createDocumentoCarga,
  getAllDocumentosCarga,
  deleteDocumentoCarga,
  DocumentoCarga,
} from "@/lib/documentos-database";
import { procesarProductoParaStock } from "@/lib/stock-flow";
import { supabase } from "@/lib/database/shared/supabase";

// Sistema inicializado vacío - Los datos se cargan desde Supabase
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      return {
        // Hydration state
        isHydrated: false,
        isDataLoaded: false, // 🎯 Flag para evitar cargas múltiples
        // 🆕 CATÁLOGO DE PRODUCTOS
        catalogoProductos: [],
        equipos: [],
        mantenimientos: [],
        cargasMercaderia: [],
        documentosCarga: [],
        stockItems: [], // 🎯 Para stock general
        movimientosStock: [], // 🎯 Para trazabilidad completa
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

              // Cargar el resto de datos incluyendo catálogo de productos
            const [cargas,
              clinicas,
              remisiones,
              transacciones,
              documentos,
              stockItems,
              movimientos,
            ] = await Promise.all([
              getAllCargas(),
              getAllClinicas(),
              getAllRemisiones(),
              getAllTransaccionesStock(),
              getAllDocumentosCarga(),
              getAllStockItems(),
              getAllMovimientosStock(),
            ]);

            // 🆕 CARGAR CATÁLOGO DE PRODUCTOS POR SEPARADO PARA CONTROL
            await get().loadCatalogoProductos();

              set({
                cargasMercaderia: cargas,
                equipos: equipos,
                mantenimientos: mantenimientos,
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

            // Mapear para asegurar que tenemos el campo tipoProducto
            const stockItemsFormateados = stockItems.map(item => ({
              ...item,
              tipoProducto: item.tipoComponente || 'Producto' // Asegurar compatibilidad
            }));

            set({
              stockItems: stockItemsFormateados,
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
            // Solo trabajamos con stock_items ahora
            const { data: stockItem, error: stockError } = await supabase
              .from("stock_items")
              .select("id, cantidad_actual")
              .eq("id", itemId)
              .single();

            if (stockError || !stockItem) {
              throw new Error(`Item no encontrado en stock_items: ${itemId}`);
            }

            const { error } = await supabase
              .from("stock_items")
              .update({
                cantidad_actual: nuevaCantidad,
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
            // Importar desde el módulo correcto de stock
            const { updateStockItemDetails } = await import("@/lib/database/stock");

            // Actualizar en stock_items (la única tabla que ahora se usa)
            await updateStockItemDetails(productId, updates);

            // Recargar datos
            await Promise.all([
              get().loadStock(),
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

        // 🆕 NUEVA: Obtener números de serie disponibles para un producto
        getNumerosSerie: async (
          productoNombre: string,
          productoMarca: string,
          productoModelo?: string
        ): Promise<string[]> => {
          try {
            console.log("🔍 Obteniendo números de serie disponibles para:", {
              productoNombre,
              productoMarca,
              productoModelo,
            });

            // 🔧 CORRECCIÓN: Obtener números de serie solo de stock_items (cantidad > 0)
            const { data: stockItems, error: errorStock } =
              await supabase
                .from("stock_items")
                .select("numero_serie")
                .eq("nombre", productoNombre)
                .eq("marca", productoMarca)
                .gt("cantidad_actual", 0) // Solo items con cantidad > 0
                .not("numero_serie", "is", null)
                .neq("numero_serie", "");

            if (errorStock) throw errorStock;

            // Procesar stock items para obtener números de serie únicos disponibles
            const numerosSerieSet = new Set<string>();

            stockItems.forEach((item) => {
              if (item.numero_serie && item.numero_serie.trim()) {
                const sn = item.numero_serie.trim();
                numerosSerieSet.add(sn);
              }
            });

            // Convertir a array y ordenar
            const numerosSerieDisponibles = Array.from(numerosSerieSet).sort();

            console.log("✅ Números de serie REALMENTE disponibles:", {
              total: numerosSerieDisponibles.length,
              numeros: numerosSerieDisponibles,
            });

            return numerosSerieDisponibles;
          } catch (error) {
            console.error("❌ Error obteniendo números de serie:", error);
            return [];
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
        registrarSalidaStockReporte: async (
          salidaData: {
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
          },
          currentUser?: { nombre: string } | null
        ) => {
          try {
            // 👤 Usar usuario actual pasado como parámetro desde el componente
            const salidaDataConUsuario = {
              ...salidaData,
              tecnicoResponsable:
                salidaData.tecnicoResponsable || currentUser?.nombre || "Sistema",
            };

            await registrarSalidaStockReporte(salidaDataConUsuario);

            // Recargar datos para mantener consistencia
            await get().loadMovimientosStock();

            console.log(
              "✅ Salida de stock para reporte registrada exitosamente por:",
              currentUser?.nombre || "Sistema"
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
            await get().loadMovimientosStock();

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

            // 🔄 RECARGAR STOCK, MOVIMIENTOS Y INVENTARIO TÉCNICO después de agregar carga para que aparezca inmediatamente
            console.log(
              "🔄 Recargando stock, movimientos e inventario técnico después de agregar carga..."
            );
            const [stockItems, movimientos] = await Promise.all([
              getAllStockItems(),
              getAllMovimientosStock(),
            ]);
            set({
              stockItems: stockItems,
              movimientosStock: movimientos,
            });

            console.log(
              "✅ Stock y movimientos recargados exitosamente después de agregar carga"
            );

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
            // Optimistic update: remove from local state immediately
            const prev = get().cargasMercaderia || [];
            set({ cargasMercaderia: prev.filter((c) => c.id !== cargaId) });

            await deleteCargaMercaderia(cargaId);

            // Refresh from server to ensure consistency
            const cargas = await getAllCargas();
            set({ cargasMercaderia: cargas });
            console.log("✅ Carga eliminada exitosamente");
          } catch (error) {
            console.error("❌ Error deleting carga:", error);
            // On failure, reload from server to revert optimistic update
            try {
              const cargas = await getAllCargas();
              set({ cargasMercaderia: cargas });
            } catch {}
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
        // HYDRATION FUNCTIONS
        // ===============================================
        setHydrated: () => {
          set({ isHydrated: true });
        },

        // ===============================================
        // USUARIOS (Solo para gestión administrativa)
        // ===============================================
        usuarios: [],

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

        // ===============================================
        // FUNCIONES BÁSICAS REQUERIDAS POR LOS TIPOS
        // ===============================================
        addMantenimiento: async (mantenimientoData: any) => {
          try {
            console.log(
              "🔄 Store: Creando mantenimiento en BD...",
              mantenimientoData
            );
            const nuevoMantenimiento = await createMantenimiento(
              mantenimientoData
            );
            console.log(
              "✅ Store: Mantenimiento creado en BD:",
              nuevoMantenimiento
            );

            // 🔧 CAMBIO: Recargar todos los mantenimientos desde la BD (más seguro)
            console.log(
              "🔄 Store: Recargando todos los mantenimientos desde BD..."
            );
            const mantenimientos = await getAllMantenimientos();
            set({ mantenimientos });
            console.log(
              "✅ Store: Mantenimientos recargados:",
              mantenimientos.length
            );

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
          cliente?: string,
          tipoVenta?: 'unidad' | 'caja' // 🆕 NUEVO: Tipo de venta para productos fraccionables
        ) => {
          try {
            console.log("🔄 INICIO - Procesando salida de stock...", {
              itemId,
              stockItemId,
              cantidad,
              motivo,
              numeroRemision,
              cliente,
            });

            // Determinar si es del inventario técnico o stock general
            if (itemId) {
              // 🔧 CORRECCIÓN: Ahora solo trabajamos con stock_items
              // Si se pasa itemId, asumir que es de stock_items
              const stockItem = get().stockItems.find(s => s.id === itemId);
              
              if (!stockItem) {
                console.error(
                  "❌ No se encontró el item en stock_items:",
                  itemId
                );
                throw new Error(`Item no encontrado en stock: ${itemId}`);
              }

              console.log("🔍 Procesando salida para stock item desde store:", {
                id: stockItem.id,
                nombre: stockItem.nombre,
                numeroSerie: stockItem.numeroSerie,
              });

              // 🔧 USAR FUNCIÓN DIRECTA DE DATABASE.TS en lugar del store
              await registrarSalidaStock({
                itemId: itemId,
                productoNombre: stockItem.nombre,
                productoMarca: stockItem.marca,
                productoModelo: stockItem.modelo,
                numeroSerie: stockItem.numeroSerie,
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

              console.log(
                "✅ Movimiento de stock registrado para:",
                stockItem.nombre,
                "S/N:",
                stockItem.numeroSerie
              );
            } else if (stockItemId) {
              // Es del stock general (stock_items)
              const stockItem = get().stockItems.find(
                (s) => s.id === stockItemId
              );

              if (stockItem) {
                console.log("🔍 Procesando salida para stock item:", stockItem);
                console.log("📦 Tipo de venta:", tipoVenta);

                // 📦 NUEVO: Procesar fraccionamiento si aplica
                let cantidadFinalDescontar = cantidad;
                let observacionesExtras = `Remisión: ${numeroRemision || "N/A"}`;

                if (tipoVenta && stockItem.permite_fraccionamiento) {
                  console.log("📦 Procesando producto fraccionable:", {
                    tipoVenta,
                    cantidadOriginal: cantidad,
                    unidadesPorPaquete: stockItem.unidades_por_paquete,
                    cajasCompletas: stockItem.cajas_completas,
                    unidadesSueltas: stockItem.unidades_sueltas
                  });

                  if (tipoVenta === 'caja') {
                    // Venta por caja: descontar de cajas_completas
                    console.log("📦 Venta por caja - descontando de cajas completas");
                    observacionesExtras += ` - Venta por CAJA (${stockItem.unidades_por_paquete} unidades)`;
                    
                    // La cantidad ya viene en cajas, no necesitamos conversión
                    cantidadFinalDescontar = cantidad;
                  } else if (tipoVenta === 'unidad') {
                    // Venta por unidad: descontar de unidades_sueltas
                    console.log("📦 Venta por unidad - descontando de unidades sueltas");
                    observacionesExtras += ` - Venta por UNIDAD`;
                    
                    // La cantidad ya viene en unidades, no necesitamos conversión
                    cantidadFinalDescontar = cantidad;
                  }
                }

                // 🔧 USAR FUNCIÓN DIRECTA DE DATABASE.TS en lugar del store
                await registrarSalidaStock({
                  itemId: stockItemId,
                  productoNombre: stockItem.nombre,
                  productoMarca: stockItem.marca,
                  productoModelo: stockItem.modelo,
                  numeroSerie: stockItem.numeroSerie, // 🆕 AGREGADO: Incluir número de serie
                  cantidad: cantidadFinalDescontar,
                  cantidadAnterior: stockItem.cantidadDisponible,
                  motivo: motivo,
                  destino: cliente || "Cliente",
                  responsable: "Sistema - Remisión",
                  cliente: cliente,
                  numeroFactura: numeroFactura,
                  observaciones: observacionesExtras,
                  carpetaOrigen: stockItem.marca,
                  // 📦 NUEVO: Información del fraccionamiento
                  tipoVenta: tipoVenta,
                  permiteFraccionamiento: stockItem.permite_fraccionamiento,
                  unidadesPorPaquete: stockItem.unidades_por_paquete
                });

                console.log(
                  "✅ Movimiento de stock registrado para:",
                  stockItem.nombre,
                  "Tipo:", tipoVenta || "normal"
                );
              } else {
                console.error(
                  "❌ No se encontró el stock item con ID:",
                  stockItemId
                );
                throw new Error(`Stock item no encontrado: ${stockItemId}`);
              }
            }

            // Recargar inventarios
            await Promise.all([
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
        deleteRemision: async (
          id: string,
          motivo: string = "Eliminación solicitada por usuario"
        ) => {
          try {
            console.log(
              "🔄 Eliminando remisión con restauración de stock...",
              id
            );
            const resultado = await deleteRemisionConRestauracion(id, motivo);

            // Recargar la lista de remisiones después de eliminar
            const remisiones = await getAllRemisiones();
            set({ remisiones });

            console.log("✅ Remisión eliminada exitosamente:", resultado);
            return resultado;
          } catch (error) {
            console.error("❌ Error deleting remisión:", error);
            throw error;
          }
        },

        // 🆕 Nueva función para eliminar remisión con motivo y restauración de stock
        deleteRemisionConMotivo: async (id: string, motivo: string) => {
          try {
            console.log(
              "🔄 Eliminando remisión con restauración de stock...",
              id
            );
            const resultado = await deleteRemisionConRestauracion(id, motivo);

            // Recargar datos
            await Promise.all([
              get().loadStock(),
              get().loadMovimientosStock(),
            ]);

            const remisiones = await getAllRemisiones();
            set({ remisiones });

            console.log(
              "✅ Remisión eliminada con restauración exitosa:",
              resultado
            );
            return resultado;
          } catch (error) {
            console.error("❌ Error deleting remisión con motivo:", error);
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
        addDocumentoCarga: async (documento: DocumentoCarga) => {
          try {
            console.log("📄 Agregando documento a la carga:", documento);
            const nuevoDocumento = await createDocumentoCarga(documento);

            // Recargar documentos
            const documentos = await getAllDocumentosCarga();
            set({ documentosCarga: documentos });

            console.log("✅ Documento agregado exitosamente");
            return nuevoDocumento;
          } catch (error) {
            console.error("❌ Error agregando documento:", error);
            throw error;
          }
        },
        deleteDocumentoCarga: async () => {},
        getDocumentosByCarga: (cargaId: string) => {
          const { documentosCarga } = get();
          return documentosCarga
            .filter((doc) => doc.carga_id === cargaId)
            .map((doc) => ({
              id: doc.id,
              cargaId: doc.carga_id,
              codigoCarga: doc.codigo_carga,
              nombre: doc.nombre,
              tipoDocumento: doc.tipo_documento,
              archivo: {
                nombre: doc.archivo_nombre,
                tamaño: doc.archivo_tamaño,
                tipo: doc.archivo_tipo,
                url: doc.archivo_url,
              },
              observaciones: doc.observaciones,
              fechaSubida: doc.fecha_subida,
              subidoPor: doc.subido_por,
            }));
        },
        getCargasConDocumentos: () => [],

        // ===============================================
        // FUNCIONES DE MANTENIMIENTOS
        // ===============================================
        addMantenimiento: async (
          mantenimientoData: Omit<Mantenimiento, "id" | "createdAt">
        ) => {
          try {
            console.log("🔄 Creando mantenimiento...", mantenimientoData);
            const nuevoMantenimiento = await createMantenimiento(
              mantenimientoData
            );

            // Recargar mantenimientos
            const mantenimientos = await getAllMantenimientos();
            set({ mantenimientos });

            console.log("✅ Mantenimiento creado exitosamente");
            return nuevoMantenimiento;
          } catch (error) {
            console.error("❌ Error creating mantenimiento:", error);
            throw error;
          }
        },

        updateMantenimiento: async (
          id: string,
          updates: Partial<Mantenimiento>
        ) => {
          try {
            console.log("🔄 Actualizando mantenimiento...", id, updates);
            await dbUpdateMantenimiento(id, updates);

            // Recargar mantenimientos
            const mantenimientos = await getAllMantenimientos();
            set({ mantenimientos });

            console.log("✅ Mantenimiento actualizado exitosamente");
          } catch (error) {
            console.error("❌ Error updating mantenimiento:", error);
            throw error;
          }
        },

        deleteMantenimiento: async (id: string) => {
          try {
            console.log("🔄 Eliminando mantenimiento...", id);
            await dbDeleteMantenimiento(id);

            // Recargar mantenimientos
            const mantenimientos = await getAllMantenimientos();
            set({ mantenimientos });

            console.log("✅ Mantenimiento eliminado exitosamente");
          } catch (error) {
            console.error("❌ Error deleting mantenimiento:", error);
            throw error;
          }
        },

        getMantenimientosByEquipo: (equipoId: string) => {
          const { mantenimientos } = get();
          return mantenimientos.filter((m) => m.equipoId === equipoId);
        },

        // 🆕 FUNCIONES PARA CALENDARIO
        addMantenimientoProgramado: async (mantenimiento: {
          equipoId: string;
          fechaProgramada: string;
          descripcion: string;
          tipo: "Preventivo";
          tecnicoAsignado?: string;
          prioridad: "Baja" | "Media" | "Alta" | "Crítica";
          tiempoEstimado?: number;
          esRecurrente?: boolean;
          frecuenciaMantenimiento?:
            | "Mensual"
            | "Bimestral"
            | "Trimestral"
            | "Semestral"
            | "Anual";
          diasNotificacionAnticipada?: number;
        }) => {
          try {
            console.log(
              "🔄 Creando mantenimiento programado...",
              mantenimiento
            );

            const mantenimientoData = {
              equipoId: mantenimiento.equipoId,
              fecha: mantenimiento.fechaProgramada.split("T")[0], // Solo la fecha
              fechaProgramada: mantenimiento.fechaProgramada,
              descripcion: mantenimiento.descripcion,
              estado: "Pendiente" as const,
              tipo: mantenimiento.tipo,
              esProgramado: true,
              tecnicoAsignado: mantenimiento.tecnicoAsignado,
              prioridad: mantenimiento.prioridad,
              tiempoEstimado: mantenimiento.tiempoEstimado,
              esRecurrente: mantenimiento.esRecurrente,
              frecuenciaMantenimiento: mantenimiento.frecuenciaMantenimiento,
              diasNotificacionAnticipada:
                mantenimiento.diasNotificacionAnticipada,
            };

            const nuevoMantenimiento = await createMantenimiento(
              mantenimientoData
            );

            // Recargar mantenimientos
            const mantenimientos = await getAllMantenimientos();
            set({ mantenimientos });

            console.log("✅ Mantenimiento programado creado exitosamente");
            return nuevoMantenimiento;
          } catch (error) {
            console.error("❌ Error creating mantenimiento programado:", error);
            throw error;
          }
        },

        getMantenimientosProgramados: () => {
          const { mantenimientos } = get();
          return mantenimientos.filter(
            (m) => m.tipo === "Preventivo" || m.esProgramado
          );
        },

        getMantenimientosByTecnico: (tecnico: string) => {
          const { mantenimientos } = get();
          return mantenimientos.filter((m) => m.tecnicoAsignado === tecnico);
        },

        getMantenimientosVencidos: () => {
          const { mantenimientos } = get();
          const hoy = new Date();
          return mantenimientos.filter((m) => {
            const fechaMantenimiento = new Date(m.fechaProgramada || m.fecha);
            return fechaMantenimiento < hoy && m.estado !== "Finalizado";
          });
        },

        // Funciones placeholder para técnicos y planes (se pueden implementar después)
        loadTecnicos: async () => {
          console.log("🔄 Cargando técnicos... (placeholder)");
        },

        addTecnico: async (tecnico: Omit<Tecnico, "id">) => {
          console.log("🔄 Agregando técnico... (placeholder)", tecnico);
        },

        updateTecnico: async (id: string, updates: Partial<Tecnico>) => {
          console.log("🔄 Actualizando técnico... (placeholder)", id, updates);
        },

        getTecnicosDisponibles: () => {
          return [];
        },

        loadPlanesMantenimiento: async () => {
          console.log("🔄 Cargando planes de mantenimiento... (placeholder)");
        },

        addPlanMantenimiento: async (
          plan: Omit<PlanMantenimiento, "id" | "createdAt">
        ) => {
          console.log(
            "🔄 Agregando plan de mantenimiento... (placeholder)",
            plan
          );
        },

        searchEquipos: (term: string) => {
          const { equipos } = get();
          if (!term.trim()) return equipos;

          const searchTerm = term.toLowerCase();
          return equipos.filter(
            (equipo) =>
              equipo.cliente.toLowerCase().includes(searchTerm) ||
              equipo.nombreEquipo.toLowerCase().includes(searchTerm) ||
              equipo.marca.toLowerCase().includes(searchTerm) ||
              equipo.modelo.toLowerCase().includes(searchTerm) ||
              equipo.ubicacion.toLowerCase().includes(searchTerm)
          );
        },

        // ===============================================
        // 🆕 FUNCIONES PARA CATÁLOGO DE PRODUCTOS
        // ===============================================
        loadCatalogoProductos: async () => {
          try {
            console.log("🔄 Cargando catálogo de productos desde Supabase...");
            const { data, error } = await supabase
              .from("catalogo_productos")
              .select("*")
              .eq("activo", true)
              .order("marca", { ascending: true });

            if (error) throw error;

            const catalogoProductos: CatalogoProducto[] = data.map((producto) => ({
              id: producto.id,
              marca: producto.marca,
              nombre: producto.nombre,
              descripcion: producto.descripcion,
              categoria: producto.categoria,
              codigoProducto: producto.codigo_producto,
              precio: producto.precio,
              moneda: producto.moneda as 'USD' | 'GS',
              
              // 💰 NUEVOS CAMPOS DE PRECIOS DUALES
              precioPorCaja: producto.precio_por_caja,
              precioPorUnidad: producto.precio_por_unidad,
              monedaCaja: producto.moneda_caja as 'USD' | 'GS' | undefined,
              monedaUnidad: producto.moneda_unidad as 'USD' | 'GS' | undefined,
              
              // 📦 CAMPOS DE FRACCIONAMIENTO
              permiteFraccionamiento: producto.permite_fraccionamiento || false,
              unidadesPorCaja: producto.unidades_por_caja || 1,
              
              // 💸 CAMPOS EXISTENTES
              precioMinimo: producto.precio_minimo,
              precioMaximo: producto.precio_maximo,
              margenUtilidad: producto.margen_utilidad,
              disponibleParaVenta: producto.disponible_para_venta,
              activo: producto.activo,
              createdAt: producto.created_at,
              updatedAt: producto.updated_at,
            }));

            set({ catalogoProductos });
            console.log("✅ Catálogo de productos cargado exitosamente:", catalogoProductos.length);
          } catch (error) {
            console.error("❌ Error loading catálogo productos:", error);
          }
        },

        addCatalogoProducto: async (productoData: Omit<CatalogoProducto, 'id' | 'createdAt' | 'updatedAt'>) => {
          try {
            console.log("🔄 Agregando producto al catálogo...", productoData);
            const { data, error } = await supabase
              .from("catalogo_productos")
              .insert({
                marca: productoData.marca,
                nombre: productoData.nombre,
                descripcion: productoData.descripcion,
                categoria: productoData.categoria,
                codigo_producto: productoData.codigoProducto,
                precio: productoData.precio,
                moneda: productoData.moneda,
                
                // 💰 NUEVOS CAMPOS DE PRECIOS DUALES
                precio_por_caja: productoData.precioPorCaja,
                precio_por_unidad: productoData.precioPorUnidad,
                moneda_caja: productoData.monedaCaja,
                moneda_unidad: productoData.monedaUnidad,
                
                // 📦 CAMPOS DE FRACCIONAMIENTO
                permite_fraccionamiento: productoData.permiteFraccionamiento || false,
                unidades_por_caja: productoData.unidadesPorCaja || 1,
                
                // 💸 CAMPOS EXISTENTES
                precio_minimo: productoData.precioMinimo,
                precio_maximo: productoData.precioMaximo,
                margen_utilidad: productoData.margenUtilidad,
                disponible_para_venta: productoData.disponibleParaVenta,
                activo: productoData.activo,
              })
              .select()
              .single();

            if (error) throw error;

            const nuevoProducto: CatalogoProducto = {
              id: data.id,
              marca: data.marca,
              nombre: data.nombre,
              descripcion: data.descripcion,
              categoria: data.categoria,
              codigoProducto: data.codigo_producto,
              precio: data.precio,
              moneda: data.moneda as 'USD' | 'GS',
              
              // 💰 PRECIOS DUALES
              precioPorCaja: data.precio_por_caja,
              precioPorUnidad: data.precio_por_unidad,
              monedaCaja: data.moneda_caja as 'USD' | 'GS' | undefined,
              monedaUnidad: data.moneda_unidad as 'USD' | 'GS' | undefined,
              
              // 📦 FRACCIONAMIENTO
              permiteFraccionamiento: data.permite_fraccionamiento,
              unidadesPorCaja: data.unidades_por_caja,
              
              // 💸 EXISTENTES
              precioMinimo: data.precio_minimo,
              precioMaximo: data.precio_maximo,
              margenUtilidad: data.margen_utilidad,
              disponibleParaVenta: data.disponible_para_venta,
              activo: data.activo,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
            };

            // Recargar catálogo para mantener consistencia
            await get().loadCatalogoProductos();
            console.log("✅ Producto agregado al catálogo exitosamente");
            return nuevoProducto;
          } catch (error) {
            console.error("❌ Error adding producto al catálogo:", error);
            throw error;
          }
        },

        updateCatalogoProducto: async (id: string, updates: Partial<CatalogoProducto>) => {
          try {
            console.log("🔄 Actualizando producto del catálogo...", { id, updates });
            
            // 🔍 NUEVO: Obtener datos actuales del producto para detectar cambios importantes
            const { data: productoActual, error: fetchError } = await supabase
              .from("catalogo_productos")
              .select("nombre, marca")
              .eq("id", id)
              .single();

            if (fetchError) {
              console.error("❌ Error obteniendo producto actual:", fetchError);
              throw fetchError;
            }

            const updateData: any = {};
            
            // Campos básicos
            if (updates.marca) updateData.marca = updates.marca;
            if (updates.nombre) updateData.nombre = updates.nombre;
            if (updates.descripcion !== undefined) updateData.descripcion = updates.descripcion;
            if (updates.categoria !== undefined) updateData.categoria = updates.categoria;
            if (updates.codigoProducto !== undefined) updateData.codigo_producto = updates.codigoProducto;
            
            // Precios originales
            if (updates.precio !== undefined) updateData.precio = updates.precio;
            if (updates.moneda) updateData.moneda = updates.moneda;
            
            // 💰 NUEVOS CAMPOS DE PRECIOS DUALES
            if (updates.precioPorCaja !== undefined) updateData.precio_por_caja = updates.precioPorCaja;
            if (updates.precioPorUnidad !== undefined) updateData.precio_por_unidad = updates.precioPorUnidad;
            if (updates.monedaCaja !== undefined) updateData.moneda_caja = updates.monedaCaja;
            if (updates.monedaUnidad !== undefined) updateData.moneda_unidad = updates.monedaUnidad;
            
            // 📦 CAMPOS DE FRACCIONAMIENTO
            if (updates.permiteFraccionamiento !== undefined) updateData.permite_fraccionamiento = updates.permiteFraccionamiento;
            if (updates.unidadesPorCaja !== undefined) updateData.unidades_por_caja = updates.unidadesPorCaja;
            
            // Campos de rango de precios
            if (updates.precioMinimo !== undefined) updateData.precio_minimo = updates.precioMinimo;
            if (updates.precioMaximo !== undefined) updateData.precio_maximo = updates.precioMaximo;
            if (updates.margenUtilidad !== undefined) updateData.margen_utilidad = updates.margenUtilidad;
            
            // Campos de estado
            if (updates.disponibleParaVenta !== undefined) updateData.disponible_para_venta = updates.disponibleParaVenta;
            if (updates.activo !== undefined) updateData.activo = updates.activo;
            
            updateData.updated_at = new Date().toISOString();

            console.log("📄 Datos a actualizar en Supabase:", updateData);

            // Actualizar en el catálogo
            const { error } = await supabase
              .from("catalogo_productos")
              .update(updateData)
              .eq("id", id);

            if (error) {
              console.error("❌ Error de Supabase al actualizar:", error);
              throw error;
            }

            // 🔄 NUEVO: Detectar si hubo cambios en nombre, marca o modelo
            const huboCambiosImportantes = 
              (updates.nombre && updates.nombre !== productoActual.nombre) ||
              (updates.marca && updates.marca !== productoActual.marca);

            if (huboCambiosImportantes) {
              console.log("🔄 Detectados cambios importantes, sincronizando en todas las tablas...");
              
              try {
                // Importar dinámicamente para evitar dependencias circulares
                const { sincronizarProductoEnTodasLasTablas } = await import("../lib/product-sync");
                
                const cambios = {
                  nombreAnterior: productoActual.nombre, // ✅ El nombre que está actualmente en otras tablas
                  marcaAnterior: productoActual.marca,   // ✅ La marca que está actualmente en otras tablas
                  modeloAnterior: '', // CatalogoProducto no tiene modelo
                  nombreNuevo: updates.nombre || productoActual.nombre,     // ✅ El nuevo nombre que queremos
                  marcaNueva: updates.marca || productoActual.marca,       // ✅ La nueva marca que queremos
                  modeloNuevo: '', // CatalogoProducto no tiene modelo
                  categoriaProducto: updates.categoria
                };

                console.log("📋 Parámetros de sincronización:", {
                  buscando: { nombre: cambios.nombreAnterior, marca: cambios.marcaAnterior },
                  actualizandoA: { nombre: cambios.nombreNuevo, marca: cambios.marcaNueva }
                });

                const syncResult = await sincronizarProductoEnTodasLasTablas(id, cambios);
                
                if (syncResult.success) {
                  console.log(`✅ Sincronización exitosa: ${syncResult.registrosActualizados} registros actualizados en ${syncResult.tablasSincronizadas.length} tablas`);
                  
                  // Mostrar resumen detallado
                  syncResult.detalles.forEach(detalle => {
                    if (detalle.actualizados > 0) {
                      console.log(`   📄 ${detalle.tabla}: ${detalle.actualizados} registros`);
                    }
                  });
                } else {
                  console.warn("⚠️ Sincronización completada con advertencias:", syncResult.errores);
                }
              } catch (syncError) {
                console.error("❌ Error en la sincronización automática:", syncError);
                // No fallar la actualización del catálogo por errores de sincronización
              }
            }

            // Recargar catálogo para mantener consistencia
            await get().loadCatalogoProductos();
            console.log("✅ Producto del catálogo actualizado exitosamente");
          } catch (error) {
            console.error("❌ Error updating producto del catálogo:", error);
            throw error;
          }
        },

        deleteCatalogoProducto: async (id: string) => {
          try {
            console.log("🔄 Eliminando producto del catálogo...", id);
            // Marcar como inactivo en lugar de eliminar físicamente
            const { error } = await supabase
              .from("catalogo_productos")
              .update({
                activo: false,
                updated_at: new Date().toISOString()
              })
              .eq("id", id);

            if (error) throw error;

            // Recargar catálogo para mantener consistencia
            await get().loadCatalogoProductos();
            console.log("✅ Producto del catálogo eliminado (desactivado) exitosamente");
          } catch (error) {
            console.error("❌ Error deleting producto del catálogo:", error);
            throw error;
          }
        },

        getCatalogoProductos: () => {
          const { catalogoProductos } = get();
          return catalogoProductos || [];
        },

        getCatalogoProductosPorMoneda: (moneda: 'USD' | 'GS') => {
          const { catalogoProductos } = get();
          return (catalogoProductos || []).filter(p => p.moneda === moneda);
        },

        buscarProductosEnCatalogo: (termino: string) => {
          const { catalogoProductos } = get();
          if (!termino.trim()) return catalogoProductos || [];
          
          const terminoBusqueda = termino.toLowerCase();
          return (catalogoProductos || []).filter(producto =>
            producto.nombre.toLowerCase().includes(terminoBusqueda) ||
            producto.marca.toLowerCase().includes(terminoBusqueda) ||
            (producto.descripcion && producto.descripcion.toLowerCase().includes(terminoBusqueda)) ||
            (producto.categoria && producto.categoria.toLowerCase().includes(terminoBusqueda)) ||
            (producto.codigoProducto && producto.codigoProducto.toLowerCase().includes(terminoBusqueda))
          );
        },


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
