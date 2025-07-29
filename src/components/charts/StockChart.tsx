'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/store/useAppStore';
import { Package, TrendingUp, AlertTriangle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

export function StockChart() {
  const { componentesDisponibles, transaccionesStock, getEstadisticasStock } = useAppStore();
  
  const estadisticas = getEstadisticasStock();

  // Datos para gráfico de área - Stock por marca
  const stockPorMarca = componentesDisponibles.reduce((acc, comp) => {
    const marca = comp.marca || 'Sin Marca';
    if (!acc[marca]) {
      acc[marca] = { marca, disponible: 0, total: 0, bajo: 0 };
    }
    acc[marca].disponible += comp.cantidadDisponible;
    acc[marca].total += comp.cantidadOriginal;
    if (comp.cantidadDisponible <= 5 && comp.cantidadDisponible > 0) {
      acc[marca].bajo += 1;
    }
    return acc;
  }, {} as Record<string, any>);

  const dataArea = Object.values(stockPorMarca);

  // Datos para gráfico de barras - Productos con stock bajo
  const productosStockBajo = componentesDisponibles
    .filter(comp => comp.cantidadDisponible <= 5 && comp.cantidadDisponible > 0)
    .map(comp => ({
      nombre: comp.nombre.length > 15 ? comp.nombre.substring(0, 15) + '...' : comp.nombre,
      cantidad: comp.cantidadDisponible,
      marca: comp.marca,
      fill: comp.cantidadDisponible <= 2 ? '#ef4444' : '#f59e0b'
    }))
    .slice(0, 8); // Mostrar solo los primeros 8

  // Datos para gráfico de líneas - Transacciones por día (últimos 7 días)
  const hoy = new Date();
  const ultimosSieteDias = Array.from({ length: 7 }, (_, i) => {
    const fecha = new Date(hoy);
    fecha.setDate(fecha.getDate() - (6 - i));
    return fecha.toISOString().split('T')[0];
  });

  const transaccionesPorDia = ultimosSieteDias.map(fecha => {
    const transaccionesDia = transaccionesStock.filter(t => 
      t.fechaTransaccion?.startsWith(fecha)
    );
    
    const entradas = transaccionesDia.filter(t => 
      ['ENTRADA', 'DEVOLUCION'].includes(t.tipo)
    ).length;
    
    const salidas = transaccionesDia.filter(t => 
      ['SALIDA', 'RESERVA'].includes(t.tipo)
    ).length;

    return {
      fecha: new Date(fecha).toLocaleDateString('es-PY', { 
        month: 'short', 
        day: 'numeric' 
      }),
      entradas,
      salidas,
      total: transaccionesDia.length
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.totalProductos}</p>
                <p className="text-sm text-gray-600">Total Productos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.productosConStockBajo}</p>
                <p className="text-sm text-gray-600">Stock Bajo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ArrowUpCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.entradasMes}</p>
                <p className="text-sm text-gray-600">Entradas Mes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <ArrowDownCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.salidasMes}</p>
                <p className="text-sm text-gray-600">Salidas Mes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.transaccionesHoy}</p>
                <p className="text-sm text-gray-600">Movimientos Hoy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de área - Stock por marca */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Stock por Marca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataArea} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="marca" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stackId="1" 
                    stroke="#94a3b8" 
                    fill="#e2e8f0" 
                    name="Total"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="disponible" 
                    stackId="2" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    name="Disponible"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de barras - Productos con stock bajo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Productos con Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {productosStockBajo.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productosStockBajo} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="nombre" 
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value, name, props) => [
                        value, 
                        'Cantidad',
                        `Marca: ${props.payload.marca}`
                      ]}
                    />
                    <Bar 
                      dataKey="cantidad" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay productos con stock bajo</p>
                    <p className="text-sm">¡Excelente gestión de inventario!</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de líneas - Transacciones por día */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Movimientos de Stock (Últimos 7 días)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={transaccionesPorDia} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="entradas" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  name="Entradas"
                />
                <Line 
                  type="monotone" 
                  dataKey="salidas" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  name="Salidas"
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#6366f1', strokeWidth: 2, r: 3 }}
                  name="Total"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}