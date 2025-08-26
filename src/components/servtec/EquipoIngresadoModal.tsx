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
    
    // 👨‍💻 Mensaje de Jack - funcionalidad en desarrollo
    toast.info('Jack está terminando acá...', {
      duration: 3000,
      description: 'Esta funcionalidad estará disponible pronto'
    });
    
    // Cerrar el modal después de mostrar el mensaje
    setTimeout(() => {
      onOpenChange(false);
    }, 1500);
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
            👨‍💻 Jack está terminando esta funcionalidad. Estará disponible pronto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mensaje de Jack - Funcionalidad en desarrollo */}
          <Card className="border-2 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                  <Wrench className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-orange-800 mb-2">
                  👨‍💻 Jack está terminando acá...
                </h3>
                <p className="text-orange-700">
                  Esta funcionalidad estará disponible muy pronto.
                  <br />
                  ¡Gracias por tu paciencia!
                </p>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Entendido
            </Button>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
              👍 Está bien, esperaré
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
