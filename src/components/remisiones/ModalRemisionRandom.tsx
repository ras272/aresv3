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
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Remision } from "@/types";
import { ProductoRandomForm } from "./ProductoRandomForm";

interface ModalRemisionRandomProps {
  isOpen: boolean;
  onClose: () => void;
  remisionParaEditar?: Remision | null;
}

const TECNICOS_PREDEFINIDOS = [
  "Jack Green",
  "William Green",
  "Otro (personalizar)",
] as const;

export default function ModalRemisionRandom({
  isOpen,
  onClose,
  remisionParaEditar,
}: ModalRemisionRandomProps) {
  const {
    addRemision,
    updateRemision,
    generateNumeroRemision,
    getClinicasActivas,
    loadClinicas, // 🆕 Agregar loadClinicas
  } = useAppStore();

  // Estados del formulario
  const [clienteSeleccionado, setClienteSeleccionado] = useState("");
  const [numeroFactura, setNumeroFactura] = useState("");
  const [tecnicoSeleccionado, setTecnicoSeleccionado] =
    useState<(typeof TECNICOS_PREDEFINIDOS)[number]>("Jack Green");
  const [tecnicoPersonalizado, setTecnicoPersonalizado] = useState("");
  const [descripcionGeneral, setDescripcionGeneral] = useState("");
  const [productosSeleccionados, setProductosSeleccionados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Obtener clínicas activas
  const clinicasActivas = getClinicasActivas();

  // Cargar datos al abrir modal
  useEffect(() => {
    if (isOpen) {
      loadClinicas(); // 🆕 Cargar clínicas cuando se abre el modal
      
      if (remisionParaEditar) {
        // Modo edición
        setClienteSeleccionado(remisionParaEditar.cliente);
        setNumeroFactura(remisionParaEditar.numeroFactura || "");
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
        setProductosSeleccionados(remisionParaEditar.productos);
      } else {
        // Modo creación - limpiar formulario
        setClienteSeleccionado("");
        setNumeroFactura("");
        setTecnicoSeleccionado("Jack Green");
        setTecnicoPersonalizado("");
        setDescripcionGeneral("");
        setProductosSeleccionados([]);
      }
    }
  }, [isOpen, remisionParaEditar, loadClinicas]);

  // Agregar producto a la remisión
  const handleAgregarProducto = (producto: any) => {
    setProductosSeleccionados([...productosSeleccionados, producto]);
  };

  // Actualizar cantidad de producto
  const actualizarCantidad = (productoId: string, nuevaCantidad: number) => {
    setProductosSeleccionados((productos) =>
      productos.map((p) =>
        p.id === productoId
          ? {
              ...p,
              cantidadSolicitada: Math.max(1, nuevaCantidad),
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
      toast.error("Agrega al menos un producto o servicio");
      return;
    }

    setLoading(true);

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
          tipoRemision: "Random",
          tecnicoResponsable: tecnicoResponsable,
          productos: productosSeleccionados,
          descripcionGeneral: descripcionGeneral || undefined,
        };

        await updateRemision(remisionParaEditar.id, remisionActualizada);

        toast.success("Remisión random actualizada exitosamente", {
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
          tipoRemision: "Random",
          tecnicoResponsable: tecnicoResponsable,
          productos: productosSeleccionados,
          descripcionGeneral: descripcionGeneral || undefined,
          estado: "Confirmada",
        };

        await addRemision(nuevaRemision);

        toast.success("Remisión random generada exitosamente", {
          description: `Se creó la remisión para ${clienteSeleccionado}`,
        });
      }

      // Limpiar formulario
      setClienteSeleccionado("");
      setNumeroFactura("");
      setTecnicoSeleccionado("Jack Green");
      setTecnicoPersonalizado("");
      setDescripcionGeneral("");
      setProductosSeleccionados([]);

      onClose();
    } catch (error) {
      console.error("Error al procesar remisión random:", error);
      toast.error(
        remisionParaEditar
          ? "Error al actualizar la remisión random"
          : "Error al generar la remisión random"
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
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6" />
                <div>
                  <h2 className="text-xl font-bold">
                    {remisionParaEditar
                      ? "Editar Remisión Personalizada"
                      : "Nueva Remisión Personalizada"}
                  </h2>
                  <p className="text-purple-100 text-sm">
                    {remisionParaEditar
                      ? `Editando: ${remisionParaEditar.numeroRemision}`
                      : "Remisión sin afectación de stock"}
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
                        )}}
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

              {/* Formulario de Productos Random */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Agregar Productos/Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProductoRandomForm 
                    onAgregarProducto={handleAgregarProducto}
                    productosExistentes={productosSeleccionados}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Productos Seleccionados */}
            {productosSeleccionados.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Productos/Items en la Remisión ({productosSeleccionados.length})
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
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
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
                  className="bg-purple-600 hover:bg-purple-700"
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