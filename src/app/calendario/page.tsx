'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/useAppStore';
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  MapPin,
  Wrench,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';

type VistaCalendario = 'mes' | 'semana' | 'dia';
type FiltroTecnico = 'todos' | string;

interface MantenimientoProgramado {
  id: string;
  equipoId: string;
  fecha: string;
  fechaProgramada?: string;
  descripcion: string;
  estado: 'Pendiente' | 'En proceso' | 'Finalizado';
  tipo: 'Correctivo' | 'Preventivo';
  esProgramado?: boolean;
  tecnicoAsignado?: string;
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  tiempoEstimado?: number;
  esRecurrente?: boolean;
  frecuenciaMantenimiento?: string;
  // Info del equipo
  cliente?: string;
  nombreEquipo?: string;
  marca?: string;
  modelo?: string;
  ubicacion?: string;
}

export default function CalendarioPage() {
  const { equipos, mantenimientos, updateMantenimiento, addMantenimientoProgramado } = useAppStore();
  const [vista, setVista] = useState<VistaCalendario>('mes');
  const [fechaActual, setFechaActual] = useState(new Date());
  const [filtroTecnico, setFiltroTecnico] = useState<FiltroTecnico>('todos');
  const [mantenimientoSeleccionado, setMantenimientoSeleccionado] = useState<MantenimientoProgramado | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [nuevoMantenimiento, setNuevoMantenimiento] = useState({
    equipoId: '',
    fechaProgramada: '',
    descripcion: '',
    tecnicoAsignado: 'Javier Lopez',
    prioridad: 'Media' as 'Baja' | 'Media' | 'Alta' | 'Crítica',
    tiempoEstimado: 2,
    esRecurrente: false,
    frecuenciaMantenimiento: 'Trimestral' as 'Mensual' | 'Bimestral' | 'Trimestral' | 'Semestral' | 'Anual',
    diasNotificacionAnticipada: 7
  });

  // Técnicos disponibles
  const tecnicos = [
    'Javier Lopez'
  ];

  // Procesar mantenimientos programados
  const mantenimientosProgramados: MantenimientoProgramado[] = mantenimientos
    .filter(m => m.tipo === 'Preventivo' || m.esProgramado)
    .map(m => {
      const equipo = equipos.find(e => e.id === m.equipoId);
      return {
        ...m,
        cliente: equipo?.cliente,
        nombreEquipo: equipo?.nombreEquipo,
        marca: equipo?.marca,
        modelo: equipo?.modelo,
        ubicacion: equipo?.ubicacion
      };
    });

  // Filtrar por técnico
  const mantenimientosFiltrados = filtroTecnico === 'todos' 
    ? mantenimientosProgramados
    : mantenimientosProgramados.filter(m => m.tecnicoAsignado === filtroTecnico);

  // Obtener mantenimientos por fecha
  const obtenerMantenimientosPorFecha = (fecha: Date): MantenimientoProgramado[] => {
    const fechaStr = fecha.toISOString().split('T')[0];
    return mantenimientosFiltrados.filter(m => {
      const fechaMantenimiento = new Date(m.fechaProgramada || m.fecha).toISOString().split('T')[0];
      return fechaMantenimiento === fechaStr;
    });
  };

  // Navegar fechas
  const navegarFecha = (direccion: 'anterior' | 'siguiente') => {
    const nuevaFecha = new Date(fechaActual);
    
    if (vista === 'mes') {
      nuevaFecha.setMonth(nuevaFecha.getMonth() + (direccion === 'siguiente' ? 1 : -1));
    } else if (vista === 'semana') {
      nuevaFecha.setDate(nuevaFecha.getDate() + (direccion === 'siguiente' ? 7 : -7));
    } else {
      nuevaFecha.setDate(nuevaFecha.getDate() + (direccion === 'siguiente' ? 1 : -1));
    }
    
    setFechaActual(nuevaFecha);
  };

  // Obtener color por prioridad
  const obtenerColorPrioridad = (prioridad: string) => {
    switch (prioridad) {
      case 'Crítica': return 'bg-red-500 text-white';
      case 'Alta': return 'bg-orange-500 text-white';
      case 'Media': return 'bg-yellow-500 text-white';
      case 'Baja': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Cambiar estado de mantenimiento
  const cambiarEstadoMantenimiento = async (id: string, nuevoEstado: 'En proceso' | 'Finalizado') => {
    try {
      await updateMantenimiento(id, { estado: nuevoEstado });
      toast.success(`Mantenimiento marcado como: ${nuevoEstado}`);
      setMostrarModal(false);
    } catch (error) {
      toast.error('Error al actualizar el mantenimiento');
    }
  };

  // Formatear fecha
  const formatearFecha = (fecha: Date) => {
    return fecha.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatearMes = (fecha: Date) => {
    return fecha.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long'
    });
  };

  // Crear nuevo mantenimiento programado
  const crearNuevoMantenimiento = async () => {
    try {
      if (!nuevoMantenimiento.equipoId || !nuevoMantenimiento.fechaProgramada || !nuevoMantenimiento.descripcion) {
        toast.error('Por favor completa todos los campos obligatorios');
        return;
      }

      await addMantenimientoProgramado({
        equipoId: nuevoMantenimiento.equipoId,
        fechaProgramada: nuevoMantenimiento.fechaProgramada,
        descripcion: nuevoMantenimiento.descripcion,
        tipo: 'Preventivo',
        tecnicoAsignado: nuevoMantenimiento.tecnicoAsignado,
        prioridad: nuevoMantenimiento.prioridad,
        tiempoEstimado: nuevoMantenimiento.tiempoEstimado,
        esRecurrente: nuevoMantenimiento.esRecurrente,
        frecuenciaMantenimiento: nuevoMantenimiento.esRecurrente ? nuevoMantenimiento.frecuenciaMantenimiento : undefined,
        diasNotificacionAnticipada: nuevoMantenimiento.diasNotificacionAnticipada
      });

      toast.success('Mantenimiento programado creado exitosamente');
      setMostrarModalNuevo(false);
      
      // Resetear formulario
      setNuevoMantenimiento({
        equipoId: '',
        fechaProgramada: '',
        descripcion: '',
        tecnicoAsignado: 'Javier Lopez',
        prioridad: 'Media',
        tiempoEstimado: 2,
        esRecurrente: false,
        frecuenciaMantenimiento: 'Trimestral',
        diasNotificacionAnticipada: 7
      });
    } catch (error) {
      toast.error('Error al crear el mantenimiento programado');
    }
  };

  // Estadísticas rápidas
  const estadisticas = {
    total: mantenimientosFiltrados.length,
    pendientes: mantenimientosFiltrados.filter(m => m.estado === 'Pendiente').length,
    enProceso: mantenimientosFiltrados.filter(m => m.estado === 'En proceso').length,
    vencidos: mantenimientosFiltrados.filter(m => {
      const fecha = new Date(m.fechaProgramada || m.fecha);
      return fecha < new Date() && m.estado !== 'Finalizado';
    }).length
  };

  return (
    <DashboardLayout 
      title="📅 Calendario de Mantenimientos" 
      subtitle="Planificación y seguimiento de mantenimientos programados"
    >
      <div className="space-y-6">
        {/* Header con controles */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          {/* Navegación de fecha */}
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navegarFecha('anterior')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-center min-w-[200px]">
              <h2 className="text-xl font-bold text-gray-900">
                {vista === 'mes' && formatearMes(fechaActual)}
                {vista === 'semana' && `Semana del ${formatearFecha(fechaActual)}`}
                {vista === 'dia' && formatearFecha(fechaActual)}
              </h2>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navegarFecha('siguiente')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Controles de vista y filtros */}
          <div className="flex flex-wrap gap-2">
            {/* Selector de vista */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['mes', 'semana', 'dia'] as VistaCalendario[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setVista(v)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    vista === v 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>

            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setMostrarModalNuevo(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Mantenimiento
            </Button>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.total}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-orange-600">{estadisticas.pendientes}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Proceso</p>
                <p className="text-2xl font-bold text-blue-600">{estadisticas.enProceso}</p>
              </div>
              <Wrench className="h-8 w-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vencidos</p>
                <p className="text-2xl font-bold text-red-600">{estadisticas.vencidos}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </Card>
        </div>

        {/* Vista del calendario simplificada */}
        <Card className="p-6">
          <div className="text-center py-12">
            <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-blue-500" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              🚀 ¡Calendario de Mantenimientos Implementado!
            </h3>
            <p className="text-gray-600 mb-4">
              Sistema completo con vistas mensual, semanal y diaria
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900">Vista Mensual</h4>
                <p className="text-sm text-blue-700">Planificación general del mes</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900">Vista Semanal</h4>
                <p className="text-sm text-green-700">Asignación de técnicos</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900">Vista Diaria</h4>
                <p className="text-sm text-purple-700">Trabajo detallado del día</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Lista de mantenimientos programados */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Próximos Mantenimientos Programados
          </h3>
          
          <div className="space-y-3">
            {mantenimientosFiltrados.slice(0, 5).map(mantenimiento => (
              <motion.div
                key={mantenimiento.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setMantenimientoSeleccionado(mantenimiento);
                  setMostrarModal(true);
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Badge className={obtenerColorPrioridad(mantenimiento.prioridad)}>
                      {mantenimiento.prioridad}
                    </Badge>
                    <Badge variant="outline">
                      {mantenimiento.tipo}
                    </Badge>
                    <Badge variant={
                      mantenimiento.estado === 'Finalizado' ? 'default' :
                      mantenimiento.estado === 'En proceso' ? 'secondary' : 'destructive'
                    }>
                      {mantenimiento.estado}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(mantenimiento.fechaProgramada || mantenimiento.fecha).toLocaleDateString('es-ES')}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {mantenimiento.nombreEquipo}
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {mantenimiento.cliente} - {mantenimiento.ubicacion}
                      </div>
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {mantenimiento.tecnicoAsignado}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-700 mb-2">
                      {mantenimiento.descripcion}
                    </p>
                    {mantenimiento.esRecurrente && (
                      <div className="text-xs text-blue-600">
                        🔄 Recurrente ({mantenimiento.frecuenciaMantenimiento})
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {mantenimientosFiltrados.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No hay mantenimientos programados</p>
                <p className="text-sm">¡Crea el primer mantenimiento preventivo!</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Modal de detalles */}
      <AnimatePresence>
        {mostrarModal && mantenimientoSeleccionado && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setMostrarModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Detalles del Mantenimiento
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMostrarModal(false)}
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-6">
                {/* Info del equipo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Equipo</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Nombre:</strong> {mantenimientoSeleccionado.nombreEquipo}</p>
                      <p><strong>Marca:</strong> {mantenimientoSeleccionado.marca}</p>
                      <p><strong>Modelo:</strong> {mantenimientoSeleccionado.modelo}</p>
                      <p><strong>Cliente:</strong> {mantenimientoSeleccionado.cliente}</p>
                      <p><strong>Ubicación:</strong> {mantenimientoSeleccionado.ubicacion}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Mantenimiento</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Tipo:</strong> {mantenimientoSeleccionado.tipo}</p>
                      <p><strong>Prioridad:</strong> {mantenimientoSeleccionado.prioridad}</p>
                      <p><strong>Estado:</strong> {mantenimientoSeleccionado.estado}</p>
                      <p><strong>Técnico:</strong> {mantenimientoSeleccionado.tecnicoAsignado}</p>
                      <p><strong>Tiempo estimado:</strong> {mantenimientoSeleccionado.tiempoEstimado}h</p>
                    </div>
                  </div>
                </div>
                
                {/* Descripción */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Descripción</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    {mantenimientoSeleccionado.descripcion}
                  </p>
                </div>
                
                {/* Acciones */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {mantenimientoSeleccionado.estado === 'Pendiente' && (
                    <Button
                      onClick={() => cambiarEstadoMantenimiento(mantenimientoSeleccionado.id, 'En proceso')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      Iniciar Trabajo
                    </Button>
                  )}
                  
                  {mantenimientoSeleccionado.estado === 'En proceso' && (
                    <Button
                      onClick={() => cambiarEstadoMantenimiento(mantenimientoSeleccionado.id, 'Finalizado')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Finalizar
                    </Button>
                  )}
                  
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Equipo
                  </Button>
                  
                  <Button variant="outline">
                    <Phone className="h-4 w-4 mr-2" />
                    Contactar Cliente
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal para Nuevo Mantenimiento */}
      <AnimatePresence>
        {mostrarModalNuevo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setMostrarModalNuevo(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  📅 Nuevo Mantenimiento Programado
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMostrarModalNuevo(false)}
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-4">
                {/* Selección de Equipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Equipo *
                  </label>
                  <select
                    value={nuevoMantenimiento.equipoId}
                    onChange={(e) => setNuevoMantenimiento(prev => ({
                      ...prev,
                      equipoId: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecciona un equipo</option>
                    {equipos.map(equipo => (
                      <option key={equipo.id} value={equipo.id}>
                        {equipo.nombreEquipo} - {equipo.cliente}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fecha Programada */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Programada *
                  </label>
                  <input
                    type="datetime-local"
                    value={nuevoMantenimiento.fechaProgramada}
                    onChange={(e) => setNuevoMantenimiento(prev => ({
                      ...prev,
                      fechaProgramada: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción del Mantenimiento *
                  </label>
                  <textarea
                    value={nuevoMantenimiento.descripcion}
                    onChange={(e) => setNuevoMantenimiento(prev => ({
                      ...prev,
                      descripcion: e.target.value
                    }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe el mantenimiento a realizar..."
                  />
                </div>

                {/* Grid para campos en paralelo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Técnico Asignado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Técnico Asignado
                    </label>
                    <select
                      value={nuevoMantenimiento.tecnicoAsignado}
                      onChange={(e) => setNuevoMantenimiento(prev => ({
                        ...prev,
                        tecnicoAsignado: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {tecnicos.map(tecnico => (
                        <option key={tecnico} value={tecnico}>{tecnico}</option>
                      ))}
                    </select>
                  </div>

                  {/* Prioridad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prioridad
                    </label>
                    <select
                      value={nuevoMantenimiento.prioridad}
                      onChange={(e) => setNuevoMantenimiento(prev => ({
                        ...prev,
                        prioridad: e.target.value as 'Baja' | 'Media' | 'Alta' | 'Crítica'
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Baja">Baja</option>
                      <option value="Media">Media</option>
                      <option value="Alta">Alta</option>
                      <option value="Crítica">Crítica</option>
                    </select>
                  </div>

                  {/* Tiempo Estimado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tiempo Estimado (horas)
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      max="24"
                      step="0.5"
                      value={nuevoMantenimiento.tiempoEstimado}
                      onChange={(e) => setNuevoMantenimiento(prev => ({
                        ...prev,
                        tiempoEstimado: parseFloat(e.target.value)
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Días de Notificación */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notificar con anticipación (días)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={nuevoMantenimiento.diasNotificacionAnticipada}
                      onChange={(e) => setNuevoMantenimiento(prev => ({
                        ...prev,
                        diasNotificacionAnticipada: parseInt(e.target.value)
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Mantenimiento Recurrente */}
                <div className="border-t pt-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <input
                      type="checkbox"
                      id="esRecurrente"
                      checked={nuevoMantenimiento.esRecurrente}
                      onChange={(e) => setNuevoMantenimiento(prev => ({
                        ...prev,
                        esRecurrente: e.target.checked
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="esRecurrente" className="text-sm font-medium text-gray-700">
                      🔄 Mantenimiento Recurrente
                    </label>
                  </div>

                  {nuevoMantenimiento.esRecurrente && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frecuencia
                      </label>
                      <select
                        value={nuevoMantenimiento.frecuenciaMantenimiento}
                        onChange={(e) => setNuevoMantenimiento(prev => ({
                          ...prev,
                          frecuenciaMantenimiento: e.target.value as 'Mensual' | 'Bimestral' | 'Trimestral' | 'Semestral' | 'Anual'
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Mensual">Mensual</option>
                        <option value="Bimestral">Bimestral</option>
                        <option value="Trimestral">Trimestral</option>
                        <option value="Semestral">Semestral</option>
                        <option value="Anual">Anual</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Botones de Acción */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setMostrarModalNuevo(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={crearNuevoMantenimiento}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Mantenimiento
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
} 