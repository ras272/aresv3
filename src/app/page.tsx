'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
import { SmartMantenimientoList } from '@/components/ui/smart-mantenimiento-list';
import { StatsCardSkeleton, InventarioCardSkeleton, LoadingOverlay } from '@/components/ui/loading-states';
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
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const router = useRouter();
  const { equipos, mantenimientos, updateMantenimiento } = useAppStore();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { execute, isLoading } = useSmartLoading();
  const { isFieldMode, fieldConfig } = useFieldMode();

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
        <div className="space-y-4 sm:space-y-6">
        {/* Stats Cards - Mobile Optimized */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
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
                  <Card className={`${fieldConfig.cardPadding} hover:shadow-lg transition-shadow group`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">
                          {stat.name}
                        </p>
                        <motion.p
                          className="text-3xl font-bold text-gray-900"
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                        >
                          {stat.value}
                        </motion.p>
                      </div>
                      <motion.div
                        className={`p-3 rounded-full ${stat.bgColor} group-hover:scale-110 transition-transform`}
                        initial={{ rotate: -10 }}
                        animate={{ rotate: 0 }}
                        transition={{ delay: index * 0.1 + 0.3 }}
                      >
                        <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
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
                      <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-blue-700 transition-colors">
                        Sistema de Inventario
                      </h3>
                      <p className="text-gray-600 font-medium leading-relaxed mb-3">
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
                      className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 font-medium px-6 py-3 rounded-lg group-hover:shadow-md"
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

        {/* Panel de Tareas del Ingeniero - Mobile Optimized */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Tareas Pendientes */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <SmartMantenimientoList
              mantenimientos={mantenimientosPendientes}
              equipos={equipos}
              onEquipoClick={irAlEquipo}
              onEstadoChange={cambiarEstadoMantenimiento}
              title="Tareas Pendientes"
              emptyIcon={CheckCircle}
              emptyTitle="¡No hay tareas pendientes!"
              emptyMessage="Buen trabajo 👍"
              badgeVariant="destructive"
              itemsPerPage={3}
            />
          </motion.div>

          {/* Tareas En Proceso */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <SmartMantenimientoList
              mantenimientos={mantenimientosEnProceso}
              equipos={equipos}
              onEquipoClick={irAlEquipo}
              onEstadoChange={cambiarEstadoMantenimiento}
              title="En Proceso"
              emptyIcon={Wrench}
              emptyTitle="No hay trabajos en proceso"
              emptyMessage="Inicia alguna tarea pendiente"
              badgeVariant="secondary"
              itemsPerPage={3}
            />
          </motion.div>
        </div>

        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <motion.div
                  className="p-3 bg-blue-100 rounded-full"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">¡Bienvenido a ARES Paraguay!</h3>
                  <p className="text-gray-600">
                    Sistema de gestión completo para el servicio técnico de equipos médicos.
                    {mantenimientosPendientes.length > 0 && (
                      <span className="font-medium text-orange-600">
                        {' '}Tienes {mantenimientosPendientes.length} tarea{mantenimientosPendientes.length > 1 ? 's' : ''} pendiente{mantenimientosPendientes.length > 1 ? 's' : ''}.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="hidden md:flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{equipos.length}</div>
                  <div className="text-gray-500">Equipos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{mantenimientosFinalizados.length}</div>
                  <div className="text-gray-500">Completados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{mantenimientosEnProceso.length}</div>
                  <div className="text-gray-500">En Proceso</div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
        </div>
      </DashboardLayout>
    </>
  );
}
