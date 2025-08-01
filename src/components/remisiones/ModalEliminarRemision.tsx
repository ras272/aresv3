'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Package, RotateCcw } from 'lucide-react';
import { Remision } from '@/types';
import { Badge } from '@/components/ui/badge';

interface ModalEliminarRemisionProps {
  isOpen: boolean;
  onClose: () => void;
  remision: Remision | null;
  onConfirm: (motivo: string) => Promise<void>;
}

export default function ModalEliminarRemision({
  isOpen,
  onClose,
  remision,
  onConfirm
}: ModalEliminarRemisionProps) {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!motivo.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onConfirm(motivo);
      setMotivo('');
      onClose();
    } catch (error) {
      console.error('Error al eliminar remisión:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMotivo('');
    onClose();
  };

  if (!remision) return null;

  // Contar productos que tienen stock asociado (componente_id)
  const productosConStock = remision.productos.filter(p => p.stockItemId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Confirmar Eliminación de Remisión
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información de la remisión */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Remisión a eliminar:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Número:</span> {remision.numeroRemision}
              </div>
              <div>
                <span className="font-medium">Cliente:</span> {remision.cliente}
              </div>
              <div>
                <span className="font-medium">Fecha:</span> {new Date(remision.fecha).toLocaleDateString('es-PY')}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Estado:</span>
                <Badge variant="outline">{remision.estado}</Badge>
              </div>
            </div>
          </div>

          {/* Advertencia sobre restauración de stock */}
          {productosConStock.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <RotateCcw className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">
                    Restauración Automática de Stock
                  </h4>
                  <p className="text-blue-800 text-sm mb-3">
                    Se restaurarán automáticamente las cantidades de los siguientes productos al stock:
                  </p>
                  <div className="space-y-2">
                    {productosConStock.map((producto, index) => (
                      <div key={producto.id} className="flex items-center gap-2 text-sm">
                        <Package className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">{producto.cantidadSolicitada}x</span>
                        <span>{producto.nombre}</span>
                        <span className="text-blue-600">({producto.marca} {producto.modelo})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Campo de motivo */}
          <div className="space-y-2">
            <Label htmlFor="motivo" className="text-sm font-medium">
              Motivo de la cancelación *
            </Label>
            <Textarea
              id="motivo"
              placeholder="Describe el motivo por el cual se cancela esta remisión..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              className="resize-none"
            />
            {!motivo.trim() && (
              <p className="text-red-500 text-xs">El motivo es obligatorio</p>
            )}
          </div>

          {/* Advertencia final */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900 mb-1">
                  ¡Atención! Esta acción no se puede deshacer
                </h4>
                <p className="text-red-800 text-sm">
                  La remisión será eliminada permanentemente del sistema y se registrará 
                  el motivo de cancelación en el historial.
                </p>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={!motivo.trim() || loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Eliminando...' : 'Confirmar Eliminación'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}