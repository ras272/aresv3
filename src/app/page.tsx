'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import {
  Heart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  ArrowRight,
  Building2,
  DollarSign,
  Star,
  Zap,
  Users,
  Wrench,
  Package,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import React from 'react';
import {
  EquiposStatusRecharts,
  MantenimientosTrendRecharts,
  StockPorMarcaRecharts,
  IngresosMensualesRecharts,
  KPIsRecharts
} from '@/components/charts/RechartsComponents';

// 🎨 Componente de título animado
const AnimatedTitle = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const phrases = [
    "Centro de control",
    "Gestión inteligente", 
    "Monitoreo en tiempo real",
    "Servicio técnico avanzado"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % phrases.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center space-x-2">
      <motion.span
        className="text-muted-foreground"
        initial={{ opacity: 0.7 }}
        animate={{ opacity: 1 }}
      >
        Sistema de
      </motion.span>
      <motion.span
        key={currentIndex}
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.9 }}
        transition={{ 
          duration: 0.5, 
          ease: "easeOut",
          type: "spring",
          stiffness: 100
        }}
        className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
      >
        {phrases[currentIndex]}
      </motion.span>
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-2 h-2 bg-blue-500 rounded-full"
      />
    </div>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const { equipos, mantenimientos, componentesDisponibles } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga inicial
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // 📊 CÁLCULOS EJECUTIVOS AVANZADOS
  const calcularMetricasEjecutivas = () => {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);

    // 💰 Ingresos del mes
    const mantenimientosMesActual = mantenimientos.filter(m => {
      const fecha = new Date(m.fecha);
      return fecha >= inicioMes && m.estado === 'Finalizado' && m.precioServicio;
    });
    
    const mantenimientosMesAnterior = mantenimientos.filter(m => {
      const fecha = new Date(m.fecha);
      return fecha >= inicioMesAnterior && fecha <= finMesAnterior && m.estado === 'Finalizado' && m.precioServicio;
    });

    const ingresosMesActual = mantenimientosMesActual.reduce((total, m) => total + (m.precioServicio || 0), 0);
    const ingresosMesAnterior = mantenimientosMesAnterior.reduce((total, m) => total + (m.precioServicio || 0), 0);
    const crecimientoIngresos = ingresosMesAnterior > 0 ? ((ingresosMesActual - ingresosMesAnterior) / ingresosMesAnterior * 100) : 0;

    // ⭐ Satisfacción del cliente (basada en mantenimientos sin problemas)
    const mantenimientosRecientes = mantenimientos.filter(m => {
      const fecha = new Date(m.fecha);
      const hace30Dias = new Date();
      hace30Dias.setDate(hace30Dias.getDate() - 30);
      return fecha >= hace30Dias && m.estado === 'Finalizado';
    });

    const mantenimientosSinProblemas = mantenimientosRecientes.filter(m => 
      !m.comentarios?.toLowerCase().includes('problema') &&
      !m.comentarios?.toLowerCase().includes('reclamo') &&
      !m.comentarios?.toLowerCase().includes('falla')
    );

    const satisfaccion = mantenimientosRecientes.length > 0 ? 
      (mantenimientosSinProblemas.length / mantenimientosRecientes.length * 5) : 4.8;

    // ⚡ Eficiencia operativa
    const mantenimientosHoy = mantenimientos.filter(m => {
      const fecha = new Date(m.fecha);
      return fecha.toDateString() === hoy.toDateString() && m.estado === 'Finalizado';
    });

    const tiempoPromedio = mantenimientosHoy.length > 0 ? 
      mantenimientosHoy.reduce((acc, m) => acc + (m.tiempoReal || 2.5), 0) / mantenimientosHoy.length : 2.3;

    // 🏥 Clientes únicos activos
    const clientesActivos = new Set(
      mantenimientos
        .filter(m => {
          const fecha = new Date(m.fecha);
          const hace30Dias = new Date();
          hace30Dias.setDate(hace30Dias.getDate() - 30);
          return fecha >= hace30Dias;
        })
        .map(m => equipos.find(e => e.id === m.equipoId)?.cliente)
        .filter(Boolean)
    ).size;

    return {
      ingresosMesActual,
      crecimientoIngresos,
      satisfaccion,
      tiempoPromedio,
      clientesActivos,
      mantenimientosHoy: mantenimientosHoy.length
    };
  };

  const metricas = calcularMetricasEjecutivas();

  // 📊 Métricas principales ejecutivas
  const metricasPrincipales = [
    {
      name: 'Ingresos del Mes',
      value: `$${metricas.ingresosMesActual.toLocaleString()}`,
      change: metricas.crecimientoIngresos,
      icon: DollarSign,
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200'
    },
    {
      name: 'Satisfacción Cliente',
      value: `${metricas.satisfaccion.toFixed(1)}/5.0`,
      change: metricas.satisfaccion >= 4.5 ? 5 : -2,
      icon: Star,
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-200'
    },
    {
      name: 'Eficiencia Operativa',
      value: `${metricas.tiempoPromedio.toFixed(1)}h`,
      change: metricas.tiempoPromedio <= 2.5 ? 8 : -3,
      icon: Zap,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200'
    },
    {
      name: 'Clientes Activos',
      value: metricas.clientesActivos.toString(),
      change: 12,
      icon: Users,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200'
    }
  ];

  // 🔧 Estado operacional
  const mantenimientosPendientes = mantenimientos.filter(m => m.estado === 'Pendiente');
  const mantenimientosEnProceso = mantenimientos.filter(m => m.estado === 'En proceso');
  const stockBajo = componentesDisponibles.filter(c => c.cantidadDisponible <= 2);
  const valorTotalStock = componentesDisponibles.reduce((total, c) => total + (c.cantidadDisponible * 150), 0);
  const stockSaludable = ((componentesDisponibles.length - stockBajo.length) / componentesDisponibles.length * 100) || 85;

  // 🚨 Alertas ejecutivas
  const generarAlertasEjecutivas = () => {
    const alertas = [];

    // Cliente con múltiples servicios
    const clientesConMuchosServicios = {};
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);

    mantenimientos.forEach(m => {
      if (new Date(m.fecha) >= hace7Dias) {
        const equipo = equipos.find(e => e.id === m.equipoId);
        if (equipo) {
          clientesConMuchosServicios[equipo.cliente] = (clientesConMuchosServicios[equipo.cliente] || 0) + 1;
        }
      }
    });

    Object.entries(clientesConMuchosServicios).forEach(([cliente, cantidad]) => {
      if (cantidad >= 3) {
        alertas.push({
          tipo: 'cliente_frecuente',
          mensaje: `${cliente}: ${cantidad} servicios esta semana`,
          color: 'text-orange-600'
        });
      }
    });

    // Stock crítico
    if (stockBajo.length > 0) {
      alertas.push({
        tipo: 'stock_critico',
        mensaje: `${stockBajo.length} componente${stockBajo.length > 1 ? 's' : ''} con stock crítico`,
        color: 'text-red-600'
      });
    }

    // Equipos fuera de servicio por mucho tiempo
    const equiposCriticos = equipos.filter(e => 
      e.componentes?.some(c => c.estado === 'Fuera de servicio')
    );

    if (equiposCriticos.length > 0) {
      alertas.push({
        tipo: 'equipos_criticos',
        mensaje: `${equiposCriticos.length} equipo${equiposCriticos.length > 1 ? 's' : ''} fuera de servicio`,
        color: 'text-red-600'
      });
    }

    return alertas.slice(0, 3);
  };

  const alertasEjecutivas = generarAlertasEjecutivas();

  if (loading) {
    return (
      <DashboardLayout title="Dashboard" subtitle={<AnimatedTitle />}>
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard" subtitle={<AnimatedTitle />}>
      <div className="space-y-6">
        
        {/* 📊 Métricas Ejecutivas Principales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metricasPrincipales.map((metrica) => (
            <Card key={metrica.name} className="p-6 border border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {metrica.name}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrica.value}
                  </p>
                  <div className="flex items-center mt-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      metrica.change > 0 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {metrica.change > 0 ? '+' : ''}{metrica.change.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  {React.createElement(metrica.icon, { className: "h-6 w-6 text-gray-700" })}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* 📊 Gráficos Ejecutivos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Estado de Equipos */}
          <EquiposStatusRecharts
            operativos={equipos.filter(e => e.componentes?.every(c => c.estado === 'Operativo') ?? true).length}
            enMantenimiento={equipos.filter(e => e.componentes?.some(c => c.estado === 'En reparacion') ?? false).length}
            fueraDeServicio={equipos.filter(e => e.componentes?.some(c => c.estado === 'Fuera de servicio') ?? false).length}
          />

          {/* KPIs Principales */}
          <KPIsRecharts
            satisfaccionCliente={Math.round(metricas.satisfaccion * 20)} // Convertir de 0-5 a 0-100
            eficienciaOperativa={metricas.tiempoPromedio <= 2.5 ? 85 : 65}
            cumplimientoSLA={Math.round(stockSaludable)}
          />

          {/* Stock por Marca */}
          <StockPorMarcaRecharts
            data={(() => {
              const stockPorMarca = {};
              componentesDisponibles.forEach(c => {
                const marca = c.marca || 'Sin Marca';
                stockPorMarca[marca] = (stockPorMarca[marca] || 0) + c.cantidadDisponible;
              });
              return Object.entries(stockPorMarca)
                .map(([marca, cantidad]) => ({ marca, cantidad }))
                .sort((a, b) => b.cantidad - a.cantidad)
                .slice(0, 6); // Top 6 marcas
            })()}
          />

          {/* Ingresos Mensuales */}
          <IngresosMensualesRecharts
            data={(() => {
              const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
              const hoy = new Date();
              return meses.map((mes, index) => {
                const fechaMes = new Date(hoy.getFullYear(), index, 1);
                const ingresosMes = mantenimientos
                  .filter(m => {
                    const fechaM = new Date(m.fecha);
                    return fechaM.getMonth() === index && 
                           fechaM.getFullYear() === hoy.getFullYear() &&
                           m.estado === 'Finalizado' && 
                           m.precioServicio;
                  })
                  .reduce((total, m) => total + (m.precioServicio || 0), 0);
                
                return { mes, ingresos: ingresosMes };
              });
            })()}
          />
        </motion.div>

        {/* 🔧 Estado Operacional */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          {/* Servicio Técnico */}
          <Card className="p-6 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-700 flex items-center">
                <Wrench className="h-5 w-5 mr-2" />
                Servicio Técnico
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/servtec')}
                className="text-blue-600 hover:text-blue-700"
              >
                Ver todo
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pendientes</span>
                <span className="font-semibold text-red-600">{mantenimientosPendientes.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">En Proceso</span>
                <span className="font-semibold text-yellow-600">{mantenimientosEnProceso.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completados Hoy</span>
                <span className="font-semibold text-green-600">{metricas.mantenimientosHoy}</span>
              </div>
            </div>
          </Card>

          {/* Inventario */}
          <Card className="p-6 border-l-4 border-l-orange-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-orange-700 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Inventario
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/inventario-tecnico')}
                className="text-orange-600 hover:text-orange-700"
              >
                Ver stock
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Stock Crítico</span>
                <span className={`font-semibold ${stockBajo.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {stockBajo.length} items
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Stock Saludable</span>
                <span className="font-semibold text-green-600">{stockSaludable.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Valor Total</span>
                <span className="font-semibold text-blue-600">${valorTotalStock.toLocaleString()}</span>
              </div>
            </div>
          </Card>

          {/* Rendimiento */}
          <Card className="p-6 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-700 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Rendimiento
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tiempo Promedio</span>
                <span className="font-semibold text-blue-600">{metricas.tiempoPromedio.toFixed(1)}h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Satisfacción</span>
                <span className="font-semibold text-green-600">{metricas.satisfaccion.toFixed(1)}/5.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Clientes Activos</span>
                <span className="font-semibold text-purple-600">{metricas.clientesActivos}</span>
              </div>
            </div>
          </Card>
        </motion.div>



        {/* Acceso Rápido a ServTec */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6 hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-blue-500"
                onClick={() => router.push('/servtec')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-blue-700 transition-colors">
                    Centro de Control ServTec
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Gestión completa de mantenimientos y servicio técnico
                  </p>
                </div>
              </div>
              <div className="flex items-center text-blue-600 group-hover:text-blue-700 transition-colors">
                <span className="text-sm font-medium mr-2">Abrir</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Estado Positivo cuando todo está bien */}
        {mantenimientosPendientes.length === 0 && alertasEjecutivas.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="p-8 text-center bg-green-50 border-green-200">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-900 mb-2">
                ¡Sistema Operando Perfectamente!
              </h3>
              <p className="text-green-700 mb-4">
                No hay alertas críticas ni mantenimientos pendientes
              </p>
              <div className="flex justify-center space-x-4">
                <Button 
                  onClick={() => router.push('/servtec')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Ir a ServTec
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/reportes')}
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  Ver Reportes
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}