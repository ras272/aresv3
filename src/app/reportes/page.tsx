'use client';

import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  Heart,
  Wrench,
  Building,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

export default function ReportesPage() {
  const { equipos, mantenimientos } = useAppStore();

  const exportarReporte = () => {
    const csvContent = [
      ['Cliente', 'Tipo', 'Marca', 'Modelo', 'Numero de Serie', 'Mantenimientos'].join(','),
      ...equipos.map(equipo => [
        equipo.cliente,
        equipo.tipoEquipo,
        equipo.marca,
        equipo.modelo,
        equipo.numeroSerie,
        mantenimientos.filter(m => m.equipoId === equipo.id).length
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_equipos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Reporte exportado correctamente');
  };

  // Estadisticas por cliente
  const estadisticasPorCliente = equipos.reduce((acc, equipo) => {
    if (!acc[equipo.cliente]) {
      acc[equipo.cliente] = {
        equipos: 0,
        mantenimientos: 0,
      };
    }
    acc[equipo.cliente].equipos++;
    acc[equipo.cliente].mantenimientos += mantenimientos.filter(m => m.equipoId === equipo.id).length;
    return acc;
  }, {} as Record<string, { equipos: number; mantenimientos: number }>);

  return (
    <DashboardLayout 
      title="Reportes y Estadisticas" 
      subtitle="Analisis completo del sistema de gestion de equipos medicos"
    >
      <div className="space-y-6">
        {/* Header con boton de exportacion */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-gray-600">Genera reportes personalizados en formato CSV</span>
          </div>
          
          <Button
            onClick={exportarReporte}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Exportar Reporte CSV</span>
          </Button>
        </div>

        {/* Metricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Equipos</p>
                  <p className="text-3xl font-bold text-gray-900">{equipos.length}</p>
                </div>
                <Heart className="h-8 w-8 text-blue-500" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Mantenimientos</p>
                  <p className="text-3xl font-bold text-gray-900">{mantenimientos.length}</p>
                </div>
                <Wrench className="h-8 w-8 text-green-500" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clientes Activos</p>
                  <p className="text-3xl font-bold text-gray-900">{Object.keys(estadisticasPorCliente).length}</p>
                </div>
                <Building className="h-8 w-8 text-purple-500" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tasa de Exito</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {mantenimientos.length > 0 
                      ? Math.round((mantenimientos.filter(m => m.estado === 'Finalizado').length / mantenimientos.length) * 100)
                      : 0
                    }%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Estados de mantenimientos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Mantenimientos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-700">
                  {mantenimientos.filter(m => m.estado === 'Pendiente').length}
                </p>
                <p className="text-sm text-red-600">Pendientes</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-700">
                  {mantenimientos.filter(m => m.estado === 'En proceso').length}
                </p>
                <p className="text-sm text-yellow-600">En Proceso</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-700">
                  {mantenimientos.filter(m => m.estado === 'Finalizado').length}
                </p>
                <p className="text-sm text-green-600">Finalizados</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Estadisticas por cliente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Building className="h-5 w-5 text-purple-500" />
              <h3 className="text-lg font-semibold text-gray-900">Equipos por Cliente</h3>
            </div>
            
            <div className="space-y-3">
              {Object.entries(estadisticasPorCliente)
                .sort((a, b) => b[1].equipos - a[1].equipos)
                .map(([cliente, stats]) => (
                  <div key={cliente} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{cliente}</p>
                      <p className="text-sm text-gray-500">{stats.mantenimientos} mantenimientos realizados</p>
                    </div>
                    <Badge variant="outline">{stats.equipos} equipos</Badge>
                  </div>
                ))}
            </div>
          </Card>
        </motion.div>

        {/* Resumen ejecutivo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Resumen Ejecutivo</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Puntos Clave</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• {equipos.length} equipos medicos bajo gestion</li>
                  <li>• {Object.keys(estadisticasPorCliente).length} clientes activos</li>
                  <li>• {mantenimientos.filter(m => m.estado === 'Finalizado').length} mantenimientos completados</li>
                  <li>• {mantenimientos.filter(m => m.estado === 'Pendiente').length} mantenimientos pendientes</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Recomendaciones</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Priorizar mantenimientos pendientes</li>
                  <li>• Implementar mantenimiento preventivo</li>
                  <li>• Establecer cronograma de revisiones</li>
                  <li>• Optimizar tiempos de respuesta</li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
} 