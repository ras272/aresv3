'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DatabaseOptimizer } from '@/lib/database-optimization';
import { 
  Database, 
  Trash2, 
  Zap, 
  BarChart3, 
  Settings,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

export default function OptimizacionPage() {
  const [loading, setLoading] = useState(false);
  const [spaceUsage, setSpaceUsage] = useState<{
    totalSize: string;
    tablesSizes: Array<{ table: string; size: string }>;
  } | null>(null);

  // Cargar estadísticas al montar el componente
  React.useEffect(() => {
    loadSpaceUsage();
  }, []);

  const handleOptimizeDatabase = async () => {
    setLoading(true);
    try {
      const result = await DatabaseOptimizer.optimizeDatabase();
      const totalDeleted = result.cleanup?.total_deleted || 0;
      const totalOptimized = result.compression?.total_optimized || 0;
      
      toast.success('Base de datos optimizada exitosamente', {
        description: `${totalDeleted} registros eliminados, ${totalOptimized} campos optimizados`
      });
      // Recargar estadísticas
      await loadSpaceUsage();
    } catch (error) {
      toast.error('Error al optimizar la base de datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    setLoading(true);
    try {
      const cleanupResult = await DatabaseOptimizer.runCleanup();
      const orphanedFiles = await DatabaseOptimizer.cleanupOrphanedFiles();
      
      toast.success(`Limpieza completada`, {
        description: `${cleanupResult.total_deleted} registros antiguos y ${orphanedFiles} archivos huérfanos eliminados`
      });
      await loadSpaceUsage();
    } catch (error) {
      toast.error('Error en la limpieza');
    } finally {
      setLoading(false);
    }
  };

  const handleCompressJSON = async () => {
    setLoading(true);
    try {
      await DatabaseOptimizer.compressJSON();
      const optimizedCount = await DatabaseOptimizer.optimizeTextFields();
      toast.success('Compresión completada', {
        description: `Se comprimieron campos JSON y se optimizaron ${optimizedCount} campos de texto`
      });
      await loadSpaceUsage();
    } catch (error) {
      toast.error('Error en la compresión');
    } finally {
      setLoading(false);
    }
  };

  const loadSpaceUsage = async () => {
    try {
      const usage = await DatabaseOptimizer.getSpaceUsage();
      setSpaceUsage(usage);
    } catch (error) {
      // console.error('Error cargando estadísticas:', error);
    }
  };

  const scheduleCleanup = async () => {
    try {
      await DatabaseOptimizer.scheduleMonthlyCleanup();
      toast.success('Limpieza programada ejecutada');
    } catch (error) {
      toast.error('Error en limpieza programada');
    }
  };

  return (
    <DashboardLayout 
      title="Optimización de Base de Datos" 
      subtitle="Herramientas para mantener la base de datos eficiente y optimizada"
    >
      <div className="space-y-6">
        {/* Header con estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tamaño Total</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {spaceUsage?.totalSize || 'Cargando...'}
                  </p>
                </div>
                <Database className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <Badge className="bg-green-100 text-green-800">
                    Optimizada
                  </Badge>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Límite Supabase</p>
                  <p className="text-2xl font-bold text-gray-900">500 MB</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Acciones de optimización */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Optimización Completa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Ejecuta una optimización completa que incluye limpieza de datos antiguos, 
                compresión JSON y recuperación de espacio.
              </p>
              <Button 
                onClick={handleOptimizeDatabase}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Optimizando...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Optimizar Base de Datos
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                Limpieza de Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Elimina registros antiguos, alertas leídas, sesiones expiradas 
                y archivos huérfanos.
              </p>
              <Button 
                onClick={handleCleanup}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Ejecutar Limpieza
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                Compresión de Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Comprime campos JSON grandes y optimiza campos de texto 
                eliminando espacios innecesarios.
              </p>
              <Button 
                onClick={handleCompressJSON}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <Settings className="h-4 w-4 mr-2" />
                Comprimir Datos
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" />
                Limpieza Programada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Ejecuta la limpieza mensual programada si no se ha ejecutado 
                en los últimos 30 días.
              </p>
              <Button 
                onClick={scheduleCleanup}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <Clock className="h-4 w-4 mr-2" />
                Ejecutar Limpieza Mensual
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas por tabla */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Uso de Espacio por Tabla
              </CardTitle>
              <Button 
                onClick={loadSpaceUsage}
                variant="outline"
                size="sm"
              >
                Actualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {spaceUsage?.tablesSizes ? (
              <div className="space-y-2">
                {spaceUsage.tablesSizes.slice(0, 10).map((table) => (
                  <div key={table.table} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{table.table}</span>
                    <Badge variant="outline">{table.size}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Haz clic en "Actualizar" para cargar las estadísticas</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recomendaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Recomendaciones de Optimización
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Limpieza Mensual</p>
                  <p className="text-sm text-blue-700">
                    Ejecuta la optimización completa una vez al mes para mantener la base de datos eficiente.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Monitoreo de Espacio</p>
                  <p className="text-sm text-green-700">
                    Con tu uso actual, tienes espacio para crecer 100x antes de necesitar un plan pago.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Archivos Grandes</p>
                  <p className="text-sm text-yellow-700">
                    Comprime imágenes y PDFs antes de subirlos para ahorrar espacio de storage.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}