"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package2, 
  Package, 
  ShoppingCart, 
  AlertTriangle, 
  Eye,
  Loader2,
  Box,
  DollarSign
} from 'lucide-react';
import { useStockPresentaciones, type ResumenProducto } from '@/hooks/useStockPresentaciones';
import { VentaProductoModal } from './VentaProductoModal';

interface StockItemCardProps {
  stockItem: {
    id: string;
    nombre: string;
    marca: string;
    modelo: string;
    cantidadDisponible: number;
    imagen?: string;
    precio?: number;
    moneda?: string;
  };
  onStockUpdated?: () => void;
  showAdvancedFeatures?: boolean; // Para mostrar las nuevas funciones o mantener compatibilidad
}

export function StockItemCard({ 
  stockItem, 
  onStockUpdated,
  showAdvancedFeatures = true 
}: StockItemCardProps) {
  const { loading, obtenerResumenProducto } = useStockPresentaciones();
  const [resumenProducto, setResumenProducto] = useState<ResumenProducto | null>(null);
  const [mostrarVentaModal, setMostrarVentaModal] = useState(false);
  const [expandido, setExpandido] = useState(false);

  // Cargar resumen del producto para funciones avanzadas
  useEffect(() => {
    if (showAdvancedFeatures && stockItem.id) {
      cargarResumenProducto();
    }
  }, [stockItem.id, showAdvancedFeatures]);

  const cargarResumenProducto = async () => {
    const resumen = await obtenerResumenProducto(stockItem.id);
    if (resumen) {
      setResumenProducto(resumen);
    }
  };

  const handleVentaExitosa = () => {
    cargarResumenProducto(); // Recargar datos
    onStockUpdated?.(); // Notificar al componente padre
  };

  const formatearPrecio = (precio: number | null, moneda: string = 'USD'): string => {
    if (!precio) return 'Sin precio';
    
    if (moneda === 'USD') {
      return `$${precio.toLocaleString()}`;
    } else {
      return `₲${precio.toLocaleString()}`;
    }
  };

  const getNivelStock = (cantidad: number): { nivel: 'alto' | 'medio' | 'bajo' | 'critico', color: string, texto: string } => {
    if (cantidad === 0) return { nivel: 'critico', color: 'text-red-600 bg-red-50 border-red-200', texto: 'Sin Stock' };
    if (cantidad <= 2) return { nivel: 'critico', color: 'text-red-600 bg-red-50 border-red-200', texto: 'Crítico' };
    if (cantidad <= 5) return { nivel: 'bajo', color: 'text-orange-600 bg-orange-50 border-orange-200', texto: 'Bajo' };
    if (cantidad <= 10) return { nivel: 'medio', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', texto: 'Medio' };
    return { nivel: 'alto', color: 'text-green-600 bg-green-50 border-green-200', texto: 'Alto' };
  };

  const stockInfo = resumenProducto 
    ? getNivelStock(resumenProducto.stock.total_unidades_disponibles)
    : getNivelStock(stockItem.cantidadDisponible);

  return (
    <>
      <Card className="hover:shadow-md transition-shadow border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1">
              {stockItem.imagen && (
                <img
                  src={stockItem.imagen}
                  alt={stockItem.nombre}
                  className="w-12 h-12 object-cover rounded-md border border-gray-200"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <div className="flex-1">
                <CardTitle className="text-base font-medium text-gray-800 leading-tight">
                  {stockItem.nombre}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {stockItem.marca} • {stockItem.modelo}
                </p>
                
                {/* Precio base */}
                {stockItem.precio && stockItem.precio > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <DollarSign className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-600">
                      {formatearPrecio(stockItem.precio, stockItem.moneda)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Badge de stock */}
            <Badge className={`${stockInfo.color} border font-medium`}>
              {stockInfo.texto}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Stock básico */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Box className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Stock disponible:</span>
              </div>
              <span className={`font-semibold text-lg ${stockInfo.color.split(' ')[0]}`}>
                {showAdvancedFeatures && resumenProducto 
                  ? resumenProducto.stock.total_unidades_disponibles 
                  : stockItem.cantidadDisponible}
              </span>
            </div>

            {/* Información avanzada */}
            {showAdvancedFeatures && resumenProducto && (
              <>
                {loading && (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">Cargando...</span>
                  </div>
                )}

                {!loading && (
                  <div className="space-y-2">
                    {/* Resumen rápido */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <div className="flex items-center gap-1">
                          <Package2 className="h-3 w-3 text-blue-600" />
                          <span className="font-medium text-blue-600">
                            {resumenProducto.stock.cajas_stock}
                          </span>
                        </div>
                        <div className="text-xs text-blue-600">Cajas</div>
                      </div>
                      
                      <div className="bg-green-50 border border-green-200 rounded p-2">
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3 text-green-600" />
                          <span className="font-medium text-green-600">
                            {resumenProducto.stock.unidades_sueltas}
                          </span>
                        </div>
                        <div className="text-xs text-green-600">Sueltas</div>
                      </div>
                    </div>

                    {/* Factor de conversión */}
                    {resumenProducto.stock.factor_conversion > 1 && (
                      <div className="bg-gray-50 border border-gray-200 rounded p-2">
                        <div className="text-xs text-gray-600">
                          1 caja = {resumenProducto.stock.factor_conversion} unidades
                        </div>
                      </div>
                    )}

                    {/* Caja abierta */}
                    {resumenProducto.caja_abierta.tiene_caja_abierta && (
                      <div className="bg-orange-50 border border-orange-200 rounded p-2">
                        <div className="flex items-center gap-2">
                          <Package className="h-3 w-3 text-orange-600" />
                          <span className="text-xs font-medium text-orange-700">
                            Caja abierta: {resumenProducto.caja_abierta.unidades_restantes} restantes
                          </span>
                        </div>
                        <div className="text-xs text-orange-600 mt-1">
                          {resumenProducto.caja_abierta.porcentaje_usado?.toFixed(0)}% utilizado
                        </div>
                      </div>
                    )}

                    {/* Alertas */}
                    {resumenProducto.alertas.stock_bajo && (
                      <div className="bg-red-50 border border-red-200 rounded p-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3 text-red-600" />
                          <span className="text-xs font-medium text-red-700">
                            Stock bajo - Requiere reposición
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Botón para expandir/contraer detalles */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandido(!expandido)}
                      className="w-full h-6 text-xs text-gray-500 hover:text-gray-700"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      {expandido ? 'Menos detalles' : 'Más detalles'}
                    </Button>

                    {/* Detalles expandidos */}
                    {expandido && (
                      <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                        <div className="text-xs text-gray-600">
                          <strong>Presentaciones disponibles:</strong>
                        </div>
                        {resumenProducto.presentaciones.map((presentacion) => (
                          <div key={presentacion.presentacion_id} className="bg-gray-50 rounded p-2 text-xs">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                {presentacion.factor_conversion === 1 ? (
                                  <Package className="h-3 w-3 text-gray-500" />
                                ) : (
                                  <Package2 className="h-3 w-3 text-gray-500" />
                                )}
                                <span className="font-medium">{presentacion.nombre_presentacion}</span>
                                {presentacion.es_default && (
                                  <Badge variant="secondary" className="text-xs px-1 py-0">Defecto</Badge>
                                )}
                              </div>
                              <span className="text-gray-600">
                                {presentacion.unidades_disponibles} disponibles
                              </span>
                            </div>
                            {presentacion.precio_venta && (
                              <div className="text-green-600 font-medium mt-1">
                                {formatearPrecio(presentacion.precio_venta, resumenProducto.producto.moneda)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Acciones */}
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              {showAdvancedFeatures ? (
                <Button
                  onClick={() => setMostrarVentaModal(true)}
                  disabled={
                    loading || 
                    (resumenProducto ? resumenProducto.stock.total_unidades_disponibles === 0 : stockItem.cantidadDisponible === 0)
                  }
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Vender
                </Button>
              ) : (
                <Button
                  disabled={stockItem.cantidadDisponible === 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Registrar Salida
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de venta */}
      {showAdvancedFeatures && (
        <VentaProductoModal
          isOpen={mostrarVentaModal}
          onClose={() => setMostrarVentaModal(false)}
          stockItemId={stockItem.id}
          onVentaExitosa={handleVentaExitosa}
        />
      )}
    </>
  );
}
