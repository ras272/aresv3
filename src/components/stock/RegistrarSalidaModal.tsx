'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/store/useAppStore';
import { 
  X, 
  ArrowDownCircle, 
  Package, 
  User, 
  MapPin,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface ProductoAgrupado {
  id: string;
  nombre: string;
  marca: string;
  modelo: string;
  tipoComponente: string;
  cantidadTotal: number;
  ubicaciones: Array<{
    ubicacion: string;
    cantidad: number;
    componenteIds: string[];
  }>;
  detallesNumerosSerie: {
    sinNumeroSerie: number;
    conNumeroSerie: Array<{
      numeroSerie: string;
      cantidad: number;
      componenteId: string;
    }>;
  };
  imagen?: string;
  observaciones?: string;
}

interface RegistrarSalidaModalProps {
  isOpen: boolean;
  onClose: () => void;
  producto: ProductoAgrupado | null;
  carpeta: string;
  onRegistrarSalida: (salidaData: {
    itemId: string;
    productoNombre: string;
    productoMarca?: string;
    productoModelo?: string;
    cantidad: number;
    cantidadAnterior: number;
    motivo: string;
    destino: string;
    responsable: string;
    cliente?: string;
    numeroFactura?: string;
    observaciones?: string;
    carpetaOrigen?: string;
  }) => Promise<void>;
}

export function RegistrarSalidaModal({
  isOpen,
  onClose,
  producto,
  carpeta,
  onRegistrarSalida
}: RegistrarSalidaModalProps) {
  const [cantidad, setCantidad] = useState<number>(1);
  const [motivo, setMotivo] = useState<string>('');
  const [destino, setDestino] = useState<string>('');
  const [responsable, setResponsable] = useState<string>('');
  const [cliente, setCliente] = useState<string>('');
  const [clientePersonalizado, setClientePersonalizado] = useState<string>('');
  const [numeroFactura, setNumeroFactura] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const { clinicas } = useAppStore();

  const motivosComunes = [
    'Venta a cliente',
    'Asignación a equipo',
    'Transferencia a técnico',
    'Reparación externa',
    'Devolución a proveedor',
    'Producto defectuoso',
    'Uso interno',
    'Otro'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!producto) return;

    // Validaciones
    if (cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    if (cantidad > producto.cantidadTotal) {
      toast.error(`No hay suficiente stock. Disponible: ${producto.cantidadTotal}`);
      return;
    }

    if (!motivo.trim()) {
      toast.error('El motivo es requerido');
      return;
    }

    if (!destino.trim()) {
      toast.error('El destino es requerido');
      return;
    }

    if (!responsable.trim()) {
      toast.error('El responsable es requerido');
      return;
    }

    try {
      setIsLoading(true);

      // Usar el primer componente ID disponible (simplificado)
      const itemId = producto.ubicaciones[0]?.componenteIds[0] || producto.id;

      // Determinar el cliente final
      const clienteFinal = cliente === 'Otro' ? clientePersonalizado.trim() : cliente.trim();

      await onRegistrarSalida({
        itemId,
        productoNombre: producto.nombre,
        productoMarca: producto.marca,
        productoModelo: producto.modelo,
        cantidad,
        cantidadAnterior: producto.cantidadTotal,
        motivo,
        destino,
        responsable,
        cliente: clienteFinal || undefined,
        numeroFactura: numeroFactura.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
        carpetaOrigen: carpeta
      });

      toast.success('Salida registrada exitosamente');
      handleClose();

    } catch (error) {
      console.error('Error registrando salida:', error);
      toast.error('Error al registrar la salida');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCantidad(1);
    setMotivo('');
    setDestino('');
    setResponsable('');
    setCliente('');
    setClientePersonalizado('');
    setNumeroFactura('');
    setObservaciones('');
    onClose();
  };

  if (!isOpen || !producto) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="border-0 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center space-x-3">
                <ArrowDownCircle className="h-6 w-6 text-red-500" />
                <div>
                  <CardTitle className="text-xl">Registrar Salida de Stock</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {producto.nombre} - {producto.marca} {producto.modelo}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Información del producto */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Package className="h-5 w-5 text-blue-500 mt-1" />
                    <div>
                      <h4 className="font-medium">{producto.nombre}</h4>
                      <p className="text-sm text-muted-foreground">
                        {producto.marca} - {producto.modelo}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {producto.tipoComponente}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {producto.cantidadTotal}
                    </div>
                    <p className="text-sm text-muted-foreground">Disponible</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Cantidad */}
                <div>
                  <label htmlFor="cantidad" className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad a Retirar *
                  </label>
                  <Input
                    id="cantidad"
                    type="number"
                    min="1"
                    max={producto.cantidadTotal}
                    value={cantidad}
                    onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                    className="w-full"
                    required
                  />
                  {cantidad > producto.cantidadTotal && (
                    <div className="flex items-center space-x-2 mt-2 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">No hay suficiente stock disponible</span>
                    </div>
                  )}
                </div>

                {/* Motivo */}
                <div>
                  <label htmlFor="motivo" className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de la Salida *
                  </label>
                  <Select value={motivo} onValueChange={setMotivo}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar motivo de salida..." />
                    </SelectTrigger>
                    <SelectContent>
                      {motivosComunes.map((motivoComun) => (
                        <SelectItem key={motivoComun} value={motivoComun}>
                          {motivoComun}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {motivo === 'Otro' && (
                    <Input
                      className="mt-2"
                      placeholder="Especificar otro motivo..."
                      onChange={(e) => setMotivo(e.target.value)}
                    />
                  )}
                </div>

                {/* Destino */}
                <div>
                  <label htmlFor="destino" className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Destino *
                  </label>
                  <Input
                    id="destino"
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                    placeholder="Ej: Cliente ABC, Técnico Juan, Almacén Central..."
                    className="w-full"
                    required
                  />
                </div>

                {/* Responsable */}
                <div>
                  <label htmlFor="responsable" className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline h-4 w-4 mr-1" />
                    Responsable de la Salida *
                  </label>
                  <Input
                    id="responsable"
                    value={responsable}
                    onChange={(e) => setResponsable(e.target.value)}
                    placeholder="Nombre del responsable..."
                    className="w-full"
                    required
                  />
                </div>

                {/* Cliente (opcional) */}
                <div>
                  <label htmlFor="cliente" className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente (opcional)
                  </label>
                  <Select value={cliente} onValueChange={setCliente}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clinicas.map((clinica) => (
                        <SelectItem key={clinica.id} value={clinica.nombre}>
                          {clinica.nombre}
                        </SelectItem>
                      ))}
                      <SelectItem value="Otro">
                        Otro cliente
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {cliente === 'Otro' && (
                    <Input
                      className="mt-2"
                      placeholder="Especificar nombre del cliente..."
                      value={clientePersonalizado}
                      onChange={(e) => setClientePersonalizado(e.target.value)}
                    />
                  )}
                </div>

                {/* Número de factura (opcional) */}
                <div>
                  <label htmlFor="numeroFactura" className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="inline h-4 w-4 mr-1" />
                    Número de Factura (opcional)
                  </label>
                  <Input
                    id="numeroFactura"
                    value={numeroFactura}
                    onChange={(e) => setNumeroFactura(e.target.value)}
                    placeholder="Ej: FAC-001-2024..."
                    className="w-full"
                  />
                </div>

                {/* Observaciones */}
                <div>
                  <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones (opcional)
                  </label>
                  <Textarea
                    id="observaciones"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Notas adicionales sobre la salida..."
                    rows={3}
                    className="w-full"
                  />
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || cantidad > producto.cantidadTotal}
                    className="flex items-center space-x-2"
                  >
                    <ArrowDownCircle className="h-4 w-4" />
                    <span>{isLoading ? 'Registrando...' : 'Registrar Salida'}</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}