'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
import { usePermissions } from '@/components/PermissionGuard';
import { SmartMantenimientoList } from '@/components/ui/smart-mantenimiento-list';
import { StatsCardSkeleton, LoadingOverlay } from '@/components/ui/loading-states';
import { MobileStatsCard } from '@/components/ui/mobile-optimized';
import { useSmartLoading } from '@/hooks/useSmartLoading';
import { useFieldMode } from '@/hooks/useDevice';
import {
  Heart,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Package,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const router = useRouter();
  const { equipos, mantenimientos, updateMantenimiento } = useAppStore();
  const { getCurrentUser } = usePermissions();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { execute, isLoading } = useSmartLoading();
  const { isFieldMode, fieldConfig } = useFieldMode();
  
  // 🎯 Verificar si el usuario actual es técnico
  const currentUser = getCurrentUser();
  const esTecnico = currentUser?.rol === 'tecnico';

  // Simular carga inicial de datos
  useEffect(() => {
    const initializeDashboard = async () => {
      await execute(async () => {
        // Simular carga de datos
        await new Promise(resolve => setTimeout(resolve, 800));
        setIsInitialLoading(false);
      });
    };

    initializeDashboard();
  }, [execute]);

  const mantenimientosPendientes = mantenimientos.filter(m => m.estado === 'Pendiente');
  const mantenimientosEnProceso = mantenimientos.filter(m => m.estado === 'En proceso');
  const mantenimientosFinalizados = mantenimientos.filter(m => m.estado === 'Finalizado');

  // Función para ir al equipo específico
  const irAlEquipo = (equipoId: string) => {
    router.push(`/equipo/${equipoId}`);
  };

  // Función para cambiar estado de mantenimiento con loading inteligente
  const cambiarEstadoMantenimiento = async (mantenimientoId: string, nuevoEstado: 'En proceso' | 'Finalizado', mantenimiento?: any) => {
    const result = await execute(async () => {
      // Si intenta finalizar, verificar que tenga reporte generado
      if (nuevoEstado === 'Finalizado') {
        if (!mantenimiento?.reporteGenerado) {
          toast.error('No puedes finalizar sin generar el reporte técnico');
          toast.info('Ve al equipo y genera el reporte primero');
          throw new Error('Reporte técnico requerido');
        }
      }

      await updateMantenimiento(mantenimientoId, { estado: nuevoEstado });
      return nuevoEstado;
    }, 'Error al actualizar el mantenimiento');

    if (result) {
      toast.success(`Mantenimiento marcado como: ${result}`, {
        description: `El estado se actualizó correctamente`,
        duration: 3000,
      });
    }
  };



  const stats = [
    {
      name: 'Total Equipos',
      value: equipos.length,
      icon: Heart,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      name: 'Mantenimientos Pendientes',
      value: mantenimientosPendientes.length,
      icon: AlertTriangle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    },
    {
      name: 'En Proceso',
      value: mantenimientosEnProceso.length,
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    },
    {
      name: 'Finalizados',
      value: mantenimientosFinalizados.length,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    }
  ];

  return (
    <>
      <LoadingOverlay isVisible={isLoading} text="Actualizando datos..." />
      <DashboardLayout
        title="Dashboard"
        subtitle="Bienvenido al sistema de gestión de equipos médicos"
      >
        <div className="w-full max-w-full space-y-1.5 sm:space-y-3 lg:space-y-6">
        {/* Stats Cards - Mobile Optimized */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-4 lg:gap-6">
          {isInitialLoading ? (
            // Mostrar skeletons mientras carga
            Array.from({ length: 4 }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <StatsCardSkeleton />
              </motion.div>
            ))
          ) : (
            stats.map((stat, index) => {
              // Usar componente móvil si está en modo campo
              if (isFieldMode) {
                return <MobileStatsCard key={stat.name} stat={stat} index={index} />;
              }

              // Versión desktop
              return (
                <motion.div
                  key={stat.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-2 sm:p-3 lg:p-4 hover:shadow-lg transition-shadow group">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate leading-tight">
                          {stat.name}
                        </p>
                        <motion.p
                          className="text-lg sm:text-xl lg:text-3xl font-bold text-foreground leading-none mt-0.5"
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                        >
                          {stat.value}
                        </motion.p>
                      </div>
                      <motion.div
                        className={`p-2 sm:p-3 rounded-full ${stat.bgColor} group-hover:scale-110 transition-transform flex-shrink-0`}
                        initial={{ rotate: -10 }}
                        animate={{ rotate: 0 }}
                        transition={{ delay: index * 0.1 + 0.3 }}
                      >
                        <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 ${stat.textColor}`} />
                      </motion.div>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Sistema de Inventario - TEMPORALMENTE DESACTIVADO */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {isInitialLoading ? (
            <InventarioCardSkeleton />
          ) : (
            <Card className="shadow-lg bg-white hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  onClick={() => router.push('/inventory')}>
              <div className="p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <motion.div
                      className="p-4 bg-blue-600 rounded-xl group-hover:scale-105 transition-transform duration-200"
                      whileHover={{ rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Package className="h-8 w-8 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-blue-700 transition-colors">
                        Sistema de Inventario
                      </h3>
                      <p className="text-muted-foreground font-medium leading-relaxed mb-3">
                        Gestiona el stock de productos, componentes y piezas de repuesto con un control profesional
                      </p>
                      <div className="flex items-center space-x-6 text-sm">
                        <motion.div
                          className="flex items-center space-x-2 text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full"
                          whileHover={{ scale: 1.05 }}
                        >
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="font-medium">Control tipo Sortly</span>
                        </motion.div>
                        <motion.div
                          className="flex items-center space-x-2 text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full"
                          whileHover={{ scale: 1.05 }}
                        >
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                          <span className="font-medium">QR automáticos</span>
                        </motion.div>
                        <motion.div
                          className="flex items-center space-x-2 text-purple-700 bg-purple-100 px-3 py-1.5 rounded-full"
                          whileHover={{ scale: 1.05 }}
                        >
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                          <span className="font-medium">Trazabilidad completa</span>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      className="bg-background border-border text-foreground hover:bg-muted hover:border-blue-300 hover:text-blue-700 transition-all duration-200 font-medium px-6 py-3 rounded-lg group-hover:shadow-md"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push('/inventory')
                      }}
                    >
                      Ir al Inventario
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </motion.div> */}

        {/* Dashboard Mejorado para Técnico */}
        {esTecnico ? (
          <div className="space-y-6">
            {/* 🎯 Resumen Rápido para Técnico */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
            >
              {/* Tareas Pendientes */}
              <Card className="p-3 sm:p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-red-700 truncate">Tareas Urgentes</p>
                    <p className="text-2xl sm:text-3xl font-bold text-red-800">{mantenimientosPendientes.length}</p>
                  </div>
                  <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 flex-shrink-0" />
                </div>
              </Card>

              {/* Tareas En Proceso */}
              <Card className="p-3 sm:p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-yellow-700 truncate">En Proceso</p>
                    <p className="text-2xl sm:text-3xl font-bold text-yellow-800">{mantenimientosEnProceso.length}</p>
                  </div>
                  <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 flex-shrink-0" />
                </div>
              </Card>

              {/* Equipos Operativos */}
              <Card className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all sm:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-green-700 truncate">Equipos OK</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-800">
                      {equipos.filter(e => e.componentes?.every(c => c.estado === 'Operativo')).length}
                    </p>
                  </div>
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
                </div>
              </Card>
            </motion.div>

            {/* 🚀 Accesos Rápidos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center">
                  <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mr-2" />
                  Accesos Rápidos
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/equipos')}
                    className="h-12 sm:h-16 flex flex-col items-center justify-center space-y-0.5 sm:space-y-1 hover:bg-blue-50 hover:border-blue-300"
                  >
                    <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    <span className="text-xs">Ver Equipos</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => router.push('/inventario-tecnico')}
                    className="h-12 sm:h-16 flex flex-col items-center justify-center space-y-0.5 sm:space-y-1 hover:bg-green-50 hover:border-green-300"
                  >
                    <Package className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    <span className="text-xs">Inventario</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => router.push('/calendario')}
                    className="h-12 sm:h-16 flex flex-col items-center justify-center space-y-0.5 sm:space-y-1 hover:bg-purple-50 hover:border-purple-300"
                  >
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    <span className="text-xs">Calendario</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Buscar equipos críticos (fuera de servicio) primero
                      const equipoCritico = equipos.find(e => 
                        e.componentes?.some(c => c.estado === 'Fuera de servicio')
                      );
                      
                      if (equipoCritico) {
                        router.push(`/equipo/${equipoCritico.id}`);
                        toast.info(`Equipo crítico encontrado: ${equipoCritico.nombreEquipo}`, {
                          description: `Cliente: ${equipoCritico.cliente}`
                        });
                        return;
                      }
                      
                      // Si no hay críticos, buscar el mantenimiento más antiguo pendiente
                      if (mantenimientosPendientes.length > 0) {
                        const mantenimientoMasAntiguo = mantenimientosPendientes
                          .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())[0];
                        router.push(`/equipo/${mantenimientoMasAntiguo.equipoId}`);
                        toast.info('Tarea más antigua pendiente', {
                          description: mantenimientoMasAntiguo.descripcion
                        });
                        return;
                      }
                      
                      // Si no hay nada urgente
                      toast.success('¡Excelente! No hay tareas urgentes pendientes', {
                        description: 'Todos los equipos están funcionando correctamente'
                      });
                    }}
                    className="h-12 sm:h-16 flex flex-col items-center justify-center space-y-0.5 sm:space-y-1 hover:bg-red-50 hover:border-red-300"
                  >
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                    <span className="text-xs">Más Urgente</span>
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* 📋 Panel de Tareas Mejorado */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6"
            >
              {/* Tareas Pendientes */}
              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                    Tareas Urgentes ({mantenimientosPendientes.length})
                  </h3>
                  {mantenimientosPendientes.length > 3 && (
                    <Button variant="ghost" size="sm" onClick={() => router.push('/equipos')}>
                      Ver todas
                    </Button>
                  )}
                </div>
                
                {mantenimientosPendientes.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">¡Excelente trabajo!</h4>
                    <p className="text-gray-600">No hay tareas urgentes pendientes</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mantenimientosPendientes.slice(0, 3).map((mantenimiento, index) => {
                      const equipo = equipos.find(e => e.id === mantenimiento.equipoId);
                      const componente = mantenimiento.componenteId 
                        ? equipo?.componentes?.find(c => c.id === mantenimiento.componenteId)
                        : null;
                      
                      return (
                        <motion.div
                          key={mantenimiento.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="border rounded-lg p-4 bg-red-50 border-red-200 hover:shadow-md transition-all cursor-pointer"
                          onClick={() => irAlEquipo(mantenimiento.equipoId)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="font-medium text-gray-900">{equipo?.nombreEquipo}</h4>
                                {componente && (
                                  <span className="px-2 py-1 bg-red-200 text-red-800 text-xs rounded-full">
                                    {componente.nombre}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-1">
                                📍 {equipo?.cliente} - {equipo?.ubicacion}
                              </p>
                              <p className="text-sm text-red-700 font-medium">{mantenimiento.descripcion}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                📅 {new Date(mantenimiento.fecha).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                irAlEquipo(mantenimiento.equipoId);
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Atender
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Tareas En Proceso */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                    En Proceso ({mantenimientosEnProceso.length})
                  </h3>
                  {mantenimientosEnProceso.length > 3 && (
                    <Button variant="ghost" size="sm" onClick={() => router.push('/equipos')}>
                      Ver todas
                    </Button>
                  )}
                </div>
                
                {mantenimientosEnProceso.length === 0 ? (
                  <div className="text-center py-8">
                    <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Sin trabajos en proceso</h4>
                    <p className="text-gray-600">Inicia alguna tarea pendiente</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mantenimientosEnProceso.slice(0, 3).map((mantenimiento, index) => {
                      const equipo = equipos.find(e => e.id === mantenimiento.equipoId);
                      const componente = mantenimiento.componenteId 
                        ? equipo?.componentes?.find(c => c.id === mantenimiento.componenteId)
                        : null;
                      
                      return (
                        <motion.div
                          key={mantenimiento.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="border rounded-lg p-4 bg-yellow-50 border-yellow-200 hover:shadow-md transition-all cursor-pointer"
                          onClick={() => irAlEquipo(mantenimiento.equipoId)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="font-medium text-gray-900">{equipo?.nombreEquipo}</h4>
                                {componente && (
                                  <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full">
                                    {componente.nombre}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-1">
                                📍 {equipo?.cliente} - {equipo?.ubicacion}
                              </p>
                              <p className="text-sm text-yellow-700 font-medium">{mantenimiento.descripcion}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                📅 {new Date(mantenimiento.fecha).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                irAlEquipo(mantenimiento.equipoId);
                              }}
                              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                            >
                              Continuar
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </motion.div>

            {/* 📊 Resumen del Día */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
                  Resumen del Día
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{mantenimientosFinalizados.length}</p>
                    <p className="text-sm text-blue-700">Completadas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {equipos.filter(e => e.componentes?.every(c => c.estado === 'Operativo')).length}
                    </p>
                    <p className="text-sm text-green-700">Equipos OK</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">
                      {equipos.filter(e => e.componentes?.some(c => c.estado === 'En reparacion')).length}
                    </p>
                    <p className="text-sm text-yellow-700">En Reparación</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {equipos.filter(e => e.componentes?.some(c => c.estado === 'Fuera de servicio')).length}
                    </p>
                    <p className="text-sm text-red-700">Críticos</p>
                  </div>
                </div>
                
                {/* Mensaje motivacional */}
                <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 text-center">
                    {mantenimientosPendientes.length === 0 
                      ? "🎉 ¡Excelente trabajo! No hay tareas pendientes."
                      : `💪 Tienes ${mantenimientosPendientes.length} tarea${mantenimientosPendientes.length > 1 ? 's' : ''} pendiente${mantenimientosPendientes.length > 1 ? 's' : ''}. ¡Tú puedes!`
                    }
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>
        ) : (
          // 🎯 Dashboard Ejecutivo para Super Admin
          <div className="space-y-6">
            {/* 📊 KPIs Ejecutivos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {/* Ingresos del Mes */}
              <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Ingresos del Mes</p>
                    <p className="text-2xl font-bold text-green-800">₲ 45.2M</p>
                    <p className="text-xs text-green-600">+12% vs mes anterior</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </Card>

              {/* Equipos Activos */}
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Equipos Activos</p>
                    <p className="text-2xl font-bold text-blue-800">{equipos.length}</p>
                    <p className="text-xs text-blue-600">En {new Set(equipos.map(e => e.cliente)).size} clientes</p>
                  </div>
                  <Heart className="h-8 w-8 text-blue-600" />
                </div>
              </Card>

              {/* Satisfacción Cliente */}
              <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Satisfacción</p>
                    <p className="text-2xl font-bold text-purple-800">4.8/5</p>
                    <p className="text-xs text-purple-600">Promedio últimos 30 días</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-purple-600" />
                </div>
              </Card>

              {/* Eficiencia Operativa */}
              <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700">Eficiencia</p>
                    <p className="text-2xl font-bold text-orange-800">94%</p>
                    <p className="text-xs text-orange-600">Tareas a tiempo</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </Card>
            </motion.div>

            {/* 🚨 Alertas Críticas del Negocio */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Alertas Críticas */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  Alertas Críticas
                </h3>
                <div className="space-y-3">
                  {/* Cliente con múltiples reclamos */}
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-800">Clínica Estética Bella</p>
                        <p className="text-sm text-red-600">3 reclamos en 7 días - Riesgo de pérdida</p>
                      </div>
                      <Button size="sm" variant="outline" className="text-red-700 border-red-300">
                        Revisar
                      </Button>
                    </div>
                  </div>

                  {/* Equipo problemático */}
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-yellow-800">Ultraformer III - Serie UF3-2024-001</p>
                        <p className="text-sm text-yellow-600">5 fallas en 30 días - Requiere análisis</p>
                      </div>
                      <Button size="sm" variant="outline" className="text-yellow-700 border-yellow-300">
                        Analizar
                      </Button>
                    </div>
                  </div>

                  {/* Stock crítico */}
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-orange-800">Stock Crítico</p>
                        <p className="text-sm text-orange-600">Transductores 4MHz: Solo 2 unidades</p>
                      </div>
                      <Button size="sm" variant="outline" className="text-orange-700 border-orange-300">
                        Ordenar
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Panel Financiero */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                  Resumen Financiero
                </h3>
                <div className="space-y-4">
                  {(() => {
                    // 💰 Calcular datos financieros reales
                    // 💰 Calcular datos financieros reales
                    const mantenimientosConPrecio = mantenimientos.filter(m => 
                      m.estado === 'Finalizado' && m.precioServicio && m.precioServicio > 0
                    );
                    
                    const ingresosTotales = mantenimientosConPrecio.reduce((total, m) => 
                      total + (m.precioServicio || 0), 0
                    );
                    
                    const costoPromedio = mantenimientosConPrecio.length > 0 
                      ? ingresosTotales / mantenimientosConPrecio.length 
                      : 0;
                    
                    // Formatear números para mostrar en guaraníes completos
                    const formatearGuaranies = (valor: number) => {
                      return `₲ ${valor.toLocaleString('es-PY')}`;
                    };

                    return (
                      <>
                        {/* Ingresos por servicio */}
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                          <div>
                            <p className="font-medium text-green-800">Servicios Técnicos</p>
                            <p className="text-sm text-green-600">
                              {mantenimientosConPrecio.length} servicios completados
                            </p>
                          </div>
                          <p className="text-xl font-bold text-green-800">
                            {ingresosTotales > 0 ? formatearGuaranies(ingresosTotales) : '₲ 0'}
                          </p>
                        </div>

                        {/* Costo promedio */}
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                          <div>
                            <p className="font-medium text-blue-800">Precio Promedio</p>
                            <p className="text-sm text-blue-600">Por servicio</p>
                          </div>
                          <p className="text-xl font-bold text-blue-800">
                            {costoPromedio > 0 ? formatearGuaranies(costoPromedio) : '₲ 0'}
                          </p>
                        </div>

                        {/* Servicios pendientes de facturar */}
                        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                          <div>
                            <p className="font-medium text-purple-800">Pendientes Facturar</p>
                            <p className="text-sm text-purple-600">Sin precio asignado</p>
                          </div>
                          <p className="text-xl font-bold text-purple-800">
                            {mantenimientos.filter(m => m.estado === 'Finalizado' && !m.precioServicio).length}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </Card>
            </motion.div>

            {/* 👥 Gestión de Equipo y Acciones Ejecutivas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Gestión de Equipo */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Wrench className="h-5 w-5 text-blue-500 mr-2" />
                  Performance del Equipo
                </h3>
                <div className="space-y-4">
                  {/* Técnico 1 */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">JL</span>
                      </div>
                      <div>
                        <p className="font-medium">Javier López</p>
                        <p className="text-sm text-gray-600">Técnico Senior</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">98%</p>
                      <p className="text-xs text-gray-500">Eficiencia</p>
                    </div>
                  </div>

                  {/* Estadísticas del equipo */}
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{mantenimientosFinalizados.length}</p>
                      <p className="text-xs text-green-700">Completados</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{mantenimientosEnProceso.length}</p>
                      <p className="text-xs text-yellow-700">En Proceso</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{mantenimientosPendientes.length}</p>
                      <p className="text-xs text-red-700">Pendientes</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Acciones Ejecutivas */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Package className="h-5 w-5 text-purple-500 mr-2" />
                  Acciones Ejecutivas
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/admin/usuarios')}
                    className="h-16 flex flex-col items-center justify-center space-y-1 hover:bg-blue-50"
                  >
                    <Heart className="h-5 w-5 text-blue-600" />
                    <span className="text-xs">Gestionar Usuarios</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      toast.info('Generando reporte ejecutivo...', {
                        description: 'Se enviará por email en unos minutos'
                      });
                    }}
                    className="h-16 flex flex-col items-center justify-center space-y-1 hover:bg-green-50"
                  >
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-xs">Reporte Ejecutivo</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => router.push('/analisis')}
                    className="h-16 flex flex-col items-center justify-center space-y-1 hover:bg-purple-50"
                  >
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                    <span className="text-xs">Análisis Avanzado</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      toast.info('Configurando alertas personalizadas...', {
                        description: 'Próximamente disponible'
                      });
                    }}
                    className="h-16 flex flex-col items-center justify-center space-y-1 hover:bg-orange-50"
                  >
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <span className="text-xs">Configurar Alertas</span>
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* 📈 Gráfico de Tendencias (Placeholder) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
                  Tendencias del Negocio
                </h3>
                <div className="h-64 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700">Gráficos de Tendencias</p>
                    <p className="text-sm text-gray-500">Ingresos, reclamos y eficiencia por mes</p>
                    <p className="text-xs text-gray-400 mt-2">Próximamente: Integración con Chart.js</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        )}



        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <motion.div
                  className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Heart className="h-6 w-6 text-green-600 dark:text-green-400" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">¡Bienvenido a ARES Paraguay!</h3>
                  <p className="text-muted-foreground">
                    Sistema de gestión completo para el servicio técnico de equipos médicos.
                    {mantenimientosPendientes.length > 0 && (
                      <span className="font-medium text-orange-600 dark:text-orange-400">
                        {' '}Tienes {mantenimientosPendientes.length} tarea{mantenimientosPendientes.length > 1 ? 's' : ''} pendiente{mantenimientosPendientes.length > 1 ? 's' : ''}.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/analisis')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Ver Análisis
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/equipos')}
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  Gestionar Equipos
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
        </div>
      </DashboardLayout>
    </>
  );
}
