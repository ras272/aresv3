"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EditProductModal } from "@/components/inventory/EditProductModal";
import { TrazabilidadStats } from "@/components/stock/TrazabilidadStats";
import { MovimientosCarpetaModal } from "@/components/stock/MovimientosCarpetaModal";
import { RegistrarSalidaModal } from "@/components/stock/RegistrarSalidaModal";
import {
  Package,
  Search,
  AlertTriangle,
  Plus,
  Minus,
  Edit3,
  Folder,
  ChevronRight,
  ChevronDown,
  Image as ImageIcon,
  BarChart3,
  ArrowDownCircle,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface ProductoAgrupado {
  id: string;
  nombre: string;
  marca: string;
  modelo: string;
  tipoComponente: string;
  cantidadTotal: number;
  ubicaciones: Array<{
    ubicacion: string;
    cantidad: number;
    componenteIds: string[];
  }>;
  detallesNumerosSerie: {
    sinNumeroSerie: number;
    conNumeroSerie: Array<{
      numeroSerie: string;
      cantidad: number;
      componenteId: string;
    }>;
  };
  imagen?: string;
  observaciones?: string;
}

export default function StockPage() {
  const {
    stockItems,
    loadStock,
    updateStockItem,
    updateStockItemDetails,
    getEstadisticasStockGeneral,
    loadMovimientosStock,
    registrarSalidaStock,
  } = useAppStore();

  const [busqueda, setBusqueda] = useState("");
  const [carpetasAbiertas, setCarpetasAbiertas] = useState<Set<string>>(
    new Set(["ares"])
  );
  const [estadisticasAbiertas, setEstadisticasAbiertas] = useState(false);

  // Estados para el modal de edición de producto
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [productoParaEditar, setProductoParaEditar] =
    useState<ProductoAgrupado | null>(null);

  // Estados para trazabilidad
  const [modalMovimientosOpen, setModalMovimientosOpen] = useState(false);
  const [carpetaSeleccionada, setCarpetaSeleccionada] = useState<string>("");
  const [modalSalidaOpen, setModalSalidaOpen] = useState(false);
  const [productoParaSalida, setProductoParaSalida] =
    useState<ProductoAgrupado | null>(null);

  // Estados para crear carpeta manualmente
  const [modalCrearCarpeta, setModalCrearCarpeta] = useState(false);
  const [nombreNuevaCarpeta, setNombreNuevaCarpeta] = useState("");

  // Estado para carpetas vacías creadas manualmente
  const [carpetasVacias, setCarpetasVacias] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadStock();
    loadMovimientosStock();
  }, [loadStock, loadMovimientosStock]);

  // Agrupar productos por marca/carpeta
  const agruparProductos = () => {
    const grupos: Record<string, ProductoAgrupado[]> = {};

    stockItems.forEach((componente) => {
      const carpeta =
        componente.carpetaPrincipal || componente.marca || "Sin Clasificar";

      if (!grupos[carpeta]) {
        grupos[carpeta] = [];
      }

      // Buscar si ya existe un producto agrupado
      let productoExistente = grupos[carpeta].find(
        (p) =>
          p.nombre === componente.nombre &&
          p.marca === componente.marca &&
          p.modelo === componente.modelo
      );

      if (!productoExistente) {
        productoExistente = {
          id: `${componente.nombre}-${componente.marca}-${componente.modelo}`
            .toLowerCase()
            .replace(/\s+/g, "-"),
          nombre: componente.nombre,
          marca: componente.marca,
          modelo: componente.modelo,
          tipoComponente: componente.tipoComponente,
          cantidadTotal: 0,
          ubicaciones: [],
          detallesNumerosSerie: {
            sinNumeroSerie: 0,
            conNumeroSerie: [],
          },
          imagen: componente.imagen,
          observaciones: componente.observaciones,
        };
        grupos[carpeta].push(productoExistente);
      }

      // Agregar cantidad
      productoExistente.cantidadTotal += componente.cantidadDisponible;

      // Manejar ubicaciones
      const ubicacionExistente = productoExistente.ubicaciones.find(
        (u) => u.ubicacion === (componente.ubicacionFisica || "Sin ubicación")
      );

      if (ubicacionExistente) {
        ubicacionExistente.cantidad += componente.cantidadDisponible;
        ubicacionExistente.componenteIds.push(componente.id);
      } else {
        productoExistente.ubicaciones.push({
          ubicacion: componente.ubicacionFisica || "Sin ubicación",
          cantidad: componente.cantidadDisponible,
          componenteIds: [componente.id],
        });
      }

      // Manejar números de serie
      if (componente.numeroSerie) {
        productoExistente.detallesNumerosSerie.conNumeroSerie.push({
          numeroSerie: componente.numeroSerie,
          cantidad: componente.cantidadDisponible,
          componenteId: componente.id,
        });
      } else {
        productoExistente.detallesNumerosSerie.sinNumeroSerie +=
          componente.cantidadDisponible;
      }
    });

    return grupos;
  };

  const toggleCarpeta = (carpetaId: string) => {
    const nuevasCarpetas = new Set(carpetasAbiertas);
    if (nuevasCarpetas.has(carpetaId)) {
      nuevasCarpetas.delete(carpetaId);
    } else {
      nuevasCarpetas.add(carpetaId);
    }
    setCarpetasAbiertas(nuevasCarpetas);
  };

  const abrirModalEdit = (producto: ProductoAgrupado) => {
    setProductoParaEditar(producto);
    setModalEditOpen(true);
  };

  const handleUpdateProduct = async (
    productId: string,
    updates: { imagen?: string; observaciones?: string }
  ) => {
    try {
      await updateStockItemDetails(productId, updates);
      toast.success("Producto actualizado exitosamente");
    } catch (error) {
      console.error("Error actualizando producto:", error);
      toast.error("Error al actualizar el producto");
      throw error;
    }
  };

  const productosAgrupados = agruparProductos();
  const estadisticas = getEstadisticasStockGeneral();

  const handleCrearCarpeta = () => {
    if (!nombreNuevaCarpeta.trim()) {
      toast.error("Ingresa un nombre para la carpeta");
      return;
    }

    const nombreCarpeta = nombreNuevaCarpeta.trim();

    // Verificar si la carpeta ya existe
    const carpetaExiste =
      Object.keys(productosAgrupados).some(
        (carpeta) => carpeta.toLowerCase() === nombreCarpeta.toLowerCase()
      ) || carpetasVacias.has(nombreCarpeta);

    if (carpetaExiste) {
      toast.error("Ya existe una carpeta con ese nombre");
      return;
    }

    // Crear carpeta vacía
    const carpetaId = nombreCarpeta.toLowerCase().replace(/\s+/g, "-");
    setCarpetasVacias((prev) => new Set([...prev, nombreCarpeta]));
    setCarpetasAbiertas((prev) => new Set([...prev, carpetaId]));

    // Cerrar modal y limpiar
    setModalCrearCarpeta(false);
    setNombreNuevaCarpeta("");

    toast.success(`Carpeta "${nombreCarpeta}" creada exitosamente`, {
      description: "Ahora puedes mover productos a esta carpeta",
    });
  };

  // Filtrar productos por búsqueda
  const filtrarProductos = (productos: ProductoAgrupado[]) => {
    if (!busqueda.trim()) return productos;

    const termino = busqueda.toLowerCase();
    return productos.filter(
      (producto) =>
        producto.nombre.toLowerCase().includes(termino) ||
        producto.marca.toLowerCase().includes(termino) ||
        producto.modelo.toLowerCase().includes(termino)
    );
  };

  return (
    <DashboardLayout
      title="Stock"
      subtitle="Gestión de inventario organizado por carpetas"
    >
      <div className="space-y-6">
        {/* Estadísticas colapsables */}
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-muted/50 pb-3"
            onClick={() => setEstadisticasAbiertas(!estadisticasAbiertas)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {estadisticasAbiertas ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <CardTitle className="text-lg">
                    Estadísticas de Stock
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {estadisticas.totalProductos} productos •{" "}
                    {estadisticas.productosConStockBajo} con stock bajo
                  </p>
                </div>
              </div>
              <BarChart3 className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>

          <AnimatePresence>
            {estadisticasAbiertas && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                          Total Productos
                        </CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {estadisticas.totalProductos}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                          Stock Bajo
                        </CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                          {estadisticas.productosConStockBajo}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                          Entradas Mes
                        </CardTitle>
                        <Plus className="h-4 w-4 text-green-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          {estadisticas.entradasMes}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                          Salidas Mes
                        </CardTitle>
                        <Minus className="h-4 w-4 text-red-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                          {estadisticas.salidasMes}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Estadísticas de Trazabilidad */}
        <TrazabilidadStats />

        {/* Búsqueda y Acciones */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => (window.location.href = "/stock/nuevo")}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nuevo Item</span>
                </Button>
                <Button
                  onClick={() => setModalCrearCarpeta(true)}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Folder className="h-4 w-4" />
                  <span>Nueva Carpeta</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Productos organizados por carpetas */}
        <div className="space-y-4">
          {/* Mostrar carpetas vacías creadas manualmente */}
          {Array.from(carpetasVacias).map((carpeta) => {
            const carpetaId = carpeta.toLowerCase().replace(/\s+/g, "-");
            const estaAbierta = carpetasAbiertas.has(carpetaId);

            return (
              <Card key={`empty-${carpeta}`}>
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleCarpeta(carpetaId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {estaAbierta ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <Folder className="h-5 w-5 text-gray-400" />
                      <div>
                        <CardTitle className="text-lg text-gray-600">
                          {carpeta}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          0 unidades • 0 productos
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-gray-500">
                      Vacía
                    </Badge>
                  </div>
                </CardHeader>

                <AnimatePresence>
                  {estaAbierta && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CardContent className="pt-0">
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Esta carpeta está vacía</p>
                          <p className="text-xs mt-2">
                            Los productos se organizarán aquí automáticamente
                            cuando coincidan con el nombre de la carpeta
                          </p>
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}

          {/* Mostrar carpetas con productos */}
          {Object.entries(productosAgrupados).map(([carpeta, productos]) => {
            const carpetaId = carpeta.toLowerCase().replace(/\s+/g, "-");
            const estaAbierta = carpetasAbiertas.has(carpetaId);
            const productosFiltrados = filtrarProductos(productos);

            if (productosFiltrados.length === 0 && busqueda.trim()) {
              return null;
            }

            return (
              <Card key={carpeta}>
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleCarpeta(carpetaId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {estaAbierta ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <Folder className="h-5 w-5 text-blue-500" />
                      <div>
                        <CardTitle className="text-lg">{carpeta}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {productos.reduce(
                            (sum, p) => sum + p.cantidadTotal,
                            0
                          )}{" "}
                          unidades • {productos.length} productos
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCarpetaSeleccionada(carpeta);
                          setModalMovimientosOpen(true);
                        }}
                        className="flex items-center space-x-1"
                        title="Ver movimientos de esta carpeta"
                      >
                        <BarChart3 className="h-4 w-4" />
                        <span>Movimientos</span>
                      </Button>
                      <Badge variant="outline">
                        {productosFiltrados.length} productos
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <AnimatePresence>
                  {estaAbierta && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {productosFiltrados.map((producto) => (
                            <Card
                              key={producto.id}
                              className="hover:shadow-md transition-shadow"
                            >
                              <CardContent className="p-4">
                                {/* Imagen del producto - Más grande y prominente */}
                                {producto.imagen && (
                                  <div className="mb-4">
                                    <img
                                      src={producto.imagen}
                                      alt={producto.nombre}
                                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                    />
                                  </div>
                                )}

                                <div className="space-y-3">
                                  <div>
                                    <h4 className="font-medium text-foreground mb-1">
                                      {producto.nombre}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      {producto.marca} - {producto.modelo}
                                    </p>
                                    <Badge
                                      variant="outline"
                                      className="mt-1 text-xs"
                                    >
                                      {producto.tipoComponente}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                      Cantidad:
                                    </span>
                                    <div className="flex items-center space-x-2">
                                      <span
                                        className={`text-lg font-bold ${
                                          producto.cantidadTotal <= 5 &&
                                          producto.cantidadTotal > 0
                                            ? "text-orange-600"
                                            : producto.cantidadTotal === 0
                                            ? "text-red-600"
                                            : "text-green-600"
                                        }`}
                                      >
                                        {producto.cantidadTotal}
                                      </span>

                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => abrirModalEdit(producto)}
                                        className="h-8 w-8 p-0"
                                        title="Editar producto (imagen y observaciones)"
                                      >
                                        <ImageIcon className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setProductoParaSalida(producto);
                                          setModalSalidaOpen(true);
                                        }}
                                        className="h-8 w-8 p-0"
                                        title="Registrar salida de stock"
                                        disabled={producto.cantidadTotal === 0}
                                      >
                                        <ArrowDownCircle className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>

                                  {producto.ubicaciones.length > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                      <strong>Ubicaciones:</strong>
                                      {producto.ubicaciones
                                        .slice(0, 2)
                                        .map((ubicacion, idx) => (
                                          <div key={idx} className="ml-2">
                                            • {ubicacion.ubicacion}:{" "}
                                            {ubicacion.cantidad} unidades
                                          </div>
                                        ))}
                                      {producto.ubicaciones.length > 2 && (
                                        <div className="ml-2 text-blue-600">
                                          +{producto.ubicaciones.length - 2}{" "}
                                          ubicaciones más...
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        {productosFiltrados.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>
                              No hay productos en esta carpeta que coincidan con
                              la búsqueda
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>

        {Object.keys(productosAgrupados).length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No hay productos en stock
              </h3>
              <p className="text-muted-foreground">
                Los productos agregados desde mercaderías aparecerán aquí
                organizados por carpetas.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de edición de producto */}
      <EditProductModal
        isOpen={modalEditOpen}
        onClose={() => {
          setModalEditOpen(false);
          setProductoParaEditar(null);
        }}
        producto={productoParaEditar}
        onUpdate={handleUpdateProduct}
      />

      {/* Modal de movimientos de carpeta */}
      <MovimientosCarpetaModal
        isOpen={modalMovimientosOpen}
        onClose={() => {
          setModalMovimientosOpen(false);
          setCarpetaSeleccionada("");
        }}
        carpeta={carpetaSeleccionada}
      />

      {/* Modal de registrar salida */}
      <RegistrarSalidaModal
        isOpen={modalSalidaOpen}
        onClose={() => {
          setModalSalidaOpen(false);
          setProductoParaSalida(null);
        }}
        producto={productoParaSalida}
        carpeta={
          Object.entries(productosAgrupados).find(([carpeta, productos]) =>
            productos.some((p) => p.id === productoParaSalida?.id)
          )?.[0] || ""
        }
        onRegistrarSalida={registrarSalidaStock}
      />

      {/* Modal para crear nueva carpeta */}
      <AnimatePresence>
        {modalCrearCarpeta && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setModalCrearCarpeta(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <Folder className="h-5 w-5 text-blue-500" />
                  <span>Nueva Carpeta</span>
                </h3>
                <button
                  onClick={() => setModalCrearCarpeta(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="nombreCarpeta"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Nombre de la carpeta
                  </label>
                  <Input
                    id="nombreCarpeta"
                    value={nombreNuevaCarpeta}
                    onChange={(e) => setNombreNuevaCarpeta(e.target.value)}
                    placeholder="Ej: Equipos Nuevos, Repuestos Urgentes..."
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleCrearCarpeta();
                      }
                    }}
                    autoFocus
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setModalCrearCarpeta(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCrearCarpeta}
                    disabled={!nombreNuevaCarpeta.trim()}
                    className="flex items-center space-x-2"
                  >
                    <Folder className="h-4 w-4" />
                    <span>Crear Carpeta</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
