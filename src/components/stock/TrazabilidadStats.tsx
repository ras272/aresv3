'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Activity,
  ArrowUpCircle,
  ArrowDownCircle,
  BarChart3,
  Calendar
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface EstadisticasTrazabilidad {
  totalMovimientos: number;
  movimientosHoy: number;
  movimientosMes: number;
  entradas: { total: number; mes: number; valorTotal: number };
  salidas: { total: number; mes: number; valorTotal: number };
  ajustes: { total: number; mes: number };
  productosConMasMovimientos: Array<{ producto: string; cantidad: number }>;
  carpetasConMasActividad: Array<{ carpeta: string; cantidad: number }>;
}

export function TrazabilidadStats() {
  const { getEstadisticasTrazabilidad } = useAppStore();
  const [estadisticas, setEstadisticas] = useState<EstadisticasTrazabilidad | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        setIsLoading(true);
        const stats = await getEstadisticasTrazabilidad();
        setEstadisticas(stats);
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    cargarEstadisticas();
  }, [getEstadisticasTrazabilidad]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!estadisticas) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Movimientos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.totalMovimientos}</div>
            <p className="text-xs text-muted-foreground">
              {estadisticas.movimientosHoy} hoy • {estadisticas.movimientosMes} este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Entradas</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {estadisticas.entradas.total}
            </div>
            <p className="text-xs text-muted-foreground">
              {estadisticas.entradas.mes} este mes
            </p>
            {estadisticas.entradas.valorTotal > 0 && (
              <p className="text-xs text-green-600 font-medium">
                {formatCurrency(estadisticas.entradas.valorTotal)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Salidas</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {estadisticas.salidas.total}
            </div>
            <p className="text-xs text-muted-foreground">
              {estadisticas.salidas.mes} este mes
            </p>
            {estadisticas.salidas.valorTotal > 0 && (
              <p className="text-xs text-red-600 font-medium">
                {formatCurrency(estadisticas.salidas.valorTotal)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ajustes</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {estadisticas.ajustes.total}
            </div>
            <p className="text-xs text-muted-foreground">
              {estadisticas.ajustes.mes} este mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Productos y carpetas con más actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productos con más movimientos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-500" />
              <span>Productos con Más Movimientos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {estadisticas.productosConMasMovimientos.length > 0 ? (
              <div className="space-y-3">
                {estadisticas.productosConMasMovimientos.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate">{item.producto}</p>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {item.cantidad} movimientos
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay datos de movimientos aún
              </p>
            )}
          </CardContent>
        </Card>

        {/* Carpetas con más actividad */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span>Carpetas con Más Actividad</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {estadisticas.carpetasConMasActividad.length > 0 ? (
              <div className="space-y-3">
                {estadisticas.carpetasConMasActividad.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate">{item.carpeta}</p>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {item.cantidad} movimientos
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay datos de carpetas aún
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Indicadores de rendimiento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-purple-500" />
            <span>Resumen de Actividad</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {estadisticas.entradas.mes - estadisticas.salidas.mes}
              </div>
              <p className="text-sm text-green-700">Balance del Mes</p>
              <p className="text-xs text-muted-foreground">
                {estadisticas.entradas.mes - estadisticas.salidas.mes >= 0 ? 'Crecimiento' : 'Reducción'} neto
              </p>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {estadisticas.movimientosMes > 0 ? 
                  Math.round((estadisticas.salidas.mes / estadisticas.movimientosMes) * 100) : 0}%
              </div>
              <p className="text-sm text-blue-700">Rotación del Mes</p>
              <p className="text-xs text-muted-foreground">
                Porcentaje de salidas
              </p>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {estadisticas.movimientosHoy}
              </div>
              <p className="text-sm text-purple-700">Actividad Hoy</p>
              <p className="text-xs text-muted-foreground">
                Movimientos registrados
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}