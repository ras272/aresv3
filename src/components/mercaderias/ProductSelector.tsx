'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, Plus, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getProductosByMarca, getMarcasDisponibles, ProductoCatalogo } from '@/lib/catalogo-productos';
import { toast } from 'sonner';

interface ProductSelectorProps {
  marca: string;
  value: string;
  onChange: (value: string) => void;
  onCreateNew?: (nombre: string) => void;
  placeholder?: string;
  error?: string;
  filtrarPorCategoria?: string;
}

export function ProductSelector({ 
  marca, 
  value, 
  onChange, 
  onCreateNew,
  placeholder = "Seleccionar producto...",
  error,
  filtrarPorCategoria
}: ProductSelectorProps) {
  const [open, setOpen] = useState(false);
  const [productos, setProductos] = useState<ProductoCatalogo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    if (marca && open) {
      cargarProductosPorMarca();
    }
  }, [marca, open]);

  useEffect(() => {
    const handleFocus = () => {
      if (marca && open) {
        console.log('🔍 Recargando productos después de focus de ventana');
        cargarProductosPorMarca();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [marca, open]);

  const cargarProductosPorMarca = async () => {
    if (!marca) return;
    
    try {
      setLoading(true);
      console.log('🔄 Cargando productos para marca:', marca);
      
      const productosData = await getProductosByMarca(marca, filtrarPorCategoria);
      
      if (filtrarPorCategoria) {
        console.log(`🔍 Productos filtrados por categoría "${filtrarPorCategoria}":`, productosData);
      } else {
        console.log('✅ Productos cargados:', productosData);
      }
      
      setProductos(productosData);
    } catch (error) {
      console.error('❌ Error cargando productos:', error);
      toast.error('Error al cargar productos de la marca');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (producto: ProductoCatalogo) => {
    onChange(producto.nombre);
    setOpen(false);
    setSearchValue('');
  };

  const handleCreateNew = () => {
    if (searchValue.trim() && onCreateNew) {
      onCreateNew(searchValue.trim());
      setOpen(false);
      setSearchValue('');
    }
  };

  const productoSeleccionado = productos.find(p => p.nombre === value);
  const productosDisponibles = productos.filter(p => 
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
      {filtrarPorCategoria && (
        <div className="text-xs text-orange-600 mt-1 mb-2 flex items-center gap-1">
          <span>🔍</span>
          <span>Mostrando solo productos de categoría: <strong>{filtrarPorCategoria}</strong></span>
        </div>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={false}
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
                  <span className="text-gray-900">{productoSeleccionado.nombre}</span>
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
        <PopoverContent 
          className="w-[400px] p-0" 
          align="start"
          style={{ backgroundColor: '#ffffff' }}
        >
          <Command style={{ backgroundColor: '#ffffff' }}>
            <CommandInput 
              placeholder={`Buscar productos de ${marca}...`}
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList style={{ backgroundColor: '#ffffff' }}>
              {loading ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Cargando productos...
                </div>
              ) : (
                <>
                  <CommandEmpty>
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
                  </CommandEmpty>
                  
                  {productosDisponibles.length > 0 && (
                    <CommandGroup heading={`Productos de ${marca}`}>
                      {productosDisponibles.map((producto) => (
                        <CommandItem
                          key={producto.id}
                          value={producto.nombre}
                          onSelect={() => handleSelect(producto)}
                          className={cn(
                            "flex items-center justify-between cursor-pointer p-2",
                            // ✅ SOLUCIÓN PRINCIPAL: Forzar estilos específicos
                            "text-gray-900 hover:bg-gray-100 hover:text-gray-900",
                            "aria-selected:bg-gray-100 aria-selected:text-gray-900",
                            "data-[selected]:bg-gray-100 data-[selected]:text-gray-900",
                            // Asegurar que no se vea disabled
                            "opacity-100 pointer-events-auto"
                          )}
                          // ✅ SOLUCIÓN ALTERNATIVA: Props directas
                          style={{
                            color: '#111827',
                            opacity: 1,
                            pointerEvents: 'auto'
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Check
                              className={cn(
                                "h-4 w-4 text-blue-600",
                                value === producto.nombre ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div>
                              <div className="font-medium text-gray-900">
                                {producto.nombre}
                              </div>
                              {producto.descripcion && (
                                <div className="text-xs text-gray-500">
                                  {producto.descripcion}
                                </div>
                              )}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  
                  {searchValue.trim() && 
                   !productosDisponibles.some(p => 
                     p.nombre.toLowerCase() === searchValue.toLowerCase()
                   ) && 
                   onCreateNew && (
                    <CommandGroup>
                      <CommandItem 
                        onSelect={handleCreateNew}
                        className="text-gray-900 hover:bg-gray-50 cursor-pointer bg-white"
                        style={{ color: '#111827', opacity: 1 }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Crear "{searchValue}" en {marca}
                      </CommandItem>
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
      
      {productoSeleccionado?.descripcion && (
        <p className="text-gray-500 text-xs mt-1">
          {productoSeleccionado.descripcion}
        </p>
      )}

      {/* 🔧 SOLUCIÓN CSS GLOBAL (si las anteriores no funcionan) */}
      <style jsx global>{`
        [cmdk-item] {
          color: #111827 !important;
          opacity: 1 !important;
          pointer-events: auto !important;
          background-color: transparent !important;
        }
        [cmdk-item]:hover {
          background-color: #f3f4f6 !important;
          color: #111827 !important;
        }
        [cmdk-item][aria-selected="true"] {
          background-color: #f3f4f6 !important;
          color: #111827 !important;
        }
        [cmdk-item][data-selected] {
          background-color: #f3f4f6 !important;
          color: #111827 !important;
        }
        [cmdk-item][data-disabled] {
          background-color: transparent !important;
          color: #111827 !important;
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}