import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  Coins, 
  Package, 
  Calculator, 
  AlertTriangle,
  Info,
  CheckCircle
} from 'lucide-react';
import { CatalogoProducto } from '@/types';
import { 
  calcularPrecio, 
  formatearPrecio, 
  obtenerMejorPrecio, 
  validarPreciosProducto 
} from '@/lib/utils/precios';

interface PreciosDualesProps {
  producto: Partial<CatalogoProducto>;
  onChange: (updates: Partial<CatalogoProducto>) => void;
  readonly?: boolean;
}

export function PreciosDuales({ producto, onChange, readonly = false }: PreciosDualesProps) {
  const [simulacionCantidad, setSimulacionCantidad] = useState(1);

  const validacion = validarPreciosProducto(producto as CatalogoProducto);

  const handlePrecioChange = (campo: keyof CatalogoProducto, valor: string | boolean | number) => {
    onChange({ [campo]: valor });
  };

  const calcularPrecioUnidadBasico = () => {
    if (producto.precioPorCaja && producto.unidadesPorCaja && producto.unidadesPorCaja > 1) {
      const precioCalculado = producto.precioPorCaja / producto.unidadesPorCaja;
      handlePrecioChange('precioPorUnidad', Number(precioCalculado.toFixed(2)));
      handlePrecioChange('monedaUnidad', producto.monedaCaja || 'USD');
    }
  };

  const simularCompra = () => {
    if (!producto.permiteFraccionamiento || !simulacionCantidad) return null;

    const resultado = obtenerMejorPrecio(producto as CatalogoProducto, simulacionCantidad);
    return resultado;
  };

  const MonedaIcon = ({ moneda }: { moneda?: 'USD' | 'GS' }) => {
    return moneda === 'USD' ? 
      <DollarSign className="w-4 h-4 text-green-600" /> : 
      <Coins className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Configuración de Fraccionamiento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-500" />
            Configuración de Producto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Permite Fraccionamiento</Label>
              <p className="text-sm text-gray-600">
                ¿Se puede vender por unidad individual?
              </p>
            </div>
            {!readonly && (
              <Switch
                checked={producto.permiteFraccionamiento || false}
                onCheckedChange={(checked) => handlePrecioChange('permiteFraccionamiento', checked)}
              />
            )}
            {readonly && (
              <Badge variant={producto.permiteFraccionamiento ? "default" : "secondary"}>
                {producto.permiteFraccionamiento ? "Sí" : "Solo caja completa"}
              </Badge>
            )}
          </div>

          {producto.permiteFraccionamiento && (
            <div>
              <Label htmlFor="unidadesPorCaja">Unidades por Caja</Label>
              <Input
                id="unidadesPorCaja"
                type="number"
                value={producto.unidadesPorCaja || 1}
                onChange={(e) => handlePrecioChange('unidadesPorCaja', Number(e.target.value))}
                min="1"
                disabled={readonly}
                className="w-32"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuración de Precios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Precios por Tipo de Venta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Precio por Caja */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
            <div className="md:col-span-3">
              <h4 className="font-medium text-gray-900 mb-2">Venta por Caja Completa</h4>
            </div>
            
            <div>
              <Label htmlFor="precioPorCaja">Precio por Caja</Label>
              <Input
                id="precioPorCaja"
                type="number"
                step="0.01"
                value={producto.precioPorCaja || ''}
                onChange={(e) => handlePrecioChange('precioPorCaja', Number(e.target.value))}
                placeholder="0.00"
                disabled={readonly}
              />
            </div>
            
            <div>
              <Label htmlFor="monedaCaja">Moneda</Label>
              <Select
                value={producto.monedaCaja || 'USD'}
                onValueChange={(value: 'USD' | 'GS') => handlePrecioChange('monedaCaja', value)}
                disabled={readonly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      USD - Dólares
                    </div>
                  </SelectItem>
                  <SelectItem value="GS">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-blue-600" />
                      GS - Guaraníes
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              {producto.precioPorCaja && (
                <div className="text-sm text-gray-600">
                  <MonedaIcon moneda={producto.monedaCaja} />
                  <span className="ml-1 font-medium">
                    {formatearPrecio(producto.precioPorCaja, producto.monedaCaja || 'USD')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Precio por Unidad */}
          {producto.permiteFraccionamiento && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-blue-50">
              <div className="md:col-span-3 flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Venta por Unidad Individual</h4>
                {!readonly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={calcularPrecioUnidadBasico}
                    disabled={!producto.precioPorCaja || !producto.unidadesPorCaja}
                  >
                    <Calculator className="w-4 h-4 mr-1" />
                    Calcular
                  </Button>
                )}
              </div>
              
              <div>
                <Label htmlFor="precioPorUnidad">Precio por Unidad</Label>
                <Input
                  id="precioPorUnidad"
                  type="number"
                  step="0.01"
                  value={producto.precioPorUnidad || ''}
                  onChange={(e) => handlePrecioChange('precioPorUnidad', Number(e.target.value))}
                  placeholder="0.00"
                  disabled={readonly}
                />
              </div>
              
              <div>
                <Label htmlFor="monedaUnidad">Moneda</Label>
                <Select
                  value={producto.monedaUnidad || producto.monedaCaja || 'USD'}
                  onValueChange={(value: 'USD' | 'GS') => handlePrecioChange('monedaUnidad', value)}
                  disabled={readonly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        USD - Dólares
                      </div>
                    </SelectItem>
                    <SelectItem value="GS">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-blue-600" />
                        GS - Guaraníes
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                {producto.precioPorUnidad && (
                  <div className="text-sm text-gray-600">
                    <MonedaIcon moneda={producto.monedaUnidad} />
                    <span className="ml-1 font-medium">
                      {formatearPrecio(producto.precioPorUnidad, producto.monedaUnidad || 'USD')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validación */}
      {!validacion.valido && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Errores en configuración:</strong>
            <ul className="mt-1 list-disc list-inside">
              {validacion.errores.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {validacion.advertencias.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Recomendaciones:</strong>
            <ul className="mt-1 list-disc list-inside">
              {validacion.advertencias.map((advertencia, index) => (
                <li key={index}>{advertencia}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Simulador de Compra */}
      {readonly && producto.permiteFraccionamiento && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-purple-500" />
              Simulador de Compra
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div>
                <Label htmlFor="simulacionCantidad">Cantidad deseada (unidades)</Label>
                <Input
                  id="simulacionCantidad"
                  type="number"
                  value={simulacionCantidad}
                  onChange={(e) => setSimulacionCantidad(Number(e.target.value))}
                  min="1"
                  className="w-32"
                />
              </div>
            </div>

            {simulacionCantidad > 0 && (() => {
              const simulacion = simularCompra();
              if (!simulacion) return null;

              return (
                <div className="border rounded-lg p-4 bg-green-50">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-900">Mejor opción de compra:</span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Tipo:</strong> {simulacion.calculoOptimo.equivalencia}
                    </div>
                    <div>
                      <strong>Precio total:</strong> {simulacion.calculoOptimo.precioTotal.descripcion}
                    </div>
                    {simulacion.ahorro && (
                      <div className="text-green-600">
                        <strong>Ahorro:</strong> {simulacion.ahorro}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}