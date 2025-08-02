"use client";

import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Plus, Package, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getProductosByMarca,
  ProductoCatalogo,
} from "@/lib/catalogo-productos";
import { toast } from "sonner";

interface ProductSelectorProps {
  marca: string;
  value: string;
  onChange: (value: string) => void;
  onCreateNew?: (nombre: string) => void;
  placeholder?: string;
  error?: string;
}

export function ProductSelectorSimple({
  marca,
  value,
  onChange,
  onCreateNew,
  placeholder = "Seleccionar producto...",
  error,
}: ProductSelectorProps) {
  const [open, setOpen] = useState(false);
  const [productos, setProductos] = useState<ProductoCatalogo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    if (marca && open) {
      cargarProductosPorMarca();
    }
  }, [marca, open]);

  const cargarProductosPorMarca = async () => {
    if (!marca) return;

    try {
      setLoading(true);
      console.log("🔄 Cargando productos para marca:", marca);
      const productosData = await getProductosByMarca(marca);
      console.log("✅ Productos cargados:", productosData);
      setProductos(productosData);
    } catch (error) {
      console.error("❌ Error cargando productos:", error);
      toast.error("Error al cargar productos de la marca");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (producto: ProductoCatalogo) => {
    console.log("🎯 Producto seleccionado (simple):", producto.nombre);
    onChange(producto.nombre);
    setOpen(false);
    setSearchValue("");
  };

  const handleCreateNew = () => {
    if (searchValue.trim() && onCreateNew) {
      onCreateNew(searchValue.trim());
      setOpen(false);
      setSearchValue("");
    }
  };

  const productoSeleccionado = productos.find((p) => p.nombre === value);
  const productosDisponibles = productos.filter((p) =>
    p.nombre.toLowerCase().includes(searchValue.toLowerCase())
  );

  if (!marca) {
    return (
      <div>
        <Label>Nombre del Producto</Label>
        <div className="mt-1 p-3 border rounded-md bg-gray-50 text-gray-500 text-sm">
          Primero selecciona una marca para ver los productos disponibles
        </div>
      </div>
    );
  }

  return (
    <div>
      <Label>Nombre del Producto *</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between mt-1 h-10 bg-white hover:bg-gray-50 border-gray-300",
              "text-left font-normal cursor-pointer",
              !value && "text-gray-500",
              error && "border-red-500"
            )}
          >
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-400" />
              {productoSeleccionado ? (
                <div className="flex items-center gap-2">
                  <span className="text-gray-900">
                    {productoSeleccionado.nombre}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {marca}
                  </Badge>
                </div>
              ) : (
                <span className="text-gray-500">{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder={`Buscar productos de ${marca}...`}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Cargando productos...
              </div>
            ) : productosDisponibles.length === 0 ? (
              <div className="p-4 text-center">
                <div className="text-sm text-gray-500 mb-3">
                  No se encontraron productos de "{marca}"
                </div>
                {searchValue.trim() && onCreateNew && (
                  <Button
                    size="sm"
                    onClick={handleCreateNew}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Crear "{searchValue}"
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-1">
                <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-1">
                  Productos de {marca}
                </div>
                {productosDisponibles.map((producto) => (
                  <div
                    key={producto.id}
                    onClick={() => handleSelect(producto)}
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer rounded-sm"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4",
                        value === producto.nombre ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {producto.nombre}
                      </div>
                      {producto.descripcion && (
                        <div className="text-xs text-gray-500">
                          {producto.descripcion}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {searchValue.trim() &&
                  !productosDisponibles.some(
                    (p) => p.nombre.toLowerCase() === searchValue.toLowerCase()
                  ) &&
                  onCreateNew && (
                    <div
                      onClick={handleCreateNew}
                      className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer rounded-sm border-t"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="text-sm">
                        Crear "{searchValue}" en {marca}
                      </span>
                    </div>
                  )}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      {productoSeleccionado?.descripcion && (
        <p className="text-gray-500 text-xs mt-1">
          {productoSeleccionado.descripcion}
        </p>
      )}
    </div>
  );
}
