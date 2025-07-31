'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  X, 
  Search, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  BarChart3, 
  RefreshCw,
  Calendar,
  Package,
  TrendingUp,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import type { MovimientoStock } from '@/lib/database';

interface MovimientosCarpetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  carpeta: string;
}

export function MovimientosCarpetaModal({
  isOpen,
  onClose,
  carpeta
}: MovimientosCarpetaModalProps) {
  const { getMovimientosByCarpeta, getEstadisticasPorCarpeta } = useAppStore();
  const [movimientos, setMovimientos] = useState<MovimientoStock[]>([]);
  const [movimientosFiltrados, setMovimientosFiltrados] = useState<MovimientoStock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');

  const estadisticasCarpeta = getEstadisticasPorCarpeta(carpeta);

  useEffect(() => {
    if (isOpen && carpeta) {
      cargarMovimientos();
    }
  }, [isOpen, carpeta]);

  useEffect(() => {
    filtrarMovimientos();
  }, [movimientos, busqueda, filtroTipo]);

  const cargarMovimientos = async () => {
    try {
      setIsLoading(true);
      const movimientosCarpeta = await getMovimientosByCarpeta(carpeta);
      setMovimientos(movimientosCarpeta);
    } catch (error) {
      console.error('Error cargando movimientos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filtrarMovimientos = () => {
    let filtrados = movimientos;

    // Filtrar por búsqueda
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();
      filtrados = filtrados.filter(mov =>
        mov.productoNombre.toLowerCase().includes(termino) ||
        mov.productoMarca?.toLowerCase().includes(termino) ||
        mov.motivo.toLowerCase().includes(termino) ||
        mov.cliente?.toLowerCase().includes(termino)
      );
    }

    // Filtrar por tipo
    if (filtroTipo !== 'TODOS') {
      filtrados = filtrados.filter(mov => mov.tipoMovimiento === filtroTipo);
    }

    setMovimientosFiltrados(filtrados);
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'Entrada':
        return <ArrowUpCircle className="h-4 w-4 text-green-500" />;
      case 'Salida':
        return <ArrowDownCircle className="h-4 w-4 text-red-500" />;
      case 'Ajuste':
        return <BarChart3 className="h-4 w-4 text-orange-500" />;
      case 'Transferencia':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'Asignacion':
        return <RefreshCw className="h-4 w-4 text-purple-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'Entrada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Salida':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Ajuste':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Transferencia':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Asignacion':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-PY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-6 w-6 text-blue-500" />
              <div>
                <h2 className="text-xl font-semibold">Movimientos de Stock</h2>
                <p className="text-sm text-muted-foreground">Carpeta: {carpeta}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Estadísticas de la carpeta */}
          <div className="p-6 border-b bg-gray-50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {estadisticasCarpeta.totalMovimientos}
                </div>
                <p className="text-sm text-muted-foreground">Total Movimientos</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {estadisticasCarpeta.entradas.total}
                </div>
                <p className="text-sm text-muted-foreground">Entradas</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {estadisticasCarpeta.salidas.total}
                </div>
                <p className="text-sm text-muted-foreground">Salidas</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {estadisticasCarpeta.productosUnicos}
                </div>
                <p className="text-sm text-muted-foreground">Productos Únicos</p>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="p-6 border-b">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por producto, marca, motivo..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex space-x-2">
                {['TODOS', 'Entrada', 'Salida', 'Ajuste', 'Transferencia', 'Asignacion'].map((tipo) => (
                  <Button
                    key={tipo}
                    variant={filtroTipo === tipo ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFiltroTipo(tipo)}
                    className="flex items-center space-x-1"
                  >
                    {tipo !== 'TODOS' && getTipoIcon(tipo)}
                    <span>{tipo}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Lista de movimientos */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : movimientosFiltrados.length > 0 ? (
              <div className="space-y-4">
                {movimientosFiltrados.map((movimiento) => (
                  <Card key={movimiento.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          {getTipoIcon(movimiento.tipoMovimiento)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium">{movimiento.productoNombre}</h4>
                              <Badge className={getTipoBadgeColor(movimiento.tipoMovimiento)}>
                                {movimiento.tipoMovimiento}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {movimiento.productoMarca} - {movimiento.productoModelo}
                            </p>
                            <p className="text-sm">
                              <strong>Motivo:</strong> {movimiento.motivo}
                            </p>
                            
                            {/* 🔧 Información mejorada para servicios técnicos */}
                            {movimiento.motivo === 'Utilizado en servicio técnico' && movimiento.observaciones && (
                              <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-xs font-medium text-blue-800 mb-1">📋 Detalles del Servicio:</p>
                                <p className="text-xs text-blue-700">{movimiento.observaciones}</p>
                              </div>
                            )}
                            
                            {/* 🔄 Información para devoluciones por eliminación de reportes */}
                            {(movimiento.motivo === 'Reporte eliminado completamente' || movimiento.motivo === 'Reporte eliminado desde equipo') && movimiento.observaciones && (
                              <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-xs font-medium text-green-800 mb-1">🔄 Devolución Automática:</p>
                                <p className="text-xs text-green-700">{movimiento.observaciones}</p>
                              </div>
                            )}
                            
                            {movimiento.descripcion && movimiento.motivo !== 'Utilizado en servicio técnico' && (
                              <p className="text-sm text-muted-foreground">
                                {movimiento.descripcion}
                              </p>
                            )}
                            
                            {movimiento.cliente && (
                              <p className="text-sm">
                                <strong>Cliente:</strong> {movimiento.cliente}
                              </p>
                            )}
                            {movimiento.numeroFactura && (
                              <p className="text-sm">
                                <strong>Factura:</strong> {movimiento.numeroFactura}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {movimiento.tipoMovimiento === 'Salida' ? '-' : '+'}
                            {movimiento.cantidad}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatFecha(movimiento.fechaMovimiento)}
                          </p>
                          {movimiento.valorTotal && (
                            <p className="text-sm font-medium text-green-600">
                              {formatCurrency(movimiento.valorTotal)}
                            </p>
                          )}
                          {movimiento.usuarioResponsable && (
                            <p className="text-xs text-muted-foreground">
                              Por: {movimiento.usuarioResponsable}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No hay movimientos
                </h3>
                <p className="text-sm text-muted-foreground">
                  {busqueda || filtroTipo !== 'TODOS' 
                    ? 'No se encontraron movimientos con los filtros aplicados'
                    : 'Esta carpeta aún no tiene movimientos registrados'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <p className="text-sm text-muted-foreground">
              Mostrando {movimientosFiltrados.length} de {movimientos.length} movimientos
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={cargarMovimientos}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Exportar</span>
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}