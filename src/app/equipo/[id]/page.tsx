'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/store/useAppStore';
import { mantenimientoSchema, MantenimientoFormData } from '@/lib/schemas';
import { aiReporteService } from '@/lib/ai-service';
import { WordReporteService } from '@/lib/word-service';
import { 
  ArrowLeft, 
  Heart,
  Calendar,
  FileText,
  Plus,
  Upload,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Settings,
  Package,
  Brain,
  Download,
  Sparkles,
  Send,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

export default function EquipoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const equipoId = params.id as string;
  
  const { equipos, addMantenimiento, updateMantenimiento, deleteMantenimiento, updateComponente, getMantenimientosByEquipo } = useAppStore();
  const [showNewMantenimiento, setShowNewMantenimiento] = useState(false);
  const [selectedComponenteId, setSelectedComponenteId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para el sistema de reportes con IA
  const [showReporteModal, setShowReporteModal] = useState(false);
  const [selectedMantenimiento, setSelectedMantenimiento] = useState<any>(null);
  const [textoInformal, setTextoInformal] = useState('');
  const [precioServicio, setPrecioServicio] = useState('');
  const [reporteGenerado, setReporteGenerado] = useState('');
  const [generandoReporte, setGenerandoReporte] = useState(false);
  const [reporteListo, setReporteListo] = useState(false);

  // Estados para eliminación de mantenimientos
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mantenimientoToDelete, setMantenimientoToDelete] = useState<any>(null);

  const equipo = equipos.find(e => e.id === equipoId);
  const mantenimientos = getMantenimientosByEquipo(equipoId);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MantenimientoFormData>({
    resolver: zodResolver(mantenimientoSchema),
    defaultValues: {
      estado: 'Pendiente',
    },
  });

  if (!equipo) {
    return (
      <DashboardLayout title="Equipo no encontrado">
        <div className="text-center py-12">
          <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Equipo no encontrado</h2>
          <p className="text-gray-600 mb-4">El equipo que buscas no existe o ha sido eliminado.</p>
          <Button onClick={() => router.push('/equipos')}>
            Volver a Equipos
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      toast.success(`Archivo seleccionado: ${file.name}`);
    }
  };

  const onSubmitMantenimiento = async (data: MantenimientoFormData) => {
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mantenimientoData = {
        ...data,
        equipoId,
        fecha: new Date().toISOString().split('T')[0],
        componenteId: selectedComponenteId || undefined,
        archivo: selectedFile ? {
          nombre: selectedFile.name,
          tamaño: selectedFile.size,
          tipo: selectedFile.type,
        } : undefined,
      };
      
      addMantenimiento(mantenimientoData);
      
      toast.success('Mantenimiento registrado correctamente');
      setShowNewMantenimiento(false);
      setSelectedComponenteId('');
      reset();
      setSelectedFile(null);
    } catch (error) {
      toast.error('Error al registrar el mantenimiento');
    } finally {
      setIsLoading(false);
    }
  };

  const updateEstadoMantenimiento = (mantenimientoId: string, nuevoEstado: 'Pendiente' | 'En proceso' | 'Finalizado') => {
    updateMantenimiento(mantenimientoId, { estado: nuevoEstado });
    toast.success(`Estado actualizado a: ${nuevoEstado}`);
  };

  const updateEstadoComponente = (componenteId: string, nuevoEstado: 'Operativo' | 'En reparacion' | 'Fuera de servicio') => {
    updateComponente(equipoId, componenteId, { estado: nuevoEstado });
    toast.success(`Estado del componente actualizado`);
    
    // Si el componente se pone "En reparación", abrir automáticamente el modal de reclamo
    if (nuevoEstado === 'En reparacion') {
      setSelectedComponenteId(componenteId);
      setShowNewMantenimiento(true);
      // Pequeño delay para que el toast se vea antes del modal
      setTimeout(() => {
        toast.info('Documenta el problema encontrado en este componente');
      }, 1000);
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'Pendiente':
        return <AlertTriangle className="h-4 w-4" />;
      case 'En proceso':
        return <Clock className="h-4 w-4" />;
      case 'Finalizado':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Pendiente':
        return 'destructive';
      case 'En proceso':
        return 'secondary';
      case 'Finalizado':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getComponenteEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Operativo':
        return 'default';
      case 'En reparacion':
        return 'secondary';
      case 'Fuera de servicio':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Funciones para el sistema de reportes con IA
  const abrirReporteModal = (mantenimiento: any) => {
    setSelectedMantenimiento(mantenimiento);
    
    // Si ya tiene reporte generado, abrir en modo visualización
    if (mantenimiento.reporteGenerado) {
      setReporteGenerado('Reporte técnico disponible para descarga');
      setReporteListo(true);
      setTextoInformal('');
      setPrecioServicio('');
    } else {
      // Si no tiene reporte, abrir en modo creación
      setReporteGenerado('');
      setReporteListo(false);
      setTextoInformal('');
      setPrecioServicio('');
    }
    
    setShowReporteModal(true);
  };

  const cerrarReporteModal = () => {
    setShowReporteModal(false);
    setSelectedMantenimiento(null);
    setTextoInformal('');
    setPrecioServicio('');
    setReporteGenerado('');
    setReporteListo(false);
  };

  const eliminarReporte = async () => {
    setReporteGenerado('');
    setReporteListo(false);
    
    // Marcar el mantenimiento como que NO tiene reporte generado
    if (selectedMantenimiento) {
      await updateMantenimiento(selectedMantenimiento.id, { reporteGenerado: false });
    }
    
    toast.success('Reporte eliminado. Puedes generar uno nuevo.');
  };

  const abrirModalEliminarMantenimiento = (mantenimiento: any) => {
    setMantenimientoToDelete(mantenimiento);
    setShowDeleteModal(true);
  };

  const cerrarModalEliminarMantenimiento = () => {
    setMantenimientoToDelete(null);
    setShowDeleteModal(false);
  };

  const confirmarEliminarMantenimiento = async () => {
    if (!mantenimientoToDelete) return;

    try {
      await deleteMantenimiento(mantenimientoToDelete.id);
      toast.success('Mantenimiento eliminado correctamente');
      setShowDeleteModal(false);
      setMantenimientoToDelete(null);
    } catch (error) {
      toast.error('Error al eliminar el mantenimiento');
    }
  };

  const generarReporteConIA = async () => {
    if (!textoInformal.trim()) {
      toast.error('Por favor, describe lo que hiciste en el mantenimiento');
      return;
    }

    if (!precioServicio.trim()) {
      toast.error('Por favor, ingresa el precio del servicio');
      return;
    }

    setGenerandoReporte(true);
    
    try {
      const componente = selectedMantenimiento.componenteId 
        ? equipo.componentes.find(c => c.id === selectedMantenimiento.componenteId)
        : undefined;

      // Usar el servicio de IA profesional
      const reporteGenerado = await aiReporteService.generarReporte({
        equipo: {
          cliente: equipo.cliente,
          ubicacion: equipo.ubicacion,
          marca: equipo.marca,
          modelo: equipo.modelo,
          nombreEquipo: equipo.nombreEquipo,
          numeroSerieBase: equipo.numeroSerieBase,
          tipoEquipo: equipo.tipoEquipo,
          fechaEntrega: equipo.fechaEntrega,
        },
        mantenimiento: {
          fecha: selectedMantenimiento.fecha,
          descripcion: selectedMantenimiento.descripcion,
          estado: selectedMantenimiento.estado,
          comentarios: selectedMantenimiento.comentarios,
        },
        componente: componente ? {
          nombre: componente.nombre,
          numeroSerie: componente.numeroSerie,
          estado: componente.estado,
        } : undefined,
        textoInformal: textoInformal,
        precioServicio: precioServicio
      });

      setReporteGenerado(reporteGenerado);
      setReporteListo(true);
      
      // Marcar el mantenimiento como que ya tiene reporte generado
      await updateMantenimiento(selectedMantenimiento.id, { reporteGenerado: true });
      
      toast.success('¡Reporte generado exitosamente con IA!', {
        description: 'El reporte profesional está listo para descargar'
      });
    } catch (error) {
      console.error('Error al generar reporte:', error);
      toast.error('Error al generar el reporte', {
        description: 'Por favor, intenta nuevamente'
      });
    } finally {
      setGenerandoReporte(false);
    }
  };

  const descargarReporteWord = async () => {
    try {
      toast.info('Generando documento Word profesional...');
      
      const fechaHoy = new Date().toISOString().split('T')[0];
      const nombreArchivo = `Reporte_${equipo.cliente.replace(/\s+/g, '_')}_${fechaHoy}.docx`;
      
      const componente = selectedMantenimiento?.componenteId 
        ? equipo.componentes.find(c => c.id === selectedMantenimiento.componenteId)
        : undefined;

      // Obtener el contenido del trabajo realizado y otros datos del reporte de IA
      let trabajoRealizado = '';
      let precioServicio = '350000'; // Precio por defecto

      // Si tenemos el reporte generado y no es placeholder, usar ese contenido
      if (reporteGenerado && reporteGenerado !== 'Reporte técnico disponible para descarga') {
        console.log('Reporte de IA completo:', reporteGenerado);
        
        // Buscar el párrafo del trabajo realizado que genera la IA
        // La IA genera un párrafo largo con el trabajo técnico profesional
        const lines = reporteGenerado.split('\n').filter(line => line.trim() !== '');
        
        // Buscar específicamente la sección "Trabajo Realizado:" y extraer el párrafo
        let trabajoStartIndex = -1;
        let trabajoEndIndex = -1;
        
        // Encontrar el índice donde empieza "Trabajo Realizado:"
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes('trabajo realizado:')) {
            trabajoStartIndex = i + 1; // Línea siguiente al encabezado
            break;
          }
        }
        
        // Si encontramos el inicio, buscar el final (antes de COSTO)
        if (trabajoStartIndex !== -1) {
          for (let i = trabajoStartIndex; i < lines.length; i++) {
            const line = lines[i].toLowerCase();
            if (line.includes('costo del servicio:') || 
                line.includes('precio:') ||
                line.includes('ing.') ||
                line.includes('_____')) {
              trabajoEndIndex = i;
              break;
            }
          }
          
          // Si no encontramos final específico, usar todo hasta el final
          if (trabajoEndIndex === -1) {
            trabajoEndIndex = lines.length;
          }
          
          // Extraer todas las líneas del trabajo realizado
          const trabajoLines = lines.slice(trabajoStartIndex, trabajoEndIndex)
            .filter(line => line.trim() !== '') // Filtrar líneas vacías
            .map(line => line.trim());
          
          if (trabajoLines.length > 0) {
            trabajoRealizado = trabajoLines.join(' ').trim().replace(/\s+/g, ' ');
            console.log('Trabajo extraído:', trabajoRealizado);
          }
        }
        
        // Extraer precio del reporte de IA
        const precioLine = lines.find(line => 
          line.toLowerCase().includes('precio:') || 
          line.toLowerCase().includes('costo:')
        );
        
        if (precioLine) {
          const precioMatch = precioLine.match(/(\d{1,3}(?:\.\d{3})*)/);
          if (precioMatch) {
            precioServicio = precioMatch[1].replace(/\./g, '');
          }
        }
      } else {
        // Si no tenemos contenido del reporte de IA, generar uno nuevo primero
        try {
          toast.info('Generando contenido del reporte...');
          
                     const reporteIA = await aiReporteService.generarReporte({
             equipo: {
               cliente: equipo.cliente,
               ubicacion: equipo.ubicacion,
               marca: equipo.marca,
               modelo: equipo.modelo,
               nombreEquipo: equipo.nombreEquipo,
               numeroSerieBase: equipo.numeroSerieBase,
               tipoEquipo: equipo.tipoEquipo,
               fechaEntrega: equipo.fechaEntrega,
             },
             mantenimiento: {
               fecha: selectedMantenimiento?.fecha || fechaHoy,
               descripcion: selectedMantenimiento?.descripcion || '',
               estado: selectedMantenimiento?.estado || 'Finalizado',
               comentarios: selectedMantenimiento?.comentarios || '',
             },
             componente: componente ? {
               nombre: componente.nombre,
               numeroSerie: componente.numeroSerie,
               estado: componente.estado,
             } : undefined,
             textoInformal: `Llegué al cliente ${equipo.cliente} para revisar el equipo ${equipo.nombreEquipo} ${equipo.marca} ${equipo.modelo}. El problema reportado era: ${selectedMantenimiento?.descripcion}. Realicé la inspección completa del equipo, identifiqué la falla, procedí con la reparación necesaria y verifiqué que todo funcionara correctamente.`,
             precioServicio: '350000'
           });
           
           console.log('Reporte generado automáticamente:', reporteIA);
           
                       // Usar el mismo parsing mejorado para extraer el trabajo realizado
            const lines = reporteIA.split('\n').filter(line => line.trim() !== '');
            let trabajoStartIndex = -1;
            let trabajoEndIndex = -1;
            
            // Encontrar el índice donde empieza "Trabajo Realizado:"
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].toLowerCase().includes('trabajo realizado:')) {
                trabajoStartIndex = i + 1; // Línea siguiente al encabezado
                break;
              }
            }
            
            // Si encontramos el inicio, buscar el final (antes de COSTO)
            if (trabajoStartIndex !== -1) {
              for (let i = trabajoStartIndex; i < lines.length; i++) {
                const line = lines[i].toLowerCase();
                if (line.includes('costo del servicio:') || 
                    line.includes('precio:') ||
                    line.includes('ing.') ||
                    line.includes('_____')) {
                  trabajoEndIndex = i;
                  break;
                }
              }
              
              // Si no encontramos final específico, usar todo hasta el final
              if (trabajoEndIndex === -1) {
                trabajoEndIndex = lines.length;
              }
              
              // Extraer todas las líneas del trabajo realizado
              const trabajoLines = lines.slice(trabajoStartIndex, trabajoEndIndex)
                .filter(line => line.trim() !== '') // Filtrar líneas vacías
                .map(line => line.trim());
              
              if (trabajoLines.length > 0) {
                trabajoRealizado = trabajoLines.join(' ').trim().replace(/\s+/g, ' ');
                console.log('Trabajo extraído del reporte automático:', trabajoRealizado);
              }
            }
          
        } catch (error) {
          console.error('Error al generar reporte de IA:', error);
          trabajoRealizado = `Se realizó el servicio técnico del equipo ${equipo.nombreEquipo} por el problema reportado: ${selectedMantenimiento?.descripcion}. Se verificó el funcionamiento del equipo y se solucionó la falla encontrada. El equipo quedó operativo y funcionando correctamente según los parámetros establecidos por el fabricante.`;
        }
      }

      // Si no se extrajo trabajo realizado, usar descripción por defecto
      if (!trabajoRealizado || trabajoRealizado.length < 50) {
        trabajoRealizado = `Se realizó el servicio técnico del equipo ${equipo.nombreEquipo} modelo ${equipo.modelo} de la marca ${equipo.marca}. Se atendió el problema reportado: "${selectedMantenimiento?.descripcion}". Se realizaron las verificaciones correspondientes, se identificó la causa de la falla y se procedió con la reparación necesaria. Se realizaron pruebas de funcionamiento y calibración. El equipo quedó operativo y funcionando correctamente según los parámetros establecidos por el fabricante. El cliente quedó conforme con el servicio realizado.`;
      }

      // Formatear el precio para mostrar con puntos
      const precioFormateado = parseInt(precioServicio).toLocaleString('es-PY');

      // Generar datos para el documento Word usando datos reales
      const reporteData = {
        fecha: selectedMantenimiento?.fecha || fechaHoy,
        cliente: equipo.cliente,
        numeroReporte: WordReporteService.generarNumeroReporte(equipo.nombreEquipo, selectedMantenimiento?.fecha || fechaHoy),
        descripcionProblema: selectedMantenimiento?.descripcion || 'Mantenimiento preventivo',
        formularioAsistencia: WordReporteService.generarNumeroFormulario(),
        trabajoRealizado: trabajoRealizado,
        costo: precioFormateado,
        ingeniero: 'Ing. Javier López'
      };

      // Generar el documento Word
      const blob = await WordReporteService.generarDocumentoWord(reporteData);
      
      // Descargar el archivo
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivo;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Documento Word descargado exitosamente', {
        description: `Archivo: ${nombreArchivo}`
      });
      
    } catch (error) {
      console.error('Error al generar documento Word:', error);
      toast.error('Error al generar el documento Word', {
        description: 'Por favor, intenta nuevamente'
      });
    }
  };

  return (
    <DashboardLayout 
      title={equipo.nombreEquipo}
      subtitle={`${equipo.marca} ${equipo.modelo} - ${equipo.cliente}`}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver</span>
          </Button>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-green-700 border-green-200">
              {equipo.componentes.filter(c => c.estado === 'Operativo').length}/{equipo.componentes.length} Operativo
            </Badge>
            <Badge variant="secondary">
              {mantenimientos.length} mantenimiento{mantenimientos.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información del Equipo */}
          <div className="lg:col-span-2 space-y-6">
            {/* Detalles Básicos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Heart className="h-5 w-5 text-red-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Información del Equipo</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Cliente</Label>
                    <p className="text-gray-900 font-medium">{equipo.cliente}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Ubicación</Label>
                    <div className="flex items-center text-gray-900">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                      {equipo.ubicacion}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Nombre del Equipo</Label>
                    <p className="text-gray-900 font-medium">{equipo.nombreEquipo}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Tipo de Equipo</Label>
                    <p className="text-gray-900">{equipo.tipoEquipo}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Marca</Label>
                    <p className="text-gray-900">{equipo.marca}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Modelo</Label>
                    <p className="text-gray-900">{equipo.modelo}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Número de Serie Base</Label>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">{equipo.numeroSerieBase}</code>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Fecha de Entrega</Label>
                    <p className="text-gray-900">{new Date(equipo.fechaEntrega).toLocaleDateString('es-ES')}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-500">Accesorios</Label>
                    <p className="text-gray-900">{equipo.accesorios}</p>
                  </div>
                  {equipo.observaciones && (
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-gray-500">Observaciones</Label>
                      <p className="text-gray-900">{equipo.observaciones}</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Componentes del Equipo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Package className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Componentes del Equipo</h3>
                </div>

                <div className="space-y-3">
                  {equipo.componentes.map((componente, index) => (
                    <motion.div
                      key={componente.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900">{componente.nombre}</h4>
                            <Badge variant={getComponenteEstadoColor(componente.estado) as any}>
                              {componente.estado}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Serie:</span> {componente.numeroSerie}
                          </p>
                          {componente.observaciones && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Observaciones:</span> {componente.observaciones}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Select
                            value={componente.estado}
                            onValueChange={(value) => updateEstadoComponente(componente.id, value as any)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Operativo">Operativo</SelectItem>
                              <SelectItem value="En reparacion">En reparación</SelectItem>
                              <SelectItem value="Fuera de servicio">Fuera de servicio</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Historial de Mantenimientos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Wrench className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Historial de Mantenimientos</h3>
                  </div>
                  <Button
                    onClick={() => setShowNewMantenimiento(true)}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Nuevo Reclamo</span>
                  </Button>
                </div>

                <div className="space-y-4">
                  {mantenimientos.length === 0 ? (
                    <div className="text-center py-8">
                      <Wrench className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Sin mantenimientos registrados</h4>
                      <p className="text-gray-500">Este equipo no tiene mantenimientos previos</p>
                    </div>
                  ) : (
                    mantenimientos
                      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                      .map((mantenimiento, index) => {
                        const componente = mantenimiento.componenteId 
                          ? equipo.componentes.find(c => c.id === mantenimiento.componenteId)
                          : null;
                        
                        return (
                          <motion.div
                            key={mantenimiento.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Badge variant={getEstadoColor(mantenimiento.estado) as any}>
                                    {getEstadoIcon(mantenimiento.estado)}
                                    <span className="ml-1">{mantenimiento.estado}</span>
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    {new Date(mantenimiento.fecha).toLocaleDateString('es-ES')}
                                  </span>
                                  {componente && (
                                    <Badge variant="outline" className="text-blue-700">
                                      {componente.nombre}
                                    </Badge>
                                  )}
                                </div>
                                
                                <p className="text-gray-900 mb-2">{mantenimiento.descripcion}</p>
                                
                                {mantenimiento.comentarios && (
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                    <Label className="text-sm font-medium text-gray-500">Comentarios del Ingeniero</Label>
                                    <p className="text-sm text-gray-700">{mantenimiento.comentarios}</p>
                                  </div>
                                )}
                                
                                {mantenimiento.archivo && (
                                  <div className="mt-2 flex items-center space-x-2 text-sm text-blue-600">
                                    <FileText className="h-4 w-4" />
                                    <span>{mantenimiento.archivo.nombre}</span>
                                    <span className="text-gray-500">
                                      ({(mantenimiento.archivo.tamaño / 1024).toFixed(1)} KB)
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {mantenimiento.estado !== 'Finalizado' && (
                                  <Select
                                    value={mantenimiento.estado}
                                    onValueChange={(value) => updateEstadoMantenimiento(mantenimiento.id, value as any)}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                                      <SelectItem value="En proceso">En proceso</SelectItem>
                                      <SelectItem value="Finalizado">Finalizado</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                                
                                {/* Botón para generar/ver reporte */}
                                {mantenimiento.estado === 'Finalizado' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => abrirReporteModal(mantenimiento)}
                                    className="flex items-center space-x-1 text-gray-700 border-gray-300 hover:bg-gray-50"
                                  >
                                    <Brain className="h-4 w-4" />
                                    <span>{mantenimiento.reporteGenerado ? 'Ver Reporte' : 'Generar Reporte'}</span>
                                  </Button>
                                )}

                                {/* Botón para eliminar mantenimiento */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => abrirModalEliminarMantenimiento(mantenimiento)}
                                  className="flex items-center space-x-1 text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  <span>Eliminar</span>
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                  )}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar con Estadísticas */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Componentes</span>
                    <Badge variant="outline">{equipo.componentes.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Operativos</span>
                    <Badge variant="default">
                      {equipo.componentes.filter(c => c.estado === 'Operativo').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">En Reparación</span>
                    <Badge variant="secondary">
                      {equipo.componentes.filter(c => c.estado === 'En reparacion').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Fuera de Servicio</span>
                    <Badge variant="destructive">
                      {equipo.componentes.filter(c => c.estado === 'Fuera de servicio').length}
                    </Badge>
                  </div>
                  <hr />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Mantenimientos</span>
                    <Badge variant="outline">{mantenimientos.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pendientes</span>
                    <Badge variant="destructive">
                      {mantenimientos.filter(m => m.estado === 'Pendiente').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">En Proceso</span>
                    <Badge variant="secondary">
                      {mantenimientos.filter(m => m.estado === 'En proceso').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Finalizados</span>
                    <Badge variant="default">
                      {mantenimientos.filter(m => m.estado === 'Finalizado').length}
                    </Badge>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Información Adicional</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-600">Registrado:</span>
                    <p className="font-medium">{new Date(equipo.createdAt).toLocaleDateString('es-ES')}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Último mantenimiento:</span>
                    <p className="font-medium">
                      {mantenimientos.length > 0 
                        ? new Date(mantenimientos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0].fecha).toLocaleDateString('es-ES')
                        : 'Sin mantenimientos'
                      }
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Modal para Generar/Ver Reporte con IA */}
        <AnimatePresence>
          {showReporteModal && selectedMantenimiento && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={cerrarReporteModal}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className={`bg-white rounded-lg p-6 max-h-[90vh] overflow-y-auto ${
                  selectedMantenimiento.reporteGenerado && !reporteListo ? 'w-full max-w-2xl' : 'w-full max-w-4xl'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <Brain className="h-6 w-6 text-gray-700" />
                    <h3 className="text-xl font-semibold text-gray-900">
                      {selectedMantenimiento.reporteGenerado ? 'Ver Reporte Técnico' : 'Generar Reporte Técnico'}
                    </h3>
                  </div>
                  <Button variant="outline" onClick={cerrarReporteModal}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>

                {selectedMantenimiento.reporteGenerado ? (
                  // Modal simplificado para ver reporte existente
                  <div className="space-y-6">
                    {/* Información del mantenimiento */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-3">Información del Mantenimiento</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Cliente:</span>
                          <p className="font-medium">{equipo.cliente}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Equipo:</span>
                          <p className="font-medium">{equipo.marca} {equipo.modelo}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Fecha:</span>
                          <p className="font-medium">{new Date(selectedMantenimiento.fecha).toLocaleDateString('es-ES')}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Estado:</span>
                          <Badge variant={getEstadoColor(selectedMantenimiento.estado) as any}>
                            {selectedMantenimiento.estado}
                          </Badge>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-600">Problema:</span>
                          <p className="font-medium">{selectedMantenimiento.descripcion}</p>
                        </div>
                      </div>
                    </div>

                    {/* Estado del reporte */}
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Reporte técnico generado</span>
                      </div>
                      <p className="text-sm text-green-700">
                        El reporte profesional está disponible para descarga. Fue generado automáticamente con IA 
                        siguiendo el formato estándar de Ares Paraguay.
                      </p>
                    </div>

                    {/* Vista previa del reporte */}
                    <div className="bg-gray-50 border rounded-lg p-8 text-center">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-3" />
                      <h4 className="font-medium text-gray-900 mb-1">Reporte Técnico Profesional</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Documento generado con formato corporativo de Ares Paraguay
                      </p>
                      <p className="text-xs text-gray-500">
                        Incluye información del cliente, trabajo realizado, costos y firma del ingeniero
                      </p>
                    </div>

                    {/* Acciones principales */}
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        onClick={async () => {
                          try {
                            toast.info('Cargando contenido del reporte...');
                            
                            const componente = selectedMantenimiento.componenteId 
                              ? equipo.componentes.find(c => c.id === selectedMantenimiento.componenteId)
                              : undefined;

                            const contenidoReporte = await aiReporteService.generarReporte({
                              equipo: {
                                cliente: equipo.cliente,
                                ubicacion: equipo.ubicacion,
                                marca: equipo.marca,
                                modelo: equipo.modelo,
                                nombreEquipo: equipo.nombreEquipo,
                                numeroSerieBase: equipo.numeroSerieBase,
                                tipoEquipo: equipo.tipoEquipo,
                                fechaEntrega: equipo.fechaEntrega,
                              },
                              mantenimiento: {
                                fecha: selectedMantenimiento.fecha,
                                descripcion: selectedMantenimiento.descripcion,
                                estado: selectedMantenimiento.estado,
                                comentarios: selectedMantenimiento.comentarios,
                              },
                              componente: componente ? {
                                nombre: componente.nombre,
                                numeroSerie: componente.numeroSerie,
                                estado: componente.estado,
                              } : undefined,
                              textoInformal: selectedMantenimiento.comentarios || 'Servicio técnico realizado según procedimientos estándar de Ares Paraguay.',
                              precioServicio: '350000'
                            });
                            
                            setReporteGenerado(contenidoReporte);
                            setReporteListo(true);
                            
                            toast.success('Reporte cargado para visualización', {
                              description: 'Ahora puedes ver el contenido completo del reporte'
                            });
                          } catch (error) {
                            toast.error('Error al cargar el reporte');
                          }
                        }}
                        variant="outline"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        <span>Ver Contenido</span>
                      </Button>
                      <Button
                        onClick={eliminarReporte}
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Eliminar</span>
                      </Button>
                      <Button
                        onClick={descargarReporteWord}
                        className="bg-gray-900 hover:bg-gray-800"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        <span>Descargar Word</span>
                      </Button>
                    </div>

                    {/* Vista del reporte cuando se presiona "Ver Contenido" */}
                    {reporteListo && reporteGenerado !== 'Reporte técnico disponible para descarga' && (
                      <div className="pt-4 border-t border-gray-200">
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <h4 className="font-medium text-gray-900 mb-3">Contenido del Reporte</h4>
                          <div className="bg-white border rounded-lg p-4 max-h-96 overflow-y-auto">
                            <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                              {reporteGenerado}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Opción para regenerar */}
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-3">
                        ¿Necesitas generar un nuevo reporte con información diferente?
                      </p>
                      <Button
                        onClick={() => {
                          setReporteGenerado('');
                          setReporteListo(false);
                          cerrarReporteModal();
                          // Reabrir en modo creación
                          setTimeout(() => abrirReporteModal({...selectedMantenimiento, reporteGenerado: false}), 100);
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Generar Nuevo Reporte</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Modal completo para crear nuevo reporte
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Panel izquierdo - Input del ingeniero */}
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">Información del Mantenimiento</h4>
                        <div className="text-sm text-gray-700 space-y-1">
                          <p><span className="font-medium">Fecha:</span> {selectedMantenimiento?.fecha}</p>
                          <p><span className="font-medium">Estado:</span> {selectedMantenimiento?.estado}</p>
                          <p><span className="font-medium">Problema:</span> {selectedMantenimiento?.descripcion}</p>
                          <p><span className="font-medium">Equipo:</span> {equipo.marca} {equipo.modelo}</p>
                          <p><span className="font-medium">Cliente:</span> {equipo.cliente}</p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-base font-medium text-gray-900 mb-2 block">
                          Descripción del Trabajo Realizado
                        </Label>
                        <p className="text-sm text-gray-600 mb-3">
                          Describe informalmente lo que hiciste. El sistema generará un reporte técnico profesional.
                        </p>
                        <Textarea
                          value={textoInformal}
                          onChange={(e) => setTextoInformal(e.target.value)}
                          placeholder={`Ej: Llegue a ${equipo.cliente} y revise el ${equipo.marca} ${equipo.modelo}. El problema era que ${selectedMantenimiento?.descripcion?.toLowerCase()}. Revise todo y estaba medio dañado el cable principal. Lo cambie por uno nuevo y despues probe que todo funcione bien. Calibre los parametros y quedo operativo. El cliente quedo conforme con el trabajo.`}
                          rows={8}
                          className="w-full text-sm"
                        />
                      </div>

                      <div>
                        <Label className="text-base font-medium text-gray-900 mb-2 block">
                          Precio del Servicio (Guaraníes)
                        </Label>
                        <p className="text-sm text-gray-600 mb-3">
                          Ingresa el costo del servicio realizado (solo números).
                        </p>
                        <input
                          type="text"
                          value={precioServicio}
                          onChange={(e) => {
                            // Solo permitir números
                            const valor = e.target.value.replace(/[^\d]/g, '');
                            setPrecioServicio(valor);
                          }}
                          placeholder="Ej: 350000"
                          className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        {precioServicio && (
                          <p className="text-xs text-gray-500 mt-1">
                            Precio formateado: {parseInt(precioServicio).toLocaleString('es-PY')} Gs.
                          </p>
                        )}
                      </div>

                      <div className="flex space-x-3">
                        <Button
                          onClick={generarReporteConIA}
                          disabled={generandoReporte || !textoInformal.trim() || !precioServicio.trim()}
                          className="flex-1 bg-gray-900 hover:bg-gray-800"
                        >
                          {generandoReporte ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                              <span>Generando reporte...</span>
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              <span>Generar Reporte</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Panel derecho - Reporte generado */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium text-gray-900 mb-2 block">
                          Reporte Técnico Generado
                        </Label>
                        
                        {reporteListo ? (
                          // Estado: Reporte recién generado
                          <div className="space-y-3">
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-gray-600" />
                                <span className="text-sm font-medium text-gray-800">Reporte generado exitosamente</span>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 border rounded-lg p-4 max-h-96 overflow-y-auto">
                              <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                                {reporteGenerado}
                              </pre>
                            </div>

                            <div className="flex space-x-3">
                              <Button
                                onClick={eliminarReporte}
                                variant="outline"
                                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span>Eliminar</span>
                              </Button>
                              <Button
                                onClick={descargarReporteWord}
                                className="flex-1 bg-gray-900 hover:bg-gray-800"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                <span>Descargar Word</span>
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // Estado: Sin reporte, esperando generación
                          <div className="bg-gray-50 border rounded-lg p-8 text-center text-gray-500">
                            {generandoReporte ? (
                              <div className="space-y-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-400 border-t-transparent mx-auto" />
                                <p className="text-sm">Procesando texto...</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <Brain className="h-12 w-12 text-gray-400 mx-auto" />
                                <p className="text-sm">Completa los campos y genera el reporte</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de Confirmación para Eliminar Mantenimiento */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={cerrarModalEliminarMantenimiento}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-lg p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Eliminar Mantenimiento</h3>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-3">
                    ¿Estás seguro de que deseas eliminar este mantenimiento? Esta acción no se puede deshacer.
                  </p>
                  {mantenimientoToDelete && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Fecha: {new Date(mantenimientoToDelete.fecha).toLocaleDateString('es-ES')}
                      </p>
                      <p className="text-sm text-gray-700">
                        {mantenimientoToDelete.descripcion}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={cerrarModalEliminarMantenimiento}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={confirmarEliminarMantenimiento}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Eliminar
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal para Nuevo Mantenimiento */}
        <AnimatePresence>
          {showNewMantenimiento && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowNewMantenimiento(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-lg p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Nuevo Reclamo de Mantenimiento</h3>
                
                <form onSubmit={handleSubmit(onSubmitMantenimiento)} className="space-y-4">
                  <div>
                    <Label htmlFor="componenteId">Componente Específico (opcional)</Label>
                    <Select 
                      value={selectedComponenteId || 'general'} 
                      onValueChange={(value) => setSelectedComponenteId(value === 'general' ? '' : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar componente..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">Mantenimiento general del equipo</SelectItem>
                        {equipo.componentes.map((componente) => (
                          <SelectItem key={componente.id} value={componente.id}>
                            {componente.nombre} - {componente.numeroSerie}
                            {componente.estado === 'En reparacion' && (
                              <span className="ml-2 text-xs text-red-600 font-medium">🔧 EN REPARACIÓN</span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedComponenteId && (
                      <p className="text-xs text-blue-600 mt-1">
                        ✓ Componente seleccionado automáticamente por cambio de estado
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="descripcion">Descripción del Problema *</Label>
                    <Textarea
                      id="descripcion"
                      placeholder="Describe el problema o falla que presenta el equipo..."
                      {...register('descripcion')}
                      rows={4}
                    />
                    {errors.descripcion && (
                      <p className="text-sm text-red-600 mt-1">{errors.descripcion.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="estado">Estado Inicial</Label>
                    <Select onValueChange={(value) => setValue('estado', value as any)} defaultValue="Pendiente">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                        <SelectItem value="En proceso">En proceso</SelectItem>
                        <SelectItem value="Finalizado">Finalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="comentarios">Comentarios del Ingeniero</Label>
                    <Textarea
                      id="comentarios"
                      placeholder="Observaciones adicionales del técnico..."
                      {...register('comentarios')}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Archivo Adjunto (opcional)</Label>
                    <div className="mt-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center space-x-2"
                      >
                        <Upload className="h-4 w-4" />
                        <span>
                          {selectedFile ? selectedFile.name : 'Seleccionar archivo'}
                        </span>
                      </Button>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewMantenimiento(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
} 