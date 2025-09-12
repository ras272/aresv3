'use client';

import { useState, useEffect } from 'react';
import { X, Save, Calendar, FileText, Package, User, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TransaccionSortly {
  id: string;
  fecha_transaccion: string;
  factura_os: string | null;
  remision: string | null;
  producto_descripcion: string;
  cantidad: number;
  cliente_destino: string | null;
  observaciones: string | null;
}

interface FormularioTransaccionProps {
  transaccion?: TransaccionSortly | null;
  onGuardar: (datos: any) => void;
  onCancelar: () => void;
}

export function FormularioTransaccion({ transaccion, onGuardar, onCancelar }: FormularioTransaccionProps) {
  const [formData, setFormData] = useState({
    fecha_transaccion: '',
    factura_os: '',
    remision: '',
    producto_descripcion: '',
    cantidad: '1',  // Cambiar a string para manejar mejor la entrada
    cliente_destino: '',
    observaciones: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Eliminar la variable tiposDocumento ya que no la usamos más

  useEffect(() => {
    if (transaccion) {
      // Formatear la fecha correctamente para el input type="date"
      const fechaParaInput = transaccion.fecha_transaccion.includes('T') 
        ? transaccion.fecha_transaccion.split('T')[0]
        : transaccion.fecha_transaccion;
      
      setFormData({
        fecha_transaccion: fechaParaInput,
        factura_os: transaccion.factura_os || '',
        remision: transaccion.remision || '',
        producto_descripcion: transaccion.producto_descripcion,
        cantidad: transaccion.cantidad.toString(),  // Convertir a string
        cliente_destino: transaccion.cliente_destino || '',
        observaciones: transaccion.observaciones || ''
      });
    }
  }, [transaccion]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validarFormulario = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fecha_transaccion) {
      newErrors.fecha_transaccion = 'La fecha es obligatoria';
    }

    if (!formData.producto_descripcion.trim()) {
      newErrors.producto_descripcion = 'La descripción del producto es obligatoria';
    }

    if (parseFloat(formData.cantidad) === 0 || formData.cantidad === '') {
      newErrors.cantidad = 'La cantidad no puede ser 0 o estar vacía';
    }

    // Los campos factura_os y remision ahora son completamente opcionales

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setLoading(true);
    try {
      await onGuardar({
        ...formData,
        cantidad: Number(formData.cantidad)  // Convertir a número solo al guardar
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">
            {transaccion ? 'Editar Transacción' : 'Nueva Transacción de Sortly'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancelar}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Fecha */}
            <div className="space-y-2">
              <Label htmlFor="fecha" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Fecha de Transacción *
              </Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha_transaccion}
                onChange={(e) => handleChange('fecha_transaccion', e.target.value)}
                className={errors.fecha_transaccion ? 'border-red-500' : ''}
              />
              {errors.fecha_transaccion && (
                <p className="text-sm text-red-500">{errors.fecha_transaccion}</p>
              )}
            </div>

            {/* FACTURA/OS */}
            <div className="space-y-2">
              <Label htmlFor="factura" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                FACTURA/OS (opcional)
              </Label>
              <Input
                id="factura"
                type="text"
                placeholder="Número de factura u orden de servicio (opcional)"
                value={formData.factura_os}
                onChange={(e) => handleChange('factura_os', e.target.value)}
                className={errors.factura_os ? 'border-red-500' : ''}
              />
              {errors.factura_os && (
                <p className="text-sm text-red-500">{errors.factura_os}</p>
              )}
            </div>

            {/* REMISION */}
            <div className="space-y-2">
              <Label htmlFor="remision" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                REMISIÓN (opcional)
              </Label>
              <Input
                id="remision"
                type="text"
                placeholder="Número de remisión (opcional)"
                value={formData.remision}
                onChange={(e) => handleChange('remision', e.target.value)}
                className={errors.remision ? 'border-red-500' : ''}
              />
              {errors.remision && (
                <p className="text-sm text-red-500">{errors.remision}</p>
              )}
            </div>

            {/* Producto y Cantidad */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="producto" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Descripción del Producto *
                </Label>
                <Input
                  id="producto"
                  type="text"
                  placeholder="Descripción detallada del producto"
                  value={formData.producto_descripcion}
                  onChange={(e) => handleChange('producto_descripcion', e.target.value)}
                  className={errors.producto_descripcion ? 'border-red-500' : ''}
                />
                {errors.producto_descripcion && (
                  <p className="text-sm text-red-500">{errors.producto_descripcion}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad</Label>
                <Input
                  id="cantidad"
                  type="text"
                  inputMode="decimal"
                  step="0.01"
                  placeholder="Ej: 1, -1, +2, -2.5"
                  value={formData.cantidad}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Permitir escribir números negativos, positivos (con + o sin +), decimales y guiones
                    if (value === '' || value === '-' || value === '+' || /^[+-]?\d*\.?\d*$/.test(value)) {
                      handleChange('cantidad', value);  // Guardar como string
                    }
                  }}
                  className={errors.cantidad ? 'border-red-500' : ''}
                />
                {errors.cantidad && (
                  <p className="text-sm text-red-500">{errors.cantidad}</p>
                )}
              </div>
            </div>

            {/* Cliente/Destino */}
            <div className="space-y-2">
              <Label htmlFor="cliente" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Cliente/Destino
              </Label>
              <Input
                id="cliente"
                type="text"
                placeholder="Nombre del cliente o destino"
                value={formData.cliente_destino}
                onChange={(e) => handleChange('cliente_destino', e.target.value)}
              />
            </div>

            {/* Observaciones */}
            <div className="space-y-2">
              <Label htmlFor="observaciones" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Observaciones
              </Label>
              <Textarea
                id="observaciones"
                placeholder="Observaciones adicionales sobre la transacción"
                rows={3}
                value={formData.observaciones}
                onChange={(e) => handleChange('observaciones', e.target.value)}
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancelar}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Guardando...' : (transaccion ? 'Actualizar' : 'Guardar')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}