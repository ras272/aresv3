'use client';

import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Coins } from 'lucide-react';

// 🎨 Paleta de colores profesional
const COLORS = {
  primary: '#3B82F6',    // Blue
  success: '#10B981',    // Green
  warning: '#F59E0B',    // Amber
  danger: '#EF4444',     // Red
  purple: '#8B5CF6',     // Purple
  cyan: '#06B6D4',       // Cyan
  gray: '#6B7280'        // Gray
};

// 🍩 Gráfico de Estado de Equipos (Pie Chart)
interface EquiposStatusRechartsProps {
  operativos: number;
  enMantenimiento: number;
  fueraDeServicio: number;
}

export const EquiposStatusRecharts: React.FC<EquiposStatusRechartsProps> = ({
  operativos,
  enMantenimiento,
  fueraDeServicio
}) => {
  const data = [
    { name: 'Operativos', value: operativos, color: COLORS.success },
    { name: 'En Mantenimiento', value: enMantenimiento, color: COLORS.warning },
    { name: 'Fuera de Servicio', value: fueraDeServicio, color: COLORS.danger }
  ];

  const total = operativos + enMantenimiento + fueraDeServicio;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            {data.value} equipos ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Estado de Equipos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => <span className="text-sm text-gray-700">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center mt-4">
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-sm text-gray-600">Total Equipos</p>
        </div>
      </CardContent>
    </Card>
  );
};

// 📈 Gráfico de Mantenimientos Tendencia (Area Chart)
interface MantenimientosTrendRechartsProps {
  data: Array<{
    mes: string;
    preventivos: number;
    correctivos: number;
  }>;
}

export const MantenimientosTrendRecharts: React.FC<MantenimientosTrendRechartsProps> = ({ data }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value} mantenimientos
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Tendencia de Mantenimientos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPreventivos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorCorrectivos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.danger} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.danger} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="mes" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: COLORS.gray }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: COLORS.gray }}
              />
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                formatter={(value) => <span className="text-sm text-gray-700">{value}</span>}
              />
              <Area
                type="monotone"
                dataKey="preventivos"
                stackId="1"
                stroke={COLORS.primary}
                fill="url(#colorPreventivos)"
                name="Preventivos"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="correctivos"
                stackId="1"
                stroke={COLORS.danger}
                fill="url(#colorCorrectivos)"
                name="Correctivos"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// 📈 Gráfico de Movimientos de Stock por Marca (Area Chart)
interface MovimientosStockRechartsProps {
  data: Array<{
    mes: string;
    [marca: string]: number | string;
  }>;
}

export const MovimientosStockRecharts: React.FC<MovimientosStockRechartsProps> = ({ data }) => {
  // Obtener las marcas dinámicamente (excluyendo 'mes')
  const marcas = data.length > 0 ? Object.keys(data[0]).filter(key => key !== 'mes') : [];
  
  // Colores para las diferentes marcas
  const marcaColors = [
    COLORS.primary,   // Blue
    COLORS.success,   // Green  
    COLORS.warning,   // Amber
    COLORS.danger,    // Red
    COLORS.purple,    // Purple
    COLORS.cyan       // Cyan
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const totalMovimientos = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload
            .sort((a: any, b: any) => b.value - a.value)
            .map((entry: any, index: number) => (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {entry.dataKey}: {entry.value} unidades
              </p>
            ))}
          <div className="border-t pt-1 mt-1">
            <p className="text-sm font-medium text-gray-700">
              Total: {totalMovimientos} unidades
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Movimientos de Stock por Marca</CardTitle>
        <p className="text-sm text-gray-600">Productos que más salen del inventario</p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                {marcas.map((marca, index) => (
                  <linearGradient key={marca} id={`color${marca.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={marcaColors[index % marcaColors.length]} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={marcaColors[index % marcaColors.length]} stopOpacity={0.1}/>
                  </linearGradient>
                ))}
              </defs>
              <XAxis 
                dataKey="mes" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: COLORS.gray }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: COLORS.gray }}
              />
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                formatter={(value) => <span className="text-sm text-gray-700">{value}</span>}
              />
              {marcas.map((marca, index) => (
                <Area
                  key={marca}
                  type="monotone"
                  dataKey={marca}
                  stackId="1"
                  stroke={marcaColors[index % marcaColors.length]}
                  fill={`url(#color${marca.replace(/\s+/g, '')})`}
                  name={marca}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// 📈 Gráfico de Ingresos Mensuales (Line Chart) - ACTUALIZADO PARA MULTI-MONEDA
interface IngresosMensualesRechartsProps {
  data: Array<{
    mes: string;
    ventasUSD: number;
    ventasGS: number;
  }>;
}

export const IngresosMensualesRecharts: React.FC<IngresosMensualesRechartsProps> = ({ data }) => {
  const [monedaSeleccionada, setMonedaSeleccionada] = useState<'USD' | 'GS'>('USD');

  const formatCurrency = (value: number, moneda: 'USD' | 'GS') => {
    if (moneda === 'USD') {
      return `$${value.toLocaleString('es-PY')}`;
    } else {
      return `₲ ${value.toLocaleString('es-PY')}`;
    }
  };

  const getCurrentData = () => {
    return data.map(item => ({
      ...item,
      ingresos: monedaSeleccionada === 'USD' ? item.ventasUSD : item.ventasGS
    }));
  };

  const getCurrentColor = () => {
    return monedaSeleccionada === 'USD' ? COLORS.success : COLORS.primary;
  };

  const getTotalIngresos = () => {
    return getCurrentData().reduce((sum, item) => sum + item.ingresos, 0);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Ventas: {formatCurrency(payload[0].value, monedaSeleccionada)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">Ventas Mensuales</CardTitle>
            <p className="text-sm text-gray-600">Basado en movimientos reales de stock</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={monedaSeleccionada === 'USD' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMonedaSeleccionada('USD')}
              className="flex items-center gap-1"
            >
              <DollarSign className="w-4 h-4" />
              USD
            </Button>
            <Button
              variant={monedaSeleccionada === 'GS' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMonedaSeleccionada('GS')}
              className="flex items-center gap-1"
            >
              <Coins className="w-4 h-4" />
              GS
            </Button>
          </div>
        </div>
        {/* Mostrar total de ingresos */}
        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Total en los últimos 6 meses</p>
          <p className="text-2xl font-bold" style={{ color: getCurrentColor() }}>
            {formatCurrency(getTotalIngresos(), monedaSeleccionada)}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={getCurrentData()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <XAxis 
                dataKey="mes" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: COLORS.gray }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: COLORS.gray }}
                tickFormatter={(value) => formatCurrency(value, monedaSeleccionada)}
              />
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="ingresos"
                stroke={getCurrentColor()}
                strokeWidth={3}
                dot={{ fill: getCurrentColor(), strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: getCurrentColor() }}
                name="Ventas"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// 🎯 KPIs con Radial Bar Chart
interface KPIsRechartsProps {
  satisfaccionCliente: number; // 0-100
  eficienciaOperativa: number; // 0-100
  cumplimientoSLA: number; // 0-100
}

export const KPIsRecharts: React.FC<KPIsRechartsProps> = ({
  satisfaccionCliente,
  eficienciaOperativa,
  cumplimientoSLA
}) => {
  const data = [
    { name: 'Satisfacción Cliente', value: satisfaccionCliente, fill: COLORS.success },
    { name: 'Eficiencia Operativa', value: eficienciaOperativa, fill: COLORS.primary },
    { name: 'Cumplimiento SLA', value: cumplimientoSLA, fill: COLORS.warning }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.payload.name}</p>
          <p className="text-sm text-gray-600">{data.value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">KPIs Principales</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={data}>
              <RadialBar
                minAngle={15}
                label={{ position: 'insideStart', fill: '#fff', fontSize: 12 }}
                background
                clockWise
                dataKey="value"
              />
              <Legend 
                iconSize={10}
                layout="vertical"
                verticalAlign="bottom"
                align="center"
                formatter={(value) => <span className="text-sm text-gray-700">{value}</span>}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};