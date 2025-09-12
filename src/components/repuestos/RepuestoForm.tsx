'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { createRepuesto } from '@/lib/repuestos-database';
import { RepuestoFormData } from '@/lib/schemas';

interface RepuestoFormProps {
  onRepuestoCreated?: () => void;
}

export function RepuestoForm({ onRepuestoCreated }: RepuestoFormProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    marca: '',
    modelo: '',
    numero_serie: '',
    lote: '',
    cantidad_actual: 0,
    cantidad_minima: 1,
    unidad_medida: 'unidad',
    categoria: '',
    subcategoria: '',
    proveedor: '',
    precio_unitario: '',
    moneda: 'USD',
    fecha_vencimiento: '',
    observaciones: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    
    // Limpiar error cuando el usuario escribe
    if (errors[id]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    
    if (formData.cantidad_actual < 0) {
      newErrors.cantidad_actual = 'La cantidad debe ser mayor o igual a 0';
    }
    
    if (formData.cantidad_minima < 1) {
      newErrors.cantidad_minima = 'La cantidad mínima debe ser mayor a 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const repuestoData: Omit<RepuestoFormData, 'id' | 'codigo_repuesto' | 'activo'> = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        marca: formData.marca || null,
        modelo: formData.modelo || null,
        numero_serie: formData.numero_serie || null,
        lote: formData.lote || null,
        cantidad_actual: Number(formData.cantidad_actual),
        cantidad_minima: Number(formData.cantidad_minima),
        unidad_medida: formData.unidad_medida,
        estado: 'Disponible',
        categoria: formData.categoria || null,
        subcategoria: formData.subcategoria || null,
        proveedor: formData.proveedor || null,
        precio_unitario: formData.precio_unitario ? Number(formData.precio_unitario) : null,
        moneda: formData.moneda,
        fecha_ingreso: new Date().toISOString(),
        fecha_vencimiento: formData.fecha_vencimiento || null,
        fotos: null,
        documentos: null,
        tags: null,
        custom_fields: null,
        qr_code: null,
        barcode: null,
        observaciones: formData.observaciones || null,
      };

      await createRepuesto(repuestoData);
      
      toast({
        title: 'Repuesto creado',
        description: 'El repuesto se ha creado exitosamente.',
      });
      
      // Reset form
      setFormData({
        nombre: '',
        descripcion: '',
        marca: '',
        modelo: '',
        numero_serie: '',
        lote: '',
        cantidad_actual: 0,
        cantidad_minima: 1,
        unidad_medida: 'unidad',
        categoria: '',
        subcategoria: '',
        proveedor: '',
        precio_unitario: '',
        moneda: 'USD',
        fecha_vencimiento: '',
        observaciones: '',
      });
      
      if (onRepuestoCreated) {
        onRepuestoCreated();
      }
    } catch (error) {
      console.error('Error al crear repuesto:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el repuesto. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Nuevo Repuesto</CardTitle>
        <CardDescription>
          Ingresa la información del nuevo repuesto para agregarlo al inventario.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Nombre del repuesto"
                className={errors.nombre ? 'border-red-500' : ''}
              />
              {errors.nombre && <p className="text-sm text-red-500">{errors.nombre}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Input
                id="categoria"
                value={formData.categoria}
                onChange={handleChange}
                placeholder="Categoría del repuesto"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Descripción detallada del repuesto"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marca">Marca</Label>
              <Input
                id="marca"
                value={formData.marca}
                onChange={handleChange}
                placeholder="Marca del repuesto"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo</Label>
              <Input
                id="modelo"
                value={formData.modelo}
                onChange={handleChange}
                placeholder="Modelo del repuesto"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="numero_serie">Número de Serie</Label>
              <Input
                id="numero_serie"
                value={formData.numero_serie}
                onChange={handleChange}
                placeholder="Número de serie"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cantidad_actual">Cantidad Actual</Label>
              <Input
                id="cantidad_actual"
                type="number"
                min="0"
                value={formData.cantidad_actual}
                onChange={handleChange}
                className={errors.cantidad_actual ? 'border-red-500' : ''}
              />
              {errors.cantidad_actual && <p className="text-sm text-red-500">{errors.cantidad_actual}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cantidad_minima">Cantidad Mínima</Label>
              <Input
                id="cantidad_minima"
                type="number"
                min="1"
                value={formData.cantidad_minima}
                onChange={handleChange}
                className={errors.cantidad_minima ? 'border-red-500' : ''}
              />
              {errors.cantidad_minima && <p className="text-sm text-red-500">{errors.cantidad_minima}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unidad_medida">Unidad de Medida</Label>
              <Input
                id="unidad_medida"
                value={formData.unidad_medida}
                onChange={handleChange}
                placeholder="unidad, pieza, metro, etc."
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proveedor">Proveedor</Label>
              <Input
                id="proveedor"
                value={formData.proveedor}
                onChange={handleChange}
                placeholder="Proveedor del repuesto"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="precio_unitario">Precio Unitario</Label>
              <Input
                id="precio_unitario"
                type="number"
                step="0.01"
                min="0"
                value={formData.precio_unitario}
                onChange={handleChange}
                placeholder="Precio unitario"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lote">Lote</Label>
              <Input
                id="lote"
                value={formData.lote}
                onChange={handleChange}
                placeholder="Número de lote"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fecha_vencimiento">Fecha de Vencimiento</Label>
              <Input
                id="fecha_vencimiento"
                type="date"
                value={formData.fecha_vencimiento}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              placeholder="Observaciones adicionales"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creando...' : 'Crear Repuesto'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}