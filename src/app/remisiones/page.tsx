'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import ModalRemision from '@/components/remisiones/ModalRemision';
import {
  FileText,
  Plus,
  Search,
  Calendar,
  MapPin,
  User,
  Package,
  Eye,
  Edit,
  Trash2,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Remision } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function RemisionesPage() {
  const {
    remisiones,
    getRemisiones,
    deleteRemision,
    loadInventarioTecnico
  } = useAppStore();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalVerRemision, setModalVerRemision] = useState(false);
  const [modalEditarRemision, setModalEditarRemision] = useState(false);
  const [remisionSeleccionada, setRemisionSeleccionada] = useState<Remision | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  // Cargar datos al montar el componente
  useEffect(() => {
    loadInventarioTecnico();
  }, [loadInventarioTecnico]);

  // Filtrar remisiones
  const remisionesFiltradas = getRemisiones().filter(remision => {
    const coincideBusqueda =
      remision.numeroRemision.toLowerCase().includes(busqueda.toLowerCase()) ||
      remision.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      remision.contacto?.toLowerCase().includes(busqueda.toLowerCase()) ||
      remision.productos.some(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.marca.toLowerCase().includes(busqueda.toLowerCase())
      );

    const coincideEstado = filtroEstado === 'todos' || remision.estado === filtroEstado;

    return coincideBusqueda && coincideEstado;
  });

  // Obtener color del badge según estado
  const getEstadoColor = (estado: Remision['estado']) => {
    switch (estado) {
      case 'Borrador': return 'bg-gray-100 text-gray-800';
      case 'Confirmada': return 'bg-blue-100 text-blue-800';
      case 'En tránsito': return 'bg-yellow-100 text-yellow-800';
      case 'Entregada': return 'bg-green-100 text-green-800';
      case 'Cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Ver remisión
  const handleVerRemision = (remision: Remision) => {
    setRemisionSeleccionada(remision);
    setModalVerRemision(true);
  };

  // Editar remisión
  const handleEditarRemision = (remision: Remision) => {
    setRemisionSeleccionada(remision);
    setModalEditarRemision(true);
  };

  // Descargar remisión como Word
  const handleDescargarWord = async (remision: Remision) => {
    try {
      // Importar dinámicamente el servicio de Word
      const { WordRemisionService } = await import('@/lib/word-remision-service');
      
      const blob = await WordRemisionService.generarRemisionWord(remision);
      
      // Crear enlace de descarga
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Remision_${remision.numeroRemision}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Remisión descargada exitosamente');
    } catch (error) {
      console.error('Error al generar documento Word:', error);
      toast.error('Error al generar el documento Word');
    }
  };

  // Eliminar remisión
  const handleEliminarRemision = async (id: string, numeroRemision: string) => {
    if (confirm(`¿Estás seguro de eliminar la remisión ${numeroRemision}?`)) {
      try {
        await deleteRemision(id);
        toast.success('Remisión eliminada exitosamente');
      } catch (error) {
        toast.error('Error al eliminar la remisión');
      }
    }
  };

  // Estadísticas rápidas
  const estadisticas = {
    total: remisiones.length,
    confirmadas: remisiones.filter(r => r.estado === 'Confirmada').length,
    enTransito: remisiones.filter(r => r.estado === 'En tránsito').length,
    entregadas: remisiones.filter(r => r.estado === 'Entregada').length
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border mx-4 mt-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900">
                  <FileText className="w-8 h-8" />
                  Remisiones Digitales
                </h1>
                <p className="text-gray-600 mt-2">
                  Sistema de trazabilidad para entregas de ARES Paraguay
                </p>
              </div>
              <Button
                onClick={() => setModalAbierto(true)}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Nueva Remisión
              </Button>
            </div>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-gray-50 rounded-lg p-4 border shadow-sm">
                <div className="text-2xl font-bold text-gray-900">{estadisticas.total}</div>
                <div className="text-gray-600 text-sm">Total</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border shadow-sm">
                <div className="text-2xl font-bold text-gray-900">{estadisticas.confirmadas}</div>
                <div className="text-gray-600 text-sm">Confirmadas</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border shadow-sm">
                <div className="text-2xl font-bold text-gray-900">{estadisticas.enTransito}</div>
                <div className="text-gray-600 text-sm">En Tránsito</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border shadow-sm">
                <div className="text-2xl font-bold text-gray-900">{estadisticas.entregadas}</div>
                <div className="text-gray-600 text-sm">Entregadas</div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Filtros */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por número, cliente, contacto o productos..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="Borrador">Borrador</option>
                  <option value="Confirmada">Confirmada</option>
                  <option value="En tránsito">En tránsito</option>
                  <option value="Entregada">Entregada</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Lista de remisiones */}
          {remisionesFiltradas.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {busqueda || filtroEstado !== 'todos'
                    ? 'No se encontraron remisiones'
                    : 'No hay remisiones creadas'
                  }
                </h3>
                <p className="text-gray-500 mb-6">
                  {busqueda || filtroEstado !== 'todos'
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'Crea tu primera remisión digital para comenzar'
                  }
                </p>
                {!busqueda && filtroEstado === 'todos' && (
                  <Button onClick={() => setModalAbierto(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primera Remisión
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {remisionesFiltradas.map((remision, index) => (
                <motion.div
                  key={remision.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            {remision.numeroRemision}
                            <Badge className={getEstadoColor(remision.estado)}>
                              {remision.estado}
                            </Badge>
                          </CardTitle>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(remision.fecha).toLocaleDateString('es-PY')}
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {remision.tecnicoResponsable}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleVerRemision(remision)}
                            title="Ver remisión"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditarRemision(remision)}
                            title="Editar remisión"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDescargarWord(remision)}
                            title="Descargar como Word"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEliminarRemision(remision.id, remision.numeroRemision)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Eliminar remisión"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Información del cliente */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Cliente</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="font-medium">{remision.cliente}</div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {remision.direccionEntrega}
                            </div>
                            {remision.contacto && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {remision.contacto}
                              </div>
                            )}
                            {remision.numeroFactura && (
                              <div className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                <span className="font-medium">Factura:</span> {remision.numeroFactura}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Productos */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            Productos ({remision.productos.length})
                          </h4>
                          <div className="space-y-1">
                            {remision.productos.slice(0, 3).map((producto) => (
                              <div key={producto.id} className="text-sm text-gray-600">
                                <span className="font-medium">{producto.cantidadSolicitada}x</span> {producto.nombre}
                                <span className="text-gray-400 ml-1">
                                  ({producto.marca} {producto.modelo})
                                </span>
                              </div>
                            ))}
                            {remision.productos.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{remision.productos.length - 3} productos más
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {remision.descripcionGeneral && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">
                            <strong>Observaciones:</strong> {remision.descripcionGeneral}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de nueva remisión */}
        <ModalRemision
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
        />

        {/* Modal para ver remisión */}
        <Dialog open={modalVerRemision} onOpenChange={setModalVerRemision}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Ver Remisión - {remisionSeleccionada?.numeroRemision}
              </DialogTitle>
            </DialogHeader>
            
            {remisionSeleccionada && (
              <div className="space-y-6 p-6">
                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Información de la Remisión</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium">Número:</span>
                        <span>{remisionSeleccionada.numeroRemision}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Fecha:</span>
                        <span>{new Date(remisionSeleccionada.fecha).toLocaleDateString('es-PY')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Tipo:</span>
                        <span>{remisionSeleccionada.tipoRemision}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Estado:</span>
                        <Badge className={getEstadoColor(remisionSeleccionada.estado)}>
                          {remisionSeleccionada.estado}
                        </Badge>
                      </div>
                      {remisionSeleccionada.numeroFactura && (
                        <div className="flex justify-between">
                          <span className="font-medium">Factura:</span>
                          <span>{remisionSeleccionada.numeroFactura}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="font-medium">Técnico:</span>
                        <span>{remisionSeleccionada.tecnicoResponsable}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Información del Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="font-medium">Cliente:</span>
                        <p className="text-gray-600">{remisionSeleccionada.cliente}</p>
                      </div>
                      <div>
                        <span className="font-medium">Dirección:</span>
                        <p className="text-gray-600">{remisionSeleccionada.direccionEntrega}</p>
                      </div>
                      {remisionSeleccionada.contacto && (
                        <div>
                          <span className="font-medium">Contacto:</span>
                          <p className="text-gray-600">{remisionSeleccionada.contacto}</p>
                        </div>
                      )}
                      {remisionSeleccionada.telefono && (
                        <div>
                          <span className="font-medium">Teléfono:</span>
                          <p className="text-gray-600">{remisionSeleccionada.telefono}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Productos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Productos ({remisionSeleccionada.productos.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {remisionSeleccionada.productos.map((producto, index) => (
                        <div key={producto.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  #{index + 1}
                                </Badge>
                                <h4 className="font-medium">{producto.nombre}</h4>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                <div>
                                  <p><strong>Marca:</strong> {producto.marca}</p>
                                  <p><strong>Modelo:</strong> {producto.modelo}</p>
                                </div>
                                <div>
                                  <p><strong>Cantidad:</strong> {producto.cantidadSolicitada}</p>
                                  {producto.numeroSerie && (
                                    <p><strong>N° Serie:</strong> {producto.numeroSerie}</p>
                                  )}
                                </div>
                              </div>
                              {producto.observaciones && (
                                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                  <strong>Observaciones:</strong> {producto.observaciones}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Observaciones generales */}
                {remisionSeleccionada.descripcionGeneral && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Observaciones Generales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{remisionSeleccionada.descripcionGeneral}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Botones de acción */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleDescargarWord(remisionSeleccionada)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar Word
                  </Button>
                  <Button
                    onClick={() => {
                      setModalVerRemision(false);
                      handleEditarRemision(remisionSeleccionada);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal para editar remisión */}
        <ModalRemision
          isOpen={modalEditarRemision}
          onClose={() => {
            setModalEditarRemision(false);
            setRemisionSeleccionada(null);
          }}
          remisionParaEditar={remisionSeleccionada}
        />
      </div>
    </DashboardLayout>
  );
}