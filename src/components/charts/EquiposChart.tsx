'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/store/useAppStore';
import { Wrench, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const COLORS = {
  operativo: '#10b981',
  reparacion: '#f59e0b',
  fuera_servicio: '#ef4444',
  pendiente: '#6b7280'
};

export function EquiposChart() {
  const { equipos, mantenimientos } = useAppStore();

  // Datos para gráfico de barras - Equipos por cliente
  const equiposPorCliente = equipos.reduce((acc, equipo) => {
    const cliente = equipo.cliente || 'Sin Cliente';
    acc[cliente] = (acc[cliente] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dataBarras = Object.entries(equiposPorCliente).map(([cliente, cantidad]) => ({
    cliente,
    cantidad,
    fill: '#3b82f6'
  }));

  // Datos para gráfico de pie - Estado de componentes
  const estadosComponentes = equipos.reduce((acc, equipo) => {
    equipo.componentes.forEach(comp => {
      const estado = comp.estado.toLowerCase().replace(' ', '_');
      acc[estado] = (acc[estado] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const dataPie = Object.entries(estadosComponentes).map(([estado, cantidad]) => ({
    name: estado.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: cantidad,
    fill: COLORS[estado as keyof typeof COLORS] || '#6b7280'
  }));

  // Estadísticas rápidas
  const totalEquipos = equipos.length;
  const componentesOperativos = Object.values(estadosComponentes).reduce((a, b) => a + b, 0);
  const mantenimientosPendientes = mantenimientos.filter(m => m.estado === 'Pendiente').length;
  const mantenimientosEnProceso = mantenimientos.filter(m => m.estado === 'En proceso').length;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{`${label}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // No mostrar etiquetas para segmentos muy pequeños
    
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Estadísticas rápidas */}
      <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wrench className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalEquipos}</p>
                <p className="text-sm text-gray-600">Total Equipos</p>
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
                <p className="text-2xl font-bold text-gray-900">{componentesOperativos}</p>
                <p className="text-sm text-gray-600">Componentes</p>
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
                <p className="text-2xl font-bold text-gray-900">{mantenimientosPendientes}</p>
                <p className="text-sm text-gray-600">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{mantenimientosEnProceso}</p>
                <p className="text-sm text-gray-600">En Proceso</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de barras - Equipos por cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            Equipos por Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataBarras} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="cliente" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="cantidad" 
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de pie - Estado de componentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Estado de Componentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataPie}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dataPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [value, name]}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Leyenda personalizada */}
          <div className="flex flex-wrap gap-4 mt-4 justify-center">
            {dataPie.map((entry, index) => (
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
        </CardContent>
      </Card>
    </div>
  );
}