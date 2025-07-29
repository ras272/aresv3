'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardCharts } from '@/components/charts/DashboardCharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/store/useAppStore';
import { 
  BarChart3, 
  Download, 
  Calendar,
  Filter,
  PieChart,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';

export default function AnalisisPage() {
  const { 
    equipos, 
    mantenimientos, 
    componentesDisponibles, 
    transaccionesStock,
    cargasMercaderia 
  } = useAppStore();

  const [filtroFecha, setFiltroFecha] = useState('mes');
  const [exportando, setExportando] = useState(false);

  // Función para exportar datos (simulada)
  const exportarReporte = async (tipo: string) => {
    setExportando(true);
    try {
      // Simular exportación
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(`Reporte ${tipo} exportado exitosamente`);
    } catch (error) {
      toast.error('Error al exportar el reporte');
    } finally {
      setExportando(false);
    }
  };

  // Estadísticas para análisis
  const estadisticasAnalisis = {
    equipos: {
      total: equipos.length,
      operativos: equipos.filter(e => 
        e.componentes.every(c => c.estado === 'Operativo')
      ).length,
      conProblemas: equipos.filter(e => 
        e.componentes.some(c => c.estado !== 'Operativo')
      ).length
    },
    mantenimientos: {
      total: mantenimientos.length,
      pendientes: mantenimientos.filter(m => m.estado === 'Pendiente').length,
      enProceso: mantenimientos.filter(m => m.estado === 'En proceso').length,
      finalizados: mantenimientos.filter(m => m.estado === 'Finalizado').length,
      criticos: mantenimientos.filter(m => m.prioridad === 'Crítica').length
    },
    inventario: {
      totalProductos: componentesDisponibles.length,
      stockBajo: componentesDisponibles.filter(c => 
        c.cantidadDisponible <= 5 && c.cantidadDisponible > 0
      ).length,
      agotados: componentesDisponibles.filter(c => c.cantidadDisponible === 0).length,
      valorTotal: 0 // Se puede calcular si se agregan precios
    },
    mercaderias: {
      totalCargas: cargasMercaderia.length,
      productosIngresados: cargasMercaderia.reduce((acc, carga) => 
        acc + carga.productos.length, 0
      ),
      cargasEstesMes: cargasMercaderia.filter(carga => {
        const fechaCarga = new Date(carga.fechaIngreso);
        const hoy = new Date();
        return fechaCarga.getMonth() === hoy.getMonth() && 
               fechaCarga.getFullYear() === hoy.getFullYear();
      }).length
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                Análisis del Sistema
              </h1>
              <p className="text-gray-600 mt-2">
                Análisis detallado y métricas del sistema ARES
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <select
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="semana">Esta semana</option>
                <option value="mes">Este mes</option>
                <option value="trimestre">Este trimestre</option>
                <option value="año">Este año</option>
              </select>
              
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>

          {/* Resumen ejecutivo */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Resumen Ejecutivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Equipos */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">Equipos</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Total:</span>
                      <span className="font-medium text-blue-900">{estadisticasAnalisis.equipos.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Operativos:</span>
                      <span className="font-medium text-green-600">{estadisticasAnalisis.equipos.operativos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Con problemas:</span>
                      <span className="font-medium text-red-600">{estadisticasAnalisis.equipos.conProblemas}</span>
                    </div>
                  </div>
                </div>

                {/* Mantenimientos */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-3">Mantenimientos</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-purple-700">Total:</span>
                      <span className="font-medium text-purple-900">{estadisticasAnalisis.mantenimientos.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-purple-700">Pendientes:</span>
                      <span className="font-medium text-yellow-600">{estadisticasAnalisis.mantenimientos.pendientes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-purple-700">Críticos:</span>
                      <span className="font-medium text-red-600">{estadisticasAnalisis.mantenimientos.criticos}</span>
                    </div>
                  </div>
                </div>

                {/* Inventario */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-3">Inventario</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-green-700">Productos:</span>
                      <span className="font-medium text-green-900">{estadisticasAnalisis.inventario.totalProductos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-green-700">Stock bajo:</span>
                      <span className="font-medium text-orange-600">{estadisticasAnalisis.inventario.stockBajo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-green-700">Agotados:</span>
                      <span className="font-medium text-red-600">{estadisticasAnalisis.inventario.agotados}</span>
                    </div>
                  </div>
                </div>

                {/* Mercaderías */}
                <div className="bg-orange-50 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-900 mb-3">Mercaderías</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-orange-700">Total cargas:</span>
                      <span className="font-medium text-orange-900">{estadisticasAnalisis.mercaderias.totalCargas}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-orange-700">Este mes:</span>
                      <span className="font-medium text-blue-600">{estadisticasAnalisis.mercaderias.cargasEstesMes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-orange-700">Productos:</span>
                      <span className="font-medium text-green-600">{estadisticasAnalisis.mercaderias.productosIngresados}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones de exportación */}
          <div className="flex flex-wrap gap-4 mb-8">
            <Button 
              onClick={() => exportarReporte('Equipos')}
              disabled={exportando}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar Equipos
            </Button>
            
            <Button 
              onClick={() => exportarReporte('Mantenimientos')}
              disabled={exportando}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar Mantenimientos
            </Button>
            
            <Button 
              onClick={() => exportarReporte('Inventario')}
              disabled={exportando}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar Inventario
            </Button>
            
            <Button 
              onClick={() => exportarReporte('Completo')}
              disabled={exportando}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              {exportando ? 'Exportando...' : 'Análisis Completo'}
            </Button>
          </div>

          {/* Gráficos detallados */}
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="equipos">Equipos</TabsTrigger>
              <TabsTrigger value="mantenimientos">Mantenimientos</TabsTrigger>
              <TabsTrigger value="inventario">Inventario</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <DashboardCharts />
            </TabsContent>

            <TabsContent value="equipos">
              <Card>
                <CardHeader>
                  <CardTitle>Análisis Detallado de Equipos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Análisis completo del estado y distribución de equipos médicos.
                  </p>
                  {/* Aquí se pueden agregar gráficos específicos de equipos */}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mantenimientos">
              <Card>
                <CardHeader>
                  <CardTitle>Análisis Detallado de Mantenimientos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Tendencias y patrones en los mantenimientos realizados.
                  </p>
                  {/* Aquí se pueden agregar gráficos específicos de mantenimientos */}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inventario">
              <Card>
                <CardHeader>
                  <CardTitle>Análisis Detallado de Inventario</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Control de stock y movimientos de inventario.
                  </p>
                  {/* Aquí se pueden agregar gráficos específicos de inventario */}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}