'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, X, Package } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

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

interface UpdateQuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  producto: ProductoAgrupado | null;
  onUpdate: (productId: string, newQuantity: number, reason: string, notes: string) => Promise<void>;
}

const RAZONES_TRANSACCION = [
  { value: 'venta', label: 'Venta', color: 'bg-green-100 text-green-800' },
  { value: 'devolucion', label: 'Devolución', color: 'bg-blue-100 text-blue-800' },
  { value: 'dañado', label: 'Producto Dañado', color: 'bg-red-100 text-red-800' },
  { value: 'perdido', label: 'Producto Perdido', color: 'bg-orange-100 text-orange-800' },
  { value: 'ajuste_inventario', label: 'Ajuste de Inventario', color: 'bg-purple-100 text-purple-800' },
  { value: 'transferencia', label: 'Transferencia', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'reparacion', label: 'Enviado a Reparación', color: 'bg-gray-100 text-gray-800' },
  { value: 'restock', label: 'Restock/Ingreso', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'otro', label: 'Otro', color: 'bg-slate-100 text-slate-800' }
];

export function UpdateQuantityModal({ 
  isOpen, 
  onClose, 
  producto, 
  onUpdate 
}: UpdateQuantityModalProps) {
  const [nuevaCantidad, setNuevaCantidad] = useState(0);
  const [razonSeleccionada, setRazonSeleccionada] = useState('');
  const [notasTransaccion, setNotasTransaccion] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Resetear formulario cuando se abre el modal
  React.useEffect(() => {
    if (isOpen && producto) {
      setNuevaCantidad(producto.cantidadTotal);
      setRazonSeleccionada('');
      setNotasTransaccion('');
    }
  }, [isOpen, producto]);

  const handleQuantityChange = (delta: number) => {
    const newValue = Math.max(0, nuevaCantidad + delta);
    setNuevaCantidad(newValue);
  };

  const handleSubmit = async () => {
    if (!producto) return;

    // Validaciones
    if (nuevaCantidad < 0) {
      toast.error('La cantidad no puede ser negativa');
      return;
    }

    if (nuevaCantidad !== producto.cantidadTotal && !razonSeleccionada) {
      toast.error('Selecciona una razón para el cambio de cantidad');
      return;
    }

    if (nuevaCantidad === producto.cantidadTotal) {
      toast.info('No hay cambios en la cantidad');
      return;
    }

    setIsLoading(true);
    try {
      await onUpdate(producto.id, nuevaCantidad, razonSeleccionada, notasTransaccion);
      
      const razonLabel = RAZONES_TRANSACCION.find(r => r.value === razonSeleccionada)?.label || razonSeleccionada;
      const cambio = nuevaCantidad - producto.cantidadTotal;
      const tipoOperacion = cambio > 0 ? 'Incremento' : 'Reducción';
      
      toast.success(`${tipoOperacion} registrado exitosamente`, {
        description: `${producto.nombre}: ${producto.cantidadTotal} → ${nuevaCantidad} (${razonLabel})`
      });
      
      onClose();
    } catch (error) {
      toast.error('Error actualizando cantidad', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRazonColor = (razon: string) => {
    return RAZONES_TRANSACCION.find(r => r.value === razon)?.color || 'bg-gray-100 text-gray-800';
  };

  const getDiferenciaCantidad = () => {
    if (!producto) return 0;
    return nuevaCantidad - producto.cantidadTotal;
  };

  const getTipoOperacion = () => {
    const diff = getDiferenciaCantidad();
    if (diff > 0) return { tipo: 'ENTRADA', color: 'text-green-600', icon: Plus };
    if (diff < 0) return { tipo: 'SALIDA', color: 'text-red-600', icon: Minus };
    return { tipo: 'SIN CAMBIO', color: 'text-gray-600', icon: Package };
  };

  if (!producto) return null;

  const operacion = getTipoOperacion();
  const diferencia = getDiferenciaCantidad();
  const IconoOperacion = operacion.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Actualizar Cantidad
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del producto */}
          <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
              {producto.imagen ? (
                <img 
                  src={producto.imagen} 
                  alt={producto.nombre}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Package className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{producto.nombre}</h3>
              <p className="text-sm text-gray-600">{producto.marca} - {producto.modelo}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {producto.cantidadTotal} unidades
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {producto.tipoComponente}
                </Badge>
              </div>
            </div>
          </div>

          {/* Control de cantidad */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Cantidad Actual</Label>
              <div className="text-2xl font-bold text-gray-900">{producto.cantidadTotal}</div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Nueva Cantidad</Label>
              <div className="flex items-center space-x-3 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={nuevaCantidad <= 0}
                  className="h-10 w-10 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                
                <Input
                  type="number"
                  value={nuevaCantidad}
                  onChange={(e) => setNuevaCantidad(Math.max(0, parseInt(e.target.value) || 0))}
                  className="text-center text-xl font-semibold h-10 w-20"
                  min="0"
                />
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(1)}
                  className="h-10 w-10 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Indicador de cambio */}
            {diferencia !== 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center space-x-2 p-3 rounded-lg border-2 ${
                  diferencia > 0 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <IconoOperacion className={`h-5 w-5 ${operacion.color}`} />
                <div>
                  <div className={`font-semibold ${operacion.color}`}>
                    {operacion.tipo}: {Math.abs(diferencia)} unidades
                  </div>
                  <div className="text-sm text-gray-600">
                    {producto.cantidadTotal} → {nuevaCantidad}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Razón del cambio */}
          {diferencia !== 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Razón del cambio *
              </Label>
              <Select value={razonSeleccionada} onValueChange={setRazonSeleccionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una razón..." />
                </SelectTrigger>
                <SelectContent>
                  {RAZONES_TRANSACCION.map((razon) => (
                    <SelectItem key={razon.value} value={razon.value}>
                      <div className="flex items-center space-x-2">
                        <Badge className={`${razon.color} text-xs`} variant="secondary">
                          {razon.label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notas de transacción */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Notas de transacción (opcional)
            </Label>
            <Textarea
              value={notasTransaccion}
              onChange={(e) => setNotasTransaccion(e.target.value)}
              placeholder="Agrega detalles adicionales sobre esta transacción..."
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Botones de acción */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Actualizando...</span>
                </div>
              ) : (
                'Actualizar'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}