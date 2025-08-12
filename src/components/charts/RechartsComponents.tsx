'use client';

import React from 'react';
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

// 📊 Gráfico de Stock por Marca (Bar Chart)
interface StockPorMarcaRechartsProps {
  data: Array<{
    marca: string;
    cantidad: number;
  }>;
}

export const StockPorMarcaRecharts: React.FC<StockPorMarcaRechartsProps> = ({ data }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Stock: {payload[0].value} unidades
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Stock por Marca</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <XAxis 
                dataKey="marca" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: COLORS.gray }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: COLORS.gray }}
              />
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="cantidad" 
                fill={COLORS.primary}
                radius={[4, 4, 0, 0]}
                name="Cantidad en Stock"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// 📈 Gráfico de Ingresos Mensuales (Line Chart)
interface IngresosMensualesRechartsProps {
  data: Array<{
    mes: string;
    ingresos: number;
  }>;
}

export const IngresosMensualesRecharts: React.FC<IngresosMensualesRechartsProps> = ({ data }) => {
  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Ingresos: {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Ingresos Mensuales</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                tickFormatter={formatCurrency}
              />
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="ingresos"
                stroke={COLORS.success}
                strokeWidth={3}
                dot={{ fill: COLORS.success, strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: COLORS.success }}
                name="Ingresos"
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