"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Package, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  ShoppingCart,
  X
} from 'lucide-react';
import { useStockPresentaciones } from '@/hooks/useStockPresentaciones';
import { VentaProductoModal } from './VentaProductoModal';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductoStockCritico {
  stock_item_id: string;
  nombre: string;
  marca: string;
  total_unidades_disponibles: number;
  cajas_stock: number;
  factor_conversion: number;
  nivel_criticidad: 'SIN_STOCK' | 'CRITICO' | 'BAJO' | 'NORMAL';
}

interface AlertasStockCriticoProps {
  limite?: number;
  autoRefresh?: boolean;
  showVentaOptions?: boolean;
  onStockUpdated?: () => void;
}

export function AlertasStockCritico({
  limite = 10,
  autoRefresh = true,
  showVentaOptions = true,
  onStockUpdated
}: AlertasStockCriticoProps) {
  const { loading, obtenerProductosStockCritico } = useStockPresentaciones();
  const [productos, setProductos] = useState<ProductoStockCritico[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [ventaModalOpen, setVentaModalOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<string | null>(null);

  useEffect(() => {
    cargarProductosCriticos();

    // Auto-refresh cada 30 segundos si está habilitado
    if (autoRefresh) {
      const interval = setInterval(cargarProductosCriticos, 30000);
      return () => clearInterval(interval);
    }
  }, [limite, autoRefresh]);

  const cargarProductosCriticos = async () => {
    const productosData = await obtenerProductosStockCritico(limite);
    setProductos(productosData);
  };

  const handleVentaExitosa = () => {
    cargarProductosCriticos();
    onStockUpdated?.();
  };

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'SIN_STOCK':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'CRITICO':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'BAJO':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const getNivelTexto = (nivel: string) => {
    switch (nivel) {
      case 'SIN_STOCK':
        return 'Sin Stock';
      case 'CRITICO':
        return 'Crítico';
      case 'BAJO':
        return 'Bajo';
      default:
        return 'Normal';
    }
  };

  // Agrupar productos por nivel de criticidad
  const productosAgrupados = {
    SIN_STOCK: productos.filter(p => p.nivel_criticidad === 'SIN_STOCK'),
    CRITICO: productos.filter(p => p.nivel_criticidad === 'CRITICO'),
    BAJO: productos.filter(p => p.nivel_criticidad === 'BAJO')
  };

  const totalProductosCriticos = productos.length;

  if (totalProductosCriticos === 0 && !loading) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <Package className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-green-800">Stock en buen estado</h3>
              <p className="text-sm text-green-600">
                Todos los productos tienen stock suficiente (≥{limite} unidades)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg text-orange-800">
                Alertas de Stock
              </CardTitle>
              <Badge className="bg-orange-600 text-white">
                {totalProductosCriticos}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={cargarProductosCriticos}
                disabled={loading}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCollapsed(!collapsed)}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
              >
                {collapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Sin Stock */}
                  {productosAgrupados.SIN_STOCK.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Sin Stock ({productosAgrupados.SIN_STOCK.length})
                      </h4>
                      <div className="space-y-2">
                        {productosAgrupados.SIN_STOCK.map((producto) => (
                          <ProductoStockItem
                            key={producto.stock_item_id}
                            producto={producto}
                            showVentaOptions={false} // No se puede vender sin stock
                            onVenderClick={() => {}}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stock Crítico */}
                  {productosAgrupados.CRITICO.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Stock Crítico ({productosAgrupados.CRITICO.length})
                      </h4>
                      <div className="space-y-2">
                        {productosAgrupados.CRITICO.map((producto) => (
                          <ProductoStockItem
                            key={producto.stock_item_id}
                            producto={producto}
                            showVentaOptions={showVentaOptions}
                            onVenderClick={() => {
                              setProductoSeleccionado(producto.stock_item_id);
                              setVentaModalOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stock Bajo */}
                  {productosAgrupados.BAJO.length > 0 && (
                    <div>
                      <h4 className="font-medium text-orange-600 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Stock Bajo ({productosAgrupados.BAJO.length})
                      </h4>
                      <div className="space-y-2">
                        {productosAgrupados.BAJO.map((producto) => (
                          <ProductoStockItem
                            key={producto.stock_item_id}
                            producto={producto}
                            showVentaOptions={showVentaOptions}
                            onVenderClick={() => {
                              setProductoSeleccionado(producto.stock_item_id);
                              setVentaModalOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Modal de Venta */}
      <VentaProductoModal
        isOpen={ventaModalOpen}
        onClose={() => {
          setVentaModalOpen(false);
          setProductoSeleccionado(null);
        }}
        stockItemId={productoSeleccionado}
        onVentaExitosa={handleVentaExitosa}
      />
    </>
  );
}

interface ProductoStockItemProps {
  producto: ProductoStockCritico;
  showVentaOptions: boolean;
  onVenderClick: () => void;
}

function ProductoStockItem({ producto, showVentaOptions, onVenderClick }: ProductoStockItemProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h5 className="font-medium text-gray-800">{producto.nombre}</h5>
            <Badge className={getNivelColor(producto.nivel_criticidad)}>
              {getNivelTexto(producto.nivel_criticidad)}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {producto.marca}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>Stock: {producto.total_unidades_disponibles} unidades</span>
            <span>Cajas: {producto.cajas_stock}</span>
            {producto.factor_conversion > 1 && (
              <span>Factor: {producto.factor_conversion}</span>
            )}
          </div>
        </div>

        {showVentaOptions && producto.total_unidades_disponibles > 0 && (
          <Button
            size="sm"
            onClick={onVenderClick}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            Vender
          </Button>
        )}
      </div>
    </div>
  );

  function getNivelColor(nivel: string): string {
    switch (nivel) {
      case 'SIN_STOCK':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'CRITICO':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'BAJO':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  }

  function getNivelTexto(nivel: string): string {
    switch (nivel) {
      case 'SIN_STOCK':
        return 'Sin Stock';
      case 'CRITICO':
        return 'Crítico';
      case 'BAJO':
        return 'Bajo';
      default:
        return 'Normal';
    }
  }
}
