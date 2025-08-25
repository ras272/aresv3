'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useFileSystem } from '@/hooks/useFileSystem';
import ExcelEditor from '@/components/files/SimpleExcelEditor';
import { Carpeta, Archivo } from '@/types/files';
import { 
  FolderOpen,
  File,
  Upload,
  Search,
  Grid3X3,
  List,
  Plus,
  Download,
  Edit3,
  Trash2,
  Eye,
  Clock,
  Users,
  Calculator,
  Wrench,
  Package,
  Receipt,
  FileText,
  Home,
  ChevronRight,
  HardDrive,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function ArchivosPage() {
  const {
    loading,
    carpetas,
    archivos,
    carpetaActual,
    rutaActual,
    actividad,
    cargarCarpetas,
    cargarArchivos,
    navegarACarpeta,
    subirArchivo,
    eliminarArchivo,
    descargarArchivo,
    crearCarpeta,
    eliminarCarpeta,
    buscarArchivos,
    obtenerEstadisticas,
    calcularEstadisticasGlobales,
    formatearTamaño,
    setCarpetaActual,
    setRutaActual
  } = useFileSystem();

  const [vistaActual, setVistaActual] = useState<'grid' | 'list'>('grid');
  const [busqueda, setBusqueda] = useState('');
  const [carpetasVisibles, setCarpetasVisibles] = useState<Carpeta[]>([]);
  const [archivosVisibles, setArchivosVisibles] = useState<Archivo[]>([]);
  const [mostrarSubirArchivo, setMostrarSubirArchivo] = useState(false);
  const [archivoEditando, setArchivoEditando] = useState<Archivo | null>(null);
  const [mostrarNuevaCarpeta, setMostrarNuevaCarpeta] = useState(false);
  const [mostrarBusquedaAvanzada, setMostrarBusquedaAvanzada] = useState(false);
  const [nombreNuevaCarpeta, setNombreNuevaCarpeta] = useState('');
  const [descripcionNuevaCarpeta, setDescripcionNuevaCarpeta] = useState('');
  const [departamentoNuevaCarpeta, setDepartamentoNuevaCarpeta] = useState('');
  const [filtrosAvanzados, setFiltrosAvanzados] = useState({
    extension: '',
    tamaño_min: '',
    tamaño_max: '',
    fecha_desde: '',
    fecha_hasta: '',
    es_editable: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, [carpetaActual]);

  const cargarDatos = async () => {
    try {
      // console.log('🔄 Cargando datos para carpeta:', carpetaActual?.nombre || 'Inicio');
      
      // Cargar carpetas (siempre actualizar)
      const carpetasData = await cargarCarpetas(carpetaActual?.id);
      // console.log('📁 Carpetas cargadas:', carpetasData.length);
      setCarpetasVisibles(carpetasData);
      
      // Cargar archivos si estamos en una carpeta específica
      if (carpetaActual) {
        const archivosData = await cargarArchivos(carpetaActual.id);
        // console.log('📄 Archivos cargados:', archivosData.length);
        setArchivosVisibles(archivosData);
      } else {
        // En el inicio, limpiar archivos locales Y del hook
        setArchivosVisibles([]);
        // Forzar limpieza de archivos en el hook para estadísticas correctas
        await cargarArchivos('__CLEAR__'); // Usamos un ID especial para limpiar
        // console.log('🏠 En inicio - archivos limpiados');
      }
      
      // Calcular estadísticas globales desde la base de datos
      // console.log('📊 Calculando estadísticas globales...');
      await calcularEstadisticasGlobales();
      // console.log('📊 Estadísticas actualizadas');
      
    } catch (error) {
      // console.error('❌ Error cargando datos:', error);
    }
  };

  // Manejar búsqueda
  useEffect(() => {
    if (busqueda.trim()) {
      buscarArchivos({ busqueda }).then(setArchivosVisibles);
    } else {
      cargarDatos();
    }
  }, [busqueda]);

  // Navegar al inicio
  const navegarAlInicio = () => {
    setCarpetaActual(null);
    setRutaActual([]);
  };

  // Manejar subida de archivos
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !carpetaActual) return;

    for (const file of Array.from(files)) {
      try {
        const esEditable = file.name.endsWith('.xlsx') || file.name.endsWith('.csv');
        await subirArchivo(file, carpetaActual.id, esEditable);
      } catch (error) {
        // Error ya manejado en el hook
      }
    }
    
    // Recargar datos
    cargarDatos();
    setMostrarSubirArchivo(false);
  };

  // Obtener icono por departamento
  const getIconoPorDepartamento = (departamento: string) => {
    switch (departamento) {
      case 'RRHH': return Users;
      case 'Contabilidad': return Calculator;
      case 'Servicio Técnico': return Wrench;
      case 'Inventario': return Package;
      case 'Facturación': return Receipt;
      default: return FileText;
    }
  };

  // Obtener icono por tipo de archivo
  const getIconoPorArchivo = (archivo: Archivo) => {
    if (archivo.es_editable) return Edit3;
    switch (archivo.extension.toLowerCase()) {
      case 'pdf': return FileText;
      case 'xlsx':
      case 'xls':
      case 'csv': return Calculator;
      case 'jpg':
      case 'jpeg':
      case 'png': return Eye;
      default: return File;
    }
  };

  // Abrir editor de Excel
  const abrirEditor = (archivo: Archivo) => {
    // console.log('Intentando abrir editor para:', archivo.nombre, 'Es editable:', archivo.es_editable);
    if (archivo.es_editable) {
      setArchivoEditando(archivo);
      // console.log('Archivo establecido para edición:', archivo);
      toast.success(`Abriendo ${archivo.nombre} en el editor`);
    } else {
      toast.error('Este archivo no es editable');
    }
  };

  // Cerrar editor
  const cerrarEditor = () => {
    setArchivoEditando(null);
  };

  // Guardar cambios del editor
  const guardarCambiosEditor = async (data: any) => {
    try {
      // Aquí se guardarían los cambios en Supabase
      // console.log('Guardando cambios:', data);
      
      // Actualizar versión del archivo
      if (archivoEditando) {
        const archivoActualizado = {
          ...archivoEditando,
          version: archivoEditando.version + 1,
          updated_at: new Date()
        };
        
        // Actualizar en la lista local
        setArchivosVisibles(prev => 
          prev.map(a => a.id === archivoEditando.id ? archivoActualizado : a)
        );
      }
      
      toast.success('Cambios guardados exitosamente');
    } catch (error) {
      toast.error('Error al guardar cambios');
    }
  };

  // Handlers para acciones rápidas
  const handleNuevaCarpeta = async () => {
    if (!nombreNuevaCarpeta.trim()) {
      toast.error('El nombre de la carpeta es requerido');
      return;
    }

    try {
      const nuevaCarpeta = {
        nombre: nombreNuevaCarpeta.trim(),
        descripcion: descripcionNuevaCarpeta.trim() || `Carpeta de ${departamentoNuevaCarpeta || 'documentos'}`,
        departamento: departamentoNuevaCarpeta || 'General',
        carpeta_padre_id: carpetaActual?.id || null,
        color: getColorPorDepartamento(departamentoNuevaCarpeta || 'General')
      };

      await crearCarpeta(nuevaCarpeta);
      
      // Limpiar formulario
      setNombreNuevaCarpeta('');
      setDescripcionNuevaCarpeta('');
      setDepartamentoNuevaCarpeta('');
      setMostrarNuevaCarpeta(false);
      
      // Recargar datos
      cargarDatos();
      
      toast.success(`Carpeta "${nombreNuevaCarpeta}" creada exitosamente`);
    } catch (error) {
      toast.error('Error al crear la carpeta');
    }
  };

  const handleSubirArchivosRapido = () => {
    if (!carpetaActual) {
      toast.error('Selecciona una carpeta primero');
      return;
    }
    setMostrarSubirArchivo(true);
  };

  const handleBusquedaAvanzada = async () => {
    try {
      const filtros: any = {};
      
      if (filtrosAvanzados.extension) {
        filtros.extension = filtrosAvanzados.extension;
      }
      if (filtrosAvanzados.tamaño_min) {
        filtros.tamaño_min = parseInt(filtrosAvanzados.tamaño_min);
      }
      if (filtrosAvanzados.tamaño_max) {
        filtros.tamaño_max = parseInt(filtrosAvanzados.tamaño_max);
      }
      if (filtrosAvanzados.fecha_desde) {
        filtros.fecha_desde = new Date(filtrosAvanzados.fecha_desde);
      }
      if (filtrosAvanzados.fecha_hasta) {
        filtros.fecha_hasta = new Date(filtrosAvanzados.fecha_hasta);
      }
      if (filtrosAvanzados.es_editable) {
        filtros.es_editable = filtrosAvanzados.es_editable === 'true';
      }

      // console.log('🔍 Aplicando filtros avanzados:', filtros);
      const resultados = await buscarArchivos(filtros);
      setArchivosVisibles(resultados);
      setMostrarBusquedaAvanzada(false);
      
      toast.success(`Se encontraron ${resultados.length} archivos`);
    } catch (error) {
      toast.error('Error en la búsqueda avanzada');
    }
  };

  const limpiarBusquedaAvanzada = () => {
    setFiltrosAvanzados({
      extension: '',
      tamaño_min: '',
      tamaño_max: '',
      fecha_desde: '',
      fecha_hasta: '',
      es_editable: ''
    });
    cargarDatos();
    setMostrarBusquedaAvanzada(false);
  };

  // Obtener color por departamento
  const getColorPorDepartamento = (departamento: string) => {
    switch (departamento) {
      case 'RRHH': return '#10B981';
      case 'Contabilidad': return '#8B5CF6';
      case 'Servicio Técnico': return '#F59E0B';
      case 'Inventario': return '#EF4444';
      case 'Facturación': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const estadisticas = obtenerEstadisticas();

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border mx-4 mt-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900">
                  <HardDrive className="w-8 h-8 text-blue-600" />
                  Sistema de Archivos ARES
                </h1>
                <p className="text-gray-600 mt-2">
                  Gestión centralizada de documentos empresariales
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setVistaActual(vistaActual === 'grid' ? 'list' : 'grid')}
                >
                  {vistaActual === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                </Button>
                
                {carpetaActual && (
                  <Button
                    onClick={() => setMostrarSubirArchivo(true)}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Archivo
                  </Button>
                )}
              </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-2xl font-bold text-blue-900">{estadisticas.total_carpetas}</div>
                <div className="text-blue-600 text-sm">Carpetas</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-2xl font-bold text-green-900">{estadisticas.total_archivos}</div>
                <div className="text-green-600 text-sm">Archivos</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="text-2xl font-bold text-purple-900">{estadisticas.archivos_editables}</div>
                <div className="text-purple-600 text-sm">Editables</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="text-2xl font-bold text-orange-900">{estadisticas.archivos_recientes}</div>
                <div className="text-orange-600 text-sm">Recientes</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-lg font-bold text-gray-900">{formatearTamaño(estadisticas.tamaño_total)}</div>
                <div className="text-gray-600 text-sm">Espacio Usado</div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Navegación de ruta */}
          <div className="flex items-center gap-2 mb-6 p-4 bg-white rounded-lg border">
            <Button
              variant="ghost"
              size="sm"
              onClick={navegarAlInicio}
              className="flex items-center gap-1"
            >
              <Home className="w-4 h-4" />
              Inicio
            </Button>
            
            {rutaActual.map((ruta, index) => (
              <React.Fragment key={index}>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700 font-medium">{ruta}</span>
              </React.Fragment>
            ))}
          </div>

          {/* Barra de búsqueda */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar archivos y carpetas..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Contenido principal */}
            <div className="lg:col-span-3">
              
              {/* Vista de carpetas y archivos */}
              {vistaActual === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  
                  {/* Carpetas */}
                  {carpetasVisibles.map((carpeta, index) => {
                    const IconoCarpeta = getIconoPorDepartamento(carpeta.departamento);
                    return (
                      <motion.div
                        key={carpeta.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card 
                          className="hover:shadow-lg transition-all cursor-pointer group"
                          onClick={() => navegarACarpeta(carpeta)}
                        >
                          <CardContent className="p-4 text-center">
                            <div 
                              className="w-16 h-16 mx-auto mb-3 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
                              style={{ backgroundColor: carpeta.color + '20' }}
                            >
                              <IconoCarpeta 
                                className="w-8 h-8" 
                                style={{ color: carpeta.color }} 
                              />
                            </div>
                            <h3 className="font-medium text-gray-900 mb-1 truncate">
                              {carpeta.nombre}
                            </h3>
                            <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                              {carpeta.descripcion}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {carpeta.total_archivos || 0} archivos
                            </Badge>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}

                  {/* Archivos */}
                  {archivosVisibles.map((archivo, index) => {
                    const IconoArchivo = getIconoPorArchivo(archivo);
                    return (
                      <motion.div
                        key={archivo.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (carpetasVisibles.length + index) * 0.05 }}
                      >
                        <Card className="hover:shadow-lg transition-all group">
                          <CardContent className="p-4 text-center">
                            <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                              <IconoArchivo className="w-8 h-8 text-gray-600" />
                            </div>
                            <h3 className="font-medium text-gray-900 mb-1 truncate text-sm">
                              {archivo.nombre}
                            </h3>
                            <p className="text-xs text-gray-500 mb-2">
                              {formatearTamaño(archivo.tamaño)}
                            </p>
                            <div className="flex gap-1 justify-center">
                              {archivo.es_editable && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                  Editable
                                </Badge>
                              )}
                              {archivo.version > 1 && (
                                <Badge variant="outline" className="text-xs">
                                  v{archivo.version}
                                </Badge>
                              )}
                            </div>
                            
                            {/* Acciones */}
                            <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => descargarArchivo(archivo)}
                                className="h-8 w-8 p-0"
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                              {archivo.es_editable && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    abrirEditor(archivo);
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => eliminarArchivo(archivo.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                // Vista de lista
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {/* Carpetas en lista */}
                      {carpetasVisibles.map((carpeta) => {
                        const IconoCarpeta = getIconoPorDepartamento(carpeta.departamento);
                        return (
                          <div
                            key={carpeta.id}
                            className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer"
                            onClick={() => navegarACarpeta(carpeta)}
                          >
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: carpeta.color + '20' }}
                            >
                              <IconoCarpeta 
                                className="w-5 h-5" 
                                style={{ color: carpeta.color }} 
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{carpeta.nombre}</h3>
                              <p className="text-sm text-gray-500">{carpeta.descripcion}</p>
                            </div>
                            <Badge variant="outline">
                              {carpeta.total_archivos || 0} archivos
                            </Badge>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        );
                      })}

                      {/* Archivos en lista */}
                      {archivosVisibles.map((archivo) => {
                        const IconoArchivo = getIconoPorArchivo(archivo);
                        return (
                          <div
                            key={archivo.id}
                            className="flex items-center gap-4 p-4 hover:bg-gray-50"
                          >
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <IconoArchivo className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{archivo.nombre}</h3>
                              <p className="text-sm text-gray-500">
                                {formatearTamaño(archivo.tamaño)} • {archivo.updated_at.toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {archivo.es_editable && (
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                  Editable
                                </Badge>
                              )}
                              {archivo.version > 1 && (
                                <Badge variant="outline">v{archivo.version}</Badge>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => descargarArchivo(archivo)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              {archivo.es_editable && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    abrirEditor(archivo);
                                  }}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => eliminarArchivo(archivo.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Estado vacío */}
              {carpetasVisibles.length === 0 && archivosVisibles.length === 0 && !loading && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FolderOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {busqueda ? 'No se encontraron resultados' : 'Carpeta vacía'}
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {busqueda 
                        ? 'Intenta con otros términos de búsqueda'
                        : 'Esta carpeta no contiene archivos ni subcarpetas'
                      }
                    </p>
                    {carpetaActual && !busqueda && (
                      <Button onClick={() => setMostrarSubirArchivo(true)}>
                        <Upload className="w-4 h-4 mr-2" />
                        Subir Primer Archivo
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Panel lateral */}
            <div className="space-y-6">
              
              {/* Actividad reciente */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Actividad Reciente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {actividad.slice(0, 5).map((act) => (
                      <div key={act.id} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{act.descripcion}</p>
                          <p className="text-xs text-gray-500">
                            {act.created_at.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {actividad.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No hay actividad reciente
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Acciones rápidas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setMostrarNuevaCarpeta(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Carpeta
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleSubirArchivosRapido}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Archivos
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setMostrarBusquedaAvanzada(true)}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Búsqueda Avanzada
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Modal de subir archivo */}
        {mostrarSubirArchivo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Subir Archivos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">
                      Arrastra archivos aquí o haz clic para seleccionar
                    </p>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
                    >
                      Seleccionar Archivos
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setMostrarSubirArchivo(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal de Nueva Carpeta */}
        {mostrarNuevaCarpeta && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  Nueva Carpeta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la carpeta *
                    </label>
                    <Input
                      placeholder="Ej: Documentos Legales"
                      value={nombreNuevaCarpeta}
                      onChange={(e) => setNombreNuevaCarpeta(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Departamento
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={departamentoNuevaCarpeta}
                      onChange={(e) => setDepartamentoNuevaCarpeta(e.target.value)}
                    >
                      <option value="">Seleccionar departamento</option>
                      <option value="RRHH">RRHH</option>
                      <option value="Contabilidad">Contabilidad</option>
                      <option value="Servicio Técnico">Servicio Técnico</option>
                      <option value="Inventario">Inventario</option>
                      <option value="Facturación">Facturación</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <Input
                      placeholder="Descripción opcional de la carpeta"
                      value={descripcionNuevaCarpeta}
                      onChange={(e) => setDescripcionNuevaCarpeta(e.target.value)}
                    />
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {carpetaActual ? (
                      <>Se creará dentro de: <strong>{carpetaActual.nombre}</strong></>
                    ) : (
                      <>Se creará en el directorio raíz</>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMostrarNuevaCarpeta(false);
                        setNombreNuevaCarpeta('');
                        setDescripcionNuevaCarpeta('');
                        setDepartamentoNuevaCarpeta('');
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleNuevaCarpeta}
                      disabled={!nombreNuevaCarpeta.trim()}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Crear Carpeta
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal de Búsqueda Avanzada */}
        {mostrarBusquedaAvanzada && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-lg mx-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-blue-600" />
                  Búsqueda Avanzada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Extensión
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filtrosAvanzados.extension}
                        onChange={(e) => setFiltrosAvanzados(prev => ({ ...prev, extension: e.target.value }))}
                      >
                        <option value="">Todas</option>
                        <option value="xlsx">Excel (.xlsx)</option>
                        <option value="csv">CSV (.csv)</option>
                        <option value="pdf">PDF (.pdf)</option>
                        <option value="jpg">Imagen (.jpg)</option>
                        <option value="png">Imagen (.png)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filtrosAvanzados.es_editable}
                        onChange={(e) => setFiltrosAvanzados(prev => ({ ...prev, es_editable: e.target.value }))}
                      >
                        <option value="">Todos</option>
                        <option value="true">Solo editables</option>
                        <option value="false">Solo lectura</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tamaño mínimo (KB)
                      </label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={filtrosAvanzados.tamaño_min}
                        onChange={(e) => setFiltrosAvanzados(prev => ({ ...prev, tamaño_min: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tamaño máximo (KB)
                      </label>
                      <Input
                        type="number"
                        placeholder="Sin límite"
                        value={filtrosAvanzados.tamaño_max}
                        onChange={(e) => setFiltrosAvanzados(prev => ({ ...prev, tamaño_max: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha desde
                      </label>
                      <Input
                        type="date"
                        value={filtrosAvanzados.fecha_desde}
                        onChange={(e) => setFiltrosAvanzados(prev => ({ ...prev, fecha_desde: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha hasta
                      </label>
                      <Input
                        type="date"
                        value={filtrosAvanzados.fecha_hasta}
                        onChange={(e) => setFiltrosAvanzados(prev => ({ ...prev, fecha_hasta: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={limpiarBusquedaAvanzada}
                      className="flex-1"
                    >
                      Limpiar
                    </Button>
                    <Button
                      onClick={handleBusquedaAvanzada}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Buscar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Editor de Excel */}
        {archivoEditando && (
          <ExcelEditor
            archivo={archivoEditando}
            onClose={cerrarEditor}
            onSave={guardarCambiosEditor}
          />
        )}
      </div>
    </DashboardLayout>
  );
}