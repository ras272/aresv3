'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/store/useAppStore';
import { Wrench, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

const COLORES_ESTADO = {
  'Pendiente': '#f59e0b',
  'En proceso': '#3b82f6',
  'Finalizado': '#10b981'
};

const COLORES_PRIORIDAD = {
  'Baja': '#6b7280',
  'Media': '#f59e0b',
  'Alta': '#f97316',
  'Crítica': '#ef4444'
};

export function MantenimientosChart() {
  const { mantenimientos, equipos } = useAppStore();

  // Estadísticas rápidas
  const totalMantenimientos = mantenimientos.length;
  const pendientes = mantenimientos.filter(m => m.estado === 'Pendiente').length;
  const enProceso = mantenimientos.filter(m => m.estado === 'En proceso').length;
  const finalizados = mantenimientos.filter(m => m.estado === 'Finalizado').length;
  const criticos = mantenimientos.filter(m => m.prioridad === 'Crítica').length;

  // Datos para gráfico de pie - Estados de mantenimiento
  const estadosData = [
    { name: 'Pendiente', value: pendientes, fill: COLORES_ESTADO['Pendiente'] },
    { name: 'En Proceso', value: enProceso, fill: COLORES_ESTADO['En proceso'] },
    { name: 'Finalizado', value: finalizados, fill: COLORES_ESTADO['Finalizado'] }
  ].filter(item => item.value > 0);

  // Datos para gráfico de barras - Mantenimientos por prioridad
  const prioridadData = [
    { prioridad: 'Baja', cantidad: mantenimientos.filter(m => m.prioridad === 'Baja').length, fill: COLORES_PRIORIDAD['Baja'] },
    { prioridad: 'Media', cantidad: mantenimientos.filter(m => m.prioridad === 'Media').length, fill: COLORES_PRIORIDAD['Media'] },
    { prioridad: 'Alta', cantidad: mantenimientos.filter(m => m.prioridad === 'Alta').length, fill: COLORES_PRIORIDAD['Alta'] },
    { prioridad: 'Crítica', cantidad: mantenimientos.filter(m => m.prioridad === 'Crítica').length, fill: COLORES_PRIORIDAD['Crítica'] }
  ];

  // Datos para gráfico de barras - Mantenimientos por tipo
  const tipoData = [
    { 
      tipo: 'Correctivo', 
      cantidad: mantenimientos.filter(m => m.tipo === 'Correctivo').length,
      fill: '#ef4444'
    },
    { 
      tipo: 'Preventivo', 
      cantidad: mantenimientos.filter(m => m.tipo === 'Preventivo').length,
      fill: '#10b981'
    }
  ];

  // Datos para gráfico de líneas - Mantenimientos por mes (últimos 6 meses)
  const hoy = new Date();
  const ultimosSeisMeses = Array.from({ length: 6 }, (_, i) => {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - (5 - i), 1);
    return {
      mes: fecha.toLocaleDateString('es-PY', { month: 'short', year: '2-digit' }),
      fecha: fecha
    };
  });

  const mantenimientosPorMes = ultimosSeisMeses.map(({ mes, fecha }) => {
    const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
    const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
    
    const mantenimientosMes = mantenimientos.filter(m => {
      const fechaMantenimiento = new Date(m.fecha);
      return fechaMantenimiento >= inicioMes && fechaMantenimiento <= finMes;
    });

    return {
      mes,
      correctivos: mantenimientosMes.filter(m => m.tipo === 'Correctivo').length,
      preventivos: mantenimientosMes.filter(m => m.tipo === 'Preventivo').length,
      total: mantenimientosMes.length
    };
  });

  // Equipos con más mantenimientos
  const equiposConMantenimientos = equipos.map(equipo => {
    const mantenimientosEquipo = mantenimientos.filter(m => m.equipoId === equipo.id);
    return {
      nombre: equipo.nombreEquipo.length > 20 ? 
        equipo.nombreEquipo.substring(0, 20) + '...' : 
        equipo.nombreEquipo,
      cantidad: mantenimientosEquipo.length,
      cliente: equipo.cliente,
      fill: mantenimientosEquipo.length > 3 ? '#ef4444' : 
            mantenimientosEquipo.length > 1 ? '#f59e0b' : '#10b981'
    };
  })
  .filter(equipo => equipo.cantidad > 0)
  .sort((a, b) => b.cantidad - a.cantidad)
  .slice(0, 8);

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

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wrench className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalMantenimientos}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendientes}</p>
                <p className="text-sm text-gray-600">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{enProceso}</p>
                <p className="text-sm text-gray-600">En Proceso</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{finalizados}</p>
                <p className="text-sm text-gray-600">Finalizados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{criticos}</p>
                <p className="text-sm text-gray-600">Críticos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de pie - Estados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Estados de Mantenimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {estadosData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={estadosData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {estadosData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Wrench className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay mantenimientos registrados</p>
                  </div>
                </div>
              )}
            </div>
            
            {estadosData.length > 0 && (
              <div className="flex flex-wrap gap-4 mt-4 justify-center">
                {estadosData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.fill }}
                    />
                    <span className="text-sm text-gray-600">
                      {entry.name} ({entry.value})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de barras - Prioridad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Mantenimientos por Prioridad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prioridadData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="prioridad" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="cantidad" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de barras - Tipo de mantenimiento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-green-600" />
              Tipo de Mantenimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tipoData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="tipo" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="cantidad" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de barras - Equipos con más mantenimientos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Equipos con Más Mantenimientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {equiposConMantenimientos.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={equiposConMantenimientos} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                        'Mantenimientos',
                        `Cliente: ${props.payload.cliente}`
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
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay datos de mantenimientos</p>
                    <p className="text-sm">Los equipos están en perfecto estado</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de líneas - Tendencia mensual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Tendencia de Mantenimientos (Últimos 6 meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mantenimientosPorMes} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="correctivos" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  name="Correctivos"
                />
                <Line 
                  type="monotone" 
                  dataKey="preventivos" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  name="Preventivos"
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