import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { supabaseSimple } from '@/lib/supabase-simple';
import { 
  Tarea, 
  ComentarioTarea, 
  Usuario, 
  EstadoTarea, 
  PrioridadTarea, 
  CategoriaTarea,
  FiltrosTareas,
  EstadisticasTareas
} from '@/types/tareas';

// Datos de ejemplo para desarrollo
const usuariosEjemplo: Usuario[] = [
  {
    id: '1',
    nombre: 'Juan González',
    email: 'juan@ares.com',
    departamento: 'RRHH',
    activo: true
  },
  {
    id: '2',
    nombre: 'María Rodríguez',
    email: 'maria@ares.com',
    departamento: 'Contabilidad',
    activo: true
  },
  {
    id: '3',
    nombre: 'Carlos López',
    email: 'carlos@ares.com',
    departamento: 'Servicio Técnico',
    activo: true
  },
  {
    id: '4',
    nombre: 'Ana Martínez',
    email: 'ana@ares.com',
    departamento: 'Inventario',
    activo: true
  }
];

const tareasEjemplo: Tarea[] = [
  {
    id: '1',
    titulo: 'Revisar planilla de empleados',
    descripcion: 'Verificar datos de nómina del mes actual',
    estado: 'pendiente',
    prioridad: 'alta',
    fecha_creacion: new Date('2024-01-15'),
    fecha_limite: new Date('2024-01-20'),
    asignado_a: '1',
    creado_por: '1',
    departamento: 'RRHH',
    categoria: 'rrhh',
    progreso: 0,
    tiempo_estimado: 4,
    updated_at: new Date()
  },
  {
    id: '2',
    titulo: 'Mantenimiento preventivo equipos',
    descripcion: 'Revisión mensual de equipos críticos',
    estado: 'en_progreso',
    prioridad: 'media',
    fecha_creacion: new Date('2024-01-10'),
    fecha_limite: new Date('2024-01-25'),
    asignado_a: '3',
    creado_por: '3',
    departamento: 'Servicio Técnico',
    categoria: 'mantenimiento',
    progreso: 60,
    tiempo_estimado: 8,
    tiempo_real: 5,
    updated_at: new Date()
  },
  {
    id: '3',
    titulo: 'Generar reporte financiero',
    descripcion: 'Reporte mensual de ingresos y gastos',
    estado: 'completada',
    prioridad: 'alta',
    fecha_creacion: new Date('2024-01-05'),
    fecha_limite: new Date('2024-01-15'),
    fecha_completada: new Date('2024-01-14'),
    asignado_a: '2',
    creado_por: '2',
    departamento: 'Contabilidad',
    categoria: 'contabilidad',
    progreso: 100,
    tiempo_estimado: 6,
    tiempo_real: 5.5,
    updated_at: new Date()
  },
  {
    id: '4',
    titulo: 'Actualizar inventario',
    descripcion: 'Conteo físico de productos en almacén',
    estado: 'en_revision',
    prioridad: 'media',
    fecha_creacion: new Date('2024-01-12'),
    fecha_limite: new Date('2024-01-30'),
    asignado_a: '4',
    creado_por: '4',
    departamento: 'Inventario',
    categoria: 'inventario',
    progreso: 85,
    tiempo_estimado: 12,
    tiempo_real: 10,
    updated_at: new Date()
  }
];

export function useTareas() {
  const [loading, setLoading] = useState(false);
  const [tareas, setTareas] = useState<Tarea[]>(tareasEjemplo);
  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosEjemplo);
  const [filtros, setFiltros] = useState<FiltrosTareas>({});

  // Cargar tareas
  const cargarTareas = useCallback(async (filtros?: FiltrosTareas) => {
    setLoading(true);
    try {
      // TODO: Implementar carga desde Supabase
      console.log('🔄 Cargando tareas con filtros:', filtros);
      
      let tareasFiltradas = [...tareasEjemplo];
      
      // Aplicar filtros
      if (filtros?.estado?.length) {
        tareasFiltradas = tareasFiltradas.filter(t => filtros.estado!.includes(t.estado));
      }
      
      if (filtros?.prioridad?.length) {
        tareasFiltradas = tareasFiltradas.filter(t => filtros.prioridad!.includes(t.prioridad));
      }
      
      if (filtros?.asignado_a?.length) {
        tareasFiltradas = tareasFiltradas.filter(t => filtros.asignado_a!.includes(t.asignado_a));
      }
      
      if (filtros?.departamento?.length) {
        tareasFiltradas = tareasFiltradas.filter(t => filtros.departamento!.includes(t.departamento));
      }
      
      if (filtros?.busqueda) {
        const busqueda = filtros.busqueda.toLowerCase();
        tareasFiltradas = tareasFiltradas.filter(t => 
          t.titulo.toLowerCase().includes(busqueda) ||
          t.descripcion?.toLowerCase().includes(busqueda)
        );
      }
      
      setTareas(tareasFiltradas);
      return tareasFiltradas;
      
    } catch (error) {
      console.error('Error cargando tareas:', error);
      toast.error('Error al cargar tareas');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear tarea
  const crearTarea = useCallback(async (nuevaTarea: Omit<Tarea, 'id' | 'fecha_creacion' | 'updated_at'>) => {
    try {
      const tarea: Tarea = {
        ...nuevaTarea,
        id: Date.now().toString(),
        fecha_creacion: new Date(),
        updated_at: new Date()
      };
      
      // TODO: Guardar en Supabase
      console.log('✅ Creando tarea:', tarea);
      
      setTareas(prev => [tarea, ...prev]);
      toast.success(`Tarea "${tarea.titulo}" creada exitosamente`);
      
      return tarea;
    } catch (error) {
      console.error('Error creando tarea:', error);
      toast.error('Error al crear tarea');
      throw error;
    }
  }, []);

  // Actualizar tarea
  const actualizarTarea = useCallback(async (id: string, cambios: Partial<Tarea>) => {
    try {
      const tareaActualizada = {
        ...cambios,
        updated_at: new Date()
      };
      
      // TODO: Actualizar en Supabase
      console.log('🔄 Actualizando tarea:', id, cambios);
      
      setTareas(prev => prev.map(t => 
        t.id === id ? { ...t, ...tareaActualizada } : t
      ));
      
      toast.success('Tarea actualizada exitosamente');
      
    } catch (error) {
      console.error('Error actualizando tarea:', error);
      toast.error('Error al actualizar tarea');
      throw error;
    }
  }, []);

  // Eliminar tarea
  const eliminarTarea = useCallback(async (id: string) => {
    try {
      // TODO: Eliminar de Supabase
      console.log('🗑️ Eliminando tarea:', id);
      
      setTareas(prev => prev.filter(t => t.id !== id));
      toast.success('Tarea eliminada exitosamente');
      
    } catch (error) {
      console.error('Error eliminando tarea:', error);
      toast.error('Error al eliminar tarea');
      throw error;
    }
  }, []);

  // Cambiar estado de tarea
  const cambiarEstadoTarea = useCallback(async (id: string, nuevoEstado: EstadoTarea) => {
    try {
      const cambios: Partial<Tarea> = {
        estado: nuevoEstado,
        updated_at: new Date()
      };
      
      // Si se completa, agregar fecha de completado
      if (nuevoEstado === 'completada') {
        cambios.fecha_completada = new Date();
        cambios.progreso = 100;
      }
      
      await actualizarTarea(id, cambios);
      
    } catch (error) {
      console.error('Error cambiando estado:', error);
      throw error;
    }
  }, [actualizarTarea]);

  // Obtener estadísticas
  const obtenerEstadisticas = useCallback((): EstadisticasTareas => {
    const total_tareas = tareas.length;
    const pendientes = tareas.filter(t => t.estado === 'pendiente').length;
    const en_progreso = tareas.filter(t => t.estado === 'en_progreso').length;
    const completadas = tareas.filter(t => t.estado === 'completada').length;
    
    // Tareas vencidas (pendientes o en progreso con fecha límite pasada)
    const ahora = new Date();
    const vencidas = tareas.filter(t => 
      (t.estado === 'pendiente' || t.estado === 'en_progreso') &&
      t.fecha_limite && 
      t.fecha_limite < ahora
    ).length;
    
    const por_prioridad = {
      baja: tareas.filter(t => t.prioridad === 'baja').length,
      media: tareas.filter(t => t.prioridad === 'media').length,
      alta: tareas.filter(t => t.prioridad === 'alta').length,
      urgente: tareas.filter(t => t.prioridad === 'urgente').length
    };
    
    const por_departamento: Record<string, number> = {};
    tareas.forEach(t => {
      por_departamento[t.departamento] = (por_departamento[t.departamento] || 0) + 1;
    });
    
    // Productividad semanal (tareas completadas en los últimos 7 días)
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    const productividad_semanal = tareas.filter(t => 
      t.estado === 'completada' && 
      t.fecha_completada && 
      t.fecha_completada > hace7Dias
    ).length;
    
    return {
      total_tareas,
      pendientes,
      en_progreso,
      completadas,
      vencidas,
      por_prioridad,
      por_departamento,
      productividad_semanal
    };
  }, [tareas]);

  // Obtener usuario por ID
  const obtenerUsuario = useCallback((id: string) => {
    return usuarios.find(u => u.id === id);
  }, [usuarios]);

  // Cargar datos iniciales
  useEffect(() => {
    cargarTareas();
  }, []);

  return {
    // Estado
    loading,
    tareas,
    usuarios,
    filtros,
    
    // Acciones
    cargarTareas,
    crearTarea,
    actualizarTarea,
    eliminarTarea,
    cambiarEstadoTarea,
    setFiltros,
    
    // Utilidades
    obtenerEstadisticas,
    obtenerUsuario
  };
}