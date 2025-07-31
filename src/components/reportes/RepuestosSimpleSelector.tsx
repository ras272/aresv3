"use client";

import React, { useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

interface RepuestoUtilizado {
  id: string;
  nombre: string;
  marca: string;
  modelo: string;
  cantidad: number;
  stockAntes: number;
}

interface RepuestosSimpleSelectorProps {
  repuestos: RepuestoUtilizado[];
  onRepuestosChange: (repuestos: RepuestoUtilizado[]) => void;
  disabled?: boolean;
}

export function RepuestosSimpleSelector({
  repuestos,
  onRepuestosChange,
  disabled = false,
}: RepuestosSimpleSelectorProps) {
  const { stockItems } = useAppStore();
  const [busqueda, setBusqueda] = useState("");
  const [repuestoSeleccionado, setRepuestoSeleccionado] = useState("");
  const [cantidad, setCantidad] = useState("");

  // Filtrar solo productos de la carpeta "Servicio Técnico" con stock disponible
  const repuestosDisponibles = useMemo(() => {
    return stockItems.filter(
      (item) =>
        item.cantidadDisponible > 0 &&
        item.estado === "Disponible" &&
        // 🔧 Filtrar por marca "Servicio Técnico" (ya que carpetaPrincipal no está en el tipo)
        item.marca === "Servicio Técnico" &&
        (item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          item.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
          item.modelo.toLowerCase().includes(busqueda.toLowerCase()))
    );
  }, [stockItems, busqueda]);

  const agregarRepuesto = () => {
    if (!repuestoSeleccionado || !cantidad) {
      toast.error("Selecciona un repuesto y la cantidad");
      return;
    }

    const cantidadNum = parseInt(cantidad);
    if (cantidadNum <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    const item = stockItems.find((s) => s.id === repuestoSeleccionado);
    if (!item) {
      toast.error("Repuesto no encontrado");
      return;
    }

    if (cantidadNum > item.cantidadDisponible) {
      toast.error(`Solo hay ${item.cantidadDisponible} unidades disponibles`);
      return;
    }

    // Verificar si ya existe
    if (repuestos.find((r) => r.id === repuestoSeleccionado)) {
      toast.error("Este repuesto ya fue agregado");
      return;
    }

    const nuevoRepuesto: RepuestoUtilizado = {
      id: repuestoSeleccionado,
      nombre: item.nombre,
      marca: item.marca,
      modelo: item.modelo,
      cantidad: cantidadNum,
      stockAntes: item.cantidadDisponible,
    };

    onRepuestosChange([...repuestos, nuevoRepuesto]);

    // Limpiar formulario
    setRepuestoSeleccionado("");
    setCantidad("");
    setBusqueda("");

    toast.success("Repuesto agregado");
  };

  const eliminarRepuesto = (id: string) => {
    onRepuestosChange(repuestos.filter((r) => r.id !== id));
    toast.success("Repuesto eliminado");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Repuestos Utilizados</Label>
        <Badge variant="outline">{repuestos.length} repuestos</Badge>
      </div>

      {/* Formulario simple para agregar repuestos */}
      <Card className="border-dashed border-2">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar repuesto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
                disabled={disabled}
              />
            </div>

            {/* Selector de repuesto */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Repuesto</Label>
                <select
                  value={repuestoSeleccionado}
                  onChange={(e) => setRepuestoSeleccionado(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  disabled={disabled}
                >
                  <option value="">Seleccionar...</option>
                  {repuestosDisponibles.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre} - {item.marca} ({item.cantidadDisponible}{" "}
                      disponibles)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-sm">Cantidad</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  disabled={disabled}
                />
              </div>
            </div>

            <Button
              onClick={agregarRepuesto}
              disabled={!repuestoSeleccionado || !cantidad || disabled}
              size="sm"
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Repuesto
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de repuestos agregados */}
      {repuestos.length > 0 && (
        <div className="space-y-2">
          {repuestos.map((repuesto) => (
            <Card key={repuesto.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{repuesto.nombre}</h4>
                    <p className="text-xs text-gray-600">
                      {repuesto.marca} {repuesto.modelo} • {repuesto.cantidad}x
                    </p>
                    <p className="text-xs text-gray-500">
                      Stock: {repuesto.stockAntes} →{" "}
                      {repuesto.stockAntes - repuesto.cantidad}
                    </p>
                  </div>
                  {!disabled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => eliminarRepuesto(repuesto.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {repuestosDisponibles.length === 0 && busqueda && (
        <div className="text-center py-4 text-gray-500">
          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No se encontraron repuestos</p>
        </div>
      )}
    </div>
  );
}
