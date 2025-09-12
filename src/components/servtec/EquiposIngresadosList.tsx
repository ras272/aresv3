'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Wrench,
  Eye,
  Calendar,
  User,
  Package,
  AlertCircle,
  Clock,
  CheckCircle,
  Plus,
  FileText,
  Settings,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { EquipoIngresado } from '@/types';
import { toast } from 'sonner';
import EquipoIngresadoModal from './EquipoIngresadoModal';

interface EquiposIngresadosListProps {
  onEquipoSelect?: (equipo: EquipoIngresado) => void;
}

export default function EquiposIngresadosList({
  onEquipoSelect,
}: EquiposIngresadosListProps) {
  const {
    getEquiposIngresados,
    getEquiposIngresadosByEstado,
    deleteEquipoIngresado,
    crearTicketDesdeEquipoIngresado,
  } = useAppStore();

  const { user } = useAuth();
  const equipos = getEquiposIngresados();

  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [prioridadFilter, setPrioridadFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [equipoEdit, setEquipoEdit] = useState<EquipoIngresado | undefined>();
  const [equipoToDelete, setEquipoToDelete] = useState<string | null>(null);

  // Filtrar equipos
  const filteredEquipos = useMemo(() => {
    return equipos.filter((equipo) => {
      const matchesSearch =
        searchTerm === '' ||
        equipo.clienteOrigen.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipo.equipoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipo.equipoMarca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipo.codigoIngreso.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipo.contactoCliente.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEstado =
        estadoFilter === 'all' || equipo.estadoIngreso === estadoFilter;

      const matchesPrioridad =
        prioridadFilter === 'all' || equipo.prioridadReparacion === prioridadFilter;

      return matchesSearch && matchesEstado && matchesPrioridad;
    });
  }, [equipos, searchTerm, estadoFilter, prioridadFilter]);

  // Obtener estadísticas rápidas
  const stats = useMemo(() => {
    return {
      total: equipos.length,
      recienLlegados: equipos.filter(e => e.estadoIngreso === 'Recién llegado').length,
      enDiagnostico: equipos.filter(e => e.estadoIngreso === 'En diagnóstico').length,
      enReparacion: equipos.filter(e => e.estadoIngreso === 'En reparación').length,
      esperandoRepuestos: equipos.filter(e => e.estadoIngreso === 'Esperando repuestos').length,
      listos: equipos.filter(e => e.estadoIngreso === 'Listo para entrega').length,
      criticos: equipos.filter(e => e.prioridadReparacion === 'Crítica').length,
    };
  }, [equipos]);

  const handleEdit = (equipo: EquipoIngresado) => {
    setEquipoEdit(equipo);
    setIsModalOpen(true);
  };

  const handleDelete = async (equipoId: string) => {
    try {
      await deleteEquipoIngresado(equipoId);
      toast.success('Equipo eliminado exitosamente');
      setEquipoToDelete(null);
    } catch (error) {
      console.error('Error deleting equipment:', error);
      toast.error('Error al eliminar el equipo');
    }
  };

  const handleCreateTicket = async (equipo: EquipoIngresado) => {
    try {
      const ticketId = await crearTicketDesdeEquipoIngresado(
        equipo.id,
        `Ticket generado automáticamente para ${equipo.equipoNombre}`
      );
      toast.success('Ticket de mantenimiento creado exitosamente');
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Error al crear el ticket de mantenimiento');
    }
  };

  const handleNewEquipo = () => {
    setEquipoEdit(undefined);
    setIsModalOpen(true);
  };

  const handleCloseModal = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setEquipoEdit(undefined);
    }
  };

  const getEstadoColor = (estado: EquipoIngresado['estadoIngreso']) => {
    switch (estado) {
      case 'Recién llegado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'En diagnóstico':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'En reparación':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Esperando repuestos':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Listo para entrega':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Entregado':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPrioridadColor = (prioridad: EquipoIngresado['prioridadReparacion']) => {
    switch (prioridad) {
      case 'Baja':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Media':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Alta':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Crítica':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recién llegados</p>
                <p className="text-2xl font-bold text-blue-600">{stats.recienLlegados}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Diagnóstico</p>
                <p className="text-2xl font-bold text-purple-600">{stats.enDiagnostico}</p>
              </div>
              <Search className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reparación</p>
                <p className="text-2xl font-bold text-orange-600">{stats.enReparacion}</p>
              </div>
              <Wrench className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Esperando</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.esperandoRepuestos}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Listos</p>
                <p className="text-2xl font-bold text-green-600">{stats.listos}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Críticos</p>
                <p className="text-2xl font-bold text-red-600">{stats.criticos}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros y Búsqueda
            </CardTitle>
            <Button onClick={handleNewEquipo} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Registrar Equipo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cliente, equipo, código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="Recién llegado">Recién llegado</SelectItem>
                  <SelectItem value="En diagnóstico">En diagnóstico</SelectItem>
                  <SelectItem value="En reparación">En reparación</SelectItem>
                  <SelectItem value="Esperando repuestos">Esperando repuestos</SelectItem>
                  <SelectItem value="Listo para entrega">Listo para entrega</SelectItem>
                  <SelectItem value="Entregado">Entregado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select value={prioridadFilter} onValueChange={setPrioridadFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las prioridades</SelectItem>
                  <SelectItem value="Baja">Baja</SelectItem>
                  <SelectItem value="Media">Media</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Crítica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setEstadoFilter('all');
                  setPrioridadFilter('all');
                }}
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de equipos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Equipos Ingresados ({filteredEquipos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Equipo</TableHead>
                  <TableHead>Marca/Modelo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Fecha Ingreso</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      {equipos.length === 0 
                        ? 'No hay equipos registrados'
                        : 'No se encontraron equipos con los filtros aplicados'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEquipos.map((equipo) => (
                    <TableRow key={equipo.id}>
                      <TableCell className="font-mono">
                        {equipo.codigoIngreso}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{equipo.clienteOrigen}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{equipo.equipoNombre}</p>
                          {equipo.equipoSerie && (
                            <p className="text-sm text-gray-600">S/N: {equipo.equipoSerie}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{equipo.equipoMarca}</p>
                          {equipo.equipoModelo && (
                            <p className="text-sm text-gray-600">{equipo.equipoModelo}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getEstadoColor(equipo.estadoIngreso)}>
                          {equipo.estadoIngreso}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getPrioridadColor(equipo.prioridadReparacion)}>
                          {equipo.prioridadReparacion}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{formatDate(equipo.fechaIngreso)}</p>
                          <p className="text-sm text-gray-600">{equipo.horaIngreso}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{equipo.contactoCliente}</p>
                          {equipo.telefonoContacto && (
                            <p className="text-sm text-gray-600">{equipo.telefonoContacto}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onEquipoSelect?.(equipo)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(equipo)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCreateTicket(equipo)}>
                              <FileText className="mr-2 h-4 w-4" />
                              Crear Ticket
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setEquipoToDelete(equipo.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de registro/edición */}
      <EquipoIngresadoModal
        open={isModalOpen}
        onOpenChange={handleCloseModal}
        equipoEdit={equipoEdit}
      />

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={!!equipoToDelete} onOpenChange={() => setEquipoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El equipo y toda su información serán eliminados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => equipoToDelete && handleDelete(equipoToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
