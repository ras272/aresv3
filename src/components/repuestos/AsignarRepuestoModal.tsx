'use client';

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { asignarRepuestoAEquipo } from '@/lib/repuestos-database';
import { Search, Plus, Package } from 'lucide-react';

interface AsignarRepuestoModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipoId: string;
  equipoNombre: string;
  onRepuestoAsignado: () => void;
}

export function AsignarRepuestoModal({ 
  isOpen, 
  onClose, 
  equipoId, 
  equipoNombre,
  onRepuestoAsignado 
}: AsignarRepuestoModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRepuesto, setSelectedRepuesto] = useState<any>(null);
  const [cantidad, setCantidad] = useState(1);
  const [motivo, setMotivo] = useState('Reparacion');
  const [tecnico, setTecnico] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearchRepuesto = () => {
    // TODO: Implementar búsqueda de repuestos
    toast.info('Funcionalidad de búsqueda pendiente de implementación');
  };

  const handleAsignarRepuesto = async () => {
    if (!selectedRepuesto) {
      toast.error('Por favor, seleccione un repuesto');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await asignarRepuestoAEquipo({
        repuesto_id: selectedRepuesto.id,
        equipo_id: equipoId,
        cantidad_usada: cantidad,
        motivo_uso: motivo,
        tecnico_responsable: tecnico,
        observaciones: observaciones,
        mantenimiento_id: null,
      });
      
      toast.success('Repuesto asignado exitosamente');
      onRepuestoAsignado();
      onClose();
      
      // Resetear formulario
      setSearchTerm('');
      setSelectedRepuesto(null);
      setCantidad(1);
      setMotivo('Reparacion');
      setTecnico('');
      setObservaciones('');
    } catch (error) {
      console.error('Error al asignar repuesto:', error);
      toast.error('Error al asignar el repuesto');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Asignar Repuesto a Equipo</DialogTitle>
          <DialogDescription>
            Asignar un repuesto al equipo: <strong>{equipoNombre}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Búsqueda de repuesto */}
          <div className="space-y-2">
            <Label htmlFor="search-repuesto">Buscar Repuesto</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-repuesto"
                  placeholder="Buscar por nombre, código o marca..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={handleSearchRepuesto} variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Repuesto seleccionado */}
          {selectedRepuesto ? (
            <div className="border rounded-lg p-4 bg-muted">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{selectedRepuesto.nombre}</h3>
                  <p className="text-sm text-muted-foreground">
                    Código: {selectedRepuesto.codigo_repuesto}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Stock disponible: {selectedRepuesto.cantidad_actual}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedRepuesto(null)}
                >
                  Cambiar
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium">No hay repuesto seleccionado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Busque y seleccione un repuesto para asignar al equipo.
              </p>
            </div>
          )}
          
          {/* Formulario de asignación */}
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad a Usar</Label>
                <Input
                  id="cantidad"
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(Number(e.target.value))}
                  disabled={!selectedRepuesto}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo de Uso</Label>
                <select
                  id="motivo"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  disabled={!selectedRepuesto}
                >
                  <option value="Reparacion">Reparación</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Upgrade">Upgrade</option>
                  <option value="Instalacion">Instalación</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tecnico">Técnico Responsable</Label>
              <Input
                id="tecnico"
                value={tecnico}
                onChange={(e) => setTecnico(e.target.value)}
                placeholder="Nombre del técnico responsable"
                disabled={!selectedRepuesto}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <textarea
                id="observaciones"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Observaciones adicionales"
                disabled={!selectedRepuesto}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleAsignarRepuesto}
            disabled={!selectedRepuesto || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Asignando...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Asignar Repuesto
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}