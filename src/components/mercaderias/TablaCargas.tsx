'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFieldMode } from '@/hooks/useDevice';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Search, Eye, Package, Calendar, ShoppingCart, Box, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const tipoProductoColores = {
  'Insumo': 'bg-green-100 text-green-800',
  'Repuesto': 'bg-yellow-100 text-yellow-800',
  'Equipo Médico': 'bg-blue-100 text-blue-800'
};

export function TablaCargas() {
  const { getCargasMercaderia, deleteCarga, loadAllData } = useAppStore();
  const { isFieldMode } = useFieldMode();
  const [busqueda, setBusqueda] = useState('');
  const [cargaSeleccionada, setCargaSeleccionada] = useState<string | null>(null);
  const [cargaAEliminar, setCargaAEliminar] = useState<{ id: string; codigo: string } | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  
  // Ref para hacer scroll automático al detalle
  const detalleRef = useRef<HTMLDivElement>(null);

  const cargas = getCargasMercaderia();
  
  // Función para seleccionar carga y hacer scroll automático
  const seleccionarCarga = (cargaId: string | null) => {
    setCargaSeleccionada(cargaId);
  };

  // useEffect para hacer scroll automático cuando se selecciona una carga
  useEffect(() => {
    if (cargaSeleccionada && detalleRef.current) {
      // Delay más largo para asegurar que el DOM se actualice
      setTimeout(() => {
        detalleRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }, 300);
    }
  }, [cargaSeleccionada]);

  // 🔥 FUNCIÓN PARA REFRESCAR MANUALMENTE
  const refrescarDatos = async () => {
    setRefrescando(true);
    try {
      console.log('🔄 Refrescando datos manualmente...');
      await loadAllData();
      console.log('✅ Datos refrescados exitosamente');
      toast.success('Datos actualizados', {
        description: 'Las cargas se han actualizado desde la base de datos.'
      });
    } catch (error) {
      console.error('❌ Error al refrescar:', error);
      toast.error('Error al actualizar', {
        description: 'No se pudieron cargar los datos actualizados.'
      });
    } finally {
      setRefrescando(false);
    }
  };

  // 🔥 FORZAR RECARGA DE DATOS FRESCOS AL MONTAR EL COMPONENTE
  useEffect(() => {
    console.log('🔄 Forzando recarga de datos desde Supabase...');
    loadAllData().then(() => {
      console.log('✅ Datos recargados desde Supabase');
    });
  }, [loadAllData]);
  
  const cargasFiltradas = cargas.filter(carga =>
    carga.codigoCarga.toLowerCase().includes(busqueda.toLowerCase()) ||
    (carga.numeroCargaPersonalizado && carga.numeroCargaPersonalizado.toLowerCase().includes(busqueda.toLowerCase())) ||
    carga.destino.toLowerCase().includes(busqueda.toLowerCase()) ||
    carga.productos.some(producto =>
      producto.producto.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.modelo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (producto.numeroSerie && producto.numeroSerie.toLowerCase().includes(busqueda.toLowerCase())) ||
      (producto.voltaje && producto.voltaje.toLowerCase().includes(busqueda.toLowerCase())) ||
      (producto.frecuencia && producto.frecuencia.toLowerCase().includes(busqueda.toLowerCase()))
    )
  );

  const formatearFecha = (fecha: string) => {
    try {
      // Asegurar que la fecha se interprete en la zona horaria local
      const date = new Date(fecha + 'T00:00:00');
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return fecha;
    }
  };

  const obtenerCodigoCarga = (carga: any) => {
    // Priorizar el número personalizado si existe, sino usar el código automático
    return carga.numeroCargaPersonalizado || carga.codigoCarga;
  };

  const contarTiposProductos = (productos: any[]) => {
    const tipos = productos.reduce((acc, producto) => {
      acc[producto.tipoProducto] = (acc[producto.tipoProducto] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return tipos;
  };

  const handleEliminarCarga = async () => {
    if (!cargaAEliminar) return;
    
    setEliminando(true);
    try {
      await deleteCarga(cargaAEliminar.id);
      toast.success('Carga eliminada exitosamente', {
        description: `La carga ${cargaAEliminar.codigo} ha sido eliminada permanentemente.`
      });
      setCargaAEliminar(null);
      seleccionarCarga(null); // Cerrar detalle si estaba abierto
    } catch (error) {
      toast.error('Error al eliminar la carga', {
        description: 'Por favor, intenta nuevamente.'
      });
    } finally {
      setEliminando(false);
    }
  };

  const renderDetalleProducto = (producto: any, index: number): React.ReactElement => {
    const esEquipoEstetico = producto.tipoProducto === 'Equipo Médico';
    
    return (
      <div key={producto.id} className="bg-white border rounded-lg p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
              {index + 1}
            </span>
            <div>
              <h5 className="font-semibold">{producto.producto}</h5>
              <p className="text-sm text-gray-600">
                {producto.marca} - {producto.modelo}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              className={tipoProductoColores[producto.tipoProducto as keyof typeof tipoProductoColores]}
              variant="secondary"
            >
              {producto.tipoProducto === 'Equipo Médico' ? '🏥 Equipo Estético' : 
               producto.tipoProducto === 'Insumo' ? '📦 Insumo' : '🔧 Repuesto'}
            </Badge>
            {/* 🎯 NUEVO: Badge para productos marcados para servicio técnico */}
            {producto.paraServicioTecnico && 
              <Badge className="bg-blue-100 text-blue-800 text-xs" variant="secondary">
                🔧 Servicio
              </Badge>
            }
            <span className="px-2 py-1 bg-gray-100 rounded-full text-sm">
              Cant: {producto.cantidad}
            </span>
          </div>
        </div>

        {/* Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {producto.numeroSerie && (
            <div className="flex">
              <span className="font-medium min-w-[100px]">N° Serie:</span>
              <span className="text-gray-700">{producto.numeroSerie}</span>
            </div>
          )}
          {producto.registroSanitario && (
            <div className="flex">
              <span className="font-medium min-w-[100px]">Reg. Sanitario:</span>
              <span className="text-gray-700">{producto.registroSanitario}</span>
            </div>
          )}
        </div>

        {/* Especificaciones técnicas para equipos estéticos */}
        {esEquipoEstetico && (producto.voltaje || producto.frecuencia || producto.tipoTratamiento) && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h6 className="font-medium text-blue-900 mb-2">⚡ Especificaciones Técnicas</h6>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              {producto.voltaje && (
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="text-gray-600">Voltaje:</span>
                  <span className="font-medium text-blue-800">{producto.voltaje}</span>
                </div>
              )}
              {producto.frecuencia && (
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-600">Frecuencia:</span>
                  <span className="font-medium text-green-800">{producto.frecuencia}</span>
                </div>
              )}
              {producto.tipoTratamiento && (
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span className="text-gray-600">Tratamiento:</span>
                  <span className="font-medium text-purple-800">{producto.tipoTratamiento}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Observaciones y documentos */}
        {(producto.observaciones || producto.documentosAduaneros) && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {producto.observaciones && (
              <div>
                <span className="font-medium text-gray-700">Observaciones:</span>
                <p className="text-gray-600 mt-1 p-2 bg-gray-50 rounded">{producto.observaciones}</p>
              </div>
            )}
            {producto.documentosAduaneros && (
              <div>
                <span className="font-medium text-gray-700">Documentos Aduaneros:</span>
                <p className="text-gray-600 mt-1 p-2 bg-gray-50 rounded">{producto.documentosAduaneros}</p>
              </div>
            )}
          </div>
        )}

        {/* Imagen */}
        {producto.imagen && (
          <div className="mt-4">
            <p className="font-medium mb-2">📸 Imagen del Producto:</p>
            <img
              src={producto.imagen}
              alt={producto.producto}
              className="w-24 h-24 object-cover rounded border"
            />
          </div>
        )}

        {/* Subitems */}
        {producto.subitems && producto.subitems.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="font-medium mb-2">
              🔧 Componentes/Accesorios ({producto.subitems.length}):
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {producto.subitems.map((subitem: any) => (
                <div
                  key={subitem.id}
                  className={`p-2 rounded border text-xs ${
                    subitem.paraServicioTecnico 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{subitem.nombre}</p>
                    {subitem.paraServicioTecnico && (
                      <Badge className="bg-blue-100 text-blue-800 text-[10px] px-1 py-0">
                        🔧 Servicio
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600">S/N: {subitem.numeroSerie || 'N/A'}</p>
                  <p className="text-gray-600">Cant: {subitem.cantidad}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (cargas.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay cargas registradas
        </h3>
        <p className="text-gray-600">
          Las cargas de mercaderías aparecerán aquí una vez que las registres.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Buscador móvil optimizado */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="🔍 Buscar por código, destino, producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refrescarDatos}
          disabled={refrescando}
          className="flex items-center justify-center space-x-2 w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 ${refrescando ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{refrescando ? 'Actualizando...' : 'Actualizar'}</span>
          <span className="sm:hidden">{refrescando ? 'Actualizando...' : 'Actualizar'}</span>
        </Button>
      </div>

      {/* Vista Móvil: Cards */}
      {isFieldMode ? (
        <div className="space-y-2 w-full max-w-full overflow-hidden">
          {cargasFiltradas.map((carga) => {
            const tiposProductos = contarTiposProductos(carga.productos);
            const equiposMedicos = carga.productos.filter((p: any) => p.tipoProducto === 'Equipo Médico').length;
            
            return (
              <div key={carga.id} className="bg-white border rounded-lg p-2 sm:p-3 shadow-sm hover:shadow-md transition-all w-full max-w-full overflow-hidden">
                                  {/* Header Compacto */}
                  <div className="mb-2">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-bold text-sm text-gray-900 truncate flex-1 pr-1 min-w-0">
                        {obtenerCodigoCarga(carga)}
                      </h3>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <Package className="w-3 h-3 text-gray-400" />
                        <span className="font-bold text-blue-600 text-xs">{carga.productos.length}</span>
                        {equiposMedicos > 0 && (
                          <>
                            <Box className="w-3 h-3 text-blue-600" />
                            <span className="text-blue-600 font-medium text-xs">{equiposMedicos}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {carga.numeroCargaPersonalizado && carga.numeroCargaPersonalizado !== carga.codigoCarga && (
                      <p className="text-xs text-gray-500 mb-1 truncate">Auto: {carga.codigoCarga}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 min-w-0 flex-1">
                        <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-600 truncate">{formatearFecha(carga.fechaIngreso)}</span>
                      </div>
                      
                      {/* Tipo */}
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        {carga.tipoCarga === 'stock' ? (
                          <>
                            <span className="text-xs">📦</span>
                            <span className="text-xs font-medium text-green-700">Stock</span>
                          </>
                        ) : (
                          <>
                            <span className="text-xs">🏥</span>
                            <span className="text-xs font-medium text-blue-700">Cliente</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                                  {/* Destino Compacto */}
                  <div className="mb-2 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">DESTINO</p>
                    <p className="font-medium text-xs truncate overflow-hidden">
                      {carga.tipoCarga === 'stock' ? 'Stock/Inventario' : carga.destino}
                    </p>
                    {carga.tipoCarga === 'cliente' && carga.cliente && (
                      <p className="text-xs text-gray-600 truncate overflow-hidden">{carga.cliente}</p>
                    )}
                  </div>

                  {/* Tipos de productos Compacto */}
                  <div className="mb-2 min-w-0">
                    <div className="flex flex-wrap gap-1 overflow-hidden">
                      {Object.entries(tiposProductos).map(([tipo, cantidad]) => (
                        <Badge 
                          key={tipo}
                          className={`${tipoProductoColores[tipo as keyof typeof tipoProductoColores]} text-xs px-1 py-0.5 whitespace-nowrap`}
                          variant="secondary"
                        >
                          {cantidad}x {tipo === 'Equipo Médico' ? 'Equipo' : tipo}
                        </Badge>
                      ))}
                    </div>
                  </div>

                                  {/* Acciones Compactas */}
                  <div className="flex items-center space-x-1 pt-2 border-t border-gray-200 min-w-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => seleccionarCarga(
                        cargaSeleccionada === carga.id ? null : carga.id
                      )}
                      className="flex items-center space-x-1 flex-1 h-7 text-xs min-w-0"
                    >
                      <Eye className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">Ver</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCargaAEliminar({ id: carga.id, codigo: obtenerCodigoCarga(carga) })}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center space-x-1 flex-1 h-7 text-xs min-w-0"
                    >
                      <Trash2 className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">Eliminar</span>
                    </Button>
                  </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Vista Desktop: Tabla */
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código de Carga</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Tipos</TableHead>
                <TableHead>Equipos Médicos</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargasFiltradas.map((carga) => {
                const tiposProductos = contarTiposProductos(carga.productos);
                const equiposMedicos = carga.productos.filter((p: any) => p.tipoProducto === 'Equipo Médico').length;
                
                return (
                  <TableRow key={carga.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      <div>
                        <span className="font-medium">{obtenerCodigoCarga(carga)}</span>
                        {carga.numeroCargaPersonalizado && carga.numeroCargaPersonalizado !== carga.codigoCarga && (
                          <p className="text-xs text-gray-500">Auto: {carga.codigoCarga}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatearFecha(carga.fechaIngreso)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {carga.tipoCarga === 'stock' ? (
                          <>
                            <span className="text-xl">📦</span>
                            <span className="text-sm font-medium text-green-700">Stock</span>
                          </>
                        ) : (
                          <>
                            <span className="text-xl">🏥</span>
                            <span className="text-sm font-medium text-blue-700">Cliente</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="truncate font-medium">
                          {carga.tipoCarga === 'stock' ? 'Stock/Inventario' : carga.destino}
                        </p>
                        {carga.tipoCarga === 'cliente' && carga.cliente && (
                          <p className="text-xs text-gray-500 truncate">{carga.cliente}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{carga.productos.length}</span>
                        <span className="text-gray-600 text-sm">productos</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(tiposProductos).map(([tipo, cantidad]) => (
                          <Badge 
                            key={tipo}
                            className={`${tipoProductoColores[tipo as keyof typeof tipoProductoColores]} text-xs`}
                            variant="secondary"
                          >
                            {cantidad}x {tipo === 'Equipo Médico' ? 'Equipo' : tipo}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {equiposMedicos > 0 ? (
                        <div className="flex items-center space-x-2">
                          <Box className="w-4 h-4 text-blue-600" />
                          <span className="text-blue-600 font-medium">{equiposMedicos}</span>
                          <span className="text-xs text-blue-600">enviado(s)</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                                            <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => seleccionarCarga(
                        cargaSeleccionada === carga.id ? null : carga.id
                      )}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCargaAEliminar({ id: carga.id, codigo: obtenerCodigoCarga(carga) })}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detalle de carga - MEJORADO */}
      {cargaSeleccionada && cargas.find(c => c.id === cargaSeleccionada) && (
        <div ref={detalleRef} className="border rounded-lg p-3 sm:p-6 bg-gray-50 space-y-4 sm:space-y-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-semibold text-xl">
                📦 Detalle de Carga: {obtenerCodigoCarga(cargas.find(c => c.id === cargaSeleccionada)!)}
              </h3>
              <p className="text-gray-600 mt-1">
                📅 {formatearFecha(cargas.find(c => c.id === cargaSeleccionada)!.fechaIngreso)} • 
                📍 {cargas.find(c => c.id === cargaSeleccionada)!.destino}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => seleccionarCarga(null)}
            >
              ✕
            </Button>
          </div>

          {cargas.find(c => c.id === cargaSeleccionada)!.observacionesGenerales && (
            <div className="mb-6">
              <h4 className="font-medium mb-2">📝 Observaciones Generales</h4>
              <p className="text-gray-700 bg-white p-3 rounded border">
                {cargas.find(c => c.id === cargaSeleccionada)!.observacionesGenerales}
              </p>
            </div>
          )}

          <div>
            <h4 className="font-medium mb-4">
              📦 Productos de la Carga ({cargas.find(c => c.id === cargaSeleccionada)!.productos.length})
            </h4>
            <div className="grid gap-4">
              {cargas.find(c => c.id === cargaSeleccionada)!.productos.map((producto: any, index: number) => 
                renderDetalleProducto(producto, index)
              )}
            </div>
          </div>
        </div>
      )}

      {/* Información de resultados - Mobile Optimized */}
      <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
        Mostrando {cargasFiltradas.length} de {cargas.length} cargas
      </div>

      {/* Dialog de confirmación para eliminación */}
      <ConfirmationDialog
        isOpen={cargaAEliminar !== null}
        title="Eliminar Carga"
        message={`¿Estás seguro de que deseas eliminar la carga ${cargaAEliminar?.codigo}? Esta acción eliminará todos los productos asociados y no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleEliminarCarga}
        onCancel={() => setCargaAEliminar(null)}
        isDangerous={true}
        isLoading={eliminando}
      />
    </div>
  );
} 