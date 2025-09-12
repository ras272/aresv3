'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
// import { usePermissions } from '@/components/PermissionGuard';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { mantenimientoSchema, MantenimientoFormData } from '@/lib/schemas';
import { aiReporteService } from '@/lib/ai-service';
import { WordReporteService } from '@/lib/word-service';
import { RepuestosSimpleSelector } from '@/components/reportes/RepuestosSimpleSelector';
import { EquipoRecommendations } from '@/components/equipos/EquipoRecommendations';
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
  Eye,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  History,
  Zap,
  Shield,
  DollarSign,
  Timer,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

export default function EquipoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const equipoId = params.id as string;
  
  const { equipos, addMantenimiento, updateMantenimiento, deleteMantenimiento, updateComponente, getMantenimientosByEquipo, updateStockItem } = useAppStore();
  const { user } = useAuth();
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

  // 🔧 Estado para repuestos utilizados (NUEVO - Sistema simple)
  const [repuestosUtilizados, setRepuestosUtilizados] = useState<any[]>([]);

  // 🔧 Estado para trackear cambio automático a reparación
  const [componenteEnReparacionTemporal, setComponenteEnReparacionTemporal] = useState<string | null>(null);
  const [estadoTemporalSeleccionado, setEstadoTemporalSeleccionado] = useState<'En reparacion' | 'Fuera de servicio' | null>(null);

  // 🔧 Función para devolver repuestos al stock cuando se elimina un reporte
  const devolverRepuestosAlStock = async (mantenimiento: any, motivo: string = 'Reporte eliminado') => {
    if (!mantenimiento.repuestosUtilizados || mantenimiento.repuestosUtilizados.length === 0) {
      return; // No hay repuestos que devolver
    }
    
    for (const repuesto of mantenimiento.repuestosUtilizados) {
      try {
        // 🎯 Usar la nueva función híbrida para devolución con trazabilidad completa
        const { devolverRepuestosAlStockReporte } = useAppStore.getState();
        await devolverRepuestosAlStockReporte({
          itemId: repuesto.id,
          productoNombre: repuesto.nombre,
          productoMarca: repuesto.marca,
          productoModelo: repuesto.modelo,
          cantidad: repuesto.cantidad,
          cantidadAnterior: repuesto.stockAntes - repuesto.cantidad, // Stock actual antes de devolver
          mantenimientoId: mantenimiento.id,
          equipoId: equipoId,
          tecnicoResponsable: 'Sistema',
          observaciones: `${motivo} - ${equipo?.cliente || 'Cliente N/A'} - ${selectedMantenimiento?.descripcion || 'Reporte eliminado'}`
        });
        
        // console.log(`✅ Repuesto devuelto al stock con trazabilidad completa: ${repuesto.nombre} (+${repuesto.cantidad})`);
        toast.success(`Repuesto devuelto: ${repuesto.nombre} (+${repuesto.cantidad})`, {
          description: 'Stock actualizado con trazabilidad completa'
        });
      } catch (error) {
        // console.error(`❌ Error devolviendo repuesto ${repuesto.nombre}:`, error);
        toast.error(`Error devolviendo ${repuesto.nombre} al stock`);
      }
    }
  };

  // 🔧 Función para cerrar el modal y manejar reversión de estado
  const cerrarModalMantenimiento = () => {
    // Si había un componente en reparación temporal, revertir el cambio
    if (componenteEnReparacionTemporal) {
      // No hacemos nada porque el estado nunca se cambió realmente
      setComponenteEnReparacionTemporal(null);
      setEstadoTemporalSeleccionado(null);
      toast.info('Cambio de estado cancelado');
    }
    
    setShowNewMantenimiento(false);
    setSelectedComponenteId('');
    reset();
    setSelectedFile(null);
  };

  const equipo = equipos.find(e => e.id === equipoId);
  // 🔧 CORRECCIÓN: Obtener mantenimientos del store de forma reactiva
  const { mantenimientos: todosLosMantenimientos } = useAppStore();
  const mantenimientos = todosLosMantenimientos.filter(m => m.equipoId === equipoId);
  
  // 🔍 DEBUG: Log para ver el estado actual
  // console.log('🔍 DEBUG - Mantenimientos del equipo:', {
  //   equipoId,
  //   totalMantenimientos: todosLosMantenimientos.length,
  //   mantenimientosDelEquipo: mantenimientos.length,
  //   mantenimientos: mantenimientos.map(m => ({ id: m.id, descripcion: m.descripcion, fecha: m.fecha }))
  // });
  
  // 🎯 Verificar si el usuario actual es técnico
  const esTecnico = user?.rol === 'tecnico';

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
        tipo: 'Correctivo' as const,
        prioridad: 'Media' as const,
        archivo: selectedFile ? {
          nombre: selectedFile.name,
          tamaño: selectedFile.size,
          tipo: selectedFile.type,
        } : undefined,
      };
      
      // console.log('🔄 Creando mantenimiento...', mantenimientoData);
      const nuevoMantenimiento = await addMantenimiento(mantenimientoData);
      // console.log('✅ Mantenimiento creado:', nuevoMantenimiento);
      
      // Si había un componente en reparación temporal, ahora sí actualizar su estado
      if (componenteEnReparacionTemporal && estadoTemporalSeleccionado) {
        // Usar el estado que realmente seleccionó el usuario
        updateComponente(equipoId, componenteEnReparacionTemporal, { estado: estadoTemporalSeleccionado });
        setComponenteEnReparacionTemporal(null);
        setEstadoTemporalSeleccionado(null);
      }
      
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
    // Si el componente se pone "En reparación" o "Fuera de servicio", primero abrir el modal
    if (nuevoEstado === 'En reparacion' || nuevoEstado === 'Fuera de servicio') {
      setSelectedComponenteId(componenteId);
      setComponenteEnReparacionTemporal(componenteId); // Guardar ID para revertir si se cancela
      setEstadoTemporalSeleccionado(nuevoEstado); // Guardar el estado que realmente quiere el usuario
      setShowNewMantenimiento(true);
      // Pequeño delay para que el usuario vea qué pasó
      setTimeout(() => {
        if (nuevoEstado === 'En reparacion') {
          toast.info('Documenta el problema encontrado en este componente');
        } else {
          toast.info('Documenta por qué el componente está fuera de servicio');
        }
      }, 1000);
      return; // No actualizar el estado aún
    }
    
    // Para estado "Operativo", actualizar normalmente
    updateComponente(equipoId, componenteId, { estado: nuevoEstado });
    toast.success(`Estado del componente actualizado`);
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
    // 🔧 Limpiar repuestos utilizados
    setRepuestosUtilizados([]);
  };

  const eliminarReporte = async () => {
    setReporteGenerado('');
    setReporteListo(false);
    
    // 🔧 Devolver repuestos al stock antes de eliminar el reporte
    if (selectedMantenimiento && selectedMantenimiento.repuestosUtilizados) {
      await devolverRepuestosAlStock(selectedMantenimiento, 'Reporte eliminado desde equipo');
    }
    
    // Marcar el mantenimiento como que NO tiene reporte generado y limpiar repuestos
    if (selectedMantenimiento) {
      await updateMantenimiento(selectedMantenimiento.id, { 
        reporteGenerado: false,
        repuestosUtilizados: [] // Limpiar repuestos utilizados
      });
    }
    
    toast.success('Reporte eliminado. Repuestos devueltos al stock.');
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
      
      // 🔧 Procesar repuestos utilizados - descontar del stock con trazabilidad completa
      console.log('🔧 Repuestos utilizados al generar reporte:', repuestosUtilizados);
      if (repuestosUtilizados.length > 0) {
        const { registrarSalidaStockReporte } = useAppStore.getState();
        
        for (const repuesto of repuestosUtilizados) {
          try {
            console.log('🔧 Procesando repuesto con trazabilidad completa:', repuesto);
            // 🎯 Usar la nueva función híbrida para salida con trazabilidad completa
            await registrarSalidaStockReporte({
              itemId: repuesto.id,
              productoNombre: repuesto.nombre,
              productoMarca: repuesto.marca,
              productoModelo: repuesto.modelo,
              cantidad: repuesto.cantidad,
              cantidadAnterior: repuesto.stockAntes,
              mantenimientoId: selectedMantenimiento.id,
              equipoId: equipoId,
              tecnicoResponsable: user?.nombre || user?.email || 'Sistema',
              observaciones: `Utilizado en servicio técnico - ${equipo.cliente} - ${selectedMantenimiento.descripcion}`
            });
            
            console.log(`✅ Stock actualizado con trazabilidad completa para: ${repuesto.nombre}`);
            toast.success(`Repuesto utilizado: ${repuesto.nombre} (-${repuesto.cantidad})`, {
              description: 'Stock actualizado con trazabilidad completa'
            });
          } catch (error) {
            console.error(`❌ Error actualizando stock para ${repuesto.nombre}:`, error);
            toast.error(`Error actualizando stock de ${repuesto.nombre}`);
          }
        }
      }

      // Marcar el mantenimiento como que ya tiene reporte generado, guardar precio y repuestos
      await updateMantenimiento(selectedMantenimiento.id, { 
        reporteGenerado: true,
        precioServicio: parseFloat(precioServicio) || 0,
        repuestosUtilizados: repuestosUtilizados // 🔧 Guardar repuestos utilizados
      });
      
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
        numeroReporte: selectedMantenimiento?.numeroReporte || WordReporteService.generarNumeroReporte(equipo.nombreEquipo, selectedMantenimiento?.fecha || fechaHoy),
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
            {/* Mejorar Header con Alerts */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Volver</span>
                </Button>
                
                {/* Alerts de estado crítico */}
                {equipo.componentes.filter(c => c.estado === 'Fuera de servicio').length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center space-x-2 bg-red-50 text-red-700 px-3 py-1 rounded-full border border-red-200"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Equipo requiere atención urgente</span>
                  </motion.div>
                )}
                
                {mantenimientos.filter(m => m.estado === 'Pendiente').length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center space-x-2 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full border border-yellow-200"
                  >
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">{mantenimientos.filter(m => m.estado === 'Pendiente').length} servicios pendientes</span>
                  </motion.div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className={`${
                  equipo.componentes.filter(c => c.estado === 'Operativo').length === equipo.componentes.length
                    ? 'text-green-700 border-green-200 bg-green-50'
                    : 'text-yellow-700 border-yellow-200 bg-yellow-50'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    equipo.componentes.filter(c => c.estado === 'Operativo').length === equipo.componentes.length
                      ? 'bg-green-500'
                      : 'bg-yellow-500'
                  }`}></div>
                  {equipo.componentes.filter(c => c.estado === 'Operativo').length}/{equipo.componentes.length} Operativo
                </Badge>
                <Badge variant="secondary">
                  {mantenimientos.length} mantenimiento{mantenimientos.length !== 1 ? 's' : ''}
                </Badge>
                
                {/* Quick actions removed */}
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
                            <div className="mt-2">
                              <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-200 text-xs px-2 py-1 max-w-full font-bold">
                                {componente.observaciones}
                              </Badge>
                            </div>
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
              id="historial-mantenimientos"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4">
                  <div className="flex items-center space-x-2">
                    <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Historial de Mantenimientos</h3>
                    {mantenimientos.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {mantenimientos.length} registros
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-4">
                  {mantenimientos.length === 0 ? (
                    <div className="text-center py-8">
                      <Wrench className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Sin mantenimientos registrados</h4>
                      <p className="text-gray-500">Este equipo no tiene mantenimientos previos</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Timeline vertical */}
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                      
                      {mantenimientos
                        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                        .map((mantenimiento, index) => {
                          const componente = mantenimiento.componenteId 
                            ? equipo.componentes.find(c => c.id === mantenimiento.componenteId)
                            : null;
                          
                          const diasDesdeCreacion = Math.floor(
                            (new Date().getTime() - new Date(mantenimiento.fecha).getTime()) / (1000 * 60 * 60 * 24)
                          );
                          
                          return (
                            <motion.div
                              key={mantenimiento.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="relative ml-8 pl-6 pb-4"
                            >
                              {/* Icono en el timeline */}
                              <div className={`absolute -left-10 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                mantenimiento.estado === 'Finalizado' 
                                  ? 'bg-green-100 border-green-500 text-green-600'
                                  : mantenimiento.estado === 'En proceso'
                                  ? 'bg-blue-100 border-blue-500 text-blue-600'
                                  : 'bg-red-100 border-red-500 text-red-600'
                              }`}>
                                {getEstadoIcon(mantenimiento.estado)}
                              </div>
                              
                              {/* Contenido del mantenimiento */}
                              <div className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow bg-white">
                                <div className="flex flex-col space-y-3">
                                  {/* Header con estado, fecha y badges */}
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant={getEstadoColor(mantenimiento.estado) as any} className="text-xs">
                                      <span className="ml-1">{mantenimiento.estado}</span>
                                    </Badge>
                                    {mantenimiento.numeroReporte && (
                                      <Badge className="text-xs font-mono bg-blue-50 text-blue-700 border-blue-200">
                                        {mantenimiento.numeroReporte}
                                      </Badge>
                                    )}
                                    <span className="text-xs text-gray-500 flex items-center">
                                      <Calendar className="h-3 w-3 mr-1" />
                                      {new Date(mantenimiento.fecha).toLocaleDateString('es-ES')}
                                    </span>
                                    {componente && (
                                      <Badge variant="outline" className="text-blue-700 text-xs">
                                        <Package className="h-3 w-3 mr-1" />
                                        {componente.nombre}
                                      </Badge>
                                    )}
                                    
                                    {/* Indicador de antigüedad */}
                                    {diasDesdeCreacion <= 7 && (
                                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                        {diasDesdeCreacion === 0 ? 'Hoy' 
                                         : diasDesdeCreacion === 1 ? 'Ayer'
                                         : `${diasDesdeCreacion}d`}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {/* Descripción del problema */}
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-1">Problema Reportado</h4>
                                    <p className="text-sm text-gray-700">{mantenimiento.descripcion}</p>
                                  </div>
                                  
                                  {/* Información adicional */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    {mantenimiento.tecnicoAsignado && (
                                      <div className="flex items-center space-x-1 text-gray-600">
                                        <Settings className="h-3 w-3" />
                                        <span>Técnico: {mantenimiento.tecnicoAsignado}</span>
                                      </div>
                                    )}
                                    
                                    {mantenimiento.precioServicio && (
                                      <div className="flex items-center space-x-1 text-green-600">
                                        <DollarSign className="h-3 w-3" />
                                        <span>₲{mantenimiento.precioServicio.toLocaleString('es-PY')}</span>
                                      </div>
                                    )}
                                    
                                    {mantenimiento.repuestosUtilizados && mantenimiento.repuestosUtilizados.length > 0 && (
                                      <div className="flex items-center space-x-1 text-purple-600">
                                        <Package className="h-3 w-3" />
                                        <span>{mantenimiento.repuestosUtilizados.length} repuestos utilizados</span>
                                      </div>
                                    )}
                                    
                                    {diasDesdeCreacion > 0 && (
                                      <div className="flex items-center space-x-1 text-gray-500">
                                        <Clock className="h-3 w-3" />
                                        <span>Hace {diasDesdeCreacion} días</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Comentarios del ingeniero */}
                                  {mantenimiento.comentarios && (
                                    <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-200">
                                      <div className="flex items-center space-x-1 mb-1">
                                        <Settings className="h-3 w-3 text-blue-600" />
                                        <span className="text-xs font-medium text-blue-800">Comentarios del Ingeniero</span>
                                      </div>
                                      <p className="text-xs text-gray-700">{mantenimiento.comentarios}</p>
                                    </div>
                                  )}
                                  
                                  {/* Archivo adjunto */}
                                  {mantenimiento.archivo && (
                                    <div className="flex items-center space-x-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                      <FileText className="h-3 w-3" />
                                      <span className="truncate font-medium">{mantenimiento.archivo.nombre}</span>
                                      <span className="text-gray-500">
                                        ({(mantenimiento.archivo.tamaño / 1024).toFixed(1)} KB)
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Acciones */}
                                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
                                    {mantenimiento.estado !== 'Finalizado' && (
                                      <Select
                                        value={mantenimiento.estado}
                                        onValueChange={(value) => updateEstadoMantenimiento(mantenimiento.id, value as any)}
                                      >
                                        <SelectTrigger className="h-7 text-xs w-32">
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
                                        className="h-7 text-xs text-gray-700 border-gray-300 hover:bg-gray-50"
                                      >
                                        <Brain className="h-3 w-3 mr-1" />
                                        <span>{mantenimiento.reporteGenerado ? 'Ver Reporte' : 'Generar Reporte'}</span>
                                      </Button>
                                    )}

                                    {/* Botón para eliminar mantenimiento */}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => abrirModalEliminarMantenimiento(mantenimiento)}
                                      className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                      <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      <span>Eliminar</span>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      }
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar con Métricas Avanzadas */}
          <div className="space-y-4">
            {/* Métricas de Rendimiento */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <h4 className="text-sm font-semibold text-gray-900">Métricas de Rendimiento</h4>
                </div>
                <div className="space-y-3">
                  {/* Tiempo promedio de resolución */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-1">
                      <Timer className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-600">Tiempo Promedio</span>
                    </div>
                    <span className="text-xs font-medium text-green-600">
                      {(() => {
                        const finalizados = mantenimientos.filter(m => m.estado === 'Finalizado');
                        if (finalizados.length === 0) return 'N/A';
                        const promedio = finalizados.reduce((acc, m) => {
                          const inicio = new Date(m.createdAt || m.fecha);
                          const fin = new Date(m.fecha);
                          const horas = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60);
                          return acc + Math.max(horas, 2); // Mínimo 2 horas
                        }, 0) / finalizados.length;
                        return `${promedio.toFixed(1)}h`;
                      })()} 
                    </span>
                  </div>
                  
                  {/* Tasa de éxito */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-1">
                      <Target className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-600">Tasa de Éxito</span>
                    </div>
                    <span className="text-xs font-medium text-green-600">
                      {mantenimientos.length > 0 
                        ? `${Math.round((mantenimientos.filter(m => m.estado === 'Finalizado').length / mantenimientos.length) * 100)}%`
                        : '100%'
                      }
                    </span>
                  </div>
                  
                  {/* Actividad reciente */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-1">
                      <Activity className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-600">Último Servicio</span>
                    </div>
                    <span className="text-xs font-medium text-gray-700">
                      {(() => {
                        if (mantenimientos.length === 0) return 'Nunca';
                        const ultimo = mantenimientos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
                        const dias = Math.floor((new Date().getTime() - new Date(ultimo.fecha).getTime()) / (1000 * 60 * 60 * 24));
                        return dias === 0 ? 'Hoy' : dias === 1 ? 'Ayer' : `${dias}d`;
                      })()} 
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Estadísticas de Componentes */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Package className="h-4 w-4 text-orange-500" />
                  <h4 className="text-sm font-semibold text-gray-900">Estado de Componentes</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-gray-600">Operativos</span>
                    </div>
                    <Badge variant="default" className="text-xs h-5">
                      {equipo.componentes.filter(c => c.estado === 'Operativo').length}/{equipo.componentes.length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-1">
                      <Wrench className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs text-gray-600">En Reparación</span>
                    </div>
                    <Badge variant="secondary" className="text-xs h-5">
                      {equipo.componentes.filter(c => c.estado === 'En reparacion').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-1">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      <span className="text-xs text-gray-600">Fuera de Servicio</span>
                    </div>
                    <Badge variant="destructive" className="text-xs h-5">
                      {equipo.componentes.filter(c => c.estado === 'Fuera de servicio').length}
                    </Badge>
                  </div>
                  {/* Porcentaje de salud */}
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">Salud del Equipo</span>
                      <span className="text-xs font-medium text-green-600">
                        {Math.round((equipo.componentes.filter(c => c.estado === 'Operativo').length / equipo.componentes.length) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                        style={{
                          width: `${(equipo.componentes.filter(c => c.estado === 'Operativo').length / equipo.componentes.length) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Historial de Servicios */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <History className="h-4 w-4 text-purple-500" />
                  <h4 className="text-sm font-semibold text-gray-900">Historial de Servicios</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Total Servicios</span>
                    <Badge variant="outline" className="text-xs h-5">{mantenimientos.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-red-500" />
                      <span className="text-xs text-gray-600">Pendientes</span>
                    </div>
                    <Badge variant="destructive" className="text-xs h-5">
                      {mantenimientos.filter(m => m.estado === 'Pendiente').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-1">
                      <Zap className="h-3 w-3 text-blue-500" />
                      <span className="text-xs text-gray-600">En Proceso</span>
                    </div>
                    <Badge variant="secondary" className="text-xs h-5">
                      {mantenimientos.filter(m => m.estado === 'En proceso').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-gray-600">Completados</span>
                    </div>
                    <Badge variant="default" className="text-xs h-5">
                      {mantenimientos.filter(m => m.estado === 'Finalizado').length}
                    </Badge>
                  </div>
                  
                  {/* Gráfico simple de tendencia */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600">Actividad (últimos 30 días)</span>
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    </div>
                    <div className="flex space-x-1">
                      {Array.from({ length: 7 }, (_, i) => {
                        const fecha = new Date();
                        fecha.setDate(fecha.getDate() - (6 - i));
                        const serviciosDelDia = mantenimientos.filter(m => {
                          const fechaMantenimiento = new Date(m.fecha);
                          return fechaMantenimiento.toDateString() === fecha.toDateString();
                        }).length;
                        const altura = serviciosDelDia > 0 ? Math.max(serviciosDelDia * 4, 4) : 2;
                        return (
                          <div 
                            key={i} 
                            className={`flex-1 rounded-sm ${
                              serviciosDelDia > 0 ? 'bg-blue-500' : 'bg-gray-200'
                            } transition-all duration-300`}
                            style={{ height: `${altura}px` }}
                            title={`${serviciosDelDia} servicios el ${fecha.toLocaleDateString('es-ES')}`}
                          ></div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Análisis Financiero */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <h4 className="text-sm font-semibold text-gray-900">Análisis Financiero</h4>
                </div>
                <div className="space-y-3">
                  {/* Costo total en mantenimientos */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Inversión Total</span>
                    <span className="text-xs font-medium text-green-600">
                      {(() => {
                        const total = mantenimientos
                          .filter(m => m.precioServicio && m.estado === 'Finalizado')
                          .reduce((sum, m) => sum + (m.precioServicio || 0), 0);
                        return total > 0 ? `₲${total.toLocaleString('es-PY')}` : '₲0';
                      })()} 
                    </span>
                  </div>
                  
                  {/* Costo promedio por servicio */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Costo Promedio</span>
                    <span className="text-xs font-medium text-blue-600">
                      {(() => {
                        const serviciosConPrecio = mantenimientos.filter(m => m.precioServicio && m.estado === 'Finalizado');
                        if (serviciosConPrecio.length === 0) return '₲0';
                        const promedio = serviciosConPrecio.reduce((sum, m) => sum + (m.precioServicio || 0), 0) / serviciosConPrecio.length;
                        return `₲${Math.round(promedio).toLocaleString('es-PY')}`;
                      })()} 
                    </span>
                  </div>
                  
                  {/* Último servicio */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Último Servicio</span>
                    <span className="text-xs font-medium text-purple-600">
                      {(() => {
                        const ultimo = mantenimientos
                          .filter(m => m.estado === 'Finalizado' && m.precioServicio)
                          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
                        return ultimo?.precioServicio ? `₲${ultimo.precioServicio.toLocaleString('es-PY')}` : '₲0';
                      })()} 
                    </span>
                  </div>
                  
                  {/* Indicador de rentabilidad */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Estado Financiero</span>
                      {(() => {
                        const totalInvertido = mantenimientos
                          .filter(m => m.precioServicio && m.estado === 'Finalizado')
                          .reduce((sum, m) => sum + (m.precioServicio || 0), 0);
                        const promedioAnual = totalInvertido > 0 ? totalInvertido / Math.max(1, new Date().getFullYear() - new Date(equipo.fechaEntrega).getFullYear()) : 0;
                        
                        if (promedioAnual < 500000) {
                          return <span className="text-xs font-medium text-green-600 flex items-center"><TrendingUp className="h-3 w-3 mr-1" />Eficiente</span>;
                        } else if (promedioAnual < 1000000) {
                          return <span className="text-xs font-medium text-yellow-600 flex items-center"><Activity className="h-3 w-3 mr-1" />Moderado</span>;
                        } else {
                          return <span className="text-xs font-medium text-red-600 flex items-center"><TrendingDown className="h-3 w-3 mr-1" />Alto</span>;
                        }
                      })()} 
                    </div>
                    <p className="text-xs text-gray-500">
                      {(() => {
                        const totalInvertido = mantenimientos
                          .filter(m => m.precioServicio && m.estado === 'Finalizado')
                          .reduce((sum, m) => sum + (m.precioServicio || 0), 0);
                        const añosOperacion = Math.max(1, new Date().getFullYear() - new Date(equipo.fechaEntrega).getFullYear());
                        const promedioAnual = totalInvertido / añosOperacion;
                        return `₲${Math.round(promedioAnual).toLocaleString('es-PY')}/año`;
                      })()} 
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Recomendaciones Inteligentes */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <EquipoRecommendations equipo={equipo} mantenimientos={mantenimientos} />
            </motion.div>

            {/* Información del Equipo */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Información Adicional</h4>
                <div className="space-y-2 text-xs">
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
                  <div>
                    <span className="text-gray-600">Antigüedad:</span>
                    <p className="font-medium">
                      {(() => {
                        const años = Math.floor((new Date().getTime() - new Date(equipo.fechaEntrega).getTime()) / (1000 * 60 * 60 * 24 * 365));
                        const meses = Math.floor(((new Date().getTime() - new Date(equipo.fechaEntrega).getTime()) % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
                        return años > 0 ? `${años}a ${meses}m` : `${meses} meses`;
                      })()} 
                    </p>
                  </div>
                  
                  {/* Certificación de calidad */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center space-x-1 mb-1">
                      <Shield className="h-3 w-3 text-blue-500" />
                      <span className="text-gray-600">Certificación</span>
                    </div>
                    <Badge 
                      variant={equipo.componentes.filter(c => c.estado === 'Operativo').length === equipo.componentes.length ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {equipo.componentes.filter(c => c.estado === 'Operativo').length === equipo.componentes.length 
                        ? 'Certificado ✓' 
                        : 'Mantenimiento Req.'
                      }
                    </Badge>
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
              className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50"
              onClick={cerrarReporteModal}
            >
              <motion.div
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.98, opacity: 0 }}
                className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header del Modal */}
                <div className="border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Brain className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {selectedMantenimiento.reporteGenerado ? 'Reporte Técnico' : 'Nuevo Reporte Técnico'}
                        </h3>
                        <p className="text-sm text-gray-500">Mantenimiento del {new Date(selectedMantenimiento.fecha).toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={cerrarReporteModal} className="h-8 w-8 p-0">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
                </div>

                {/* Contenido del Modal */}
                <div className="flex-1 overflow-y-auto">
                  {selectedMantenimiento.reporteGenerado ? (
                    // Vista para reporte existente
                    <div className="p-6 space-y-6">
                      {/* Información básica */}
                      <div className="grid grid-cols-3 gap-6 text-sm">
                        <div>
                          <label className="block text-gray-500 mb-1">Cliente</label>
                          <p className="font-medium text-gray-900">{equipo.cliente}</p>
                        </div>
                        <div>
                          <label className="block text-gray-500 mb-1">Equipo</label>
                          <p className="font-medium text-gray-900">{equipo.marca} {equipo.modelo}</p>
                        </div>
                        <div>
                          <label className="block text-gray-500 mb-1">Estado</label>
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {selectedMantenimiento.estado}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-500 mb-1 text-sm">Problema reportado</label>
                        <p className="text-gray-900">{selectedMantenimiento.descripcion}</p>
                      </div>

                      {/* Estado del reporte */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-900">Reporte generado</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Documento técnico disponible en formato profesional
                        </p>
                      </div>

                      {/* Vista del contenido si está cargado */}
                      {reporteListo && reporteGenerado !== 'Reporte técnico disponible para descarga' && (
                        <div className="border border-gray-200 rounded-lg">
                          <div className="px-4 py-3 border-b border-gray-200">
                            <h4 className="font-medium text-gray-900">Contenido del reporte</h4>
                          </div>
                          <div className="p-4">
                            <div className="bg-gray-50 rounded border p-4 max-h-80 overflow-y-auto">
                              <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                                {reporteGenerado}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Acciones principales */}
                      <div className="flex space-x-3 pt-4 border-t border-gray-200">
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
                              toast.success('Reporte cargado para visualización');
                            } catch (error) {
                              toast.error('Error al cargar el reporte');
                            }
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Contenido
                        </Button>
                        <Button
                          onClick={eliminarReporte}
                          variant="outline"
                          className="flex-1"
                        >
                          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Eliminar
                        </Button>
                        <Button
                          onClick={descargarReporteWord}
                          className="flex-1 bg-gray-900 hover:bg-gray-800"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                      </div>

                      {/* Opción para regenerar */}
                      <div className="pt-4 border-t border-gray-200">
                        <Button
                          onClick={() => {
                            setReporteGenerado('');
                            setReporteListo(false);
                            cerrarReporteModal();
                            setTimeout(() => abrirReporteModal({...selectedMantenimiento, reporteGenerado: false}), 100);
                          }}
                          variant="outline"
                          size="sm"
                          className="text-gray-600"
                        >
                          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Generar nuevo reporte
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Vista para crear nuevo reporte
                    <div className="grid grid-cols-2 gap-8">
                      {/* Panel izquierdo - Formulario */}
                      <div className="p-6 space-y-6">
                        {/* Información del mantenimiento */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <label className="block text-gray-500 mb-1">Cliente</label>
                            <p className="font-medium text-gray-900">{equipo.cliente}</p>
                          </div>
                          <div>
                            <label className="block text-gray-500 mb-1">Equipo</label>
                            <p className="font-medium text-gray-900">{equipo.marca} {equipo.modelo}</p>
                          </div>
                        </div>

                        {/* Descripción del trabajo */}
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Descripción del trabajo realizado
                          </label>
                          <p className="text-xs text-gray-600 mb-3">
                            Describe informalmente lo que hiciste. El sistema generará un reporte técnico profesional.
                          </p>
                          <Textarea
                            value={textoInformal}
                            onChange={(e) => setTextoInformal(e.target.value)}
                            placeholder={`Llegué a ${equipo.cliente} y revisé el ${equipo.marca} ${equipo.modelo}. El problema era que ${selectedMantenimiento?.descripcion?.toLowerCase()}. Revisé todo y estaba dañado el cable principal. Lo cambié por uno nuevo y después probé que todo funcione bien. Calibré los parámetros y quedó operativo.`}
                            rows={6}
                            className="w-full text-sm resize-none"
                          />
                        </div>

                        {/* Precio del servicio */}
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Precio del servicio
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={precioServicio}
                              onChange={(e) => {
                                const valor = e.target.value.replace(/[^\d]/g, '');
                                setPrecioServicio(valor);
                              }}
                              placeholder="350000"
                              className="w-full p-3 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                            />
                            <span className="absolute right-3 top-3 text-xs text-gray-500">Gs.</span>
                          </div>
                          {precioServicio && (
                            <p className="text-xs text-gray-500 mt-1">
                              {parseInt(precioServicio).toLocaleString('es-PY')} Guaraníes
                            </p>
                          )}
                        </div>

                        {/* Selector de repuestos */}
                        <div className="border-t border-gray-200 pt-4">
                          <RepuestosSimpleSelector
                            repuestos={repuestosUtilizados}
                            onRepuestosChange={setRepuestosUtilizados}
                            disabled={generandoReporte}
                          />
                        </div>

                        {/* Botón de generar */}
                        <div className="pt-4">
                          <Button
                            onClick={generarReporteConIA}
                            disabled={generandoReporte || !textoInformal.trim() || !precioServicio.trim()}
                            className="w-full bg-gray-900 hover:bg-gray-800"
                          >
                            {generandoReporte ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                                Generando reporte...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                Generar Reporte
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Panel derecho - Resultado */}
                      <div className="border-l border-gray-200 p-6">
                        <div className="h-full flex flex-col">
                          <label className="block text-sm font-medium text-gray-900 mb-4">
                            Reporte técnico generado
                          </label>
                          
                          {reporteListo ? (
                            <div className="flex-1 space-y-4">
                              <div className="border border-gray-200 rounded">
                                <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
                                  <div className="flex items-center space-x-2">
                                    <CheckCircle className="h-4 w-4 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-900">Completado</span>
                                  </div>
                                </div>
                                <div className="p-4">
                                  <div className="bg-gray-50 rounded border p-4 max-h-80 overflow-y-auto">
                                    <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                                      {reporteGenerado}
                                    </pre>
                                  </div>
                                </div>
                              </div>

                              <div className="flex space-x-3">
                                <Button
                                  onClick={eliminarReporte}
                                  variant="outline"
                                  className="flex-1"
                                >
                                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Eliminar
                                </Button>
                                <Button
                                  onClick={descargarReporteWord}
                                  className="flex-1 bg-gray-900 hover:bg-gray-800"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Descargar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center justify-center">
                              {generandoReporte ? (
                                <div className="text-center space-y-3">
                                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-400 border-t-transparent mx-auto" />
                                  <p className="text-sm text-gray-600">Procesando...</p>
                                </div>
                              ) : (
                                <div className="text-center space-y-3 text-gray-500">
                                  <Brain className="h-12 w-12 mx-auto" />
                                  <p className="text-sm">Completa los campos para generar el reporte</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
              className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={cerrarModalMantenimiento}
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
                      onClick={cerrarModalMantenimiento}
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