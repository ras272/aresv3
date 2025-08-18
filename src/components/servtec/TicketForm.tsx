// 🎫 Formulario para crear tickets de mantenimiento
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertTriangle, 
  Clock, 
  Wrench, 
  User, 
  Calendar,
  MapPin,
  Building2,
  Zap
} from 'lucide-react';
import type { TicketFormData, EquipoOption, TecnicoOption } from './types';
import { TECNICO_PRINCIPAL } from '@/lib/constants/technician';

interface TicketFormProps {
  formData: Partial<TicketFormData>;
  equipos: EquipoOption[];
  tecnicos: TecnicoOption[];
  onFormChange: (data: Partial<TicketFormData>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
  error?: string;
}

export function TicketForm({
  formData,
  equipos,
  tecnicos,
  onFormChange,
  onSubmit,
  onCancel,
  loading,
  error
}: TicketFormProps) {

  const handleInputChange = (field: keyof TicketFormData, value: string) => {
    onFormChange({ ...formData, [field]: value });
  };

  const equipoSeleccionado = equipos.find(e => e.id === formData.equipoId);

  // Validar si el formulario está completo (técnico auto-asignado)
  const isFormValid = formData.equipoId && 
                     formData.titulo && 
                     formData.descripcion && 
                     formData.prioridad && 
                     formData.tipo;

  // Configuración de prioridades con colores
  const prioridades = [
    { value: 'Baja', label: 'Baja', color: 'bg-green-100 text-green-800', icon: Clock },
    { value: 'Media', label: 'Media', color: 'bg-yellow-100 text-yellow-800', icon: Wrench },
    { value: 'Alta', label: 'Alta', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
    { value: 'Crítica', label: 'Crítica', color: 'bg-red-100 text-red-800', icon: Zap }
  ];

  const tipos = [
    { value: 'Preventivo', label: 'Mantenimiento Preventivo' },
    { value: 'Correctivo', label: 'Mantenimiento Correctivo' }
  ];

  return (
    <div className="space-y-8 px-2">
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Selección de Equipo */}
      <div className="space-y-3">
        <Label htmlFor="equipo" className="text-sm font-semibold flex items-center gap-2">
          <Wrench className="w-4 h-4" />
          Equipo *
        </Label>
        <Select 
          value={formData.equipoId || ''} 
          onValueChange={(value) => handleInputChange('equipoId', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar equipo..." />
          </SelectTrigger>
          <SelectContent>
            {equipos.map((equipo) => (
              <SelectItem key={equipo.id} value={equipo.id}>
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">{equipo.nombre}</span>
                  <div className="flex items-center gap-2 text-xs text-gray-500 ml-2">
                    <Building2 className="w-3 h-3" />
                    {equipo.cliente}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Información del equipo seleccionado */}
        {equipoSeleccionado && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    {equipoSeleccionado.cliente}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-700">
                    {equipoSeleccionado.ubicacion}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Título del Ticket */}
      <div className="space-y-2">
        <Label htmlFor="titulo" className="text-sm font-semibold">
          Título del Ticket *
        </Label>
        <Input
          id="titulo"
          placeholder="Ej: Falla en sistema de ventilación"
          value={formData.titulo || ''}
          onChange={(e) => handleInputChange('titulo', e.target.value)}
          className="w-full"
        />
      </div>

      {/* Tipo y Prioridad en Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Tipo de Mantenimiento */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Tipo de Mantenimiento *</Label>
          <Select 
            value={formData.tipo || ''} 
            onValueChange={(value) => handleInputChange('tipo', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo..." />
            </SelectTrigger>
            <SelectContent>
              {tipos.map((tipo) => (
                <SelectItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Prioridad */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Prioridad *</Label>
          <Select 
            value={formData.prioridad || ''} 
            onValueChange={(value) => handleInputChange('prioridad', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar prioridad..." />
            </SelectTrigger>
            <SelectContent>
              {prioridades.map((prioridad) => {
                const IconComponent = prioridad.icon;
                return (
                  <SelectItem key={prioridad.value} value={prioridad.value}>
                    <div className="flex items-center gap-2">
                      <IconComponent className="w-4 h-4" />
                      <span>{prioridad.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Descripción */}
      <div className="space-y-2">
        <Label htmlFor="descripcion" className="text-sm font-semibold">
          Descripción del Problema *
        </Label>
        <Textarea
          id="descripcion"
          placeholder="Describe detalladamente el problema o trabajo a realizar..."
          value={formData.descripcion || ''}
          onChange={(e) => handleInputChange('descripcion', e.target.value)}
          rows={4}
          className="w-full resize-none"
        />
      </div>

      {/* Asignación de Técnico y Fecha */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Técnico Asignado - Auto-asignado */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <User className="w-4 h-4" />
            Técnico Asignado
          </Label>
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <div className="flex-1">
              <p className="font-medium text-blue-900">{TECNICO_PRINCIPAL.nombre}</p>
              <p className="text-sm text-blue-600">{TECNICO_PRINCIPAL.titulo} - Auto-asignado</p>
            </div>
            <div className="text-xs text-blue-500 bg-blue-100 px-2 py-1 rounded">
              Automático
            </div>
          </div>
        </div>

        {/* Fecha Programada */}
        <div className="space-y-2">
          <Label htmlFor="fecha" className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Fecha Programada
          </Label>
          <Input
            id="fecha"
            type="datetime-local"
            value={formData.fechaProgramada || ''}
            onChange={(e) => handleInputChange('fechaProgramada', e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>
      </div>

      {/* Preview de Prioridad Seleccionada */}
      {formData.prioridad && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Prioridad seleccionada:</span>
          <Badge className={prioridades.find(p => p.value === formData.prioridad)?.color}>
            {formData.prioridad}
          </Badge>
        </div>
      )}

      {/* Botones de Acción */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button 
          onClick={onSubmit}
          disabled={!isFormValid || loading}
          className="min-w-[120px]"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creando...
            </div>
          ) : (
            'Crear Ticket'
          )}
        </Button>
      </div>
    </div>
  );
}