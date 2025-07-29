'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  Mail,
  User,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import ModalClinica from '@/components/clinicas/ModalClinica';

export default function ClinicasPage() {
  const { 
    getClinicas, 
    deleteClinica 
  } = useAppStore();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [clinicaEditando, setClinicaEditando] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  const clinicas = getClinicas();

  // Filtrar clínicas
  const clinicasFiltradas = clinicas.filter(clinica => {
    const coincideBusqueda = 
      clinica.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      clinica.direccion.toLowerCase().includes(busqueda.toLowerCase()) ||
      clinica.ciudad.toLowerCase().includes(busqueda.toLowerCase()) ||
      clinica.contactoPrincipal?.toLowerCase().includes(busqueda.toLowerCase());

    const coincideEstado = filtroEstado === 'todos' || 
      (filtroEstado === 'activas' && clinica.activa) ||
      (filtroEstado === 'inactivas' && !clinica.activa);

    return coincideBusqueda && coincideEstado;
  });

  // Eliminar clínica
  const handleEliminarClinica = async (id: string, nombre: string) => {
    if (confirm(`¿Estás seguro de eliminar la clínica ${nombre}?`)) {
      try {
        await deleteClinica(id);
        toast.success('Clínica eliminada exitosamente');
      } catch (error) {
        toast.error('Error al eliminar la clínica');
      }
    }
  };

  // Editar clínica
  const handleEditarClinica = (clinica: any) => {
    setClinicaEditando(clinica);
    setModalAbierto(true);
  };

  // Cerrar modal
  const handleCerrarModal = () => {
    setModalAbierto(false);
    setClinicaEditando(null);
  };

  // Estadísticas rápidas
  const estadisticas = {
    total: clinicas.length,
    activas: clinicas.filter(c => c.activa).length,
    inactivas: clinicas.filter(c => !c.activa).length,
    conContacto: clinicas.filter(c => c.contactoPrincipal).length
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
                  <Building2 className="w-8 h-8" />
                  Gestión de Clínicas
                </h1>
                <p className="text-gray-600 mt-2">
                  Administra las clínicas y centros médicos para remisiones
                </p>
              </div>
              <Button
                onClick={() => setModalAbierto(true)}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Nueva Clínica
              </Button>
            </div>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-gray-50 rounded-lg p-4 border shadow-sm">
                <div className="text-2xl font-bold text-gray-900">{estadisticas.total}</div>
                <div className="text-gray-600 text-sm">Total</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border shadow-sm">
                <div className="text-2xl font-bold text-green-600">{estadisticas.activas}</div>
                <div className="text-gray-600 text-sm">Activas</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border shadow-sm">
                <div className="text-2xl font-bold text-red-600">{estadisticas.inactivas}</div>
                <div className="text-gray-600 text-sm">Inactivas</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{estadisticas.conContacto}</div>
                <div className="text-gray-600 text-sm">Con Contacto</div>
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
                    placeholder="Buscar por nombre, dirección, ciudad o contacto..."
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
                  <option value="todos">Todas las clínicas</option>
                  <option value="activas">Solo activas</option>
                  <option value="inactivas">Solo inactivas</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Lista de clínicas */}
          {clinicasFiltradas.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {busqueda || filtroEstado !== 'todos' 
                    ? 'No se encontraron clínicas' 
                    : 'No hay clínicas registradas'
                  }
                </h3>
                <p className="text-gray-500 mb-6">
                  {busqueda || filtroEstado !== 'todos'
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'Registra tu primera clínica para comenzar a crear remisiones'
                  }
                </p>
                {!busqueda && filtroEstado === 'todos' && (
                  <Button onClick={() => setModalAbierto(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Primera Clínica
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {clinicasFiltradas.map((clinica, index) => (
                <motion.div
                  key={clinica.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-blue-600" />
                            {clinica.nombre}
                            <Badge className={clinica.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {clinica.activa ? 'Activa' : 'Inactiva'}
                            </Badge>
                          </CardTitle>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {clinica.ciudad}
                            </div>
                            {clinica.telefono && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                {clinica.telefono}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditarClinica(clinica)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEliminarClinica(clinica.id, clinica.nombre)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Información de ubicación */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Ubicación</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-start gap-1">
                              <MapPin className="w-3 h-3 mt-1 flex-shrink-0" />
                              <span>{clinica.direccion}</span>
                            </div>
                          </div>
                        </div>

                        {/* Información de contacto */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Contacto</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            {clinica.contactoPrincipal && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {clinica.contactoPrincipal}
                              </div>
                            )}
                            {clinica.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {clinica.email}
                              </div>
                            )}
                            {clinica.telefono && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {clinica.telefono}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {clinica.observaciones && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">
                            <strong>Observaciones:</strong> {clinica.observaciones}
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

        {/* Modal de clínica */}
        <ModalClinica
          isOpen={modalAbierto}
          onClose={handleCerrarModal}
          clinica={clinicaEditando}
        />
      </div>
    </DashboardLayout>
  );
}