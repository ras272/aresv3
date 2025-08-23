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
  MovimientosStockRecharts,
  IngresosMensualesRecharts
} from '@/components/charts/RechartsComponents';
import { UniversalSearch } from '@/components/search/UniversalSearch';

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
  const { equipos, mantenimientos, stockItems, movimientosStock, catalogoProductos, loadCatalogoProductos, loadMovimientosStock } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Cargar catálogo de productos y movimientos de stock
        await Promise.all([
          loadCatalogoProductos(),
          loadMovimientosStock()
        ]);
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    cargarDatos();
  }, []);

  // 💰 CALCULAR VENTAS REALES BASADAS EN MOVIMIENTOS DE STOCK CON PRECIOS DUALES
  const calcularVentasReales = () => {
    const hoy = new Date();
    const ultimosSeisMeses = Array.from({ length: 6 }, (_, i) => {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - (5 - i), 1);
      return {
        mes: fecha.toLocaleDateString('es-PY', { month: 'short' }),
        mesNumero: fecha.getMonth(),
        año: fecha.getFullYear(),
        fecha: fecha
      };
    });

    return ultimosSeisMeses.map(({ mes, mesNumero, año }) => {
      const inicioMes = new Date(año, mesNumero, 1);
      const finMes = new Date(año, mesNumero + 1, 0);
      
      // Obtener movimientos de salida del mes
      const movimientosMes = movimientosStock.filter(mov => {
        const fechaMovimiento = new Date(mov.fechaMovimiento);
        return fechaMovimiento >= inicioMes && 
               fechaMovimiento <= finMes && 
               mov.tipoMovimiento === 'Salida';
      });

      let ventasUSD = 0;
      let ventasGS = 0;

      // Calcular ventas por movimiento usando precios duales del catálogo
      movimientosMes.forEach(movimiento => {
        // Buscar el producto en el catálogo
        // Primero intentar por nombre y marca del movimiento directo
        let productoEnCatalogo = catalogoProductos.find(prod => 
          prod.nombre === movimiento.productoNombre && 
          prod.marca === movimiento.productoMarca
        );

        if (productoEnCatalogo) {
          let valorVenta = 0;
          let monedaVenta = 'USD';
          
          // 🎯 LÓGICA DE PRECIOS DUALES SEGÚN TIPO DE MOVIMIENTO
          if (movimiento.tipoUnidadMovimiento === 'caja' && movimiento.cajasAfectadas > 0) {
            // Venta por caja completa
            if (productoEnCatalogo.precioPorCaja && productoEnCatalogo.precioPorCaja > 0) {
              valorVenta = productoEnCatalogo.precioPorCaja * movimiento.cajasAfectadas;
              monedaVenta = productoEnCatalogo.monedaCaja || 'USD';
            } else {
              // Fallback al precio legacy
              valorVenta = (productoEnCatalogo.precio || 0) * movimiento.cantidad;
              monedaVenta = productoEnCatalogo.moneda || 'USD';
            }
          } else if (movimiento.tipoUnidadMovimiento === 'unidad') {
            // Venta por unidad individual
            const unidadesVendidas = movimiento.unidadesSueltasAfectadas || movimiento.cantidad;
            
            if (productoEnCatalogo.precioPorUnidad && productoEnCatalogo.precioPorUnidad > 0) {
              valorVenta = productoEnCatalogo.precioPorUnidad * unidadesVendidas;
              monedaVenta = productoEnCatalogo.monedaUnidad || 'USD';
            } else if (productoEnCatalogo.precioPorCaja && productoEnCatalogo.unidadesPorCaja && productoEnCatalogo.unidadesPorCaja > 1) {
              // Calcular precio por unidad desde precio por caja
              const precioPorUnidadCalculado = productoEnCatalogo.precioPorCaja / productoEnCatalogo.unidadesPorCaja;
              valorVenta = precioPorUnidadCalculado * unidadesVendidas;
              monedaVenta = productoEnCatalogo.monedaCaja || 'USD';
            } else {
              // Fallback al precio legacy
              valorVenta = (productoEnCatalogo.precio || 0) * unidadesVendidas;
              monedaVenta = productoEnCatalogo.moneda || 'USD';
            }
          } else {
            // Venta sin tipo específico - usar mejor precio disponible
            if (productoEnCatalogo.precioPorCaja && productoEnCatalogo.precioPorCaja > 0) {
              valorVenta = productoEnCatalogo.precioPorCaja * movimiento.cantidad;
              monedaVenta = productoEnCatalogo.monedaCaja || 'USD';
            } else if (productoEnCatalogo.precioPorUnidad && productoEnCatalogo.precioPorUnidad > 0) {
              valorVenta = productoEnCatalogo.precioPorUnidad * movimiento.cantidad;
              monedaVenta = productoEnCatalogo.monedaUnidad || 'USD';
            } else {
              valorVenta = (productoEnCatalogo.precio || 0) * movimiento.cantidad;
              monedaVenta = productoEnCatalogo.moneda || 'USD';
            }
          }
          
          // Sumar a la moneda correspondiente
          if (monedaVenta === 'USD') {
            ventasUSD += valorVenta;
          } else {
            ventasGS += valorVenta;
          }
        } else {
          // Si no está en catálogo, usar precio estimado en USD por defecto
          ventasUSD += movimiento.cantidad * 50; // Precio estimado
        }
      });

      return {
        mes,
        ventasUSD: Math.round(ventasUSD),
        ventasGS: Math.round(ventasGS)
      };
    });
  };

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

  // Se eliminó la sección de métricas principales ejecutivas

  // 🔧 Estado operacional - ACTUALIZADO para usar stockItems reales
  const mantenimientosPendientes = mantenimientos.filter(m => m.estado === 'Pendiente');
  const mantenimientosEnProceso = mantenimientos.filter(m => m.estado === 'En proceso');
  
  // 📦 Usar stockItems reales en lugar de componentesDisponibles
  const stockBajo = stockItems.filter(item => item.cantidadDisponible <= 5 && item.cantidadDisponible > 0);
  const stockSinExistencias = stockItems.filter(item => item.cantidadDisponible === 0);
  const valorTotalStock = stockItems.reduce((total, item) => total + (item.cantidadDisponible * 200), 0);
  const stockSaludable = stockItems.length > 0 
    ? ((stockItems.length - stockBajo.length - stockSinExistencias.length) / stockItems.length * 100) 
    : 100;

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
          {/* Skeleton de la búsqueda */}
          <div className="max-w-2xl mx-auto">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
          {/* Skeleton de los gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
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
        
        {/* 🔍 Búsqueda Universal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto"
        >
          <div className="space-y-2">
            <UniversalSearch 
              placeholder="🔍 Buscar equipos, clientes, servicios, componentes..."
              className="w-full"
            />
            {/* Debug: Mostrar cantidad de datos */}
            <div className="text-xs text-gray-500 text-center">
              Datos: {equipos.length} equipos, {mantenimientos.length} mantenimientos, {stockItems.length} items stock
            </div>
          </div>
        </motion.div>

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

          {/* Tendencia de Mantenimientos */}
          <MantenimientosTrendRecharts
            data={(() => {
              // Generar datos de los últimos 6 meses
              const hoy = new Date();
              const ultimosSeisMeses = Array.from({ length: 6 }, (_, i) => {
                const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - (5 - i), 1);
                return {
                  mes: fecha.toLocaleDateString('es-PY', { month: 'short' }),
                  fecha: fecha
                };
              });
              
              return ultimosSeisMeses.map(({ mes, fecha }) => {
                const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
                const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
                
                const mantenimientosMes = mantenimientos.filter(m => {
                  const fechaMantenimiento = new Date(m.fecha);
                  return fechaMantenimiento >= inicioMes && fechaMantenimiento <= finMes;
                });
                
                const preventivos = mantenimientosMes.filter(m => m.tipo === 'Preventivo').length;
                const correctivos = mantenimientosMes.filter(m => m.tipo === 'Correctivo').length;
                
                return {
                  mes,
                  preventivos,
                  correctivos
                };
              });
            })()}
          />

          {/* Movimientos de Stock por Marca */}
          <MovimientosStockRecharts
            data={(() => {
              // Generar datos de los últimos 6 meses
              const hoy = new Date();
              const ultimosSeisMeses = Array.from({ length: 6 }, (_, i) => {
                const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - (5 - i), 1);
                return {
                  mes: fecha.toLocaleDateString('es-PY', { month: 'short' }),
                  fecha: fecha
                };
              });
              
              // Obtener las marcas principales del stock
              const marcasPrincipales = new Set();
              stockItems.forEach(item => {
                if (item.marca && item.cantidadDisponible > 0) {
                  marcasPrincipales.add(item.marca);
                }
              });
              
              // Limitar a las 5 marcas principales
              const topMarcas = Array.from(marcasPrincipales).slice(0, 5) as string[];
              
              return ultimosSeisMeses.map(({ mes }) => {
                const movimientos: any = { mes };
                
                // Simular movimientos de stock por marca
                topMarcas.forEach(marca => {
                  // Generar datos simulados basados en el stock actual
                  const stockMarca = stockItems.filter(item => item.marca === marca);
                  const stockTotal = stockMarca.reduce((sum, item) => sum + item.cantidadDisponible, 0);
                  
                  // Simular movimientos (entre 0-15% del stock disponible)
                  const factorMovimiento = Math.random() * 0.15;
                  movimientos[marca] = Math.round(stockTotal * factorMovimiento);
                });
                
                return movimientos;
              });
            })()}
          />

          {/* Ventas Mensuales - ACTUALIZADO para usar datos reales */}
          <IngresosMensualesRecharts
            data={calcularVentasReales()}
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
                Stock
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/stock')}
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