'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTareas } from '@/hooks/useTareas';
import { Tarea, EstadoTarea, PrioridadTarea } from '@/types/tareas';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  XCircle,
  Flag,
  BarChart3,
  Target,
  TrendingUp,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function TareasPage() {
  const {
    loading,
    tareas,
    usuarios,
    cargarTareas,
    crearTarea,
    actualizarTarea,
    eliminarTarea,
    cambiarEstadoTarea,
    obtenerEstadisticas,
    obtenerUsuario
  } = useTareas();

  const [vistaActual, setVistaActual] = useState<'kanban' | 'lista' | 'calendario'>('kanban');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarNuevaTarea, setMostrarNuevaTarea] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null);

  // Datos para nueva tarea
  const [nuevaTarea, setNuevaTarea] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'media' as PrioridadTarea,
    asignado_a: '',
    departamento: '',
    categoria: 'general' as any,
    fecha_limite: '',
    tiempo_estimado: ''
  });

  const estadisticas = obtenerEstadisticas();

  // Obtener icono por estado
  const getIconoEstado = (estado: EstadoTarea) => {
    switch (estado) {
      case 'pendiente': return AlertCircle;
      case 'en_progreso': return PlayCircle;
      case 'en_revision': return PauseCircle;
      case 'completada': return CheckCircle;
      case 'cancelada': return XCircle;
      default: return AlertCircle;
    }
  };

  // Obtener color por prioridad
  const getColorPrioridad = (prioridad: PrioridadTarea) => {
    switch (prioridad) {
      case 'baja': return 'bg-gray-100 text-gray-700';
      case 'media': return 'bg-blue-100 text-blue-700';
      case 'alta': return 'bg-orange-100 text-orange-700';
      case 'urgente': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Obtener color por estado
  const getColorEstado = (estado: EstadoTarea) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-700';
      case 'en_progreso': return 'bg-blue-100 text-blue-700';
      case 'en_revision': return 'bg-purple-100 text-purple-700';
      case 'completada': return 'bg-green-100 text-green-700';
      case 'cancelada': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Manejar creación de tarea
  const handleCrearTarea = async () => {
    if (!nuevaTarea.titulo.trim()) {
      toast.error('El título es requerido');
      return;
    }

    if (!nuevaTarea.asignado_a) {
      toast.error('Debe asignar la tarea a alguien');
      return;
    }

    try {
      await crearTarea({
        ...nuevaTarea,
        progreso: 0,
        estado: 'pendiente',
        creado_por: '1', // TODO: Obtener usuario actual
        fecha_limite: nuevaTarea.fecha_limite ? new Date(nuevaTarea.fecha_limite) : undefined,
        tiempo_estimado: nuevaTarea.tiempo_estimado ? parseFloat(nuevaTarea.tiempo_estimado) : undefined
      });

      // Limpiar formulario
      setNuevaTarea({
        titulo: '',
        descripcion: '',
        prioridad: 'media',
        asignado_a: '',
        departamento: '',
        categoria: 'general',
        fecha_limite: '',
        tiempo_estimado: ''
      });
      setMostrarNuevaTarea(false);

    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  // Filtrar tareas por búsqueda
  const tareasFiltradas = tareas.filter(tarea =>
    tarea.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
    tarea.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Agrupar tareas por estado para vista Kanban
  const tareasAgrupadas = {
    pendiente: tareasFiltradas.filter(t => t.estado === 'pendiente'),
    en_progreso: tareasFiltradas.filter(t => t.estado === 'en_progreso'),
    en_revision: tareasFiltradas.filter(t => t.estado === 'en_revision'),
    completada: tareasFiltradas.filter(t => t.estado === 'completada')
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border mx-4 mt-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground">
                  <CheckSquare className="w-8 h-8 text-blue-600" />
                  Sistema de Tareas
                </h1>
                <p className="text-muted-foreground mt-2">
                  Gestión y seguimiento de tareas empresariales
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setMostrarFiltros(!mostrarFiltros)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>

                <Button
                  onClick={() => setMostrarNuevaTarea(true)}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Tarea
                </Button>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-2xl font-bold text-blue-900">{estadisticas.total_tareas}</div>
                <div className="text-blue-600 text-sm">Total</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-900">{estadisticas.pendientes}</div>
                <div className="text-yellow-600 text-sm">Pendientes</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="text-2xl font-bold text-purple-900">{estadisticas.en_progreso}</div>
                <div className="text-purple-600 text-sm">En Progreso</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-2xl font-bold text-green-900">{estadisticas.completadas}</div>
                <div className="text-green-600 text-sm">Completadas</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="text-2xl font-bold text-red-900">{estadisticas.vencidas}</div>
                <div className="text-red-600 text-sm">Vencidas</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-2xl font-bold text-foreground">{estadisticas.productividad_semanal}</div>
                <div className="text-muted-foreground text-sm">Esta Semana</div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Barra de búsqueda y controles */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar tareas..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={vistaActual === 'kanban' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVistaActual('kanban')}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Kanban
              </Button>
              <Button
                variant={vistaActual === 'lista' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVistaActual('lista')}
              >
                <Target className="w-4 h-4 mr-2" />
                Lista
              </Button>
            </div>
          </div>

          {/* Vista Kanban */}
          {vistaActual === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {Object.entries(tareasAgrupadas).map(([estado, tareas]) => (
                <div key={estado} className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground capitalize">
                      {estado.replace('_', ' ')}
                    </h3>
                    <Badge variant="outline" className={getColorEstado(estado as EstadoTarea)}>
                      {tareas.length}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {tareas.map((tarea, index) => {
                      const usuario = obtenerUsuario(tarea.asignado_a);
                      const IconoEstado = getIconoEstado(tarea.estado);

                      return (
                        <motion.div
                          key={tarea.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card
                            className="hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => setTareaSeleccionada(tarea)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-foreground text-sm line-clamp-2">
                                  {tarea.titulo}
                                </h4>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getColorPrioridad(tarea.prioridad)}`}
                                >
                                  {tarea.prioridad}
                                </Badge>
                              </div>

                              {tarea.descripcion && (
                                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                                  {tarea.descripcion}
                                </p>
                              )}

                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {usuario?.nombre || 'Sin asignar'}
                                </div>

                                {tarea.fecha_limite && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {tarea.fecha_limite.toLocaleDateString()}
                                  </div>
                                )}
                              </div>

                              {tarea.progreso > 0 && (
                                <div className="mt-3">
                                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                                    <span>Progreso</span>
                                    <span>{tarea.progreso}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className="bg-blue-600 h-1.5 rounded-full transition-all"
                                      style={{ width: `${tarea.progreso}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vista Lista */}
          {vistaActual === 'lista' && (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {tareasFiltradas.map((tarea) => {
                    const usuario = obtenerUsuario(tarea.asignado_a);
                    const IconoEstado = getIconoEstado(tarea.estado);

                    return (
                      <div
                        key={tarea.id}
                        className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => setTareaSeleccionada(tarea)}
                      >
                        <IconoEstado className={`w-5 h-5 ${tarea.estado === 'completada' ? 'text-green-600' :
                          tarea.estado === 'en_progreso' ? 'text-blue-600' :
                            tarea.estado === 'pendiente' ? 'text-yellow-600' :
                              'text-gray-600'
                          }`} />

                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{tarea.titulo}</h3>
                          <p className="text-sm text-gray-500">{tarea.descripcion}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={getColorPrioridad(tarea.prioridad)}>
                            {tarea.prioridad}
                          </Badge>

                          <Badge variant="outline" className={getColorEstado(tarea.estado)}>
                            {tarea.estado.replace('_', ' ')}
                          </Badge>

                          <div className="text-sm text-gray-500 min-w-24">
                            {usuario?.nombre || 'Sin asignar'}
                          </div>

                          {tarea.fecha_limite && (
                            <div className="text-sm text-gray-500 min-w-20">
                              {tarea.fecha_limite.toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Modal de Nueva Tarea */}
        {mostrarNuevaTarea && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-lg mx-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  Nueva Tarea
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título *
                    </label>
                    <Input
                      placeholder="Título de la tarea"
                      value={nuevaTarea.titulo}
                      onChange={(e) => setNuevaTarea(prev => ({ ...prev, titulo: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Descripción de la tarea"
                      value={nuevaTarea.descripcion}
                      onChange={(e) => setNuevaTarea(prev => ({ ...prev, descripcion: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prioridad
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={nuevaTarea.prioridad}
                        onChange={(e) => setNuevaTarea(prev => ({ ...prev, prioridad: e.target.value as PrioridadTarea }))}
                      >
                        <option value="baja">Baja</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Asignar a *
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={nuevaTarea.asignado_a}
                        onChange={(e) => setNuevaTarea(prev => ({ ...prev, asignado_a: e.target.value }))}
                      >
                        <option value="">Seleccionar usuario</option>
                        {usuarios.map(usuario => (
                          <option key={usuario.id} value={usuario.id}>
                            {usuario.nombre} ({usuario.departamento})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha límite
                      </label>
                      <Input
                        type="date"
                        value={nuevaTarea.fecha_limite}
                        onChange={(e) => setNuevaTarea(prev => ({ ...prev, fecha_limite: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tiempo estimado (horas)
                      </label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={nuevaTarea.tiempo_estimado}
                        onChange={(e) => setNuevaTarea(prev => ({ ...prev, tiempo_estimado: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setMostrarNuevaTarea(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCrearTarea}
                      disabled={!nuevaTarea.titulo.trim() || !nuevaTarea.asignado_a}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Crear Tarea
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}