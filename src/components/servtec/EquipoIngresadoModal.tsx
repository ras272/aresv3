'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, AlertCircle, Wrench, Package, User } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { EquipoIngresado } from '@/types';
import { toast } from 'sonner';

interface EquipoIngresadoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipoEdit?: EquipoIngresado;
  onSave?: (equipoData: any) => Promise<void>;
}

export default function EquipoIngresadoModal({
  open,
  onOpenChange,
  equipoEdit,
  onSave,
}: EquipoIngresadoModalProps) {
  const {
    addEquipoIngresado,
    updateEquipoIngresado,
    generateCodigoIngreso,
    getClinicasActivas,
  } = useAppStore();

  const clinicas = getClinicasActivas();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    clienteOrigen: '',
    contactoCliente: '',
    telefonoContacto: '',
    equipoNombre: '',
    equipoMarca: '',
    equipoModelo: '',
    equipoSerie: '',
    problemaReportado: '',
    estadoVisualEquipo: '',
    accesoriosIncluidos: '',
    observacionesIngreso: '',
    estadoIngreso: 'Recién llegado' as EquipoIngresado['estadoIngreso'],
    prioridadReparacion: 'Media' as EquipoIngresado['prioridadReparacion'],
  });

  // Cargar datos del equipo para edición
  useEffect(() => {
    if (equipoEdit && open) {
      setFormData({
        clienteOrigen: equipoEdit.clienteOrigen,
        contactoCliente: equipoEdit.contactoCliente,
        telefonoContacto: equipoEdit.telefonoContacto || '',
        equipoNombre: equipoEdit.equipoNombre,
        equipoMarca: equipoEdit.equipoMarca,
        equipoModelo: equipoEdit.equipoModelo || '',
        equipoSerie: equipoEdit.equipoSerie || '',
        problemaReportado: equipoEdit.problemaReportado,
        estadoVisualEquipo: equipoEdit.estadoVisualEquipo || '',
        accesoriosIncluidos: equipoEdit.accesoriosIncluidos || '',
        observacionesIngreso: equipoEdit.observacionesIngreso || '',
        estadoIngreso: equipoEdit.estadoIngreso,
        prioridadReparacion: equipoEdit.prioridadReparacion,
      });
    } else if (!equipoEdit && open) {
      // Reset form for new equipment
      setFormData({
        clienteOrigen: '',
        contactoCliente: '',
        telefonoContacto: '',
        equipoNombre: '',
        equipoMarca: '',
        equipoModelo: '',
        equipoSerie: '',
        problemaReportado: '',
        estadoVisualEquipo: '',
        accesoriosIncluidos: '',
        observacionesIngreso: '',
        estadoIngreso: 'Recién llegado',
        prioridadReparacion: 'Media',
      });
    }
  }, [equipoEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clienteOrigen.trim() || !formData.equipoNombre.trim() || !formData.problemaReportado.trim()) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    setIsLoading(true);

    try {
      if (equipoEdit) {
        // Actualizar equipo existente
        await updateEquipoIngresado(equipoEdit.id, {
          ...formData,
          updatedAt: new Date().toISOString(),
        });
        toast.success('Equipo actualizado exitosamente');
      } else {
        // Crear nuevo equipo
        const equipoData = {
          ...formData,
          fechaIngreso: new Date().toISOString().split('T')[0],
          horaIngreso: new Date().toTimeString().split(' ')[0].substring(0, 5),
        };

        await addEquipoIngresado(equipoData);
        toast.success('Equipo registrado exitosamente');
      }

      onOpenChange(false);
      if (onSave) {
        await onSave(formData);
      }
    } catch (error) {
      console.error('Error saving equipment:', error);
      toast.error(
        equipoEdit 
          ? 'Error al actualizar el equipo'
          : 'Error al registrar el equipo'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'Baja':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Media':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Alta':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Crítica':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-blue-500" />
            {equipoEdit ? 'Editar Equipo Ingresado' : 'Registrar Equipo Ingresado'}
          </DialogTitle>
          <DialogDescription>
            {equipoEdit 
              ? 'Modifique la información del equipo en servicio técnico'
              : 'Complete la información del equipo que ingresa para diagnóstico y reparación'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Cliente */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold">Información del Cliente</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clienteOrigen">
                    Cliente/Clínica <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.clienteOrigen}
                    onValueChange={(value) => handleInputChange('clienteOrigen', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clinicas.map((clinica) => (
                        <SelectItem key={clinica.id} value={clinica.nombre}>
                          {clinica.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactoCliente">
                    Contacto <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contactoCliente"
                    value={formData.contactoCliente}
                    onChange={(e) => handleInputChange('contactoCliente', e.target.value)}
                    placeholder="Nombre del contacto"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefonoContacto">Teléfono</Label>
                  <Input
                    id="telefonoContacto"
                    value={formData.telefonoContacto}
                    onChange={(e) => handleInputChange('telefonoContacto', e.target.value)}
                    placeholder="Teléfono de contacto"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Equipo */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-4 w-4 text-green-500" />
                <h3 className="font-semibold">Información del Equipo</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="equipoNombre">
                    Nombre del Equipo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="equipoNombre"
                    value={formData.equipoNombre}
                    onChange={(e) => handleInputChange('equipoNombre', e.target.value)}
                    placeholder="Ej: Monitor Multiparámetro"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="equipoMarca">
                    Marca <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="equipoMarca"
                    value={formData.equipoMarca}
                    onChange={(e) => handleInputChange('equipoMarca', e.target.value)}
                    placeholder="Ej: Philips, GE, Siemens"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="equipoModelo">Modelo</Label>
                  <Input
                    id="equipoModelo"
                    value={formData.equipoModelo}
                    onChange={(e) => handleInputChange('equipoModelo', e.target.value)}
                    placeholder="Modelo del equipo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="equipoSerie">Número de Serie</Label>
                  <Input
                    id="equipoSerie"
                    value={formData.equipoSerie}
                    onChange={(e) => handleInputChange('equipoSerie', e.target.value)}
                    placeholder="Número de serie"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalles del Problema y Estado */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <h3 className="font-semibold">Problema Reportado y Estado</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="problemaReportado">
                    Problema Reportado <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="problemaReportado"
                    value={formData.problemaReportado}
                    onChange={(e) => handleInputChange('problemaReportado', e.target.value)}
                    placeholder="Descripción detallada del problema reportado por el cliente"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estadoIngreso">Estado del Ingreso</Label>
                    <Select
                      value={formData.estadoIngreso}
                      onValueChange={(value: EquipoIngresado['estadoIngreso']) => 
                        handleInputChange('estadoIngreso', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Recién llegado">Recién llegado</SelectItem>
                        <SelectItem value="En diagnóstico">En diagnóstico</SelectItem>
                        <SelectItem value="En reparación">En reparación</SelectItem>
                        <SelectItem value="Esperando repuestos">Esperando repuestos</SelectItem>
                        <SelectItem value="Listo para entrega">Listo para entrega</SelectItem>
                        <SelectItem value="Entregado">Entregado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prioridadReparacion">Prioridad de Reparación</Label>
                    <Select
                      value={formData.prioridadReparacion}
                      onValueChange={(value: EquipoIngresado['prioridadReparacion']) => 
                        handleInputChange('prioridadReparacion', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baja">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getPrioridadColor('Baja')}>
                              Baja
                            </Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="Media">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getPrioridadColor('Media')}>
                              Media
                            </Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="Alta">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getPrioridadColor('Alta')}>
                              Alta
                            </Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="Crítica">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getPrioridadColor('Crítica')}>
                              Crítica
                            </Badge>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estadoVisualEquipo">Estado Visual del Equipo</Label>
                  <Textarea
                    id="estadoVisualEquipo"
                    value={formData.estadoVisualEquipo}
                    onChange={(e) => handleInputChange('estadoVisualEquipo', e.target.value)}
                    placeholder="Descripción del estado físico y visual del equipo"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accesoriosIncluidos">Accesorios Incluidos</Label>
                  <Textarea
                    id="accesoriosIncluidos"
                    value={formData.accesoriosIncluidos}
                    onChange={(e) => handleInputChange('accesoriosIncluidos', e.target.value)}
                    placeholder="Lista de cables, sensores, manuales y otros accesorios incluidos"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacionesIngreso">Observaciones Adicionales</Label>
                  <Textarea
                    id="observacionesIngreso"
                    value={formData.observacionesIngreso}
                    onChange={(e) => handleInputChange('observacionesIngreso', e.target.value)}
                    placeholder="Cualquier información adicional relevante"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                equipoEdit ? 'Actualizando...' : 'Registrando...'
              ) : (
                equipoEdit ? 'Actualizar Equipo' : 'Registrar Equipo'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
