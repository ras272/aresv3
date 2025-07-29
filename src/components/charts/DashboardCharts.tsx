'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
import { EquiposChart } from './EquiposChart';
import { StockChart } from './StockChart';
import { MantenimientosChart } from './MantenimientosChart';
import { 
  BarChart3, 
  Package, 
  Wrench, 
  RefreshCw, 
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

export function DashboardCharts() {
  const { 
    loadAllData, 
    equipos, 
    mantenimientos, 
    componentesDisponibles,
    transaccionesStock,
    getEstadisticas,
    getEstadisticasStock
  } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [estadisticasGenerales, setEstadisticasGenerales] = useState<any>(null);

  // Cargar datos al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        await loadAllData();
        const stats = await getEstadisticas();
        setEstadisticasGenerales(stats);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error cargando datos:', error);
        toast.error('Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [loadAllData, getEstadisticas]);

  // Función para refrescar datos
  const refrescarDatos = async () => {
    setLoading(true);
    try {
      await loadAllData();
      const stats = await getEstadisticas();
      setEstadisticasGenerales(stats);
      setLastUpdate(new Date());
      toast.success('Datos actualizados correctamente');
    } catch (error) {
      console.error('Error refrescando datos:', error);
      toast.error('Error al actualizar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Estadísticas rápidas del stock
  const estadisticasStock = getEstadisticasStock();

  // Resumen general
  const resumenGeneral = {
    totalEquipos: equipos.length,
    totalMantenimientos: mantenimientos.length,
    mantenimientosPendientes: mantenimientos.filter(m => m.estado === 'Pendiente').length,
    mantenimientosCriticos: mantenimientos.filter(m => m.prioridad === 'Crítica').length,
    productosStock: componentesDisponibles.length,
    productosStockBajo: estadisticasStock.productosConStockBajo,
    transaccionesHoy: estadisticasStock.transaccionesHoy,
    equiposOperativos: equipos.filter(e => 
      e.componentes.every(c => c.estado === 'Operativo')
    ).length
  };

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Dashboard Analítico
          </h1>
          <p className="text-gray-600 mt-2">
            Análisis completo del sistema ARES
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {lastUpdate && (
            <div className="text-sm text-gray-500">
              Última actualización: {lastUpdate.toLocaleTimeString('es-PY')}
            </div>
          )}
          <Button 
            onClick={refrescarDatos}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Actualizando...' : 'Refrescar'}
          </Button>
        </div>
      </div>

      {/* Resumen general */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{resumenGeneral.totalEquipos}</p>
                <p className="text-xs text-gray-600">Equipos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{resumenGeneral.equiposOperativos}</p>
                <p className="text-xs text-gray-600">Operativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{resumenGeneral.totalMantenimientos}</p>
                <p className="text-xs text-gray-600">Mantenimientos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{resumenGeneral.mantenimientosPendientes}</p>
                <p className="text-xs text-gray-600">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{resumenGeneral.mantenimientosCriticos}</p>
                <p className="text-xs text-gray-600">Críticos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{resumenGeneral.productosStock}</p>
                <p className="text-xs text-gray-600">Productos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{resumenGeneral.productosStockBajo}</p>
                <p className="text-xs text-gray-600">Stock Bajo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{resumenGeneral.transaccionesHoy}</p>
                <p className="text-xs text-gray-600">Mov. Hoy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs con gráficos */}
      <Tabs defaultValue="equipos" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="equipos" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Equipos
          </TabsTrigger>
          <TabsTrigger value="mantenimientos" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Mantenimientos
          </TabsTrigger>
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Inventario
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipos" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Análisis de Equipos</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Cargando datos de equipos...</p>
              </div>
            </div>
          ) : (
            <EquiposChart />
          )}
        </TabsContent>

        <TabsContent value="mantenimientos" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">Análisis de Mantenimientos</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
                <p className="text-gray-600">Cargando datos de mantenimientos...</p>
              </div>
            </div>
          ) : (
            <MantenimientosChart />
          )}
        </TabsContent>

        <TabsContent value="stock" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Análisis de Inventario</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
                <p className="text-gray-600">Cargando datos de inventario...</p>
              </div>
            </div>
          ) : (
            <StockChart />
          )}
        </TabsContent>
      </Tabs>

      {/* Información adicional */}
      {estadisticasGenerales && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Estadísticas Generales del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{estadisticasGenerales.totalCargas || 0}</p>
                <p className="text-sm text-gray-600">Total Cargas</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{estadisticasGenerales.cargasHoy || 0}</p>
                <p className="text-sm text-gray-600">Cargas Hoy</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{estadisticasGenerales.totalProductos || 0}</p>
                <p className="text-sm text-gray-600">Total Productos</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">{estadisticasGenerales.equiposMedicos || 0}</p>
                <p className="text-sm text-gray-600">Equipos Médicos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}