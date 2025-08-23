"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Plus,
  Minus,
  FileText,
  Package,
  MapPin,
  User,
  Phone,
  Search,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ComponenteDisponible, ProductoRemision, Remision } from "@/types";

// 🆕 NUEVO: Componente para mostrar productos agrupados con selector de números de serie
interface ProductoAgrupadoItemProps {
  grupo: {
    nombre: string;
    marca: string;
    modelo: string;
    origen: string;
    origenLabel: string;
    items: any[];
  };
  tieneNumerosSerie: boolean;
  stockTotal: number;
  onAgregarProducto: (componente: any, tipoVenta?: 'unidad' | 'caja') => void;
}

function ProductoAgrupadoItem({ grupo, tieneNumerosSerie, stockTotal, onAgregarProducto }: ProductoAgrupadoItemProps) {
  const [mostrarSelector, setMostrarSelector] = useState(false);
  const [numeroSerieSeleccionado, setNumeroSerieSeleccionado] = useState("");
  const [mostrarSelectorFraccionamiento, setMostrarSelectorFraccionamiento] = useState(false);
  const [tipoVentaSeleccionado, setTipoVentaSeleccionado] = useState<'unidad' | 'caja'>('unidad');
  
  // Detectar si el producto permite fraccionamiento
  const permiteFraccionamiento = grupo.items.some(item => item.permite_fraccionamiento);
  const itemFraccionamiento = grupo.items.find(item => item.permite_fraccionamiento);

  const handleAgregarProducto = (tipoVentaParam?: 'unidad' | 'caja') => {
    if (tieneNumerosSerie) {
      if (!numeroSerieSeleccionado) {
        toast.error("Selecciona un número de serie específico");
        return;
      }
      // Encontrar el item específico con el número de serie seleccionado
      const itemSeleccionado = grupo.items.find(item => item.numeroSerie === numeroSerieSeleccionado);
      if (itemSeleccionado) {
        onAgregarProducto(itemSeleccionado, tipoVentaParam);
        setNumeroSerieSeleccionado("");
        setMostrarSelector(false);
        setMostrarSelectorFraccionamiento(false);
      }
    } else if (permiteFraccionamiento) {
      // Mostrar selector de fraccionamiento
      if (!tipoVentaParam) {
        setMostrarSelectorFraccionamiento(true);
        return;
      }
      // Agregar producto con tipo de venta
      onAgregarProducto(grupo.items[0], tipoVentaParam);
      setMostrarSelectorFraccionamiento(false);
    } else {
      // Si no tiene números de serie ni fraccionamiento, agregar el primer item disponible
      onAgregarProducto(grupo.items[0]);
    }
  };

  if (tieneNumerosSerie) {
    return (
      <div className="border rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-semibold text-base">{grupo.nombre}</div>
            <div className="text-sm text-gray-600 mt-1">
              {grupo.marca} {grupo.modelo}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="outline" className="text-sm px-3 py-1">
                Stock: {stockTotal}
              </Badge>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {grupo.origenLabel}
              </Badge>
              <Badge variant="default" className="text-sm px-3 py-1 bg-blue-100 text-blue-800">
                Con números de serie
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            size="default"
            onClick={() => setMostrarSelector(!mostrarSelector)}
            className="text-blue-600 hover:text-blue-700 px-4 py-2"
          >
            <Plus className="w-5 h-5 mr-2" />
            Seleccionar
          </Button>
        </div>

        {/* Selector elegante de números de serie */}
        <AnimatePresence>
          {mostrarSelector && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-5"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-base font-medium text-blue-800">
                  Selecciona el número de serie específico:
                </span>
              </div>

              <Select value={numeroSerieSeleccionado} onValueChange={setNumeroSerieSeleccionado}>
                <SelectTrigger className="w-full h-12 text-base">
                  <SelectValue placeholder="Seleccionar número de serie...">
                    {numeroSerieSeleccionado && (
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="font-mono text-base">{numeroSerieSeleccionado}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {grupo.items
                    .filter(item => item.numeroSerie && item.cantidadDisponible > 0)
                    .map((item) => (
                      <SelectItem key={item.id} value={item.numeroSerie}>
                        <div className="flex items-center space-x-4 py-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <div className="flex flex-col">
                            <span className="font-mono text-base font-medium text-gray-900">
                              {item.numeroSerie}
                            </span>
                            <span className="text-sm text-gray-500">
                              Stock: {item.cantidadDisponible} • Disponible
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <div className="flex justify-end space-x-3 mt-5">
                <Button
                  variant="ghost"
                  size="default"
                  onClick={() => {
                    setMostrarSelector(false);
                    setNumeroSerieSeleccionado("");
                  }}
                  className="px-6 py-2"
                >
                  Cancelar
                </Button>
                <Button
                  size="default"
                  onClick={handleAgregarProducto}
                  disabled={!numeroSerieSeleccionado}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Agregar a Remisión
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Para productos sin números de serie
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div 
        className="flex items-center justify-between hover:bg-gray-50 p-2 rounded cursor-pointer transition-colors"
        onClick={() => handleAgregarProducto()}
      >
        <div className="flex-1">
          <div className="font-medium text-sm">{grupo.nombre}</div>
          <div className="text-xs text-gray-500">
            {grupo.marca} {grupo.modelo}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              Stock: {stockTotal}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {grupo.origenLabel}
            </Badge>
            {permiteFraccionamiento && itemFraccionamiento?.badge_estado_caja && (
              <Badge 
                variant="outline" 
                className="text-xs border-green-200 text-green-800 bg-green-50"
              >
                {itemFraccionamiento.badge_estado_caja}
              </Badge>
            )}
          </div>
        </div>
        <Plus className="w-4 h-4 text-blue-600" />
      </div>

      {/* 📦 SELECTOR DE FRACCIONAMIENTO */}
      <AnimatePresence>
        {mostrarSelectorFraccionamiento && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Package className="w-5 h-5 text-green-600" />
              <span className="text-base font-medium text-green-800">
                ¿Cómo deseas vender este producto?
              </span>
            </div>

            {itemFraccionamiento && (
              <div className="bg-white p-3 rounded-lg mb-4 border border-green-100">
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Stock disponible:</strong>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span>📦 {itemFraccionamiento.cajas_completas} cajas completas</span>
                  <span>🔗 {itemFraccionamiento.unidades_sueltas} unidades sueltas</span>
                  <span className="text-xs text-gray-500">
                    ({itemFraccionamiento.unidades_por_paquete} unidades por caja)
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={tipoVentaSeleccionado === 'unidad' ? 'default' : 'outline'}
                onClick={() => {
                  setTipoVentaSeleccionado('unidad');
                  handleAgregarProducto('unidad');
                }}
                className="h-16 flex flex-col items-center justify-center space-y-1"
              >
                <div className="text-2xl">🔗</div>
                <span className="text-sm font-medium">Por Unidad</span>
                <span className="text-xs text-gray-500">Vender unidades sueltas</span>
              </Button>

              <Button
                variant={tipoVentaSeleccionado === 'caja' ? 'default' : 'outline'}
                onClick={() => {
                  setTipoVentaSeleccionado('caja');
                  handleAgregarProducto('caja');
                }}
                className="h-16 flex flex-col items-center justify-center space-y-1"
                disabled={(itemFraccionamiento?.cajas_completas || 0) === 0}
              >
                <div className="text-2xl">📦</div>
                <span className="text-sm font-medium">Por Caja</span>
                <span className="text-xs text-gray-500">
                  Caja de {itemFraccionamiento?.unidades_por_paquete} unidades
                </span>
              </Button>
            </div>

            <div className="flex justify-end mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMostrarSelectorFraccionamiento(false)}
                className="text-gray-600"
              >
                Cancelar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ModalRemisionProps {
  isOpen: boolean;
  onClose: () => void;
  componentePreseleccionado?: ComponenteDisponible;
  remisionParaEditar?: Remision | null;
}

const TIPOS_REMISION = [
  "Instalación",
  "Mantenimiento",
  "Reparación",
  "Entrega",
] as const;

const TECNICOS_PREDEFINIDOS = [
  "Jack Green",
  "William Green",
  "Otro (personalizar)",
] as const;

export default function ModalRemision({
  isOpen,
  onClose,
  componentePreseleccionado,
  remisionParaEditar,
}: ModalRemisionProps) {
  const {
    stockItems,
    loadStock,
    addRemision,
    updateRemision,
    generateNumeroRemision,
    getClinicasActivas,
    procesarSalidaStock,
  } = useAppStore();

  // Estados del formulario
  const [clienteSeleccionado, setClienteSeleccionado] = useState("");
  const [numeroFactura, setNumeroFactura] = useState("");
  const [tipoRemision, setTipoRemision] =
    useState<(typeof TIPOS_REMISION)[number]>("Entrega");
  const [tecnicoSeleccionado, setTecnicoSeleccionado] =
    useState<(typeof TECNICOS_PREDEFINIDOS)[number]>("Jack Green");
  const [tecnicoPersonalizado, setTecnicoPersonalizado] = useState("");
  const [descripcionGeneral, setDescripcionGeneral] = useState("");
  const [productosSeleccionados, setProductosSeleccionados] = useState<
    ProductoRemision[]
  >([]);
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [loading, setLoading] = useState(false);

  // Obtener clínicas activas
  const clinicasActivas = getClinicasActivas();

  // Cargar stock al abrir modal
  useEffect(() => {
    if (isOpen) {
      loadStock(); // Solo cargar el stock general

      // Si hay remisión para editar, cargar sus datos
      if (remisionParaEditar) {
        setClienteSeleccionado(remisionParaEditar.cliente);
        setNumeroFactura(remisionParaEditar.numeroFactura || "");
        setTipoRemision(remisionParaEditar.tipoRemision);
        // Determinar si el técnico es predefinido o personalizado
        const tecnicoEditar = remisionParaEditar.tecnicoResponsable;
        const esPredefinido = TECNICOS_PREDEFINIDOS.includes(
          tecnicoEditar as any
        );

        if (esPredefinido) {
          setTecnicoSeleccionado(
            tecnicoEditar as (typeof TECNICOS_PREDEFINIDOS)[number]
          );
          setTecnicoPersonalizado("");
        } else {
          setTecnicoSeleccionado("Otro (personalizar)");
          setTecnicoPersonalizado(tecnicoEditar);
        }
        setDescripcionGeneral(remisionParaEditar.descripcionGeneral || "");
        // Validar que los productos tengan componenteId válidos
        const productosValidos = remisionParaEditar.productos.filter(
          (producto) =>
            producto.componenteId && producto.componenteId !== "undefined"
        );
        setProductosSeleccionados(productosValidos);
      } else {
        // Limpiar formulario para nueva remisión
        setClienteSeleccionado("");
        setNumeroFactura("");
        setTipoRemision("Entrega");
        setTecnicoSeleccionado("Jack Green");
        setTecnicoPersonalizado("");
        setDescripcionGeneral("");
        setProductosSeleccionados([]);
        setBusquedaProducto("");

        // Si hay componente preseleccionado, agregarlo automáticamente
        if (componentePreseleccionado) {
          const productoPreseleccionado: ProductoRemision = {
            id: Date.now().toString(),
            componenteId: componentePreseleccionado.id,
            nombre: componentePreseleccionado.nombre,
            marca: componentePreseleccionado.marca,
            modelo: componentePreseleccionado.modelo,
            numeroSerie: componentePreseleccionado.numeroSerie,
            cantidadSolicitada: 1,
            cantidadDisponible: componentePreseleccionado.cantidadDisponible,
            observaciones: "",
          };
          setProductosSeleccionados([productoPreseleccionado]);
        }
      }
    }
  }, [isOpen, componentePreseleccionado, remisionParaEditar, loadStock]);

  // Solo usar productos del stock general
  const todosLosProductos = React.useMemo(() => {
    const productosStock = stockItems
      .filter((item) => item.cantidadDisponible > 0)
      .map((item) => ({
        id: item.id,
        nombre: item.nombre,
        marca: item.marca || "N/A",
        modelo: item.modelo || "N/A",
        numeroSerie: item.numeroSerie || undefined,
        cantidadDisponible: item.cantidadDisponible,
        estado: "Disponible" as const,
        // 🔧 CORRECCIÓN: Todos los productos de stockItems son del stock general
        origen: "stock" as const,
        origenLabel: "Stock General",
        // 📦 NUEVO: Información de fraccionamiento
        permite_fraccionamiento: item.permite_fraccionamiento || false,
        unidades_por_paquete: item.unidades_por_paquete || 1,
        cajas_completas: item.cajas_completas || 0,
        unidades_sueltas: item.unidades_sueltas || 0,
        badge_estado_caja: item.badge_estado_caja || null,
      }));

    return productosStock;
  }, [stockItems]);

  // Filtrar productos combinados para búsqueda
  const componentesFiltrados = todosLosProductos.filter(
    (comp) =>
      comp.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
      comp.marca.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
      comp.modelo.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
      comp.numeroSerie?.toLowerCase().includes(busquedaProducto.toLowerCase())
  );

  // Agregar producto a la remisión
  const agregarProducto = (componente: any, tipoVenta?: 'unidad' | 'caja') => {
    const yaExiste = productosSeleccionados.find(
      (p) => p.componenteId === componente.id && p.origen === componente.origen
    );
    if (yaExiste) {
      toast.error("Este producto ya está agregado a la remisión");
      return;
    }

    const nuevoProducto: ProductoRemision = {
      id: Date.now().toString(),
      // 🔧 CORRECCIÓN: Todos los productos de stockItems van como stockItemId
      componenteId: null, // No usar componenteId para productos de stockItems
      stockItemId: componente.id, // Usar stockItemId para todos los productos de stockItems
      origen: componente.origen, // 'stock'
      nombre: componente.nombre,
      marca: componente.marca,
      modelo: componente.modelo,
      numeroSerie: componente.numeroSerie,
      cantidadSolicitada: 1,
      cantidadDisponible: componente.cantidadDisponible,
      observaciones: "",
      // 📦 NUEVO: Agregar tipo de venta para productos fraccionables
      tipoVenta: tipoVenta,
    };

    setProductosSeleccionados([...productosSeleccionados, nuevoProducto]);
    setBusquedaProducto("");
    
    // Mensaje personalizado según el tipo de venta
    const mensaje = tipoVenta 
      ? `${componente.nombre} agregado (${tipoVenta === 'caja' ? 'por caja' : 'por unidad'})`
      : `${componente.nombre} agregado a la remisión`;
    toast.success(mensaje);
  };

  // Actualizar cantidad de producto
  const actualizarCantidad = (productoId: string, nuevaCantidad: number) => {
    setProductosSeleccionados((productos) =>
      productos.map((p) =>
        p.id === productoId
          ? {
              ...p,
              cantidadSolicitada: Math.max(
                1,
                Math.min(nuevaCantidad, p.cantidadDisponible)
              ),
            }
          : p
      )
    );
  };

  // Actualizar observaciones de producto
  const actualizarObservaciones = (
    productoId: string,
    observaciones: string
  ) => {
    setProductosSeleccionados((productos) =>
      productos.map((p) => (p.id === productoId ? { ...p, observaciones } : p))
    );
  };

  // Remover producto
  const removerProducto = (productoId: string) => {
    setProductosSeleccionados((productos) =>
      productos.filter((p) => p.id !== productoId)
    );
  };

  // Obtener datos del cliente seleccionado
  const datosCliente = clinicasActivas.find(
    (c) => c.nombre === clienteSeleccionado
  );

  // Obtener el técnico responsable final
  const tecnicoResponsable =
    tecnicoSeleccionado === "Otro (personalizar)"
      ? tecnicoPersonalizado
      : tecnicoSeleccionado;

  // Generar o actualizar remisión
  const generarRemision = async () => {
    if (!clienteSeleccionado) {
      toast.error("Selecciona un cliente");
      return;
    }

    if (productosSeleccionados.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }

    // Validar que todos los productos tengan IDs válidos (componenteId o stockItemId)
    const productosInvalidos = productosSeleccionados.filter(
      (producto) =>
        (!producto.componenteId && !producto.stockItemId) ||
        producto.componenteId === "undefined" ||
        producto.stockItemId === "undefined"
    );

    if (productosInvalidos.length > 0) {
      toast.error(
        "Algunos productos no tienen ID válido. Por favor, elimínalos y agrégalos nuevamente."
      );
      console.error("Productos con ID inválido:", productosInvalidos);
      return;
    }

    setLoading(true);

    // Debug: Log de productos seleccionados
    console.log("🔍 Productos seleccionados:", productosSeleccionados);
    console.log("🔍 Cliente seleccionado:", clienteSeleccionado);
    console.log("🔍 Técnico responsable:", tecnicoResponsable);

    try {
      if (remisionParaEditar) {
        // Modo edición
        const remisionActualizada: Partial<Remision> = {
          numeroFactura: numeroFactura || undefined,
          cliente: clienteSeleccionado,
          direccionEntrega:
            datosCliente?.direccion || remisionParaEditar.direccionEntrega,
          contacto:
            datosCliente?.contactoPrincipal || remisionParaEditar.contacto,
          telefono: datosCliente?.telefono || remisionParaEditar.telefono,
          tipoRemision,
          tecnicoResponsable: tecnicoResponsable,
          productos: productosSeleccionados,
          descripcionGeneral: descripcionGeneral || undefined,
        };

        await updateRemision(remisionParaEditar.id, remisionActualizada);

        toast.success("Remisión actualizada exitosamente", {
          description: `Se actualizó la remisión ${remisionParaEditar.numeroRemision}`,
        });
      } else {
        // Modo creación
        const numeroRemisionGenerado = await generateNumeroRemision();

        const nuevaRemision: Omit<
          Remision,
          "id" | "numeroRemision" | "createdAt" | "updatedAt"
        > = {
          fecha: new Date().toISOString(),
          numeroFactura: numeroFactura || undefined,
          cliente: clienteSeleccionado,
          direccionEntrega: datosCliente?.direccion || "",
          contacto: datosCliente?.contactoPrincipal,
          telefono: datosCliente?.telefono,
          tipoRemision,
          tecnicoResponsable: tecnicoResponsable,
          productos: productosSeleccionados,
          descripcionGeneral: descripcionGeneral || undefined,
          estado: "Confirmada",
        };

        console.log(
          "🔍 Nueva remisión a crear:",
          JSON.stringify(nuevaRemision, null, 2)
        );

        // Crear la remisión (operación crítica)
        await addRemision(nuevaRemision);

        // 🚀 PROCESAR SALIDA DE STOCK AUTOMÁTICAMENTE (operación no crítica)
        let erroresStock = 0;
        for (const producto of productosSeleccionados) {
          try {
            // 🔧 CORRECCIÓN: Usar el ID correcto según el origen
            const itemId = producto.componenteId; // Para componentes_disponibles
            const stockItemId = producto.stockItemId; // Para stock_items

            await procesarSalidaStock(
              itemId, // ID del componente_disponibles (null si es stock_items)
              stockItemId, // ID del stock_items (null si es componentes_disponibles)
              producto.cantidadSolicitada,
              `REMISIÓN - ${clienteSeleccionado}`,
              numeroRemisionGenerado,
              numeroFactura || undefined,
              clienteSeleccionado,
              producto.tipoVenta // 📦 NUEVO: Pasar tipo de venta para productos fraccionables
            );
          } catch (error) {
            erroresStock++;
            console.error(
              `Error procesando stock para ${producto.nombre}:`,
              error
            );
            // No mostrar toast individual para evitar spam de errores
          }
        }

        // Mostrar mensaje de éxito con información sobre errores de stock si los hay
        if (erroresStock > 0) {
          toast.success("Remisión generada exitosamente", {
            description: `Se creó la remisión para ${clienteSeleccionado}. Nota: Algunos productos pueden requerir ajuste manual de stock.`,
          });
        } else {
          toast.success("Remisión generada exitosamente", {
            description: `Se creó la remisión para ${clienteSeleccionado}`,
          });
        }
      }

      // Limpiar formulario
      setClienteSeleccionado("");
      setNumeroFactura("");
      setTipoRemision("Entrega");
      setTecnicoSeleccionado("Jack Green");
      setTecnicoPersonalizado("");
      setDescripcionGeneral("");
      setProductosSeleccionados([]);
      setBusquedaProducto("");

      onClose();
    } catch (error) {
      console.error("Error al procesar remisión:", error);
      toast.error(
        remisionParaEditar
          ? "Error al actualizar la remisión"
          : "Error al generar la remisión"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6" />
                <div>
                  <h2 className="text-xl font-bold">
                    {remisionParaEditar
                      ? "Editar Remisión Digital"
                      : "Nueva Remisión Digital"}
                  </h2>
                  <p className="text-blue-100 text-sm">
                    {remisionParaEditar
                      ? `Editando: ${remisionParaEditar.numeroRemision}`
                      : "Sistema de trazabilidad ARES"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Información del Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Información del Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="cliente">Cliente / Hospital</Label>
                    <Select
                      value={clienteSeleccionado}
                      onValueChange={setClienteSeleccionado}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clinicasActivas.length === 0 ? (
                          <SelectItem value="no-clinicas" disabled>
                            No hay clínicas registradas
                          </SelectItem>
                        ) : (
                          clinicasActivas.map((clinica) => (
                            <SelectItem key={clinica.id} value={clinica.nombre}>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {clinica.nombre}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {clinica.contactoPrincipal || clinica.ciudad}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {datosCliente && (
                    <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>{datosCliente.direccion}</span>
                      </div>
                      {datosCliente.contactoPrincipal && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-gray-500" />
                          <span>{datosCliente.contactoPrincipal}</span>
                        </div>
                      )}
                      {datosCliente.telefono && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span>{datosCliente.telefono}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="tipoRemision">Tipo de Remisión</Label>
                    <Select
                      value={tipoRemision}
                      onValueChange={(value: (typeof TIPOS_REMISION)[number]) =>
                        setTipoRemision(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_REMISION.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="numeroFactura">Número de Factura</Label>
                    <Input
                      id="numeroFactura"
                      placeholder="Ej: 001-001-0001234"
                      value={numeroFactura}
                      onChange={(e) => setNumeroFactura(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="tecnicoResponsable">¿Quién entrega?</Label>
                    <Select
                      value={tecnicoSeleccionado}
                      onValueChange={(
                        value: (typeof TECNICOS_PREDEFINIDOS)[number]
                      ) => setTecnicoSeleccionado(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TECNICOS_PREDEFINIDOS.map((tecnico) => (
                          <SelectItem key={tecnico} value={tecnico}>
                            {tecnico}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Campo de texto personalizado cuando se selecciona "Otro" */}
                    {tecnicoSeleccionado === "Otro (personalizar)" && (
                      <div className="mt-2">
                        <Input
                          placeholder="Escribe el nombre del técnico..."
                          value={tecnicoPersonalizado}
                          onChange={(e) =>
                            setTecnicoPersonalizado(e.target.value)
                          }
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="descripcion">Descripción General</Label>
                    <Textarea
                      id="descripcion"
                      placeholder="Observaciones generales de la remisión..."
                      value={descripcionGeneral}
                      onChange={(e) => setDescripcionGeneral(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Selección de Productos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Productos Disponibles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Buscar productos por nombre, marca, modelo..."
                        value={busquedaProducto}
                        onChange={(e) => setBusquedaProducto(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <div className="max-h-96 overflow-y-auto space-y-3">
                      {(() => {
                        // 🆕 NUEVO: Agrupar productos por nombre/marca/modelo
                        const productosAgrupados = componentesFiltrados.reduce((grupos, componente) => {
                          const clave = `${componente.nombre}-${componente.marca}-${componente.modelo}`;
                          if (!grupos[clave]) {
                            grupos[clave] = {
                              nombre: componente.nombre,
                              marca: componente.marca,
                              modelo: componente.modelo,
                              origen: componente.origen,
                              origenLabel: componente.origenLabel,
                              items: []
                            };
                          }
                          grupos[clave].items.push(componente);
                          return grupos;
                        }, {} as Record<string, any>);

                        return Object.values(productosAgrupados).map((grupo: any) => {
                          const tieneNumerosSerie = grupo.items.some((item: any) => item.numeroSerie);
                          const stockTotal = grupo.items.reduce((total: number, item: any) => total + item.cantidadDisponible, 0);

                          return (
                            <ProductoAgrupadoItem
                              key={`${grupo.nombre}-${grupo.marca}-${grupo.modelo}`}
                              grupo={grupo}
                              tieneNumerosSerie={tieneNumerosSerie}
                              stockTotal={stockTotal}
                              onAgregarProducto={agregarProducto}
                            />
                          );
                        });
                      })()}

                      {busquedaProducto &&
                        componentesFiltrados.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No se encontraron productos</p>
                          </div>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Productos Seleccionados */}
            {productosSeleccionados.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Productos en la Remisión ({productosSeleccionados.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {productosSeleccionados.map((producto) => (
                      <div key={producto.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{producto.nombre}</h4>
                              {producto.tipoVenta && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    producto.tipoVenta === 'caja' 
                                      ? 'border-green-200 text-green-800 bg-green-50' 
                                      : 'border-blue-200 text-blue-800 bg-blue-50'
                                  }`}
                                >
                                  {producto.tipoVenta === 'caja' ? '📦 Por Caja' : '🔗 Por Unidad'}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {producto.marca} {producto.modelo}
                              {producto.numeroSerie &&
                                ` • S/N: ${producto.numeroSerie}`}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removerProducto(producto.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs">Cantidad</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  actualizarCantidad(
                                    producto.id,
                                    producto.cantidadSolicitada - 1
                                  )
                                }
                                disabled={producto.cantidadSolicitada <= 1}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <Input
                                type="number"
                                value={producto.cantidadSolicitada}
                                onChange={(e) =>
                                  actualizarCantidad(
                                    producto.id,
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                className="w-20 text-center"
                                min={1}
                                max={producto.cantidadDisponible}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  actualizarCantidad(
                                    producto.id,
                                    producto.cantidadSolicitada + 1
                                  )
                                }
                                disabled={
                                  producto.cantidadSolicitada >=
                                  producto.cantidadDisponible
                                }
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                              <span className="text-xs text-gray-500 ml-2">
                                / {producto.cantidadDisponible} disponible
                              </span>
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs">Observaciones</Label>
                            <Input
                              placeholder="Observaciones específicas..."
                              value={producto.observaciones || ""}
                              onChange={(e) =>
                                actualizarObservaciones(
                                  producto.id,
                                  e.target.value
                                )
                              }
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Técnico:</span>{" "}
                {tecnicoResponsable}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  onClick={generarRemision}
                  disabled={
                    loading ||
                    !clienteSeleccionado ||
                    productosSeleccionados.length === 0
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading
                    ? remisionParaEditar
                      ? "Actualizando..."
                      : "Generando..."
                    : remisionParaEditar
                    ? "Actualizar Remisión"
                    : "Generar Remisión"}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
