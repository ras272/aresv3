'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useAppStore } from '@/store/useAppStore';
import { 
  Search, 
  Eye, 
  Plus, 
  Download,
  Heart,
  Calendar,
  Building,
  MapPin,
  Wrench,
  Trash2,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function EquiposPage() {
  const { equipos, mantenimientos, searchEquipos, deleteEquipo } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [equipoAEliminar, setEquipoAEliminar] = useState<{ id: string; nombre: string } | null>(null);
  const [eliminando, setEliminando] = useState(false);
  
  const equiposFiltrados = searchTerm ? searchEquipos(searchTerm) : equipos;

  const getMantenimientosCount = (equipoId: string) => {
    return mantenimientos.filter(m => m.equipoId === equipoId).length;
  };

  const getUltimoMantenimiento = (equipoId: string) => {
    const mantenimientosEquipo = mantenimientos.filter(m => m.equipoId === equipoId);
    if (mantenimientosEquipo.length === 0) return null;
    return mantenimientosEquipo.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
  };

  const getComponentesOperativos = (equipoId: string) => {
    const equipo = equipos.find(e => e.id === equipoId);
    if (!equipo) return { operativos: 0, total: 0, enReparacion: 0, fueraServicio: 0 };
    
    const operativos = equipo.componentes.filter(c => c.estado === 'Operativo').length;
    const enReparacion = equipo.componentes.filter(c => c.estado === 'En reparacion').length;
    const fueraServicio = equipo.componentes.filter(c => c.estado === 'Fuera de servicio').length;
    
    return { operativos, total: equipo.componentes.length, enReparacion, fueraServicio };
  };

  const getEstadoGeneralEquipo = (equipoId: string) => {
    const { operativos, total, enReparacion, fueraServicio } = getComponentesOperativos(equipoId);
    
    if (fueraServicio > 0) return 'CRITICO';
    if (enReparacion > 0) return 'REPARACION';
    if (operativos === total && total > 0) return 'OPERATIVO';
    return 'SIN_DATOS';
  };

  const exportarCSV = () => {
    const csvContent = [
      ['Cliente', 'Ubicacion', 'Nombre Equipo', 'Tipo', 'Marca', 'Modelo', 'Serie Base', 'Componentes', 'Mantenimientos'].join(','),
      ...equiposFiltrados.map(equipo => [
        equipo.cliente,
        equipo.ubicacion,
        equipo.nombreEquipo,
        equipo.tipoEquipo,
        equipo.marca,
        equipo.modelo,
        equipo.numeroSerieBase,
        equipo.componentes.length,
        getMantenimientosCount(equipo.id)
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `equipos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Archivo CSV exportado correctamente');
  };

  const handleEliminarEquipo = async () => {
    if (!equipoAEliminar) return;
    
    setEliminando(true);
    try {
      await deleteEquipo(equipoAEliminar.id);
      toast.success('Equipo eliminado exitosamente', {
        description: `El equipo ${equipoAEliminar.nombre} ha sido eliminado permanentemente.`
      });
      setEquipoAEliminar(null);
    } catch (error) {
      toast.error('Error al eliminar el equipo', {
        description: 'Por favor, intenta nuevamente.'
      });
    } finally {
      setEliminando(false);
    }
  };

  return (
    <DashboardLayout 
      title="Gestión de Equipos" 
      subtitle="Administra todos los equipos médicos y sus componentes registrados en el sistema"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar equipos por cliente, ubicación, marca, modelo, serie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            <Button
              variant="outline"
              onClick={exportarCSV}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Exportar CSV</span>
            </Button>
          </div>
          
          <Link href="/equipos/nuevo">
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Nuevo Equipo</span>
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Equipos</p>
                  <p className="text-2xl font-bold text-gray-900">{equiposFiltrados.length}</p>
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
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Operativos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {equiposFiltrados.filter(e => getEstadoGeneralEquipo(e.id) === 'OPERATIVO').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-700">En Reparación</p>
                  <p className="text-2xl font-bold text-yellow-800">
                    {equiposFiltrados.filter(e => getEstadoGeneralEquipo(e.id) === 'REPARACION').length}
                  </p>
                </div>
                <Wrench className="h-8 w-8 text-yellow-600" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-4 bg-red-50 border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700">Críticos</p>
                  <p className="text-2xl font-bold text-red-800">
                    {equiposFiltrados.filter(e => getEstadoGeneralEquipo(e.id) === 'CRITICO').length}
                  </p>
                </div>
                <Heart className="h-8 w-8 text-red-600" />
              </div>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ubicaciones</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(equiposFiltrados.map(e => e.ubicacion)).size}
                  </p>
                </div>
                <Building className="h-8 w-8 text-purple-500" />
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Tabla de Equipos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Lista de Equipos ({equiposFiltrados.length})
              </h3>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente & Ubicación</TableHead>
                      <TableHead>Equipo</TableHead>
                      <TableHead>Marca/Modelo</TableHead>
                      <TableHead>Serie Base</TableHead>
                      <TableHead>Estado General</TableHead>
                      <TableHead>Componentes</TableHead>
                      <TableHead>Fecha Entrega</TableHead>
                      <TableHead>Mantenimientos</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equiposFiltrados.map((equipo, index) => {
                      const mantenimientosCount = getMantenimientosCount(equipo.id);
                      const ultimoMantenimiento = getUltimoMantenimiento(equipo.id);
                      const { operativos, total, enReparacion, fueraServicio } = getComponentesOperativos(equipo.id);
                      const estadoGeneral = getEstadoGeneralEquipo(equipo.id);
                      
                      return (
                        <motion.tr
                          key={equipo.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={
                            estadoGeneral === 'CRITICO' ? 'bg-red-50 hover:bg-red-100' :
                            estadoGeneral === 'REPARACION' ? 'bg-yellow-50 hover:bg-yellow-100' :
                            estadoGeneral === 'OPERATIVO' ? 'bg-green-50 hover:bg-green-100' :
                            'hover:bg-gray-50'
                          }
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{equipo.cliente}</p>
                              <div className="flex items-center text-sm text-gray-500 mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                {equipo.ubicacion}
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{equipo.nombreEquipo}</p>
                              <p className="text-sm text-gray-500">{equipo.tipoEquipo}</p>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div>
                              <p className="font-medium">{equipo.marca}</p>
                              <p className="text-sm text-gray-500">{equipo.modelo}</p>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                              {equipo.numeroSerieBase}
                            </code>
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-col space-y-1">
                              {estadoGeneral === 'CRITICO' && (
                                <Badge variant="destructive" className="w-fit flex items-center space-x-1">
                                  <span className="w-2 h-2 bg-white rounded-full"></span>
                                  <span>CRÍTICO</span>
                                </Badge>
                              )}
                              {estadoGeneral === 'REPARACION' && (
                                <Badge variant="secondary" className="w-fit flex items-center space-x-1 bg-yellow-600 text-white">
                                  <Wrench className="w-3 h-3" />
                                  <span>EN REPARACIÓN</span>
                                </Badge>
                              )}
                              {estadoGeneral === 'OPERATIVO' && (
                                <Badge variant="default" className="w-fit flex items-center space-x-1 bg-green-600">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>OPERATIVO</span>
                                </Badge>
                              )}
                              {estadoGeneral === 'SIN_DATOS' && (
                                <Badge variant="outline" className="w-fit">
                                  Sin datos
                                </Badge>
                              )}
                              <div className="text-xs text-gray-500 mt-1">
                                {fueraServicio > 0 && `${fueraServicio} fuera de servicio`}
                                {enReparacion > 0 && `${enReparacion} en reparación`}
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex flex-col space-y-1">
                              <Badge variant="outline" className="w-fit">
                                {total} total
                              </Badge>
                              <div className="flex space-x-1">
                                {operativos > 0 && (
                                  <Badge variant="default" className="w-fit text-xs">
                                    {operativos} ✓
                                  </Badge>
                                )}
                                {enReparacion > 0 && (
                                  <Badge variant="secondary" className="w-fit text-xs bg-yellow-100 text-yellow-800">
                                    {enReparacion} 🔧
                                  </Badge>
                                )}
                                {fueraServicio > 0 && (
                                  <Badge variant="destructive" className="w-fit text-xs">
                                    {fueraServicio} ❌
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            {new Date(equipo.fechaEntrega).toLocaleDateString('es-ES')}
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Badge variant={mantenimientosCount > 0 ? 'default' : 'secondary'}>
                                {mantenimientosCount}
                              </Badge>
                              {ultimoMantenimiento && (
                                <Badge 
                                  variant={
                                    ultimoMantenimiento.estado === 'Finalizado' ? 'default' :
                                    ultimoMantenimiento.estado === 'En proceso' ? 'secondary' : 'destructive'
                                  }
                                >
                                  {ultimoMantenimiento.estado}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Link href={`/equipo/${equipo.id}`}>
                                <Button variant="outline" size="sm" className="flex items-center space-x-1">
                                  <Eye className="h-4 w-4" />
                                  <span>Ver</span>
                                </Button>
                              </Link>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEquipoAEliminar({ id: equipo.id, nombre: equipo.nombreEquipo })}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              
              {equiposFiltrados.length === 0 && (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron equipos</h3>
                  <p className="text-gray-500">
                    {searchTerm 
                      ? 'Intenta con otros términos de búsqueda' 
                      : 'Comienza registrando tu primer equipo'
                    }
                  </p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Dialog de confirmación para eliminación */}
        <ConfirmationDialog
          isOpen={equipoAEliminar !== null}
          title="Eliminar Equipo"
          message={`¿Estás seguro de que deseas eliminar el equipo "${equipoAEliminar?.nombre}"? Esta acción eliminará todos los componentes y mantenimientos asociados y no se puede deshacer.`}
          confirmText="Eliminar Equipo"
          cancelText="Cancelar"
          onConfirm={handleEliminarEquipo}
          onCancel={() => setEquipoAEliminar(null)}
          isDangerous={true}
          isLoading={eliminando}
        />
      </div>
    </DashboardLayout>
  );
} 