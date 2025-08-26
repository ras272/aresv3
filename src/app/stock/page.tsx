"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditProductModal } from "@/components/inventory/EditProductModal";
import { TrazabilidadStats } from "@/components/stock/TrazabilidadStats";
import { MovimientosCarpetaModal } from "@/components/stock/MovimientosCarpetaModal";
import { MovimientosStock } from "@/components/stock/MovimientosStock";
import { RegistrarSalidaModal } from "@/components/stock/RegistrarSalidaModal";
import { StockSkeleton, CarpetaSkeleton } from "@/components/stock/StockSkeleton";

import {
  Package,
  Search,
  Plus,
  Folder,
  ChevronRight,
  ChevronDown,
  Image as ImageIcon,
  BarChart3,
  ArrowDownCircle,
  Box,
  X,
  Grid3X3,
  List,
  Filter,
  SortAsc,
  SortDesc,
  MapPin,
  DollarSign,
  Calendar,
  Eye,
  EyeOff,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Star,
  Settings
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
    loadMovimientosStock,
    registrarSalidaStock,
  } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [vistaCompacta, setVistaCompacta] = useState(false);
  const [filtroStock, setFiltroStock] = useState<'todos' | 'bajo' | 'sin_stock' | 'disponible'>('todos');
  const [ordenPor, setOrdenPor] = useState<'nombre' | 'stock' | 'valor' | 'fecha'>('nombre');
  const [ordenDireccion, setOrdenDireccion] = useState<'asc' | 'desc'>('asc');
  const [carpetasAbiertas, setCarpetasAbiertas] = useState<Set<string>>(
    new Set(["ares"])
  );

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
  
  // Estado para modal de movimientos generales
  const [modalMovimientosGeneralOpen, setModalMovimientosGeneralOpen] = useState(false);

  // Estado para modal de imagen completa
  const [modalImagenOpen, setModalImagenOpen] = useState(false);
  const [imagenSeleccionada, setImagenSeleccionada] = useState<{url: string; nombre: string} | null>(null);

  // Estados para crear carpeta manualmente
  const [modalCrearCarpeta, setModalCrearCarpeta] = useState(false);
  const [nombreNuevaCarpeta, setNombreNuevaCarpeta] = useState("");

  // Estado para carpetas vacías creadas manualmente
  const [carpetasVacias, setCarpetasVacias] = useState<Set<string>>(new Set());
  


  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        await Promise.all([
          loadStock(),
          loadMovimientosStock()
        ]);
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        // Delay mínimo para mostrar el skeleton
        setTimeout(() => setLoading(false), 500);
      }
    };

    cargarDatos();
  }, [loadStock, loadMovimientosStock]);

  // Agrupar productos por marca/carpeta
  const agruparProductos = () => {
    const grupos: Record<string, ProductoAgrupado[]> = {};

    stockItems.forEach((componente) => {
      const carpeta =
        componente.marca || "Sin Clasificar";

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
          tipoComponente: componente.tipoProducto,
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
    let productosFiltrados = productos;

    // Filtro de búsqueda
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();
      productosFiltrados = productosFiltrados.filter(
        (producto) =>
          producto.nombre.toLowerCase().includes(termino) ||
          producto.marca.toLowerCase().includes(termino) ||
          producto.modelo.toLowerCase().includes(termino)
      );
    }

    // Filtro por stock
    if (filtroStock !== 'todos') {
      productosFiltrados = productosFiltrados.filter((producto) => {
        const stockTotal = producto.cantidadTotal;
        switch (filtroStock) {
          case 'sin_stock':
            return stockTotal === 0;
          case 'bajo':
            return stockTotal > 0 && stockTotal <= 5;
          case 'disponible':
            return stockTotal > 5;
          default:
            return true;
        }
      });
    }

    // Ordenamiento
    productosFiltrados.sort((a, b) => {
      let valorA: any, valorB: any;
      
      switch (ordenPor) {
        case 'stock':
          valorA = a.cantidadTotal;
          valorB = b.cantidadTotal;
          break;
        case 'valor':
          // Buscar el primer item para obtener precio
          const itemA = stockItems.find(item => 
            item.nombre === a.nombre && item.marca === a.marca && item.modelo === a.modelo
          );
          const itemB = stockItems.find(item => 
            item.nombre === b.nombre && item.marca === b.marca && item.modelo === b.modelo
          );
          valorA = (itemA?.precio || 0) * a.cantidadTotal;
          valorB = (itemB?.precio || 0) * b.cantidadTotal;
          break;
        case 'fecha':
          // Por ahora usamos el ID como proxy de fecha
          valorA = a.id;
          valorB = b.id;
          break;
        default: // nombre
          valorA = a.nombre.toLowerCase();
          valorB = b.nombre.toLowerCase();
      }
      
      if (ordenDireccion === 'asc') {
        return valorA < valorB ? -1 : valorA > valorB ? 1 : 0;
      } else {
        return valorA > valorB ? -1 : valorA < valorB ? 1 : 0;
      }
    });

    return productosFiltrados;
  };

  // Función para obtener el color del badge de stock
  const getStockBadgeColor = (cantidad: number) => {
    if (cantidad === 0) return "bg-red-100 text-red-800 border-red-200";
    if (cantidad <= 5) return "bg-orange-100 text-orange-800 border-orange-200";
    if (cantidad <= 10) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-green-100 text-green-800 border-green-200";
  };

  // Función para obtener el ícono de carpeta
  const getCarpetaIcon = (carpeta: string) => {
    const nombre = carpeta.toLowerCase();
    if (nombre.includes('urgente') || nombre.includes('critico')) return AlertTriangle;
    if (nombre.includes('nuevo') || nombre.includes('reciente')) return Star;
    if (nombre.includes('repuesto') || nombre.includes('componente')) return Settings;
    if (nombre.includes('equipo') || nombre.includes('dispositivo')) return Zap;
    return Folder;
  };

  return (
    <DashboardLayout
      title="Stock"
      subtitle="Gestión de inventario organizado por carpetas"
    >
      <div className="max-w-7xl mx-auto p-4 bg-gray-50 rounded-xl shadow-sm">
        <div className="space-y-6">
          {/* Estadísticas de Trazabilidad */}
          <TrazabilidadStats />

          {/* Barra de herramientas mejorada */}
          <Card className="border-none shadow-md">
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Primera fila: Búsqueda y vista */}
                <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar productos por nombre, marca o modelo..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="pl-10 border-gray-300 focus:border-blue-500 rounded-lg"
                    />
                  </div>
                  
                  {/* Controles de vista */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={vistaCompacta ? "default" : "outline"}
                      size="sm"
                      onClick={() => setVistaCompacta(!vistaCompacta)}
                      className="flex items-center space-x-2"
                    >
                      {vistaCompacta ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                      <span className="hidden sm:inline">
                        {vistaCompacta ? "Compacta" : "Expandida"}
                      </span>
                    </Button>
                  </div>
                </div>

                {/* Segunda fila: Filtros y ordenamiento */}
                <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  {/* Filtro por stock */}
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <select
                      value={filtroStock}
                      onChange={(e) => setFiltroStock(e.target.value as any)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="todos">Todos los productos</option>
                      <option value="disponible">Stock disponible</option>
                      <option value="bajo">Stock bajo</option>
                      <option value="sin_stock">Sin stock</option>
                    </select>
                  </div>

                  {/* Ordenamiento */}
                  <div className="flex items-center space-x-2">
                    <select
                      value={ordenPor}
                      onChange={(e) => setOrdenPor(e.target.value as any)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="nombre">Ordenar por nombre</option>
                      <option value="stock">Ordenar por stock</option>
                      <option value="valor">Ordenar por valor</option>
                      <option value="fecha">Ordenar por fecha</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOrdenDireccion(ordenDireccion === 'asc' ? 'desc' : 'asc')}
                      className="p-2"
                    >
                      {ordenDireccion === 'asc' ? 
                        <SortAsc className="h-4 w-4" /> : 
                        <SortDesc className="h-4 w-4" />
                      }
                    </Button>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center space-x-2 ml-auto">
                    <Button
                      onClick={() => setModalMovimientosGeneralOpen(true)}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2 text-blue-600 border-blue-300 hover:bg-blue-100 transition-colors"
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span className="hidden sm:inline">Movimientos</span>
                    </Button>
                    <Button
                      onClick={() => (window.location.href = "/stock/nuevo")}
                      size="sm"
                      className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Nuevo Item</span>
                    </Button>
                    <Button
                      onClick={() => setModalCrearCarpeta(true)}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2 border-gray-300 hover:bg-gray-100"
                    >
                      <Folder className="h-4 w-4" />
                      <span className="hidden sm:inline">Nueva Carpeta</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Productos organizados por carpetas */}
          {loading ? (
            <div className="space-y-6">
              <CarpetaSkeleton cantidad={3} />
            </div>
          ) : (
            <div className="space-y-4">
            {/* Mostrar carpetas vacías creadas manualmente */}
            {Array.from(carpetasVacias).map((carpeta) => {
              const carpetaId = carpeta.toLowerCase().replace(/\s+/g, "-");
              const estaAbierta = carpetasAbiertas.has(carpetaId);

              return (
                <Card key={`empty-${carpeta}`} className="border border-gray-200 shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-shadow">
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
                        {React.createElement(getCarpetaIcon(carpeta), { 
                          className: "h-5 w-5 text-gray-400" 
                        })}
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-700 flex items-center space-x-2">
                            <span>{carpeta}</span>
                            <Badge variant="outline" className="text-gray-500 border-gray-300">
                              Vacía
                            </Badge>
                          </CardTitle>
                          <p className="text-sm text-gray-500 mt-1">
                            0 unidades • 0 productos • Sin valor asignado
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <div className="text-xs text-gray-400">Valor total</div>
                          <div className="font-semibold text-gray-500">$0</div>
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
              const totalUnidades = productos.reduce((sum, p) => sum + p.cantidadTotal, 0);
              const totalProductos = productos.length;
              const productosStockBajo = productos.filter(p => p.cantidadTotal > 0 && p.cantidadTotal <= 5).length;
              const productosSinStock = productos.filter(p => p.cantidadTotal === 0).length;
              
              // Calcular valor total estimado
              const valorTotal = productos.reduce((sum, producto) => {
                const primerItem = stockItems.find(
                  item => item.nombre === producto.nombre && 
                         item.marca === producto.marca && 
                         item.modelo === producto.modelo
                );
                return sum + ((primerItem?.precio || 0) * producto.cantidadTotal);
              }, 0);

              if (productosFiltrados.length === 0 && busqueda.trim()) {
                return null;
              }

              const CarpetaIcon = getCarpetaIcon(carpeta);

              return (
                <Card key={carpeta} className="border border-gray-200 shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader
                    className="cursor-pointer hover:bg-gray-50 transition-colors p-4"
                    onClick={() => toggleCarpeta(carpetaId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        {estaAbierta ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        )}
                        <CarpetaIcon className="h-5 w-5 text-blue-500" />
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <CardTitle className="text-lg font-semibold text-gray-800">
                              {carpeta}
                            </CardTitle>
                            
                            {/* Preview de productos con imágenes */}
                            <div className="flex -space-x-2">
                              {productos.slice(0, 3).map((producto, index) => (
                                producto.imagen && (
                                  <img
                                    key={index}
                                    src={producto.imagen}
                                    alt={producto.nombre}
                                    className="w-8 h-8 rounded-full border-2 border-white object-cover hover:scale-110 transition-transform cursor-pointer"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setImagenSeleccionada({url: producto.imagen!, nombre: producto.nombre});
                                      setModalImagenOpen(true);
                                    }}
                                    title={`${producto.nombre} - Clic para ver imagen completa`}
                                  />
                                )
                              ))}
                              {productos.length > 3 && (
                                <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center hover:bg-gray-300 transition-colors">
                                  <span className="text-xs text-gray-600 font-medium">+{productos.length - 3}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 mt-2">
                            <p className="text-sm text-gray-500">
                              {totalUnidades} unidades • {totalProductos} productos
                            </p>
                            
                            {/* Badges de estado */}
                            <div className="flex items-center space-x-2">
                              {productosSinStock > 0 && (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                                  {productosSinStock} sin stock
                                </Badge>
                              )}
                              {productosStockBajo > 0 && (
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                                  {productosStockBajo} stock bajo
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {/* Valor total */}
                        <div className="text-right">
                          <div className="text-xs text-gray-400">Valor estimado</div>
                          <div className="font-semibold text-gray-700">
                            ${valorTotal.toLocaleString()}
                          </div>
                        </div>
                        
                        {/* Acciones */}
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCarpetaSeleccionada(carpeta);
                              setModalMovimientosOpen(true);
                            }}
                            className="flex items-center space-x-1 border-gray-300 hover:bg-gray-100"
                            title="Ver movimientos de esta carpeta"
                          >
                            <BarChart3 className="h-4 w-4" />
                            <span className="hidden lg:inline">Movimientos</span>
                          </Button>
                          
                          <Badge variant="outline" className="border-gray-300">
                            {productosFiltrados.length} productos
                          </Badge>
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
                          {/* Vista en grid de productos */}
                          {loading ? (
                            <StockSkeleton vistaCompacta={vistaCompacta} cantidad={6} />
                          ) : (
                            <div className={`grid gap-4 ${
                              vistaCompacta 
                                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                            }`}>
                            {productosFiltrados.map((producto) => {
                              const primerItem = stockItems.find(
                                (item) =>
                                  item.nombre === producto.nombre &&
                                  item.marca === producto.marca &&
                                  item.modelo === producto.modelo
                              );
                              
                              const valorProducto = (primerItem?.precio || 0) * producto.cantidadTotal;
                              const stockBadgeColor = getStockBadgeColor(producto.cantidadTotal);
                              
                              return (
                                <motion.div
                                  key={producto.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="group"
                                >
                                  <Card className="h-full hover:shadow-lg transition-all duration-200 border border-gray-200 group-hover:border-blue-300">
                                    <CardContent className={`p-4 h-full flex flex-col ${
                                      vistaCompacta ? 'space-y-2' : 'space-y-3'
                                    }`}>
                                      {/* Header del producto */}
                                      <div className="flex items-start space-x-3">
                                        {/* Imagen del producto */}
                                        <div className={`flex-shrink-0 ${
                                          vistaCompacta ? 'w-16 h-16' : 'w-24 h-24'
                                        }`}>
                                          {producto.imagen ? (
                                            <img
                                              src={producto.imagen}
                                              alt={producto.nombre}
                                              className={`w-full h-full object-cover rounded-lg border border-gray-200 group-hover:shadow-md transition-shadow cursor-pointer hover:scale-105 ${
                                                vistaCompacta ? '' : 'hover:scale-110'
                                              }`}
                                              onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                              }}
                                              onClick={() => {
                                                setImagenSeleccionada({url: producto.imagen!, nombre: producto.nombre});
                                                setModalImagenOpen(true);
                                              }}
                                              title="Clic para ver imagen completa"
                                            />
                                          ) : (
                                            <div className={`w-full h-full bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center`}>
                                              <Package className={`${vistaCompacta ? 'h-8 w-8' : 'h-12 w-12'} text-gray-400`} />
                                            </div>
                                          )}
                                        </div>
                                        
                                        {/* Información del producto */}
                                        <div className="flex-1 min-w-0">
                                          <h3 className={`font-semibold text-gray-800 truncate ${
                                            vistaCompacta ? 'text-sm' : 'text-base'
                                          }`} title={producto.nombre}>
                                            {producto.nombre}
                                          </h3>
                                          <p className={`text-gray-600 truncate ${
                                            vistaCompacta ? 'text-xs' : 'text-sm'
                                          }`} title={`${producto.marca} • ${producto.modelo}`}>
                                            {producto.marca} • {producto.modelo}
                                          </p>
                                          
                                          {/* Ubicaciones (solo en vista expandida) */}
                                          {!vistaCompacta && producto.ubicaciones.length > 0 && (
                                            <div className="flex items-center mt-1 text-xs text-gray-500">
                                              <MapPin className="h-3 w-3 mr-1" />
                                              <span className="truncate">
                                                {producto.ubicaciones.slice(0, 2).map(u => u.ubicacion).join(', ')}
                                                {producto.ubicaciones.length > 2 && ` +${producto.ubicaciones.length - 2}`}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {/* Información de stock */}
                                      <div className="space-y-2">
                                        {primerItem?.permite_fraccionamiento ? (
                                          /* Stock fraccionado */
                                          <div className="space-y-2">
                                            {/* Badge de estado de caja */}
                                            <div className="flex justify-center">
                                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                primerItem.estado_caja === 'cajas_completas' ? 'bg-blue-100 text-blue-800' :
                                                primerItem.estado_caja === 'caja_abierta' ? 'bg-orange-100 text-orange-800' :
                                                primerItem.estado_caja === 'solo_unidades' ? 'bg-green-100 text-green-800' :
                                                primerItem.estado_caja === 'sin_stock' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-600'
                                              }`}>
                                                {primerItem.badge_estado_caja}
                                              </span>
                                            </div>
                                            
                                            {/* Información detallada del stock fraccionado */}
                                            <div className={`grid grid-cols-2 gap-2 text-center ${
                                              vistaCompacta ? 'text-xs' : 'text-sm'
                                            }`}>
                                              <div className="bg-blue-50 rounded p-2">
                                                <div className="flex items-center justify-center text-blue-600">
                                                  <Box className="h-3 w-3 mr-1" />
                                                  <span className="font-semibold">{primerItem.cajas_completas}</span>
                                                </div>
                                                <div className="text-blue-700 text-xs">cajas</div>
                                              </div>
                                              
                                              {(primerItem.unidades_sueltas || 0) > 0 && (
                                                <div className="bg-green-50 rounded p-2">
                                                  <div className="flex items-center justify-center text-green-600">
                                                    <Package className="h-3 w-3 mr-1" />
                                                    <span className="font-semibold">{primerItem.unidades_sueltas}</span>
                                                  </div>
                                                  <div className="text-green-700 text-xs">sueltas</div>
                                                </div>
                                              )}
                                            </div>
                                            
                                            <div className="text-center">
                                              <div className="text-sm font-semibold text-blue-600">
                                                Total: {primerItem.unidades_totales} unidades
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          /* Stock normal */
                                          <div className="text-center">
                                            <div className={`flex items-center justify-center space-x-2 ${
                                              vistaCompacta ? 'text-lg' : 'text-2xl'
                                            }`}>
                                              <span className={`font-bold ${
                                                producto.cantidadTotal <= 5 && producto.cantidadTotal > 0
                                                  ? "text-orange-500"
                                                  : producto.cantidadTotal === 0
                                                  ? "text-red-500"
                                                  : "text-green-500"
                                              }`}>
                                                {producto.cantidadTotal}
                                              </span>
                                              <span className="text-sm text-gray-500">unidades</span>
                                            </div>
                                            
                                            {producto.cantidadTotal <= 5 && producto.cantidadTotal > 0 && (
                                              <div className="flex items-center justify-center text-orange-500 text-xs mt-1">
                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                <span>Stock bajo</span>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Información adicional (solo en vista expandida) */}
                                      {!vistaCompacta && (
                                        <div className="space-y-2 pt-2 border-t border-gray-100">
                                          {/* Precio y valor */}
                                          {primerItem?.precio && primerItem.precio > 0 && (
                                            <div className="flex items-center justify-between text-sm">
                                              <span className="text-gray-600 flex items-center">
                                                <DollarSign className="h-3 w-3 mr-1" />
                                                Precio unit.
                                              </span>
                                              <span className="font-medium">
                                                ${primerItem.precio.toLocaleString()}
                                              </span>
                                            </div>
                                          )}
                                          
                                          {valorProducto > 0 && (
                                            <div className="flex items-center justify-between text-sm">
                                              <span className="text-gray-600">Valor total</span>
                                              <span className="font-semibold text-blue-600">
                                                ${valorProducto.toLocaleString()}
                                              </span>
                                            </div>
                                          )}
                                          
                                          {/* Observaciones */}
                                          {producto.observaciones && (
                                            <div className="text-xs text-gray-500 truncate" title={producto.observaciones}>
                                              {producto.observaciones}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      
                                      {/* Acciones */}
                                      <div className="flex items-center justify-end space-x-2 mt-auto pt-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => abrirModalEdit(producto)}
                                          className="h-8 w-8 p-0 text-gray-600 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                                          title="Editar producto"
                                        >
                                          <ImageIcon className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setProductoParaSalida(producto);
                                            setModalSalidaOpen(true);
                                          }}
                                          className="h-8 w-8 p-0 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                          title="Registrar salida"
                                          disabled={producto.cantidadTotal === 0}
                                        >
                                          <ArrowDownCircle className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              );
                            })}
                            </div>
                          )}

                          {!loading && productosFiltrados.length === 0 && (
                            <div className="col-span-full">
                              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                                <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p className="font-medium text-lg mb-2">
                                  No hay productos en esta carpeta
                                </p>
                                <p className="text-sm">
                                  {busqueda.trim() 
                                    ? "No se encontraron productos que coincidan con la búsqueda" 
                                    : "Los productos agregados desde mercaderías aparecerán aquí"
                                  }
                                </p>
                                {busqueda.trim() && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setBusqueda('')}
                                    className="mt-3"
                                  >
                                    Limpiar búsqueda
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}

            {Object.keys(productosAgrupados).length === 0 && Array.from(carpetasVacias).length === 0 && (
              <Card className="border border-gray-200 shadow-sm rounded-lg">
                <CardContent className="p-16 text-center">
                  <div className="max-w-md mx-auto">
                    <Package className="w-20 h-20 mx-auto text-gray-400 mb-6" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">
                      Tu inventario está vacío
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Los productos agregados desde mercaderías aparecerán aquí 
                      organizados automáticamente por carpetas.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        onClick={() => (window.location.href = "/stock/nuevo")}
                        className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Agregar Primer Producto</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => (window.location.href = "/mercaderias")}
                        className="flex items-center space-x-2"
                      >
                        <Package className="h-4 w-4" />
                        <span>Ir a Mercaderías</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          )}
        </div>
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
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2 text-gray-800">
                  <Folder className="h-5 w-5 text-blue-500" />
                  <span>Nueva Carpeta</span>
                </h3>
                <Button
                  onClick={() => setModalCrearCarpeta(false)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
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
          <DialogHeader>
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

      {/* Modal de Imagen Completa */}
      <AnimatePresence>
        {modalImagenOpen && imagenSeleccionada && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
            onClick={() => setModalImagenOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del modal */}
              <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
                <div className="flex items-center space-x-3">
                  <ImageIcon className="h-5 w-5 text-blue-500" />
                  <div>
                    <h3 className="font-semibold text-gray-800">{imagenSeleccionada.nombre}</h3>
                    <p className="text-sm text-gray-500">Vista previa de imagen</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(imagenSeleccionada.url, '_blank')}
                    className="text-gray-600 hover:text-blue-500"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Abrir original
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setModalImagenOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Contenido de la imagen */}
              <div className="p-4 flex items-center justify-center bg-gray-100">
                <img
                  src={imagenSeleccionada.url}
                  alt={imagenSeleccionada.nombre}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-image.png';
                  }}
                />
              </div>
              
              {/* Footer con acciones */}
              <div className="flex items-center justify-between p-4 bg-gray-50 border-t">
                <div className="text-sm text-gray-600">
                  Haz clic fuera de la imagen para cerrar
                </div>
                <Button
                  onClick={() => setModalImagenOpen(false)}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-100"
                >
                  Cerrar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}