'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PermissionGuard, usePermissions } from '@/components/PermissionGuard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MobileTable, MobileComponenteCard } from '@/components/ui/mobile-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Package, Calendar, MapPin, Plus, History, X, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { ComponenteDisponible } from '@/types';
import { UpdateQuantityModal } from '@/components/inventory/UpdateQuantityModal';

const tipoComponenteColores = {
  'Pieza de mano': 'bg-blue-100 text-blue-800',
  'Cartucho': 'bg-green-100 text-green-800',
  'Transductor': 'bg-purple-100 text-purple-800',
  'Cable especializado': 'bg-orange-100 text-orange-800',
  'Sensor': 'bg-red-100 text-red-800',
  'Aplicador': 'bg-pink-100 text-pink-800',
  'Punta/Tip': 'bg-yellow-100 text-yellow-800',
  'Componente técnico': 'bg-gray-100 text-gray-800'
};

const estadoColores = {
  'Disponible': 'bg-green-100 text-green-800',
  'Asignado': 'bg-blue-100 text-blue-800',
  'En reparación': 'bg-red-100 text-red-800'
};

export default function InventarioTecnicoPage() {
  const {
    componentesDisponibles,
    equipos,
    historialAsignaciones,
    loadInventarioTecnico,
    asignarComponente
  } = useAppStore();
  
  const { getCurrentUser } = usePermissions();

  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  
  // 🎯 Verificar si el usuario actual es técnico
  const currentUser = getCurrentUser();
  const esTecnico = currentUser?.rol === 'tecnico';

  // Estados para modal de asignación
  const [modalAsignacion, setModalAsignacion] = useState(false);
  const [componenteSeleccionado, setComponenteSeleccionado] = useState<ComponenteDisponible | null>(null);
  const [equipoDestino, setEquipoDestino] = useState('');
  const [cantidadAsignar, setCantidadAsignar] = useState(1);
  const [motivoAsignacion, setMotivoAsignacion] = useState('Instalación');
  const [tecnicoResponsable, setTecnicoResponsable] = useState('');
  const [observacionesAsignacion, setObservacionesAsignacion] = useState('');
  const [asignando, setAsignando] = useState(false);

  // Estados para modal de historial
  const [modalHistorial, setModalHistorial] = useState(false);
  const [historialSeleccionado, setHistorialSeleccionado] = useState<ComponenteDisponible | null>(null);

  // Estados para modal de actualización de cantidad
  const [modalUpdateQuantity, setModalUpdateQuantity] = useState(false);
  const [componenteParaActualizar, setComponenteParaActualizar] = useState<ComponenteDisponible | null>(null);

  useEffect(() => {
    loadInventarioTecnico();
  }, [loadInventarioTecnico]);

  // Filtrar componentes
  const componentesFiltrados = componentesDisponibles.filter(comp => {
    const matchBusqueda = comp.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      comp.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
      comp.modelo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (comp.numeroSerie && comp.numeroSerie.toLowerCase().includes(busqueda.toLowerCase())) ||
      comp.tipoComponente.toLowerCase().includes(busqueda.toLowerCase());

    const matchTipo = filtroTipo === 'todos' || comp.tipoComponente === filtroTipo;
    const matchEstado = filtroEstado === 'todos' || comp.estado === filtroEstado;

    return matchBusqueda && matchTipo && matchEstado;
  });

  const tiposUnicos = [...new Set(componentesDisponibles.map(comp => comp.tipoComponente))];

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleAsignarComponente = async () => {
    if (!componenteSeleccionado || !equipoDestino) {
      toast.error('Selecciona un equipo destino');
      return;
    }

    if (cantidadAsignar > componenteSeleccionado.cantidadDisponible) {
      toast.error(`Solo hay ${componenteSeleccionado.cantidadDisponible} unidades disponibles`);
      return;
    }

    setAsignando(true);
    try {
      await asignarComponente(
        componenteSeleccionado.id,
        equipoDestino,
        cantidadAsignar,
        motivoAsignacion,
        tecnicoResponsable || undefined,
        observacionesAsignacion || undefined
      );

      toast.success(`Componente asignado exitosamente`, {
        description: `${cantidadAsignar} unidad(es) de ${componenteSeleccionado.nombre} asignadas al equipo.`
      });

      // Limpiar modal
      setModalAsignacion(false);
      setComponenteSeleccionado(null);
      setEquipoDestino('');
      setCantidadAsignar(1);
      setTecnicoResponsable('');
      setObservacionesAsignacion('');

    } catch (error) {
      toast.error('Error al asignar componente', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setAsignando(false);
    }
  };

  const abrirModalAsignacion = (componente: ComponenteDisponible) => {
    setComponenteSeleccionado(componente);
    setCantidadAsignar(Math.min(1, componente.cantidadDisponible));
    setModalAsignacion(true);
  };

  // 🚀 ASIGNACIÓN AUTOMÁTICA POR CÓDIGO DE CARGA
  const asignarDirectamenteAlEquipoPadre = async (componente: ComponenteDisponible) => {
    let equipoPadre = null;

    // 1️⃣ PRIORIDAD: Información directa del equipo padre
    if (componente.equipoPadre) {
      equipoPadre = equipos.find(e => e.id === componente.equipoPadre!.equipoId);
      if (equipoPadre) {
        console.log('✅ Equipo padre encontrado por ID directo:', equipoPadre.nombreEquipo);
      }
    }

    // 2️⃣ CRITERIO PRINCIPAL: Buscar por código de carga exacto
    if (!equipoPadre && componente.codigoCargaOrigen) {
      // Extraer el identificador único del código de carga (fecha + número)
      const codigoComponente = componente.codigoCargaOrigen;
      console.log('🔍 Buscando equipo para código:', codigoComponente);

      // Buscar equipo que contenga el código específico del componente
      equipoPadre = equipos.find(equipo => {
        console.log('📋 Verificando equipo:', equipo.nombreEquipo);

        // Verificar si el equipo contiene el código exacto del componente
        // Esto debe ser una coincidencia muy específica
        const equipoContieneCodigoComponente = equipo.nombreEquipo.includes(codigoComponente);

        if (equipoContieneCodigoComponente) {
          console.log('✅ MATCH encontrado:', equipo.nombreEquipo, 'para código:', codigoComponente);
        }

        return equipoContieneCodigoComponente;
      });

      if (equipoPadre) {
        console.log('✅ Equipo padre seleccionado:', equipoPadre.nombreEquipo, '- Cliente:', equipoPadre.cliente);
      } else {
        console.log('❌ No se encontró equipo para código:', codigoComponente);
      }
    }

    if (!equipoPadre) {
      toast.error('No se encontró equipo con el mismo código de carga', {
        description: componente.codigoCargaOrigen ?
          `Código: ${componente.codigoCargaOrigen}` :
          'Usa asignación manual para seleccionar el equipo.'
      });
      return;
    }

    setAsignando(true);
    try {
      await asignarComponente(
        componente.id,
        equipoPadre.id,
        1, // Cantidad por defecto: 1
        'Instalación', // Motivo por defecto
        'Javier Lopez', // Técnico por defecto
        `Asignación automática al equipo padre: ${equipoPadre.nombreEquipo}`
      );

      const nombreLimpio = equipoPadre.nombreEquipo
        .replace(/-ENTRADA-\d{8}-\d{3}/, '')
        .replace(/-\d{8}-\d{3}/, '');

      toast.success(`¡Asignado automáticamente!`, {
        description: `${componente.nombre} → ${nombreLimpio}/${equipoPadre.cliente}`
      });

    } catch (error) {
      toast.error('Error en la asignación automática', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setAsignando(false);
    }
  };

  const abrirModalHistorial = (componente: ComponenteDisponible) => {
    setHistorialSeleccionado(componente);
    setModalHistorial(true);
  };

  const obtenerHistorialComponente = (componenteId: string) => {
    return historialAsignaciones.filter(asig => asig.componenteId === componenteId);
  };

  if (componentesDisponibles.length === 0) {
    return (
      <DashboardLayout title="Inventario Técnico" subtitle="Gestión de componentes y repuestos para servicio técnico">
        <div className="text-center py-12">
          <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay componentes en inventario
          </h3>
          <p className="text-gray-600">
            Los componentes marcados para servicio técnico aparecerán aquí.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Inventario Técnico" subtitle="Gestión de componentes y repuestos para servicio técnico">
      <div className="space-y-6">
        {/* Resumen - Mobile Optimized */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Componentes</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{componentesDisponibles.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {componentesDisponibles.filter(c => c.estado === 'Disponible' && c.cantidadDisponible > 0).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Asignados</CardTitle>
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {componentesDisponibles.filter(c => c.estado === 'Asignado').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">En Reparación</CardTitle>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {componentesDisponibles.filter(c => c.estado === 'En reparación').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros - Mobile Optimized */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="busqueda">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="busqueda"
                    placeholder="Buscar por nombre, marca, modelo, serie..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="tipo">Tipo de Componente</Label>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los tipos</SelectItem>
                    {tiposUnicos.map(tipo => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="Disponible">Disponible</SelectItem>
                    <SelectItem value="Asignado">Asignado</SelectItem>
                    <SelectItem value="En reparación">En reparación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de componentes - Responsive */}
        <Card>
          <CardHeader>
            <CardTitle>Componentes ({componentesFiltrados.length})</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <MobileTable
              data={componentesFiltrados}
              columns={[
                { key: 'componente', label: 'Componente' },
                { key: 'marca', label: 'Marca/Modelo/Tipo' },
                { key: 'serie', label: 'N° Serie' },
                { key: 'stock', label: 'Stock & Estado' },
                { key: 'ubicacion', label: 'Ubicación' },
                { key: 'fecha', label: 'Fecha' },
                { key: 'acciones', label: 'Acciones' },
              ]}
              renderMobileCard={(componente, index) => (
                <MobileComponenteCard
                  componente={componente}
                  tipoColores={tipoComponenteColores}
                  estadoColores={estadoColores}
                  equipos={equipos}
                  formatearFecha={formatearFecha}
                  onAsignar={abrirModalAsignacion}
                  onAsignarDirecto={asignarDirectamenteAlEquipoPadre}
                  onHistorial={abrirModalHistorial}
                  asignando={asignando}
                />
              )}
              renderDesktopRow={(componente, index) => (
                <>
                  <TableCell>
                    <div>
                      <p className="font-medium">{componente.nombre}</p>
                      {/* 🎯 MOSTRAR INFO DEL EQUIPO PADRE */}
                      {(() => {
                        // Priorizar información directa del equipo padre
                        if (componente.equipoPadre) {
                          // Limpiar el nombre del equipo quitando el código de entrada
                          const nombreLimpio = componente.equipoPadre.nombreEquipo
                            .replace(/-ENTRADA-\d{8}-\d{3}/, '') // Quitar -ENTRADA-YYYYMMDD-XXX
                            .replace(/-\d{8}-\d{3}/, ''); // Quitar -YYYYMMDD-XXX como fallback

                          return (
                            <div className="mt-1">
                              <p className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                🏥 PARTE DEL EQUIPO {nombreLimpio}/{componente.equipoPadre.cliente.toUpperCase()}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Serie base: {componente.equipoPadre.numeroSerieBase}
                              </p>
                            </div>
                          );
                        }

                        // Buscar el equipo padre usando MISMA LÓGICA que la función de asignación
                        let equipoPadre = null;
                        if (componente.codigoCargaOrigen) {
                          // Usar búsqueda por código de carga exacto (no por marca)
                          equipoPadre = equipos.find(equipo =>
                            equipo.nombreEquipo.includes(componente.codigoCargaOrigen!)
                          );

                          if (equipoPadre) {
                            console.log('📝 Display - Equipo encontrado:', equipoPadre.nombreEquipo, '- Cliente:', equipoPadre.cliente);
                          }
                        }

                        if (equipoPadre) {
                          // Limpiar el nombre del equipo quitando el código de entrada
                          const nombreLimpio = equipoPadre.nombreEquipo
                            .replace(/-ENTRADA-\d{8}-\d{3}/, '') // Quitar -ENTRADA-YYYYMMDD-XXX
                            .replace(/-\d{8}-\d{3}/, ''); // Quitar -YYYYMMDD-XXX como fallback

                          return (
                            <div className="mt-1">
                              <p className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                🏥 PARTE DEL EQUIPO {nombreLimpio}/{equipoPadre.cliente.toUpperCase()}
                              </p>
                            </div>
                          );
                        }

                        // Si no encuentra equipo específico, mostrar info de la carga
                        if (componente.codigoCargaOrigen) {
                          return (
                            <p className="text-xs text-blue-600 mt-1">
                              📦 Ingresado desde {componente.codigoCargaOrigen}
                            </p>
                          );
                        }

                        return componente.observaciones && (
                          <p className="text-xs text-gray-600 truncate max-w-[200px]">
                            {componente.observaciones}
                          </p>
                        );
                      })()}
                    </div>
                  </TableCell>
                  {/* Columna combinada: Marca/Modelo/Tipo */}
                  <TableCell className="min-w-[180px]">
                    <div>
                      <p className="font-medium text-sm">{componente.marca}</p>
                      <p className="text-xs text-gray-600">{componente.modelo}</p>
                      <Badge
                        className={`${tipoComponenteColores[componente.tipoComponente as keyof typeof tipoComponenteColores] || 'bg-gray-100 text-gray-800'} mt-1`}
                        variant="secondary"
                      >
                        {componente.tipoComponente}
                      </Badge>
                    </div>
                  </TableCell>

                  {/* N° Serie - Oculto en móviles */}
                  <TableCell className="hidden sm:table-cell">
                    <span className="font-mono text-xs">
                      {componente.numeroSerie || 'N/A'}
                    </span>
                  </TableCell>

                  {/* Columna combinada: Stock & Estado */}
                  <TableCell className="min-w-[100px]">
                    <div className="text-center">
                      <div className="mb-1">
                        <span className="text-sm font-bold text-blue-600">
                          {componente.cantidadDisponible}
                        </span>
                        <span className="text-xs text-gray-500">
                          /{componente.cantidadOriginal}
                        </span>
                      </div>
                      <Badge
                        className={`${estadoColores[componente.estado as keyof typeof estadoColores]} text-xs`}
                        variant="secondary"
                      >
                        {componente.estado}
                      </Badge>
                    </div>
                  </TableCell>

                  {/* Ubicación - Oculto en tablets */}
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="text-xs truncate">{componente.ubicacionFisica || 'N/A'}</span>
                    </div>
                  </TableCell>

                  {/* Fecha - Solo en pantallas grandes */}
                  <TableCell className="hidden xl:table-cell">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-xs">{formatearFecha(componente.fechaIngreso)}</span>
                    </div>
                  </TableCell>
                  {/* Acciones - Simplificadas para técnico */}
                  <TableCell className="w-[120px]">
                    <div className="flex flex-col space-y-1">
                      {/* 🎯 Para técnico: solo botón de consulta/historial */}
                      {esTecnico ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => abrirModalHistorial(componente)}
                          className="h-8 w-full flex items-center justify-center"
                          title="Ver detalles del componente"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          <span className="text-xs">Ver</span>
                        </Button>
                      ) : (
                        // Para otros roles: funcionalidad completa de asignación
                        <>
                          {componente.cantidadDisponible > 0 && (() => {
                            // 🎯 DETECTAR EQUIPO POR CÓDIGO DE CARGA
                            let equipoPadreUnico = null;
                            let tieneEquipoPadre = false;

                            // 1️⃣ Verificar equipo padre directo
                            if (componente.equipoPadre) {
                              equipoPadreUnico = equipos.find(e => e.id === componente.equipoPadre!.equipoId);
                              tieneEquipoPadre = !!equipoPadreUnico;
                            }

                            // 2️⃣ Buscar por código de carga exacto (MISMA LÓGICA que la función)
                            if (!tieneEquipoPadre && componente.codigoCargaOrigen) {
                              const codigoComponente = componente.codigoCargaOrigen;
                              equipoPadreUnico = equipos.find(equipo =>
                                equipo.nombreEquipo.includes(codigoComponente)
                              );
                              tieneEquipoPadre = !!equipoPadreUnico;

                              // Debug para UI
                              if (equipoPadreUnico) {
                                console.log('🎯 UI detectó equipo padre:', equipoPadreUnico.nombreEquipo, '- Cliente:', equipoPadreUnico.cliente);
                              }
                            }

                            if (tieneEquipoPadre && equipoPadreUnico) {
                              // Obtener nombre limpio del equipo único identificado
                              const nombreLimpio = equipoPadreUnico.nombreEquipo
                                .replace(/-ENTRADA-\d{8}-\d{3}/, '')
                                .replace(/-\d{8}-\d{3}/, '') || 'Equipo';

                              return (
                                <div className="flex flex-col space-y-1">
                                  {/* Botón de asignación directa */}
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => asignarDirectamenteAlEquipoPadre(componente)}
                                    className="h-7 px-2 bg-blue-600 hover:bg-blue-700 text-xs"
                                    title={`Asignar directamente a ${nombreLimpio}/${equipoPadreUnico.cliente}`}
                                    disabled={asignando}
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span className="hidden lg:inline ml-1 truncate max-w-[60px]">
                                      → {nombreLimpio.substring(0, 8)}...
                                    </span>
                                  </Button>

                                  {/* Botón manual como alternativa */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => abrirModalAsignacion(componente)}
                                    className="h-6 px-1 text-xs"
                                    title="Asignar a otro equipo"
                                  >
                                    <Plus className="w-2 h-2" />
                                    <span className="hidden xl:inline ml-1">Otro</span>
                                  </Button>
                                </div>
                              );
                            } else {
                              // Sin código de carga o equipo padre, asignación manual
                              return (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => abrirModalAsignacion(componente)}
                                  className="h-8 px-2"
                                  title="Asignar componente manualmente"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span className="hidden md:inline ml-1">Asignar</span>
                                </Button>
                              );
                            }
                          })()}

                          {/* Botón de historial */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => abrirModalHistorial(componente)}
                            className="h-6 w-full p-0"
                            title="Ver historial"
                          >
                            <History className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </>
              )}
              emptyStateIcon={Package}
              emptyStateTitle="No hay componentes"
              emptyStateMessage="No se encontraron componentes que coincidan con los filtros"
            />
          </CardContent>
        </Card>

        {/* Modal de Asignación */}
        <AnimatePresence>
          {modalAsignacion && componenteSeleccionado && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setModalAsignacion(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Asignar Componente</h3>
                  <button
                    onClick={() => setModalAsignacion(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="font-medium">{componenteSeleccionado.nombre}</p>
                    <p className="text-sm text-gray-600">
                      {componenteSeleccionado.marca} - {componenteSeleccionado.modelo}
                    </p>
                    <p className="text-sm text-blue-600">
                      Disponible: {componenteSeleccionado.cantidadDisponible} unidades
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="equipoDestino">Equipo Destino *</Label>
                    <Select value={equipoDestino} onValueChange={setEquipoDestino}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar equipo..." />
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

                  <div>
                    <Label htmlFor="cantidadAsignar">Cantidad a Asignar</Label>
                    <Input
                      id="cantidadAsignar"
                      type="number"
                      min="1"
                      max={componenteSeleccionado.cantidadDisponible}
                      value={cantidadAsignar}
                      onChange={(e) => setCantidadAsignar(parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="motivoAsignacion">Motivo</Label>
                    <Select value={motivoAsignacion} onValueChange={setMotivoAsignacion}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Instalación">Instalación</SelectItem>
                        <SelectItem value="Reemplazo">Reemplazo</SelectItem>
                        <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                        <SelectItem value="Upgrade">Upgrade</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tecnicoResponsable">Técnico Responsable</Label>
                    <Input
                      id="tecnicoResponsable"
                      value={tecnicoResponsable}
                      onChange={(e) => setTecnicoResponsable(e.target.value)}
                      placeholder="Nombre del técnico (opcional)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="observacionesAsignacion">Observaciones</Label>
                    <Textarea
                      id="observacionesAsignacion"
                      value={observacionesAsignacion}
                      onChange={(e) => setObservacionesAsignacion(e.target.value)}
                      placeholder="Detalles adicionales (opcional)"
                      className="min-h-[60px]"
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setModalAsignacion(false)}
                      disabled={asignando}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleAsignarComponente}
                      disabled={asignando || !equipoDestino}
                    >
                      {asignando ? 'Asignando...' : 'Asignar Componente'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de Historial */}
        <AnimatePresence>
          {modalHistorial && historialSeleccionado && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setModalHistorial(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Historial de Asignaciones</h3>
                  <button
                    onClick={() => setModalHistorial(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">{historialSeleccionado.nombre}</p>
                    <p className="text-sm text-gray-600">
                      {historialSeleccionado.marca} - {historialSeleccionado.modelo}
                    </p>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {obtenerHistorialComponente(historialSeleccionado.id).length === 0 ? (
                      <p className="text-center text-gray-500 py-4">
                        No hay asignaciones registradas para este componente.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {obtenerHistorialComponente(historialSeleccionado.id).map((asignacion) => (
                          <div key={asignacion.id} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium">
                                  {asignacion.equipo?.nombreEquipo} - {asignacion.equipo?.cliente}
                                </p>
                                <p className="text-sm text-gray-600">{asignacion.equipo?.ubicacion}</p>
                              </div>
                              <Badge variant="outline">
                                {asignacion.motivo}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Cantidad asignada:</span>
                                <span className="ml-2 font-medium">{asignacion.cantidadAsignada}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Fecha:</span>
                                <span className="ml-2">{formatearFecha(asignacion.fechaAsignacion)}</span>
                              </div>
                              {asignacion.tecnicoResponsable && (
                                <div>
                                  <span className="text-gray-600">Técnico:</span>
                                  <span className="ml-2">{asignacion.tecnicoResponsable}</span>
                                </div>
                              )}
                            </div>
                            {asignacion.observaciones && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                <span className="text-gray-600">Observaciones:</span>
                                <p className="mt-1">{asignacion.observaciones}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
} 