'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  Euro, 
  Calculator, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { calcularPrecioProducto, formatearPrecio, validarPricingData } from '@/lib/utils/pricing-calculations';
import { supabase } from '@/lib/database/shared/supabase';

interface PricingDefinitionFormProps {
  producto: any;
  onSave: (pricingData: any) => void;
  readonly?: boolean;
}

export function PricingDefinitionForm({ producto, onSave, readonly = false }: PricingDefinitionFormProps) {
  const [pricingData, setPricingData] = useState({
    precioBase: producto.precio_base || 0,
    monedaBase: producto.moneda_base || 'USD',
    factorConversion: producto.factor_conversion || 1,
    costoFlete: producto.costo_flete || 0,
    costoTransporte: producto.costo_transporte || 0,
    otrosCostos: producto.otros_costos || 0,
    margenUtilidad: producto.margen_utilidad || 0,
    ivaPercent: producto.iva_percent || 0
  });

  const [calculatedPricing, setCalculatedPricing] = useState<any>(null);
  const [validation, setValidation] = useState<{ isValid: boolean; errores: string[] }>({ isValid: true, errores: [] });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const pricing = calcularPrecioProducto(pricingData);
    setCalculatedPricing(pricing);
    
    const validation = validarPricingData(pricingData);
    setValidation(validation);
  }, [pricingData]);

  const handleChange = (field: string, value: string | number) => {
    setPricingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!validation.isValid) return;
    
    setIsSaving(true);
    try {
      // Actualizar producto en la base de datos
      const { data, error } = await supabase
        .from('catalogo_productos')
        .update({
          precio_base: pricingData.precioBase,
          moneda_base: pricingData.monedaBase,
          factor_conversion: pricingData.factorConversion,
          costo_flete: pricingData.costoFlete,
          costo_transporte: pricingData.costoTransporte,
          otros_costos: pricingData.otrosCostos,
          margen_utilidad: pricingData.margenUtilidad,
          iva_percent: pricingData.ivaPercent,
          precio_venta_neto: calculatedPricing?.precioVentaNeto,
          precio_final_lista: calculatedPricing?.precioFinalLista,
          updated_at: new Date().toISOString()
        })
        .eq('id', producto.id)
        .select()
        .single();

      if (error) throw error;

      onSave(data);
    } catch (error) {
      console.error('Error saving pricing data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const MonedaIcon = ({ moneda }: { moneda?: string }) => {
    if (moneda === 'USD') {
      return <DollarSign className="w-4 h-4 text-green-600" />;
    } else if (moneda === 'EUR') {
      return <Euro className="w-4 h-4 text-blue-600" />;
    } else {
      return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Validación de errores */}
      {!validation.isValid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validation.errores.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-500" />
              Definición de Costos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="precioBase">Precio Base</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MonedaIcon moneda={pricingData.monedaBase} />
                  </div>
                  <Input
                    id="precioBase"
                    type="number"
                    step="0.01"
                    min="0"
                    value={pricingData.precioBase}
                    onChange={(e) => handleChange('precioBase', parseFloat(e.target.value) || 0)}
                    disabled={readonly}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="monedaBase">Moneda Base</Label>
                <Select 
                  value={pricingData.monedaBase} 
                  onValueChange={(value) => handleChange('monedaBase', value)}
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
                    <SelectItem value="EUR">
                      <div className="flex items-center gap-2">
                        <Euro className="w-4 h-4 text-blue-600" />
                        EUR - Euros
                      </div>
                    </SelectItem>
                    <SelectItem value="GS">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-yellow-600" />
                        GS - Guaraníes
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="factorConversion">Factor de Conversión</Label>
              <Input
                id="factorConversion"
                type="number"
                step="0.0001"
                min="0.0001"
                value={pricingData.factorConversion}
                onChange={(e) => handleChange('factorConversion', parseFloat(e.target.value) || 1)}
                disabled={readonly}
                placeholder="1.0000"
              />
              <p className="text-sm text-gray-500 mt-1">
                Ej: 1.10 para convertir EUR a USD
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="costoFlete">Costo Flete</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MonedaIcon moneda={pricingData.monedaBase} />
                  </div>
                  <Input
                    id="costoFlete"
                    type="number"
                    step="0.01"
                    min="0"
                    value={pricingData.costoFlete}
                    onChange={(e) => handleChange('costoFlete', parseFloat(e.target.value) || 0)}
                    disabled={readonly}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="costoTransporte">Costo Transporte</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MonedaIcon moneda={pricingData.monedaBase} />
                  </div>
                  <Input
                    id="costoTransporte"
                    type="number"
                    step="0.01"
                    min="0"
                    value={pricingData.costoTransporte}
                    onChange={(e) => handleChange('costoTransporte', parseFloat(e.target.value) || 0)}
                    disabled={readonly}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="otrosCostos">Otros Costos</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MonedaIcon moneda={pricingData.monedaBase} />
                </div>
                <Input
                  id="otrosCostos"
                  type="number"
                  step="0.01"
                  min="0"
                  value={pricingData.otrosCostos}
                  onChange={(e) => handleChange('otrosCostos', parseFloat(e.target.value) || 0)}
                  disabled={readonly}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Configuración de Precios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="margenUtilidad">Margen de Utilidad (%)</Label>
                <Input
                  id="margenUtilidad"
                  type="number"
                  step="0.01"
                  min="0"
                  value={pricingData.margenUtilidad}
                  onChange={(e) => handleChange('margenUtilidad', parseFloat(e.target.value) || 0)}
                  disabled={readonly}
                />
              </div>
              <div>
                <Label htmlFor="ivaPercent">IVA (%)</Label>
                <Input
                  id="ivaPercent"
                  type="number"
                  step="0.01"
                  min="0"
                  value={pricingData.ivaPercent}
                  onChange={(e) => handleChange('ivaPercent', parseFloat(e.target.value) || 0)}
                  disabled={readonly}
                />
              </div>
            </div>

            {calculatedPricing && validation.isValid && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium">Vista Previa de Cálculo</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Costo Base:</span>
                    <span className="font-medium">
                      {formatearPrecio(pricingData.precioBase * pricingData.factorConversion, pricingData.monedaBase)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Costo Adicional:</span>
                    <span className="font-medium">
                      {formatearPrecio(pricingData.costoFlete + pricingData.costoTransporte + pricingData.otrosCostos, pricingData.monedaBase)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Costo Total:</span>
                    <span className="font-medium">
                      {formatearPrecio(calculatedPricing.costoTotal, pricingData.monedaBase)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Margen ({pricingData.margenUtilidad}%):</span>
                    <span className="font-medium">
                      {formatearPrecio(calculatedPricing.precioVentaNeto - calculatedPricing.costoTotal, pricingData.monedaBase)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Precio Venta Neto:</span>
                    <span className="font-medium">
                      {formatearPrecio(calculatedPricing.precioVentaNeto, pricingData.monedaBase)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA ({pricingData.ivaPercent}%):</span>
                    <span className="font-medium">
                      {formatearPrecio(calculatedPricing.precioFinalLista - calculatedPricing.precioVentaNeto, pricingData.monedaBase)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t-2 pt-2 font-bold">
                    <span>Precio Final de Lista:</span>
                    <span className="text-lg">
                      {formatearPrecio(calculatedPricing.precioFinalLista, pricingData.monedaBase)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {!readonly && (
              <Button 
                onClick={handleSave} 
                className="w-full"
                disabled={!validation.isValid || isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Guardar Precios
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}