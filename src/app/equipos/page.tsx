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
import { MobileTable, MobileEquipoCard } from '@/components/ui/mobile-table';
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
      <div className="space-y-4 sm:space-y-6">
        {/* Header Actions - Mobile Optimized */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar equipos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={exportarCSV}
                className="flex items-center space-x-2 flex-1 sm:flex-none"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar CSV</span>
                <span className="sm:hidden">CSV</span>
              </Button>
              <Link href="/equipos/nuevo" className="flex-1 sm:flex-none">
                <Button className="w-full flex items-center justify-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nuevo Equipo</span>
                  <span className="sm:hidden">Nuevo</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats - Mobile Optimized */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Total Equipos</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{equiposFiltrados.length}</p>
                </div>
                <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0 ml-2" />
              </div>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Operativos</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600">
                    {equiposFiltrados.filter(e => getEstadoGeneralEquipo(e.id) === 'OPERATIVO').length}
                  </p>
                </div>
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0 ml-2" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-3 sm:p-4 bg-yellow-50 border-yellow-200">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-yellow-700 truncate">En Reparación</p>
                  <p className="text-lg sm:text-2xl font-bold text-yellow-800">
                    {equiposFiltrados.filter(e => getEstadoGeneralEquipo(e.id) === 'REPARACION').length}
                  </p>
                </div>
                <Wrench className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 flex-shrink-0 ml-2" />
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-3 sm:p-4 bg-red-50 border-red-200">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-red-700 truncate">Críticos</p>
                  <p className="text-lg sm:text-2xl font-bold text-red-800">
                    {equiposFiltrados.filter(e => getEstadoGeneralEquipo(e.id) === 'CRITICO').length}
                  </p>
                </div>
                <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 flex-shrink-0 ml-2" />
              </div>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Ubicaciones</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {new Set(equiposFiltrados.map(e => e.ubicacion)).size}
                  </p>
                </div>
                <Building className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 flex-shrink-0 ml-2" />
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Tabla de Equipos - Responsive */}
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
              
              <MobileTable
                data={equiposFiltrados}
                columns={[
                  { key: 'cliente', label: 'Cliente & Ubicación' },
                  { key: 'equipo', label: 'Equipo' },
                  { key: 'marca', label: 'Marca/Modelo' },
                  { key: 'serie', label: 'Serie Base' },
                  { key: 'estado', label: 'Estado General' },
                  { key: 'componentes', label: 'Componentes' },
                  { key: 'fecha', label: 'Fecha Entrega' },
                  { key: 'mantenimientos', label: 'Mantenimientos' },
                  { key: 'acciones', label: 'Acciones' },
                ]}
                renderMobileCard={(equipo, index) => {
                  const mantenimientosCount = getMantenimientosCount(equipo.id);
                  const ultimoMantenimiento = getUltimoMantenimiento(equipo.id);
                  const componentes = getComponentesOperativos(equipo.id);
                  const estadoGeneral = getEstadoGeneralEquipo(equipo.id);
                  
                  return (
                    <MobileEquipoCard
                      equipo={equipo}
                      estadoGeneral={estadoGeneral}
                      componentes={componentes}
                      mantenimientosCount={mantenimientosCount}
                      ultimoMantenimiento={ultimoMantenimiento}
                      onVer={(id) => window.location.href = `/equipo/${id}`}
                      onEliminar={setEquipoAEliminar}
                    />
                  );
                }}
                renderDesktopRow={(equipo, index) => {
                  const mantenimientosCount = getMantenimientosCount(equipo.id);
                  const ultimoMantenimiento = getUltimoMantenimiento(equipo.id);
                  const { operativos, total, enReparacion, fueraServicio } = getComponentesOperativos(equipo.id);
                  const estadoGeneral = getEstadoGeneralEquipo(equipo.id);
                  
                  return (
                    <>
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
                    </>
                  );
                }}
                emptyStateIcon={Heart}
                emptyStateTitle="No se encontraron equipos"
                emptyStateMessage={searchTerm 
                  ? 'Intenta con otros términos de búsqueda' 
                  : 'Comienza registrando tu primer equipo'
                }
              />
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