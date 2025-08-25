"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertasStockCritico } from "@/components/stock/AlertasStockCritico";
import { StockItemCard } from "@/components/stock/StockItemCard";
import { MovimientosStock } from "@/components/stock/MovimientosStock";
import {
  Package,
  Search,
  Plus,
  Folder,
  ChevronRight,
  ChevronDown,
  BarChart3,
  PlusCircle,
  LayoutGrid,
  LayoutList,
  SlidersHorizontal
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
  precio?: number;
  moneda?: string;
}

// Nueva interfaz para mostrar por "tarjetas" en lugar de lista
interface VisualizacionConfig {
  modo: 'lista' | 'tarjetas';
  mostrarFiltros: boolean;
  mostrarStockCero: boolean;
}

export default function StockPage() {
  const {
    stockItems,
    loadStock,
    loadMovimientosStock,
  } = useAppStore();

  const [busqueda, setBusqueda] = useState("");
  const [carpetasAbiertas, setCarpetasAbiertas] = useState<Set<string>>(
    new Set(["ares"])
  );
  
  // Nuevo estado para visualización
  const [visualizacion, setVisualizacion] = useState<VisualizacionConfig>({
    modo: 'tarjetas',
    mostrarFiltros: false,
    mostrarStockCero: false
  });

  // Estados para modal de movimientos general
  const [modalMovimientosGeneralOpen, setModalMovimientosGeneralOpen] = useState(false);

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
      // Si no mostramos stock cero y la cantidad es 0, omitir
      if (!visualizacion.mostrarStockCero && componente.cantidadDisponible <= 0) {
        return;
      }
      
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
        // Función para normalizar strings (manejar acentos y caracteres especiales)
        const normalizeString = (str: string) => {
          return str
            .toLowerCase()
            .normalize('NFD') // Descomponer caracteres acentuados
            .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos (acentos)
            .replace(/\s+/g, '-') // Reemplazar espacios con guiones
            .replace(/[^a-z0-9-]/g, ''); // Remover caracteres especiales excepto guiones
        };

        productoExistente = {
          id: normalizeString(`${componente.nombre}-${componente.marca}-${componente.modelo}`),
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
      
      // Actualizar imagen si el componente actual tiene una y el producto agrupado no
      if (componente.imagen && !productoExistente.imagen) {
        productoExistente.imagen = componente.imagen;
      }

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

  const productosAgrupados = agruparProductos();

  const handleStockUpdated = () => {
    // Recargar stock cuando se actualiza
    loadStock();
  };

  return (
    <DashboardLayout
      title="Stock"
      subtitle="Gestión de inventario organizado por carpetas"
    >
      <div className="max-w-7xl mx-auto p-4 bg-gray-50 rounded-xl shadow-sm">
        <div className="space-y-6">
          {/* Alertas de Stock Crítico */}
          <AlertasStockCritico 
            limite={5} 
            autoRefresh={false} 
            onStockUpdated={handleStockUpdated}
          />

          {/* Búsqueda y Acciones */}
          <Card className="border-none shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar productos..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-blue-500 rounded-lg"
                  />
                </div>
                <div className="flex items-center space-x-2 w-full md:w-auto">
                  <Button
                    onClick={() => setModalMovimientosGeneralOpen(true)}
                    variant="outline"
                    className="flex items-center space-x-2 text-blue-600 border-blue-300 hover:bg-blue-100 transition-colors"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Movimientos</span>
                  </Button>
                  <Button
                    onClick={() => (window.location.href = "/stock/nuevo")}
                    className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Nuevo Item</span>
                  </Button>
                  <Button
                    onClick={() => setModalCrearCarpeta(true)}
                    variant="outline"
                    className="flex items-center space-x-2 border-gray-300 hover:bg-gray-100"
                  >
                    <Folder className="h-4 w-4" />
                    <span>Nueva Carpeta</span>
                  </Button>
                </div>
              </div>
              
              {/* Opciones de visualización */}
              <div className="flex items-center justify-between mt-4 border-t border-gray-200 pt-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant={visualizacion.modo === 'lista' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisualizacion(prev => ({ ...prev, modo: 'lista' }))}
                    className="h-8"
                  >
                    <LayoutList className="h-4 w-4 mr-1" />
                    Lista
                  </Button>
                  <Button
                    variant={visualizacion.modo === 'tarjetas' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisualizacion(prev => ({ ...prev, modo: 'tarjetas' }))}
                    className="h-8"
                  >
                    <LayoutGrid className="h-4 w-4 mr-1" />
                    Tarjetas
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVisualizacion(prev => ({ 
                      ...prev, 
                      mostrarStockCero: !prev.mostrarStockCero 
                    }))}
                    className={`h-8 ${visualizacion.mostrarStockCero ? 'bg-blue-50 text-blue-600' : ''}`}
                  >
                    {visualizacion.mostrarStockCero ? "Ocultar" : "Mostrar"} productos sin stock
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVisualizacion(prev => ({ 
                      ...prev, 
                      mostrarFiltros: !prev.mostrarFiltros 
                    }))}
                    className="h-8"
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-1" />
                    Filtros
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
                <Card key={`empty-${carpeta}`} className="border border-gray-200 shadow-sm rounded-lg overflow-hidden">
                  <CardHeader
                    className="cursor-pointer hover:bg-gray-50 transition-colors p-4"
                    onClick={() => toggleCarpeta(carpetaId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {estaAbierta ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        )}
                        <Folder className="h-5 w-5 text-gray-400" />
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-700">
                            {carpeta}
                          </CardTitle>
                          <p className="text-sm text-gray-500">
                            0 unidades • 0 productos
                          </p>
                        </div>
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
                        <CardContent className="pt-0 bg-gray-50 p-6">
                          <div className="text-center py-8 text-gray-500">
                            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="font-medium">Esta carpeta está vacía</p>
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
                <Card key={carpeta} className="border border-gray-200 shadow-sm rounded-lg overflow-hidden">
                  <CardHeader
                    className="cursor-pointer hover:bg-gray-50 transition-colors p-4"
                    onClick={() => toggleCarpeta(carpetaId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {estaAbierta ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        )}
                        <Folder className="h-5 w-5 text-blue-500" />
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-800">
                            {carpeta}
                          </CardTitle>
                          <p className="text-sm text-gray-500">
                            {productos.reduce(
                              (sum, p) => sum + p.cantidadTotal,
                              0
                            )}{" "}
                            unidades • {productos.length} productos
                          </p>
                        </div>
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
                        <CardContent className="pt-0 p-4">
                          {visualizacion.modo === 'lista' ? (
                            // Vista de lista (Original)
                            <div className="overflow-x-auto">
                              <table className="w-full min-w-max">
                                <thead className="text-xs text-gray-600 uppercase bg-gray-50 border-b border-gray-200">
                                  <tr>
                                    <th className="text-left py-3 px-4 font-semibold">Producto</th>
                                    <th className="text-center py-3 px-4 font-semibold">Stock</th>
                                    <th className="text-right py-3 px-4 font-semibold">Acciones</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {productosFiltrados.map((producto) => (
                                    <tr key={producto.id} className="hover:bg-gray-50 transition-colors">
                                      <td className="py-3 px-4">
                                        <div className="flex items-center space-x-3">
                                          {producto.imagen && (
                                            <img
                                              src={producto.imagen}
                                              alt={producto.nombre}
                                              className="w-10 h-10 object-cover rounded-md border border-gray-200"
                                              onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                              }}
                                            />
                                          )}
                                          <div>
                                            <div className="font-medium text-sm text-gray-800">
                                              {producto.nombre}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              {producto.marca} • {producto.modelo}
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-3 px-4 text-center">
                                        <span
                                          className={`font-bold text-lg ${
                                            producto.cantidadTotal <= 5 &&
                                            producto.cantidadTotal > 0
                                              ? "text-orange-500"
                                              : producto.cantidadTotal === 0
                                              ? "text-red-500"
                                              : "text-green-500"
                                          }`}
                                        >
                                          {producto.cantidadTotal}
                                        </span>
                                        {producto.cantidadTotal <= 5 && (
                                          <div className="text-xs text-orange-500">
                                            Stock bajo
                                          </div>
                                        )}
                                      </td>
                                      <td className="py-3 px-4">
                                        <div className="flex items-center justify-end space-x-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={producto.cantidadTotal === 0}
                                            className="h-8 w-8 p-0 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                            title="Registrar salida"
                                          >
                                            <PlusCircle className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            // Vista de tarjetas (Nueva)
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {productosFiltrados.map((producto) => (
                                <StockItemCard
                                  key={producto.id}
                                  stockItem={{
                                    id: producto.id,
                                    nombre: producto.nombre,
                                    marca: producto.marca,
                                    modelo: producto.modelo,
                                    cantidadDisponible: producto.cantidadTotal,
                                    imagen: producto.imagen,
                                    precio: producto.precio,
                                    moneda: producto.moneda
                                  }}
                                  onStockUpdated={handleStockUpdated}
                                  showAdvancedFeatures={true}
                                />
                              ))}
                            </div>
                          )}

                          {productosFiltrados.length === 0 && (
                            <div className="text-center py-8 text-gray-500 bg-gray-50">
                              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p className="font-medium">
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
            <Card className="border border-gray-200 shadow-sm rounded-lg">
              <CardContent className="p-12 text-center">
                <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  No hay productos en stock
                </h3>
                <p className="text-gray-500">
                  Los productos agregados desde mercaderías aparecerán aquí
                  organizados por carpetas.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

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
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2 text-gray-800">
                  <Folder className="h-5 w-5 text-blue-500" />
                  <span>Nueva Carpeta</span>
                </h3>
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
                    className="border-gray-300 focus:border-blue-500 rounded-lg"
                    autoFocus
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setModalCrearCarpeta(false)}
                    className="border-gray-300 hover:bg-gray-100"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCrearCarpeta}
                    disabled={!nombreNuevaCarpeta.trim()}
                    className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white"
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

      {/* Modal de Movimientos Generales */}
      <Dialog open={modalMovimientosGeneralOpen} onOpenChange={setModalMovimientosGeneralOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden rounded-xl">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="flex items-center gap-2 text-gray-800">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Movimientos Recientes del Stock
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[80vh] p-4">
            <MovimientosStock />
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
