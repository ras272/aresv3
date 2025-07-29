import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  supabaseSimple, 
  uploadFileSimple, 
  getPublicUrlSimple, 
  downloadFileSimple, 
  deleteFileSimple 
} from '@/lib/supabase-simple';
import { 
  Carpeta, 
  Archivo, 
  VersionArchivo, 
  ActividadArchivo, 
  EstadisticasArchivos,
  FiltrosArchivos 
} from '@/types/files';

// Datos de ejemplo para desarrollo
const carpetasEjemplo: Carpeta[] = [
  {
    id: '1',
    nombre: 'RRHH',
    ruta_completa: '/RRHH',
    departamento: 'RRHH',
    descripcion: 'Recursos Humanos - Planillas, contratos y documentos de empleados',
    icono: 'users',
    color: '#10B981',
    created_at: new Date(),
    updated_at: new Date(),
    total_archivos: 15
  },
  {
    id: '2',
    nombre: 'Contabilidad',
    ruta_completa: '/Contabilidad',
    departamento: 'Contabilidad',
    descripcion: 'Documentos contables, facturas y balances',
    icono: 'calculator',
    color: '#8B5CF6',
    created_at: new Date(),
    updated_at: new Date(),
    total_archivos: 23
  },
  {
    id: '3',
    nombre: 'Servicio Técnico',
    ruta_completa: '/Servicio Técnico',
    departamento: 'Servicio Técnico',
    descripcion: 'Reportes técnicos, manuales y documentación de equipos',
    icono: 'wrench',
    color: '#F59E0B',
    created_at: new Date(),
    updated_at: new Date(),
    total_archivos: 8
  },
  {
    id: '11',
    nombre: 'Planillas',
    ruta_completa: '/RRHH/Planillas',
    carpeta_padre_id: '1',
    departamento: 'RRHH',
    descripcion: 'Planillas mensuales de sueldos',
    icono: 'file-spreadsheet',
    color: '#10B981',
    created_at: new Date(),
    updated_at: new Date(),
    total_archivos: 12
  }
];

const archivosEjemplo: Archivo[] = [
  {
    id: '1',
    nombre: 'Planilla_Enero_2025.xlsx',
    nombre_original: 'Planilla_Enero_2025.xlsx',
    extension: 'xlsx',
    tamaño: 245760, // 240 KB
    tipo_mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    carpeta_id: '11',
    ruta_storage: '/rrhh/planillas/planilla_enero_2025.xlsx',
    es_editable: true,
    version: 3,
    metadatos: {
      empleados: 25,
      total_bruto: 125000000,
      total_neto: 98750000
    },
    created_at: new Date('2025-01-15'),
    updated_at: new Date('2025-01-17')
  },
  {
    id: '2',
    nombre: 'Planilla_Diciembre_2024.xlsx',
    nombre_original: 'Planilla_Diciembre_2024.xlsx',
    extension: 'xlsx',
    tamaño: 267890,
    tipo_mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    carpeta_id: '11',
    ruta_storage: '/rrhh/planillas/planilla_diciembre_2024.xlsx',
    es_editable: true,
    version: 1,
    metadatos: {
      empleados: 24,
      incluye_aguinaldo: true,
      total_bruto: 156000000,
      total_neto: 123500000
    },
    created_at: new Date('2024-12-28'),
    updated_at: new Date('2024-12-28')
  }
];

export function useFileSystem() {
  const [loading, setLoading] = useState(false);
  const [carpetas, setCarpetas] = useState<Carpeta[]>(carpetasEjemplo);
  const [archivos, setArchivos] = useState<Archivo[]>(archivosEjemplo);
  const [carpetaActual, setCarpetaActual] = useState<Carpeta | null>(null);
  const [rutaActual, setRutaActual] = useState<string[]>([]);
  const [actividad, setActividad] = useState<ActividadArchivo[]>([]);

  // Cargar carpetas principales
  const cargarCarpetas = useCallback(async (carpetaPadreId?: string) => {
    setLoading(true);
    try {
      let query = supabaseSimple
        .from('carpetas')
        .select('*');
      
      if (carpetaPadreId) {
        query = query.eq('carpeta_padre_id', carpetaPadreId);
      } else {
        query = query.is('carpeta_padre_id', null);
      }
      
      const { data, error } = await query.order('nombre');
      
      if (error) throw error;
      
      const carpetasConvertidas = data?.map(c => ({
        ...c,
        created_at: new Date(c.created_at),
        updated_at: new Date(c.updated_at)
      })) || [];
      
      // Actualizar conteo de archivos para cada carpeta
      const carpetasConConteo = await Promise.all(
        carpetasConvertidas.map(async (carpeta) => {
          try {
            const { count, error: countError } = await supabaseSimple
              .from('archivos')
              .select('*', { count: 'exact', head: true })
              .eq('carpeta_id', carpeta.id);
            
            if (countError) {
              console.warn(`Error contando archivos para carpeta ${carpeta.nombre}:`, countError);
              return { ...carpeta, total_archivos: 0 };
            }
            
            return { ...carpeta, total_archivos: count || 0 };
          } catch (error) {
            console.warn(`Error contando archivos para carpeta ${carpeta.nombre}:`, error);
            return { ...carpeta, total_archivos: 0 };
          }
        })
      );
      
      console.log('📁 Hook: Carpetas con conteo actualizado:', carpetasConConteo.map(c => `${c.nombre}: ${c.total_archivos} archivos`));
      setCarpetas(carpetasConConteo);
      return carpetasConConteo;
    } catch (error) {
      console.error('Error al cargar carpetas:', error);
      toast.error('Error al cargar carpetas');
      // Fallback a datos de ejemplo
      const carpetasFiltradas = carpetasEjemplo.filter(c => 
        carpetaPadreId ? c.carpeta_padre_id === carpetaPadreId : !c.carpeta_padre_id
      );
      setCarpetas(carpetasFiltradas);
      return carpetasFiltradas;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar archivos de una carpeta
  const cargarArchivos = useCallback(async (carpetaId: string) => {
    setLoading(true);
    try {
      // ID especial para limpiar archivos (cuando navegamos al inicio)
      if (carpetaId === '__CLEAR__') {
        console.log('🧹 Limpiando archivos del hook para estadísticas correctas');
        setArchivos([]);
        return [];
      }
      
      const { data, error } = await supabaseSimple
        .from('archivos')
        .select('*')
        .eq('carpeta_id', carpetaId)
        .order('nombre');
      
      if (error) throw error;
      
      const archivosConvertidos = data?.map(a => ({
        ...a,
        created_at: new Date(a.created_at),
        updated_at: new Date(a.updated_at)
      })) || [];
      
      console.log(`📄 Hook: Archivos cargados para carpeta ${carpetaId}:`, archivosConvertidos.length);
      setArchivos(archivosConvertidos);
      return archivosConvertidos;
    } catch (error) {
      console.error('Error al cargar archivos:', error);
      toast.error('Error al cargar archivos');
      // Fallback a datos de ejemplo
      const archivosFiltrados = archivosEjemplo.filter(a => a.carpeta_id === carpetaId);
      setArchivos(archivosFiltrados);
      return archivosFiltrados;
    } finally {
      setLoading(false);
    }
  }, []);

  // Navegar a una carpeta
  const navegarACarpeta = useCallback(async (carpeta: Carpeta) => {
    try {
      setCarpetaActual(carpeta);
      
      // Construir ruta de navegación
      const nuevaRuta = carpeta.ruta_completa.split('/').filter(Boolean);
      setRutaActual(nuevaRuta);
      
      // Registrar actividad
      const nuevaActividad: ActividadArchivo = {
        id: Date.now().toString(),
        carpeta_id: carpeta.id,
        usuario_id: 'current-user',
        accion: 'compartir', // Navegar
        descripcion: `Navegó a la carpeta ${carpeta.nombre}`,
        metadatos: { ruta: carpeta.ruta_completa },
        created_at: new Date()
      };
      
      setActividad(prev => [nuevaActividad, ...prev.slice(0, 49)]); // Mantener últimas 50
      
    } catch (error) {
      toast.error('Error al navegar a la carpeta');
    }
  }, []);

  // Subir archivo
  const subirArchivo = useCallback(async (
    file: File, 
    carpetaId: string, 
    esEditable: boolean = false
  ) => {
    setLoading(true);
    try {
      // Generar ruta única para el archivo
      const timestamp = Date.now();
      const extension = file.name.split('.').pop() || '';
      const nombreLimpio = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const rutaStorage = `${carpetaId}/${timestamp}_${nombreLimpio}`;
      
      // Subir archivo a Supabase Storage
      const storageData = await uploadFileSimple(file, rutaStorage);
      
      // Obtener URL pública
      const urlPublica = getPublicUrlSimple(rutaStorage);
      
      // Crear registro en la base de datos
      const { data, error } = await supabaseSimple
        .from('archivos')
        .insert({
          nombre: file.name,
          nombre_original: file.name,
          extension: extension,
          tamaño: file.size,
          tipo_mime: file.type,
          carpeta_id: carpetaId,
          ruta_storage: rutaStorage,
          url_publica: urlPublica,
          es_editable: esEditable || ['xlsx', 'xls', 'csv'].includes(extension.toLowerCase()),
          version: 1,
          metadatos: {
            subido_timestamp: timestamp,
            tamaño_original: file.size
          }
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const nuevoArchivo: Archivo = {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at)
      };

      setArchivos(prev => [...prev, nuevoArchivo]);
      
      // Registrar actividad en la base de datos
      await supabaseSimple
        .from('actividad_archivos')
        .insert({
          archivo_id: nuevoArchivo.id,
          carpeta_id: carpetaId,
          accion: 'subir',
          descripcion: `Subió el archivo ${file.name}`,
          metadatos: { tamaño: file.size, tipo: file.type }
        });
      
      // Actualizar actividad local
      const nuevaActividad: ActividadArchivo = {
        id: Date.now().toString(),
        archivo_id: nuevoArchivo.id,
        carpeta_id: carpetaId,
        usuario_id: 'current-user',
        accion: 'subir',
        descripcion: `Subió el archivo ${file.name}`,
        metadatos: { tamaño: file.size, tipo: file.type },
        created_at: new Date()
      };
      
      setActividad(prev => [nuevaActividad, ...prev.slice(0, 49)]);
      
      toast.success(`Archivo ${file.name} subido exitosamente`);
      return nuevoArchivo;
      
    } catch (error) {
      console.error('Error al subir archivo:', error);
      
      // Manejo específico de errores
      let errorMessage = 'Error desconocido al subir archivo';
      
      if (error instanceof Error) {
        if (error.message.includes('row-level security')) {
          errorMessage = 'Error de permisos. Configurando acceso...';
        } else if (error.message.includes('bucket')) {
          errorMessage = 'Error de almacenamiento. Verificando configuración...';
        } else if (error.message.includes('size')) {
          errorMessage = 'Archivo demasiado grande. Máximo 50MB permitido.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error('Error al subir archivo: ' + errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Eliminar archivo
  const eliminarArchivo = useCallback(async (archivoId: string) => {
    setLoading(true);
    try {
      // Obtener información del archivo antes de eliminarlo
      const { data: archivo, error: fetchError } = await supabaseSimple
        .from('archivos')
        .select('*')
        .eq('id', archivoId)
        .single();
      
      if (fetchError || !archivo) throw new Error('Archivo no encontrado');

      // Eliminar archivo del storage
      await deleteFileSimple(archivo.ruta_storage);
      
      // Eliminar registro de la base de datos
      const { error: deleteError } = await supabaseSimple
        .from('archivos')
        .delete()
        .eq('id', archivoId);
      
      if (deleteError) throw deleteError;

      // Actualizar estado local
      setArchivos(prev => prev.filter(a => a.id !== archivoId));
      
      // Registrar actividad en la base de datos
      await supabaseSimple
        .from('actividad_archivos')
        .insert({
          archivo_id: archivoId,
          accion: 'eliminar',
          descripcion: `Eliminó el archivo ${archivo.nombre}`,
          metadatos: { nombre_archivo: archivo.nombre }
        });
      
      // Registrar actividad local
      const nuevaActividad: ActividadArchivo = {
        id: Date.now().toString(),
        archivo_id: archivoId,
        usuario_id: 'current-user',
        accion: 'eliminar',
        descripcion: `Eliminó el archivo ${archivo.nombre}`,
        metadatos: {},
        created_at: new Date()
      };
      
      setActividad(prev => [nuevaActividad, ...prev.slice(0, 49)]);
      
      toast.success('Archivo eliminado exitosamente');
      
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      toast.error('Error al eliminar archivo: ' + (error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Descargar archivo
  const descargarArchivo = useCallback(async (archivo: Archivo) => {
    try {
      let url = archivo.url_publica;
      
      // Si no hay URL pública, obtenerla desde Supabase Storage
      if (!url) {
        url = getPublicUrlSimple(archivo.ruta_storage);
      }
      
      // Descargar archivo real
      const link = document.createElement('a');
      link.href = url;
      link.download = archivo.nombre_original;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Registrar actividad en la base de datos
      await supabaseSimple
        .from('actividad_archivos')
        .insert({
          archivo_id: archivo.id,
          accion: 'descargar',
          descripcion: `Descargó el archivo ${archivo.nombre}`,
          metadatos: { nombre_archivo: archivo.nombre }
        });
      
      // Registrar actividad local
      const nuevaActividad: ActividadArchivo = {
        id: Date.now().toString(),
        archivo_id: archivo.id,
        usuario_id: 'current-user',
        accion: 'descargar',
        descripcion: `Descargó el archivo ${archivo.nombre}`,
        metadatos: {},
        created_at: new Date()
      };
      
      setActividad(prev => [nuevaActividad, ...prev.slice(0, 49)]);
      
      toast.success(`Descargando ${archivo.nombre}`);
      
    } catch (error) {
      console.error('Error al descargar archivo:', error);
      toast.error('Error al descargar archivo: ' + (error as Error).message);
    }
  }, []);

  // Crear nueva carpeta
  const crearCarpeta = useCallback(async (
    nombre: string, 
    carpetaPadreId?: string,
    departamento: string = 'General'
  ) => {
    setLoading(true);
    try {
      const carpetaPadre = carpetaPadreId ? carpetas.find(c => c.id === carpetaPadreId) : null;
      const rutaCompleta = carpetaPadre ? `${carpetaPadre.ruta_completa}/${nombre}` : `/${nombre}`;
      
      const nuevaCarpeta: Carpeta = {
        id: Date.now().toString(),
        nombre,
        ruta_completa: rutaCompleta,
        carpeta_padre_id: carpetaPadreId,
        departamento,
        icono: 'folder',
        color: '#3B82F6',
        created_at: new Date(),
        updated_at: new Date(),
        total_archivos: 0
      };

      setCarpetas(prev => [...prev, nuevaCarpeta]);
      
      toast.success(`Carpeta ${nombre} creada exitosamente`);
      return nuevaCarpeta;
      
    } catch (error) {
      toast.error('Error al crear carpeta');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [carpetas]);

  // Buscar archivos
  const buscarArchivos = useCallback(async (filtros: FiltrosArchivos) => {
    try {
      let resultados = [...archivos];
      
      if (filtros.busqueda) {
        resultados = resultados.filter(a => 
          a.nombre.toLowerCase().includes(filtros.busqueda!.toLowerCase()) ||
          a.nombre_original.toLowerCase().includes(filtros.busqueda!.toLowerCase())
        );
      }
      
      if (filtros.carpeta_id) {
        resultados = resultados.filter(a => a.carpeta_id === filtros.carpeta_id);
      }
      
      if (filtros.extension) {
        resultados = resultados.filter(a => a.extension === filtros.extension);
      }
      
      if (filtros.es_editable !== undefined) {
        resultados = resultados.filter(a => a.es_editable === filtros.es_editable);
      }
      
      return resultados;
      
    } catch (error) {
      toast.error('Error en la búsqueda');
      return [];
    }
  }, [archivos]);

  // Estado para estadísticas globales
  const [estadisticasGlobales, setEstadisticasGlobales] = useState<EstadisticasArchivos>({
    total_archivos: 0,
    total_carpetas: 0,
    tamaño_total: 0,
    archivos_recientes: 0,
    archivos_editables: 0
  });

  // Calcular estadísticas globales desde la base de datos
  const calcularEstadisticasGlobales = useCallback(async () => {
    try {
      console.log('📊 Calculando estadísticas globales...');
      
      // Contar carpetas totales
      const { count: totalCarpetas, error: errorCarpetas } = await supabaseSimple
        .from('carpetas')
        .select('*', { count: 'exact', head: true });
      
      if (errorCarpetas) throw errorCarpetas;

      // Obtener todos los archivos para estadísticas detalladas
      const { data: todosArchivos, error: errorArchivos } = await supabaseSimple
        .from('archivos')
        .select('tamaño, created_at, es_editable');
      
      if (errorArchivos) throw errorArchivos;

      const totalArchivos = todosArchivos?.length || 0;
      const tamañoTotal = todosArchivos?.reduce((sum, a) => sum + (a.tamaño || 0), 0) || 0;
      
      // Archivos recientes (últimos 7 días)
      const hace7Dias = new Date();
      hace7Dias.setDate(hace7Dias.getDate() - 7);
      const archivosRecientes = todosArchivos?.filter(a => {
        const fechaCreacion = new Date(a.created_at);
        return fechaCreacion > hace7Dias;
      }).length || 0;
      
      // Archivos editables
      const archivosEditables = todosArchivos?.filter(a => a.es_editable).length || 0;

      const nuevasEstadisticas = {
        total_archivos: totalArchivos,
        total_carpetas: totalCarpetas || 0,
        tamaño_total: tamañoTotal,
        archivos_recientes: archivosRecientes,
        archivos_editables: archivosEditables
      };

      console.log('📊 Estadísticas calculadas:', nuevasEstadisticas);
      setEstadisticasGlobales(nuevasEstadisticas);
      
      return nuevasEstadisticas;
    } catch (error) {
      console.error('Error calculando estadísticas:', error);
      // Fallback a estadísticas de ejemplo
      const estadisticasFallback = {
        total_archivos: archivosEjemplo.length,
        total_carpetas: carpetasEjemplo.length,
        tamaño_total: archivosEjemplo.reduce((sum, a) => sum + a.tamaño, 0),
        archivos_recientes: 5,
        archivos_editables: archivosEjemplo.filter(a => a.es_editable).length
      };
      setEstadisticasGlobales(estadisticasFallback);
      return estadisticasFallback;
    }
  }, []);

  // Obtener estadísticas (ahora devuelve las globales)
  const obtenerEstadisticas = useCallback((): EstadisticasArchivos => {
    return estadisticasGlobales;
  }, [estadisticasGlobales]);

  // Formatear tamaño de archivo
  const formatearTamaño = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Eliminar carpeta
  const eliminarCarpeta = useCallback(async (carpetaId: string) => {
    setLoading(true);
    try {
      // Primero eliminar todos los archivos de la carpeta
      const { error: eliminarArchivosError } = await supabaseSimple
        .from('archivos')
        .delete()
        .eq('carpeta_id', carpetaId);
      
      if (eliminarArchivosError) throw eliminarArchivosError;

      // Luego eliminar la carpeta
      const { error: eliminarCarpetaError } = await supabaseSimple
        .from('carpetas')
        .delete()
        .eq('id', carpetaId);
      
      if (eliminarCarpetaError) throw eliminarCarpetaError;

      // Actualizar estado local
      setCarpetas(prev => prev.filter(c => c.id !== carpetaId));
      
      toast.success('Carpeta eliminada exitosamente');
      
    } catch (error) {
      console.error('Error al eliminar carpeta:', error);
      toast.error('Error al eliminar carpeta: ' + (error as Error).message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // Estados
    loading,
    carpetas,
    archivos,
    carpetaActual,
    rutaActual,
    actividad,

    // Funciones principales
    cargarCarpetas,
    cargarArchivos,
    navegarACarpeta,
    subirArchivo,
    eliminarArchivo,
    descargarArchivo,
    crearCarpeta,
    eliminarCarpeta,
    buscarArchivos,

    // Utilidades
    obtenerEstadisticas,
    calcularEstadisticasGlobales,
    formatearTamaño,

    // Setters
    setCarpetaActual,
    setRutaActual
  };
}