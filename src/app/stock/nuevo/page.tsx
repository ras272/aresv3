'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Package, Save, Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Schema de validación
const stockItemSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  marca: z.string().min(1, 'La marca es obligatoria'),
  modelo: z.string().optional(),
  tipoComponente: z.enum(['Insumo', 'Repuesto', 'Equipo Médico', 'Accesorio'], {
    required_error: 'Selecciona un tipo de componente'
  }),
  numeroSerie: z.string().optional(),
  cantidad: z.number().min(1, 'La cantidad debe ser mayor a 0'),
  cantidadMinima: z.number().min(0, 'La cantidad mínima no puede ser negativa').default(1),
  ubicacionFisica: z.string().optional(),
  observaciones: z.string().optional(),
  imagen: z.string().optional()
});

type StockItemFormData = z.infer<typeof stockItemSchema>;

// Marcas disponibles (las mismas del sistema de mercaderías)
const MARCAS_DISPONIBLES = [
  'Ares',
  'DermaSkin',
  'Venus',
  'Endymed',
  'Cosmetica',
  'Candela',
  'Ecleris',
  'Fotona',
  'Hydrafacial',
  'Fine',
  'Brera',
  'Cocoon',
  'Thermage',
  'Viora',
  'Lumenis',
  'Daeyang',
  'BodyHealth',
  'Intermedic',
  'Servicio Técnico',
  'Classys',
  'Otra'
];

export default function NuevoStockPage() {
  const router = useRouter();
  const { createStockItemManual } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [imagenPreview, setImagenPreview] = useState<string>('');
  const [marcaPersonalizada, setMarcaPersonalizada] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<StockItemFormData>({
    resolver: zodResolver(stockItemSchema),
    defaultValues: {
      cantidad: 1,
      cantidadMinima: 1,
      tipoComponente: 'Insumo'
    }
  });

  const marcaSeleccionada = watch('marca');
  const tipoComponente = watch('tipoComponente');

  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen es muy grande. Máximo 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagenPreview(result);
        setValue('imagen', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: StockItemFormData) => {
    setIsLoading(true);
    
    try {
      // Usar marca personalizada si se seleccionó "Otra"
      const marcaFinal = data.marca === 'Otra' ? marcaPersonalizada : data.marca;
      
      if (data.marca === 'Otra' && !marcaPersonalizada.trim()) {
        toast.error('Ingresa el nombre de la marca personalizada');
        setIsLoading(false);
        return;
      }

      const stockItemData = {
        ...data,
        marca: marcaFinal
      };

      await createStockItemManual(stockItemData);
      
      toast.success('¡Item de stock creado exitosamente!', {
        description: `${data.nombre} agregado al inventario con ${data.cantidad} unidades.`
      });
      
      router.push('/stock');
    } catch (error) {
      console.error('Error creando item de stock:', error);
      toast.error('Error al crear el item de stock', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout 
      title="Nuevo Item de Stock" 
      subtitle="Agregar productos manualmente al inventario"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header con botón volver */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al Stock</span>
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Información básica del producto */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Información del Producto</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre">Nombre del Producto *</Label>
                    <Input
                      id="nombre"
                      {...register('nombre')}
                      placeholder="Ej: Kit Hydra, Britenol..."
                    />
                    {errors.nombre && (
                      <p className="text-sm text-red-600 mt-1">{errors.nombre.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="marca">Marca *</Label>
                    <Select 
                      value={marcaSeleccionada}
                      onValueChange={(value) => setValue('marca', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar marca..." />
                      </SelectTrigger>
                      <SelectContent>
                        {MARCAS_DISPONIBLES.map(marca => (
                          <SelectItem key={marca} value={marca}>
                            {marca}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.marca && (
                      <p className="text-sm text-red-600 mt-1">{errors.marca.message}</p>
                    )}
                  </div>
                </div>

                {/* Campo para marca personalizada */}
                {marcaSeleccionada === 'Otra' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Label htmlFor="marcaPersonalizada">Nombre de la Marca *</Label>
                    <Input
                      id="marcaPersonalizada"
                      value={marcaPersonalizada}
                      onChange={(e) => setMarcaPersonalizada(e.target.value)}
                      placeholder="Ingresa el nombre de la marca..."
                    />
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="modelo">Modelo (Opcional)</Label>
                    <Input
                      id="modelo"
                      {...register('modelo')}
                      placeholder="Ej: indefinido por ahora..."
                    />
                    {errors.modelo && (
                      <p className="text-sm text-red-600 mt-1">{errors.modelo.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="tipoComponente">Tipo de Componente *</Label>
                    <Select 
                      value={tipoComponente}
                      onValueChange={(value: 'Insumo' | 'Repuesto' | 'Equipo Médico' | 'Accesorio') => 
                        setValue('tipoComponente', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Insumo">Insumo</SelectItem>
                        <SelectItem value="Repuesto">Repuesto</SelectItem>
                        <SelectItem value="Equipo Médico">Equipo Médico</SelectItem>
                        <SelectItem value="Accesorio">Accesorio</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.tipoComponente && (
                      <p className="text-sm text-red-600 mt-1">{errors.tipoComponente.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="numeroSerie">Número de Serie (Opcional)</Label>
                  <Input
                    id="numeroSerie"
                    {...register('numeroSerie')}
                    placeholder="Ej: CSU123456..."
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Cantidades y ubicación */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Cantidades y Ubicación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cantidad">Cantidad Inicial *</Label>
                    <Input
                      id="cantidad"
                      type="number"
                      min="1"
                      {...register('cantidad', { valueAsNumber: true })}
                    />
                    {errors.cantidad && (
                      <p className="text-sm text-red-600 mt-1">{errors.cantidad.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="cantidadMinima">Cantidad Mínima de Alerta</Label>
                    <Input
                      id="cantidadMinima"
                      type="number"
                      min="0"
                      {...register('cantidadMinima', { valueAsNumber: true })}
                    />
                    {errors.cantidadMinima && (
                      <p className="text-sm text-red-600 mt-1">{errors.cantidadMinima.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="ubicacionFisica">Ubicación Física (Opcional)</Label>
                  <Input
                    id="ubicacionFisica"
                    {...register('ubicacionFisica')}
                    placeholder="Ej: Deposito Principal - Showroom..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Si no se especifica, se asignará automáticamente según la marca
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Imagen y observaciones */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Información Adicional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="imagen">Imagen del Producto</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      id="imagen"
                      accept="image/*"
                      onChange={handleImagenChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('imagen')?.click()}
                      className="flex items-center space-x-2"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Subir Imagen</span>
                    </Button>
                  </div>
                  
                  {imagenPreview && (
                    <div className="mt-4">
                      <img
                        src={imagenPreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Textarea
                    id="observaciones"
                    {...register('observaciones')}
                    placeholder="Información adicional sobre el producto..."
                    className="min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Crear Item de Stock</span>
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Información de ayuda */}
        
      </div>
    </DashboardLayout>
  );
}