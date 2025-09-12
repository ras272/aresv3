'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { getRepuestoById, updateRepuesto } from '@/lib/repuestos-database';
import { Repuesto } from '@/types';
import { ArrowLeft, Save } from 'lucide-react';

export default function EditRepuestoPage() {
  const params = useParams();
  const router = useRouter();
  const repuestoId = params.id as string;

  const [repuesto, setRepuesto] = useState<Repuesto | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  useEffect(() => {
    if (repuestoId) {
      loadRepuesto();
    }
  }, [repuestoId]);

  const loadRepuesto = async () => {
    try {
      setLoading(true);
      const data = await getRepuestoById(repuestoId);
      setRepuesto(data);
      
      // Llenar el formulario con los datos del repuesto
      setFormData({
        nombre: data.nombre,
        descripcion: data.descripcion || '',
        marca: data.marca || '',
        modelo: data.modelo || '',
        numero_serie: data.numero_serie || '',
        lote: data.lote || '',
        cantidad_actual: data.cantidad_actual,
        cantidad_minima: data.cantidad_minima,
        unidad_medida: data.unidad_medida,
        categoria: data.categoria || '',
        subcategoria: data.subcategoria || '',
        proveedor: data.proveedor || '',
        precio_unitario: data.precio_unitario ? data.precio_unitario.toString() : '',
        moneda: data.moneda,
        fecha_vencimiento: data.fecha_vencimiento || '',
        observaciones: data.observaciones || '',
      });
    } catch (error) {
      console.error('Error al cargar repuesto:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el repuesto.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!repuesto) return;
    
    setIsSubmitting(true);
    
    try {
      const updates = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        marca: formData.marca || null,
        modelo: formData.modelo || null,
        numero_serie: formData.numero_serie || null,
        lote: formData.lote || null,
        cantidad_actual: Number(formData.cantidad_actual),
        cantidad_minima: Number(formData.cantidad_minima),
        unidad_medida: formData.unidad_medida,
        categoria: formData.categoria || null,
        subcategoria: formData.subcategoria || null,
        proveedor: formData.proveedor || null,
        precio_unitario: formData.precio_unitario ? Number(formData.precio_unitario) : null,
        moneda: formData.moneda,
        fecha_vencimiento: formData.fecha_vencimiento || null,
        observaciones: formData.observaciones || null,
      };

      await updateRepuesto(repuesto.id, updates);
      
      toast({
        title: 'Repuesto actualizado',
        description: 'El repuesto se ha actualizado exitosamente.',
      });
      
      router.push('/repuestos');
    } catch (error) {
      console.error('Error al actualizar repuesto:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el repuesto. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!repuesto) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-8">
          <h3 className="text-lg font-medium">Repuesto no encontrado</h3>
          <p className="mt-1 text-muted-foreground">
            No se pudo encontrar el repuesto solicitado.
          </p>
          <Button onClick={() => router.push('/repuestos')} className="mt-4">
            Volver a repuestos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Editar Repuesto</h1>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información del Repuesto</CardTitle>
            <CardDescription>
              Código: {repuesto.codigo_repuesto}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Nombre del repuesto"
                />
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
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cantidad_minima">Cantidad Mínima</Label>
                <Input
                  id="cantidad_minima"
                  type="number"
                  min="1"
                  value={formData.cantidad_minima}
                  onChange={handleChange}
                />
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
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}