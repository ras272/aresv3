'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Plus, Trash2, Package, Wrench, Info, Tag, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { createRepuesto } from '@/lib/repuestos-database';
import { useAppStore } from '@/store/useAppStore';

interface RepuestoFormData {
  nombre: string;
  descripcion: string | null;
  marca: string | null;
  modelo: string | null;
  numero_serie: string | null;
  lote: string | null;
  cantidad_actual: number;
  cantidad_minima: number;
  unidad_medida: string;
  categoria: string | null;
  subcategoria: string | null;
  proveedor: string | null;
  precio_unitario: number | null;
  moneda: string;
  fecha_vencimiento: string | null;
  observaciones: string | null;
}

interface IngresoRepuestosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function IngresoRepuestosModal({ open, onOpenChange, onSuccess }: IngresoRepuestosModalProps) {
  const { addCargaMercaderia } = useAppStore();
  const [repuestos, setRepuestos] = useState<RepuestoFormData[]>([
    {
      nombre: '',
      descripcion: null,
      marca: null,
      modelo: null,
      numero_serie: null,
      lote: null,
      cantidad_actual: 1,
      cantidad_minima: 1,
      unidad_medida: 'unidad',
      categoria: null,
      subcategoria: null,
      proveedor: null,
      precio_unitario: null,
      moneda: 'USD',
      fecha_vencimiento: null,
      observaciones: null,
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(0); // Para controlar qué repuesto está activo en la visualización

  const handleAddRepuesto = () => {
    setRepuestos([
      ...repuestos,
      {
        nombre: '',
        descripcion: null,
        marca: null,
        modelo: null,
        numero_serie: null,
        lote: null,
        cantidad_actual: 1,
        cantidad_minima: 1,
        unidad_medida: 'unidad',
        categoria: null,
        subcategoria: null,
        proveedor: null,
        precio_unitario: null,
        moneda: 'USD',
        fecha_vencimiento: null,
        observaciones: null,
      }
    ]);
    setActiveTab(repuestos.length); // Activar el nuevo repuesto
  };

  const handleRemoveRepuesto = (index: number) => {
    if (repuestos.length <= 1) {
      toast.error('Debe haber al menos un repuesto');
      return;
    }
    const newRepuestos = repuestos.filter((_, i) => i !== index);
    setRepuestos(newRepuestos);
    
    // Ajustar la pestaña activa si es necesario
    if (activeTab >= newRepuestos.length) {
      setActiveTab(newRepuestos.length - 1);
    } else if (activeTab > index) {
      setActiveTab(activeTab - 1);
    }
  };

  const handleRepuestoChange = (index: number, field: keyof RepuestoFormData, value: string | number | null) => {
    const updatedRepuestos = [...repuestos];
    updatedRepuestos[index] = {
      ...updatedRepuestos[index],
      [field]: value
    };
    setRepuestos(updatedRepuestos);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Validar que todos los repuestos tengan al menos nombre
      for (const repuesto of repuestos) {
        if (!repuesto.nombre.trim()) {
          toast.error('Todos los repuestos deben tener un nombre');
          return;
        }
      }

      // Crear cada repuesto en el sistema de repuestos
      const repuestosCreados = [];
      for (const repuesto of repuestos) {
        // Asegurarse de que los campos numéricos sean números
        const repuestoParaCrear = {
          ...repuesto,
          cantidad_actual: Number(repuesto.cantidad_actual) || 0,
          cantidad_minima: Number(repuesto.cantidad_minima) || 1,
          precio_unitario: repuesto.precio_unitario ? Number(repuesto.precio_unitario) : null,
        };

        const repuestoCreado = await createRepuesto(repuestoParaCrear);
        repuestosCreados.push(repuestoCreado);
      }

      // Crear una entrada en el sistema de mercaderías para que aparezca en /mercaderias
      const productosParaCarga = repuestos.map(repuesto => ({
        producto: repuesto.nombre,
        tipoProducto: 'Repuesto' as const,
        marca: repuesto.marca || 'Sin marca',
        modelo: repuesto.modelo || 'N/A',
        numeroSerie: repuesto.numero_serie || undefined,
        cantidad: Number(repuesto.cantidad_actual) || 1,
        observaciones: repuesto.observaciones || '',
        paraServicioTecnico: false,
        imagen: '',
        subitems: []
      }));

      const cargaData = {
        tipoCarga: 'stock' as const,
        observacionesGenerales: 'Ingreso de repuestos desde el módulo de repuestos',
        productos: productosParaCarga
      };

      await addCargaMercaderia(cargaData);

      toast.success(`¡${repuestos.length} repuesto(s) ingresado(s) exitosamente!`);
      onSuccess();
      onOpenChange(false);
      
      // Resetear el formulario
      setRepuestos([
        {
          nombre: '',
          descripcion: null,
          marca: null,
          modelo: null,
          numero_serie: null,
          lote: null,
          cantidad_actual: 1,
          cantidad_minima: 1,
          unidad_medida: 'unidad',
          categoria: null,
          subcategoria: null,
          proveedor: null,
          precio_unitario: null,
          moneda: 'USD',
          fecha_vencimiento: null,
          observaciones: null,
        }
      ]);
      setActiveTab(0);
    } catch (error: any) {
      console.error('Error al crear repuestos:', error);
      toast.error('Error al ingresar repuestos', {
        description: error.message || 'Ocurrió un error desconocido'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Ingreso de Repuestos
          </DialogTitle>
          <DialogDescription>
            Agrega nuevos repuestos al inventario técnico
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pestañas para múltiples repuestos */}
          {repuestos.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {repuestos.map((_, index) => (
                <Button
                  key={index}
                  variant={activeTab === index ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab(index)}
                  className="flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Repuesto {index + 1}
                </Button>
              ))}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {repuestos.length > 1 ? `Repuesto ${activeTab + 1}` : 'Datos del Repuesto'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Información Básica */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg bg-muted/50">
                <div className="md:col-span-12">
                  <h3 className="flex items-center gap-2 text-lg font-medium mb-4">
                    <Info className="h-5 w-5" />
                    Información Básica
                  </h3>
                </div>
                
                <div className="md:col-span-6">
                  <Label htmlFor={`nombre-${activeTab}`}>Nombre *</Label>
                  <Input
                    id={`nombre-${activeTab}`}
                    value={repuestos[activeTab].nombre}
                    onChange={(e) => handleRepuestoChange(activeTab, 'nombre', e.target.value)}
                    placeholder="Nombre del repuesto"
                  />
                </div>

                <div className="md:col-span-6">
                  <Label htmlFor={`descripcion-${activeTab}`}>Descripción</Label>
                  <Textarea
                    id={`descripcion-${activeTab}`}
                    value={repuestos[activeTab].descripcion || ''}
                    onChange={(e) => handleRepuestoChange(activeTab, 'descripcion', e.target.value || null)}
                    placeholder="Descripción del repuesto"
                    className="min-h-[60px]"
                  />
                </div>

                <div className="md:col-span-4">
                  <Label htmlFor={`marca-${activeTab}`}>Marca</Label>
                  <Input
                    id={`marca-${activeTab}`}
                    value={repuestos[activeTab].marca || ''}
                    onChange={(e) => handleRepuestoChange(activeTab, 'marca', e.target.value || null)}
                    placeholder="Marca del repuesto"
                  />
                </div>

                <div className="md:col-span-4">
                  <Label htmlFor={`modelo-${activeTab}`}>Modelo</Label>
                  <Input
                    id={`modelo-${activeTab}`}
                    value={repuestos[activeTab].modelo || ''}
                    onChange={(e) => handleRepuestoChange(activeTab, 'modelo', e.target.value || null)}
                    placeholder="Modelo"
                  />
                </div>

                <div className="md:col-span-4">
                  <Label htmlFor={`categoria-${activeTab}`}>Categoría</Label>
                  <Input
                    id={`categoria-${activeTab}`}
                    value={repuestos[activeTab].categoria || ''}
                    onChange={(e) => handleRepuestoChange(activeTab, 'categoria', e.target.value || null)}
                    placeholder="Categoría"
                  />
                </div>
              </div>

              {/* Identificación */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg bg-muted/50">
                <div className="md:col-span-12">
                  <h3 className="flex items-center gap-2 text-lg font-medium mb-4">
                    <Tag className="h-5 w-5" />
                    Identificación
                  </h3>
                </div>
                
                <div className="md:col-span-6">
                  <Label htmlFor={`numero_serie-${activeTab}`}>N° Serie</Label>
                  <Input
                    id={`numero_serie-${activeTab}`}
                    value={repuestos[activeTab].numero_serie || ''}
                    onChange={(e) => handleRepuestoChange(activeTab, 'numero_serie', e.target.value || null)}
                    placeholder="Número de serie"
                  />
                </div>

                <div className="md:col-span-6">
                  <Label htmlFor={`lote-${activeTab}`}>Lote</Label>
                  <Input
                    id={`lote-${activeTab}`}
                    value={repuestos[activeTab].lote || ''}
                    onChange={(e) => handleRepuestoChange(activeTab, 'lote', e.target.value || null)}
                    placeholder="Lote"
                  />
                </div>
              </div>

              {/* Inventario */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg bg-muted/50">
                <div className="md:col-span-12">
                  <h3 className="flex items-center gap-2 text-lg font-medium mb-4">
                    <Package className="h-5 w-5" />
                    Inventario
                  </h3>
                </div>
                
                <div className="md:col-span-3">
                  <Label htmlFor={`cantidad_actual-${activeTab}`}>Cantidad Actual</Label>
                  <Input
                    id={`cantidad_actual-${activeTab}`}
                    type="number"
                    min="0"
                    value={repuestos[activeTab].cantidad_actual}
                    onChange={(e) => handleRepuestoChange(activeTab, 'cantidad_actual', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="md:col-span-3">
                  <Label htmlFor={`cantidad_minima-${activeTab}`}>Stock Mínimo</Label>
                  <Input
                    id={`cantidad_minima-${activeTab}`}
                    type="number"
                    min="0"
                    value={repuestos[activeTab].cantidad_minima}
                    onChange={(e) => handleRepuestoChange(activeTab, 'cantidad_minima', parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="md:col-span-3">
                  <Label htmlFor={`unidad_medida-${activeTab}`}>Unidad de Medida</Label>
                  <Input
                    id={`unidad_medida-${activeTab}`}
                    value={repuestos[activeTab].unidad_medida}
                    onChange={(e) => handleRepuestoChange(activeTab, 'unidad_medida', e.target.value)}
                    placeholder="unidad"
                  />
                </div>

                <div className="md:col-span-3">
                  <Label htmlFor={`proveedor-${activeTab}`}>Proveedor</Label>
                  <Input
                    id={`proveedor-${activeTab}`}
                    value={repuestos[activeTab].proveedor || ''}
                    onChange={(e) => handleRepuestoChange(activeTab, 'proveedor', e.target.value || null)}
                    placeholder="Proveedor"
                  />
                </div>
              </div>

              {/* Valores */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg bg-muted/50">
                <div className="md:col-span-12">
                  <h3 className="flex items-center gap-2 text-lg font-medium mb-4">
                    <DollarSign className="h-5 w-5" />
                    Valores
                  </h3>
                </div>
                
                <div className="md:col-span-6">
                  <Label htmlFor={`precio_unitario-${activeTab}`}>Precio Unitario</Label>
                  <Input
                    id={`precio_unitario-${activeTab}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={repuestos[activeTab].precio_unitario || ''}
                    onChange={(e) => handleRepuestoChange(activeTab, 'precio_unitario', parseFloat(e.target.value) || null)}
                  />
                </div>

                <div className="md:col-span-6">
                  <Label htmlFor={`moneda-${activeTab}`}>Moneda</Label>
                  <Select
                    value={repuestos[activeTab].moneda}
                    onValueChange={(value) => handleRepuestoChange(activeTab, 'moneda', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="GS">GS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg bg-muted/50">
                <div className="md:col-span-12">
                  <h3 className="flex items-center gap-2 text-lg font-medium mb-4">
                    <Calendar className="h-5 w-5" />
                    Fechas
                  </h3>
                </div>
                
                <div className="md:col-span-6">
                  <Label htmlFor={`fecha_vencimiento-${activeTab}`}>Fecha Vencimiento</Label>
                  <Input
                    id={`fecha_vencimiento-${activeTab}`}
                    type="date"
                    value={repuestos[activeTab].fecha_vencimiento || ''}
                    onChange={(e) => handleRepuestoChange(activeTab, 'fecha_vencimiento', e.target.value || null)}
                  />
                </div>
              </div>

              {/* Observaciones */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg bg-muted/50">
                <div className="md:col-span-12">
                  <Label htmlFor={`observaciones-${activeTab}`}>Observaciones</Label>
                  <Textarea
                    id={`observaciones-${activeTab}`}
                    value={repuestos[activeTab].observaciones || ''}
                    onChange={(e) => handleRepuestoChange(activeTab, 'observaciones', e.target.value || null)}
                    placeholder="Observaciones adicionales"
                    className="min-h-[60px]"
                  />
                </div>
              </div>

              {/* Botón para eliminar repuesto (si hay más de uno) */}
              {repuestos.length > 1 && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveRepuesto(activeTab)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar este repuesto
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botón para agregar otro repuesto */}
          <div className="flex justify-center">
            <Button type="button" variant="outline" onClick={handleAddRepuesto} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Agregar Otro Repuesto
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Ingresando...' : 'Ingresar Repuestos'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}