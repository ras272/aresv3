'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
  Phone,
  X
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
  const { equipos, mantenimientos, updateMantenimiento, addMantenimientoProgramado, loadAllData } = useAppStore();

  // Cargar datos al montar el componente
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);
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

  // Generar grid del calendario mensual
  const generarDiasMes = () => {
    const año = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaSemanaInicio = primerDia.getDay(); // 0 = domingo
    
    const dias = [];
    
    // Días vacíos del mes anterior
    for (let i = 0; i < diaSemanaInicio; i++) {
      dias.push(null);
    }
    
    // Días del mes actual
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(año, mes, dia);
      const mantenimientosDelDia = obtenerMantenimientosPorFecha(fecha);
      dias.push({
        numero: dia,
        fecha: fecha,
        mantenimientos: mantenimientosDelDia,
        esHoy: fecha.toDateString() === new Date().toDateString()
      });
    }
    
    return dias;
  };

  // Generar días de la semana
  const generarDiasSemana = () => {
    const dias = [];
    const inicioSemana = new Date(fechaActual);
    inicioSemana.setDate(fechaActual.getDate() - fechaActual.getDay()); // Ir al domingo
    
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(inicioSemana);
      fecha.setDate(inicioSemana.getDate() + i);
      const mantenimientosDelDia = obtenerMantenimientosPorFecha(fecha);
      
      dias.push({
        fecha: fecha,
        mantenimientos: mantenimientosDelDia,
        esHoy: fecha.toDateString() === new Date().toDateString()
      });
    }
    
    return dias;
  };

  // Renderizar vista mensual
  const renderVistasMes = () => {
    const dias = generarDiasMes();
    const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    return (
      <div className="bg-white rounded-lg border">
        {/* Header con días de la semana */}
        <div className="grid grid-cols-7 border-b">
          {nombresDias.map(dia => (
            <div key={dia} className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50">
              {dia}
            </div>
          ))}
        </div>
        
        {/* Grid de días */}
        <div className="grid grid-cols-7">
          {dias.map((dia, index) => (
            <div
              key={index}
              className={`min-h-[120px] border-b border-r p-2 ${
                dia ? 'bg-white hover:bg-gray-50 cursor-pointer' : 'bg-gray-50'
              } ${dia?.esHoy ? 'bg-blue-50 border-blue-200' : ''}`}
              onClick={() => dia && handleClickDia(dia.fecha)}
            >
              {dia && (
                <>
                  <div className={`text-sm font-medium mb-2 ${
                    dia.esHoy ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {dia.numero}
                  </div>
                  
                  <div className="space-y-1">
                    {dia.mantenimientos.slice(0, 3).map(mantenimiento => (
                      <div
                        key={mantenimiento.id}
                        className={`text-xs p-1 rounded truncate ${
                          obtenerColorPrioridadCalendario(mantenimiento.prioridad)
                        }`}
                        title={`${mantenimiento.nombreEquipo} - ${mantenimiento.descripcion}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMantenimientoSeleccionado(mantenimiento);
                          setMostrarModal(true);
                        }}
                      >
                        {mantenimiento.nombreEquipo}
                      </div>
                    ))}
                    
                    {dia.mantenimientos.length > 3 && (
                      <div className="text-xs text-gray-500 p-1">
                        +{dia.mantenimientos.length - 3} más
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Renderizar vista semanal
  const renderVistaSemana = () => {
    const dias = generarDiasSemana();
    const horas = Array.from({ length: 13 }, (_, i) => i + 7); // 7:00 a 19:00
    
    return (
      <div className="bg-white rounded-lg border overflow-x-auto">
        {/* Header con días */}
        <div className="grid grid-cols-8 border-b">
          <div className="p-3 text-sm font-medium text-gray-500 bg-gray-50">Hora</div>
          {dias.map(dia => (
            <div key={dia.fecha.toISOString()} className={`p-3 text-center text-sm ${
              dia.esHoy ? 'bg-blue-50 text-blue-600 font-medium' : 'bg-gray-50 text-gray-500'
            }`}>
              <div className="font-medium">{dia.fecha.toLocaleDateString('es-ES', { weekday: 'short' })}</div>
              <div className="text-lg">{dia.fecha.getDate()}</div>
            </div>
          ))}
        </div>
        
        {/* Grid de horarios */}
        <div className="max-h-96 overflow-y-auto">
          {horas.map(hora => (
            <div key={hora} className="grid grid-cols-8 border-b min-h-[60px]">
              <div className="p-2 text-xs text-gray-500 bg-gray-50 flex items-center justify-center">
                {hora}:00
              </div>
              
              {dias.map(dia => {
                const mantenimientosHora = dia.mantenimientos.filter(m => {
                  const fechaMantenimiento = new Date(m.fechaProgramada || m.fecha);
                  return fechaMantenimiento.getHours() === hora;
                });
                
                return (
                  <div key={`${dia.fecha.toISOString()}-${hora}`} className="p-1 border-r hover:bg-gray-50">
                    {mantenimientosHora.map(mantenimiento => (
                      <div
                        key={mantenimiento.id}
                        className={`text-xs p-1 rounded mb-1 cursor-pointer ${
                          obtenerColorPrioridadCalendario(mantenimiento.prioridad)
                        }`}
                        onClick={() => {
                          setMantenimientoSeleccionado(mantenimiento);
                          setMostrarModal(true);
                        }}
                        title={`${mantenimiento.nombreEquipo} - ${mantenimiento.descripcion}`}
                      >
                        {mantenimiento.nombreEquipo}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Renderizar vista diaria
  const renderVistaDia = () => {
    const mantenimientosDelDia = obtenerMantenimientosPorFecha(fechaActual);
    const horas = Array.from({ length: 13 }, (_, i) => i + 7); // 7:00 a 19:00
    
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">
              {formatearFecha(fechaActual)}
            </h4>
            <p className="text-sm text-gray-600">
              {mantenimientosDelDia.length} mantenimientos programados
            </p>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {horas.map(hora => {
              const mantenimientosHora = mantenimientosDelDia.filter(m => {
                const fechaMantenimiento = new Date(m.fechaProgramada || m.fecha);
                return fechaMantenimiento.getHours() === hora;
              });
              
              return (
                <div key={hora} className="flex border-b min-h-[80px]">
                  <div className="w-16 p-3 text-sm text-gray-500 bg-gray-50 flex items-start justify-center">
                    {hora}:00
                  </div>
                  
                  <div className="flex-1 p-3">
                    {mantenimientosHora.length > 0 ? (
                      <div className="space-y-2">
                        {mantenimientosHora.map(mantenimiento => (
                          <div
                            key={mantenimiento.id}
                            className="border rounded-lg p-3 hover:shadow-sm cursor-pointer"
                            onClick={() => {
                              setMantenimientoSeleccionado(mantenimiento);
                              setMostrarModal(true);
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-sm">{mantenimiento.nombreEquipo}</h5>
                              <Badge className={obtenerColorPrioridad(mantenimiento.prioridad)}>
                                {mantenimiento.prioridad}
                              </Badge>
                            </div>
                            
                            <p className="text-xs text-gray-600 mb-1">{mantenimiento.descripcion}</p>
                            
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {mantenimiento.cliente}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {mantenimiento.tecnicoAsignado}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {mantenimiento.tiempoEstimado}h
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 italic">Sin mantenimientos programados</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Obtener colores para el calendario (más sutiles)
  const obtenerColorPrioridadCalendario = (prioridad: string) => {
    switch (prioridad) {
      case 'Crítica': return 'bg-red-100 text-red-700 border border-red-200';
      case 'Alta': return 'bg-orange-100 text-orange-700 border border-orange-200';
      case 'Media': return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'Baja': return 'bg-green-100 text-green-700 border border-green-200';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  // Manejar click en día del calendario
  const handleClickDia = (fecha: Date) => {
    setFechaActual(fecha);
    setVista('dia');
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

        {/* Vista del calendario real */}
        <Card className="p-6">
          {vista === 'mes' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Vista Mensual</h3>
              {renderVistasMes()}
            </div>
          )}
          
          {vista === 'semana' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Vista Semanal</h3>
              {renderVistaSemana()}
            </div>
          )}
          
          {vista === 'dia' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Vista Diaria</h3>
              {renderVistaDia()}
            </div>
          )}
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
              <div className="text-center py-8 text-gray-500">
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setMostrarModalNuevo(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="w-6 h-6" />
                    <div>
                      <h2 className="text-xl font-bold">
                        Nuevo Mantenimiento Programado
                      </h2>
                      <p className="text-blue-100 text-sm">
                        Sistema de planificación de mantenimientos ARES
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMostrarModalNuevo(false)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Información del Equipo */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wrench className="w-5 h-5" />
                        Información del Equipo
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="equipo">Equipo a mantener</Label>
                        <Select
                          value={nuevoMantenimiento.equipoId}
                          onValueChange={(value) => setNuevoMantenimiento(prev => ({
                            ...prev,
                            equipoId: value
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un equipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {equipos.map(equipo => (
                              <SelectItem key={equipo.id} value={equipo.id}>
                                {equipo.nombreEquipo} - {equipo.cliente}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {nuevoMantenimiento.equipoId && (
                        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                          {(() => {
                            const equipoSeleccionado = equipos.find(e => e.id === nuevoMantenimiento.equipoId);
                            return equipoSeleccionado ? (
                              <>
                                <div className="flex items-center gap-2 text-sm">
                                  <MapPin className="w-4 h-4 text-gray-500" />
                                  <span>{equipoSeleccionado.cliente}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Wrench className="w-4 h-4 text-gray-500" />
                                  <span>{equipoSeleccionado.marca} {equipoSeleccionado.modelo}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <User className="w-4 h-4 text-gray-500" />
                                  <span>{equipoSeleccionado.ubicacion}</span>
                                </div>
                              </>
                            ) : null;
                          })()} 
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Programación */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Programación
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="fechaProgramada">Fecha y Hora Programada</Label>
                        <Input
                          id="fechaProgramada"
                          type="datetime-local"
                          value={nuevoMantenimiento.fechaProgramada}
                          onChange={(e) => setNuevoMantenimiento(prev => ({
                            ...prev,
                            fechaProgramada: e.target.value
                          }))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="tiempoEstimado">Tiempo Estimado (horas)</Label>
                        <Input
                          id="tiempoEstimado"
                          type="number"
                          min="0.5"
                          max="24"
                          step="0.5"
                          value={nuevoMantenimiento.tiempoEstimado}
                          onChange={(e) => setNuevoMantenimiento(prev => ({
                            ...prev,
                            tiempoEstimado: parseFloat(e.target.value)
                          }))}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Detalles del Mantenimiento */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Detalles del Mantenimiento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="descripcion">Descripción del Trabajo</Label>
                      <Textarea
                        id="descripcion"
                        placeholder="Describe detalladamente el mantenimiento a realizar..."
                        value={nuevoMantenimiento.descripcion}
                        onChange={(e) => setNuevoMantenimiento(prev => ({
                          ...prev,
                          descripcion: e.target.value
                        }))}
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="tecnicoAsignado">Técnico Asignado</Label>
                        <Select
                          value={nuevoMantenimiento.tecnicoAsignado}
                          onValueChange={(value) => setNuevoMantenimiento(prev => ({
                            ...prev,
                            tecnicoAsignado: value
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {tecnicos.map(tecnico => (
                              <SelectItem key={tecnico} value={tecnico}>{tecnico}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="prioridad">Prioridad</Label>
                        <Select
                          value={nuevoMantenimiento.prioridad}
                          onValueChange={(value) => setNuevoMantenimiento(prev => ({
                            ...prev,
                            prioridad: value as 'Baja' | 'Media' | 'Alta' | 'Crítica'
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Baja">Baja</SelectItem>
                            <SelectItem value="Media">Media</SelectItem>
                            <SelectItem value="Alta">Alta</SelectItem>
                            <SelectItem value="Crítica">Crítica</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="diasNotificacion">Notificar (días antes)</Label>
                        <Input
                          id="diasNotificacion"
                          type="number"
                          min="1"
                          max="30"
                          value={nuevoMantenimiento.diasNotificacionAnticipada}
                          onChange={(e) => setNuevoMantenimiento(prev => ({
                            ...prev,
                            diasNotificacionAnticipada: parseInt(e.target.value)
                          }))}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
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
                      <Label htmlFor="esRecurrente">Mantenimiento Recurrente</Label>
                    </div>

                    {nuevoMantenimiento.esRecurrente && (
                      <div>
                        <Label htmlFor="frecuencia">Frecuencia</Label>
                        <Select
                          value={nuevoMantenimiento.frecuenciaMantenimiento}
                          onValueChange={(value) => setNuevoMantenimiento(prev => ({
                            ...prev,
                            frecuenciaMantenimiento: value as 'Mensual' | 'Bimestral' | 'Trimestral' | 'Semestral' | 'Anual'
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Mensual">Mensual</SelectItem>
                            <SelectItem value="Bimestral">Bimestral</SelectItem>
                            <SelectItem value="Trimestral">Trimestral</SelectItem>
                            <SelectItem value="Semestral">Semestral</SelectItem>
                            <SelectItem value="Anual">Anual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Footer */}
              <div className="border-t bg-gray-50 p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Técnico:</span>{" "}
                    {nuevoMantenimiento.tecnicoAsignado}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setMostrarModalNuevo(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={crearNuevoMantenimiento}
                      disabled={
                        !nuevoMantenimiento.equipoId ||
                        !nuevoMantenimiento.fechaProgramada ||
                        !nuevoMantenimiento.descripcion
                      }
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Mantenimiento
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
} 