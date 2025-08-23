"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Package2, 
  Package, 
  Calculator, 
  ShoppingCart, 
  AlertTriangle,
  CheckCircle,
  X,
  Loader2
} from 'lucide-react';
import { useStockPresentaciones, type ResumenProducto, type StockPresentacion, type SimulacionVenta } from '@/hooks/useStockPresentaciones';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';

interface VentaProductoModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockItemId: string | null;
  onVentaExitosa?: () => void;
}

export function VentaProductoModal({
  isOpen,
  onClose,
  stockItemId,
  onVentaExitosa
}: VentaProductoModalProps) {
  const { user } = useAppStore();
  const {
    loading,
    error,
    obtenerResumenProducto,
    simularVenta,
    venderCajaCompleta,
    venderUnidadesIndividuales
  } = useStockPresentaciones();

  const [resumenProducto, setResumenProducto] = useState<ResumenProducto | null>(null);
  const [tipoVenta, setTipoVenta] = useState<'caja_completa' | 'unidades'>('unidades');
  const [presentacionSeleccionada, setPresentacionSeleccionada] = useState<StockPresentacion | null>(null);
  const [cantidad, setCantidad] = useState<number>(1);
  const [simulacion, setSimulacion] = useState<SimulacionVenta | null>(null);
  const [referenciaExterna, setReferenciaExterna] = useState<string>('');
  const [procesandoVenta, setProcesandoVenta] = useState(false);

  // Cargar datos del producto cuando se abre el modal
  useEffect(() => {
    if (isOpen && stockItemId) {
      cargarDatosProducto();
    }
  }, [isOpen, stockItemId]);

  // Resetear estado cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setResumenProducto(null);
      setTipoVenta('unidades');
      setPresentacionSeleccionada(null);
      setCantidad(1);
      setSimulacion(null);
      setReferenciaExterna('');
    }
  }, [isOpen]);

  const cargarDatosProducto = async () => {
    if (!stockItemId) return;
    
    const resumen = await obtenerResumenProducto(stockItemId);
    if (resumen) {
      setResumenProducto(resumen);
      
      // Seleccionar presentación por defecto
      const presentacionDefault = resumen.presentaciones.find(p => p.es_default);
      if (presentacionDefault) {
        setPresentacionSeleccionada(presentacionDefault);
        
        // Si solo hay presentación unitaria, usar tipo unidades
        if (presentacionDefault.factor_conversion === 1) {
          setTipoVenta('unidades');
        } else {
          // Si hay cajas, preferir venta por unidades inicialmente
          setTipoVenta('unidades');
        }
      }
    }
  };

  // Simular venta cuando cambian los parámetros
  useEffect(() => {
    if (resumenProducto && presentacionSeleccionada && cantidad > 0) {
      simularVentaActual();
    }
  }, [tipoVenta, presentacionSeleccionada, cantidad, resumenProducto]);

  const simularVentaActual = async () => {
    if (!stockItemId || !resumenProducto || !presentacionSeleccionada) return;

    const resultado = await simularVenta(
      stockItemId,
      tipoVenta,
      cantidad,
      tipoVenta === 'caja_completa' ? presentacionSeleccionada.presentacion_id : undefined
    );
    
    setSimulacion(resultado);
  };

  const handleVender = async () => {
    if (!stockItemId || !resumenProducto || !presentacionSeleccionada || !simulacion?.success) {
      return;
    }

    setProcesandoVenta(true);
    
    try {
      if (tipoVenta === 'caja_completa') {
        await venderCajaCompleta(
          stockItemId,
          presentacionSeleccionada.presentacion_id,
          cantidad,
          user?.name || 'Usuario',
          referenciaExterna || undefined
        );
      } else {
        await venderUnidadesIndividuales(
          stockItemId,
          cantidad,
          user?.name || 'Usuario',
          referenciaExterna || undefined
        );
      }

      onVentaExitosa?.();
      onClose();
    } catch (error) {
      // El error ya se maneja en el hook
    } finally {
      setProcesandoVenta(false);
    }
  };

  const getCantidadMaxima = (): number => {
    if (!resumenProducto || !presentacionSeleccionada) return 0;
    
    if (tipoVenta === 'caja_completa') {
      return presentacionSeleccionada.unidades_disponibles;
    } else {
      return resumenProducto.stock.total_unidades_disponibles;
    }
  };

  const formatearPrecio = (precio: number | null, moneda: string): string => {
    if (!precio) return 'Sin precio';
    
    if (moneda === 'USD') {
      return `$${precio.toLocaleString()}`;
    } else {
      return `₲${precio.toLocaleString()}`;
    }
  };

  if (!isOpen || !stockItemId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-green-500" />
            Vender Producto
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2">Cargando datos del producto...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        )}

        {resumenProducto && (
          <div className="space-y-6">
            {/* Información del Producto */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{resumenProducto.producto.nombre}</CardTitle>
                <p className="text-sm text-gray-600">
                  {resumenProducto.producto.marca} • {resumenProducto.producto.modelo}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="font-semibold text-lg text-blue-600">
                      {resumenProducto.stock.cajas_stock}
                    </div>
                    <div className="text-sm text-gray-600">Cajas en Stock</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg text-green-600">
                      {resumenProducto.stock.total_unidades_disponibles}
                    </div>
                    <div className="text-sm text-gray-600">Unidades Disponibles</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg text-purple-600">
                      {resumenProducto.stock.factor_conversion}
                    </div>
                    <div className="text-sm text-gray-600">Unidades/Caja</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg text-orange-600">
                      {resumenProducto.stock.unidades_sueltas}
                    </div>
                    <div className="text-sm text-gray-600">Unidades Sueltas</div>
                  </div>
                </div>

                {/* Caja Abierta */}
                {resumenProducto.caja_abierta.tiene_caja_abierta && (
                  <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-orange-500" />
                      <span className="font-medium text-orange-700">Caja Abierta</span>
                    </div>
                    <p className="text-sm text-orange-600 mt-1">
                      {resumenProducto.caja_abierta.unidades_restantes} unidades restantes 
                      ({resumenProducto.caja_abierta.porcentaje_usado?.toFixed(1)}% usado)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selección de Tipo de Venta */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tipo de Venta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resumenProducto.presentaciones.map((presentacion) => (
                    <div key={presentacion.presentacion_id} className="space-y-2">
                      <Button
                        variant={presentacionSeleccionada?.presentacion_id === presentacion.presentacion_id ? "default" : "outline"}
                        className="w-full h-auto p-4 flex flex-col items-start"
                        onClick={() => {
                          setPresentacionSeleccionada(presentacion);
                          setTipoVenta(presentacion.factor_conversion === 1 ? 'unidades' : 'caja_completa');
                          setCantidad(1);
                        }}
                        disabled={!presentacion.puede_vender_completa}
                      >
                        <div className="flex items-center gap-2 w-full">
                          {presentacion.factor_conversion === 1 ? (
                            <Package className="h-4 w-4" />
                          ) : (
                            <Package2 className="h-4 w-4" />
                          )}
                          <span className="font-medium">{presentacion.nombre_presentacion}</span>
                          {presentacion.es_default && (
                            <Badge variant="secondary" className="text-xs">Por defecto</Badge>
                          )}
                        </div>
                        <div className="text-sm text-left w-full">
                          <div>Factor: {presentacion.factor_conversion}</div>
                          <div>Disponible: {presentacion.unidades_disponibles}</div>
                          {presentacion.precio_venta && (
                            <div className="font-medium text-green-600">
                              {formatearPrecio(presentacion.precio_venta, resumenProducto.producto.moneda)}
                            </div>
                          )}
                        </div>
                      </Button>
                      
                      {presentacion.factor_conversion > 1 && presentacionSeleccionada?.presentacion_id === presentacion.presentacion_id && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={tipoVenta === 'caja_completa' ? "default" : "outline"}
                            onClick={() => setTipoVenta('caja_completa')}
                            className="flex-1"
                          >
                            <Package2 className="h-4 w-4 mr-2" />
                            Caja Completa
                          </Button>
                          <Button
                            size="sm"
                            variant={tipoVenta === 'unidades' ? "default" : "outline"}
                            onClick={() => setTipoVenta('unidades')}
                            className="flex-1"
                          >
                            <Package className="h-4 w-4 mr-2" />
                            Unidades
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cantidad y Referencia */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detalles de la Venta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Cantidad a Vender
                    {tipoVenta === 'caja_completa' ? ' (cajas)' : ' (unidades)'}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max={getCantidadMaxima()}
                    value={cantidad}
                    onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo disponible: {getCantidadMaxima()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Referencia Externa (opcional)
                  </label>
                  <Input
                    type="text"
                    placeholder="Ej: Factura 001, Pedido #123"
                    value={referenciaExterna}
                    onChange={(e) => setReferenciaExterna(e.target.value)}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Simulación de Venta */}
            {simulacion && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calculator className="h-4 w-4" />
                    Previsualización de Venta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {simulacion.success ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Venta posible</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="font-medium">Tipo de venta:</div>
                          <div className="capitalize">{simulacion.tipo_venta.replace('_', ' ')}</div>
                        </div>
                        <div>
                          <div className="font-medium">Cantidad:</div>
                          <div>{simulacion.cantidad_solicitada}</div>
                        </div>
                        {simulacion.unidades_que_se_venderian && (
                          <div>
                            <div className="font-medium">Unidades totales:</div>
                            <div>{simulacion.unidades_que_se_venderian}</div>
                          </div>
                        )}
                      </div>

                      {presentacionSeleccionada?.precio_venta && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="font-medium text-green-700">
                            Precio estimado: {formatearPrecio(
                              presentacionSeleccionada.precio_venta * cantidad, 
                              resumenProducto.producto.moneda
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                      <span>{simulacion.error || 'Venta no posible'}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Acciones */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={procesandoVenta}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              
              <Button
                onClick={handleVender}
                disabled={!simulacion?.success || procesandoVenta || cantidad <= 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {procesandoVenta ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Confirmar Venta
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
