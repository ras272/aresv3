'use client';

import { useState } from 'react';
import { Edit2, Trash2, FileText, Calendar, Package, User, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TransaccionSortly {
  id: string;
  fecha_transaccion: string;
  factura_os: string | null;
  remision: string | null;
  producto_descripcion: string;
  cantidad: number;
  cliente_destino: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

interface TablaTransaccionesProps {
  transacciones: TransaccionSortly[];
  loading: boolean;
  onEditar: (transaccion: TransaccionSortly) => void;
  onEliminar: (id: string) => void;
}

export function TablaTransacciones({ transacciones, loading, onEditar, onEliminar }: TablaTransaccionesProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50; // Aumentar elementos por página

  const totalPages = Math.ceil(transacciones.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const transaccionesPaginadas = transacciones.slice(startIndex, endIndex);

  const formatearFecha = (fecha: string) => {
    // Crear la fecha como fecha local, no UTC
    const fechaLocal = new Date(fecha + 'T00:00:00');
    return fechaLocal.toLocaleDateString('es-PY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Eliminar la función getBadgeColor ya que no usamos badges de tipo

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando transacciones...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-gray-300 h-10 w-10"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transacciones.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No hay transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No se encontraron transacciones</p>
            <p className="text-gray-400">Agrega la primera transacción de Sortly para comenzar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Listado de Transacciones ({transacciones.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[600px] overflow-y-auto">
        {/* Tabla para pantallas grandes */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>FACTURA/OS</TableHead>
                <TableHead>REMISIÓN</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Cliente/Destino</TableHead>
                <TableHead>Observaciones</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transaccionesPaginadas.map((transaccion) => (
                <TableRow key={transaccion.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {formatearFecha(transaccion.fecha_transaccion)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {transaccion.factura_os ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        {transaccion.factura_os}
                      </Badge>
                    ) : (
                      <span className="text-gray-400 italic">Sin factura</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {transaccion.remision ? (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        {transaccion.remision}
                      </Badge>
                    ) : (
                      <span className="text-gray-400 italic">Sin remisión</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={transaccion.producto_descripcion}>
                      {transaccion.producto_descripcion}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      {transaccion.cantidad}
                    </div>
                  </TableCell>
                  <TableCell>
                    {transaccion.cliente_destino || (
                      <span className="text-gray-400 italic">No especificado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {transaccion.observaciones ? (
                      <div className="max-w-xs truncate" title={transaccion.observaciones}>
                        {transaccion.observaciones}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Sin observaciones</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditar(transaccion)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onEliminar(transaccion.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Cards para pantallas pequeñas */}
        <div className="md:hidden space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {transaccionesPaginadas.map((transaccion) => (
            <Card key={transaccion.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-2">
                    {transaccion.factura_os && (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        F: {transaccion.factura_os}
                      </Badge>
                    )}
                    {transaccion.remision && (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        R: {transaccion.remision}
                      </Badge>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditar(transaccion)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onEliminar(transaccion.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{formatearFecha(transaccion.fecha_transaccion)}</span>
                  </div>

                  {(transaccion.factura_os || transaccion.remision) && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <div className="flex gap-2">
                        {transaccion.factura_os && <span>F: {transaccion.factura_os}</span>}
                        {transaccion.remision && <span>R: {transaccion.remision}</span>}
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2 text-sm">
                    <Package className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{transaccion.producto_descripcion}</p>
                      <p className="text-gray-500">Cantidad: {transaccion.cantidad}</p>
                    </div>
                  </div>

                  {transaccion.cliente_destino && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{transaccion.cliente_destino}</span>
                    </div>
                  )}

                  {transaccion.observaciones && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {transaccion.observaciones}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <Button
                  key={i}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(i + 1)}
                  className="w-8 h-8 p-0"
                >
                  {i + 1}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        )}

        <div className="text-center text-sm text-gray-500 mt-4">
          Mostrando {startIndex + 1} - {Math.min(endIndex, transacciones.length)} de {transacciones.length} transacciones
        </div>
      </CardContent>
    </Card>
  );
}