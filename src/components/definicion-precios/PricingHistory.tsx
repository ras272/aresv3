'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Minus
} from 'lucide-react';
import { supabase } from '@/lib/database/shared/supabase';
import { formatearPrecio } from '@/lib/utils/pricing-calculations';

interface HistorialPrecio {
  id: string;
  created_at: string;
  precio_base: number;
  moneda_base: string;
  costo_total: number;
  precio_venta_neto: number;
  precio_final_lista: number;
  margen_utilidad: number;
  iva_percent: number;
}

interface PricingHistoryProps {
  productoId: string;
}

export function PricingHistory({ productoId }: PricingHistoryProps) {
  const [historial, setHistorial] = useState<HistorialPrecio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarHistorial();
  }, [productoId]);

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      
      // Cargar historial de precios desde la base de datos
      const { data, error } = await supabase
        .from('historial_precios')
        .select('*')
        .eq('producto_id', productoId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      setHistorial(data || []);
    } catch (error) {
      console.error('Error cargando historial de precios:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularVariacion = (actual: number, anterior: number | undefined) => {
    if (anterior === undefined) return null;
    if (anterior === 0) return actual > 0 ? 'positive' : 'negative';
    
    const variacion = ((actual - anterior) / anterior) * 100;
    if (variacion > 0) return 'positive';
    if (variacion < 0) return 'negative';
    return 'neutral';
  };

  const VariacionIcon = ({ tipo }: { tipo: 'positive' | 'negative' | 'neutral' | null }) => {
    if (tipo === 'positive') {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (tipo === 'negative') {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    } else {
      return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          Historial de Precios
        </CardTitle>
      </CardHeader>
      <CardContent>
        {historial.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No hay historial de precios para este producto</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Precio Base</TableHead>
                <TableHead>Costo Total</TableHead>
                <TableHead>Margen</TableHead>
                <TableHead>IVA</TableHead>
                <TableHead>Precio Venta</TableHead>
                <TableHead>Precio Final</TableHead>
                <TableHead>Variación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historial.map((registro, index) => {
                const anterior = index < historial.length - 1 ? historial[index + 1] : undefined;
                const variacion = calcularVariacion(registro.precio_final_lista, anterior?.precio_final_lista);
                
                return (
                  <TableRow key={registro.id}>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(registro.created_at).toLocaleDateString('es-PY')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(registro.created_at).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatearPrecio(registro.precio_base, registro.moneda_base)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {formatearPrecio(registro.costo_total, registro.moneda_base)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {registro.margen_utilidad}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {registro.iva_percent}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatearPrecio(registro.precio_venta_neto, registro.moneda_base)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold">
                        {formatearPrecio(registro.precio_final_lista, registro.moneda_base)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <VariacionIcon tipo={variacion} />
                        {variacion && variacion !== 'neutral' && (
                          <span className={`text-xs ${variacion === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                            {Math.abs(
                              anterior 
                                ? ((registro.precio_final_lista - anterior.precio_final_lista) / anterior.precio_final_lista * 100)
                                : 0
                            ).toFixed(2)}%
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}