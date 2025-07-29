'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { X, Save, Package } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  producto: ProductoAgrupado | null;
  onUpdate: (productId: string, updates: { imagen?: string; observaciones?: string }) => Promise<void>;
}

export function EditProductModal({
  isOpen,
  onClose,
  producto,
  onUpdate
}: EditProductModalProps) {
  const [imagen, setImagen] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (producto) {
      setImagen(producto.imagen || '');
      setObservaciones(producto.observaciones || '');
    }
  }, [producto]);

  const handleSave = async () => {
    if (!producto) return;

    setIsLoading(true);
    try {
      await onUpdate(producto.id, {
        imagen: imagen || undefined,
        observaciones: observaciones || undefined
      });
      
      toast.success('Producto actualizado exitosamente');
      onClose();
    } catch (error) {
      console.error('Error actualizando producto:', error);
      toast.error('Error al actualizar el producto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUploaded = (imageUrl: string) => {
    setImagen(imageUrl);
  };

  const handleImageRemoved = () => {
    setImagen('');
  };

  if (!producto) return null;

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-0 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center space-x-3">
                  <Package className="h-6 w-6 text-blue-500" />
                  <div>
                    <CardTitle className="text-xl">Editar Producto</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {producto.nombre} - {producto.marca} {producto.modelo}
                    </p>
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
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Información del producto (solo lectura) */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nombre</label>
                    <p className="text-sm text-gray-900">{producto.nombre}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Marca</label>
                    <p className="text-sm text-gray-900">{producto.marca}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Modelo</label>
                    <p className="text-sm text-gray-900">{producto.modelo}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Cantidad Total</label>
                    <p className="text-sm text-gray-900 font-semibold">{producto.cantidadTotal} unidades</p>
                  </div>
                </div>

                {/* Imagen del producto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Imagen del Producto
                  </label>
                  <ImageUpload
                    currentImageUrl={imagen}
                    onImageUploaded={handleImageUploaded}
                    onImageRemoved={handleImageRemoved}
                    maxSizeMB={5}
                  />
                </div>

                {/* Observaciones */}
                <div>
                  <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones
                  </label>
                  <Textarea
                    id="observaciones"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Notas adicionales sobre el producto..."
                    rows={4}
                    className="w-full"
                  />
                </div>

                {/* Ubicaciones (solo información) */}
                {producto.ubicaciones.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ubicaciones Actuales
                    </label>
                    <div className="space-y-2">
                      {producto.ubicaciones.map((ubicacion, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm">{ubicacion.ubicacion}</span>
                          <span className="text-sm font-medium">{ubicacion.cantidad} unidades</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isLoading ? 'Guardando...' : 'Guardar Cambios'}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}