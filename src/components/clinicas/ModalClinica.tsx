'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Building2, MapPin, Phone, Mail, User } from 'lucide-react';
import { toast } from 'sonner';
import { Clinica } from '@/types';

interface ModalClinicaProps {
  isOpen: boolean;
  onClose: () => void;
  clinica?: Clinica | null;
}

export default function ModalClinica({ isOpen, onClose, clinica }: ModalClinicaProps) {
  const { addClinica, updateClinica } = useAppStore();
  
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    ciudad: '',
    telefono: '',
    email: '',
    contactoPrincipal: '',
    observaciones: '',
    activa: true
  });

  const [loading, setLoading] = useState(false);

  // Cargar datos de la clínica si estamos editando
  useEffect(() => {
    if (clinica) {
      setFormData({
        nombre: clinica.nombre,
        direccion: clinica.direccion,
        ciudad: clinica.ciudad,
        telefono: clinica.telefono || '',
        email: clinica.email || '',
        contactoPrincipal: clinica.contactoPrincipal || '',
        observaciones: clinica.observaciones || '',
        activa: clinica.activa
      });
    } else {
      // Resetear formulario para nueva clínica
      setFormData({
        nombre: '',
        direccion: '',
        ciudad: '',
        telefono: '',
        email: '',
        contactoPrincipal: '',
        observaciones: '',
        activa: true
      });
    }
  }, [clinica, isOpen]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.nombre.trim()) {
      toast.error('El nombre de la clínica es obligatorio');
      return;
    }
    
    if (!formData.direccion.trim()) {
      toast.error('La dirección es obligatoria');
      return;
    }
    
    if (!formData.ciudad.trim()) {
      toast.error('La ciudad es obligatoria');
      return;
    }

    setLoading(true);
    
    try {
      if (clinica) {
        // Actualizar clínica existente
        await updateClinica(clinica.id, formData);
        toast.success('Clínica actualizada exitosamente');
      } else {
        // Crear nueva clínica
        await addClinica(formData);
        toast.success('Clínica registrada exitosamente');
      }
      
      onClose();
    } catch (error) {
      console.error('Error al guardar clínica:', error);
      toast.error('Error al guardar la clínica');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {clinica ? 'Editar Clínica' : 'Nueva Clínica'}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Información Básica</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre de la Clínica *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    placeholder="Hospital Central, Clínica San Roque..."
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="ciudad">Ciudad *</Label>
                  <Input
                    id="ciudad"
                    value={formData.ciudad}
                    onChange={(e) => handleInputChange('ciudad', e.target.value)}
                    placeholder="Asunción, Ciudad del Este..."
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="direccion">Dirección Completa *</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => handleInputChange('direccion', e.target.value)}
                  placeholder="Av. Mariscal López 1234, entre Brasilia y España"
                  required
                />
              </div>
            </div>

            {/* Información de contacto */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Información de Contacto
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactoPrincipal">Persona de Contacto</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="contactoPrincipal"
                      value={formData.contactoPrincipal}
                      onChange={(e) => handleInputChange('contactoPrincipal', e.target.value)}
                      placeholder="Dr. Juan Pérez, Lic. María González..."
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="telefono">Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => handleInputChange('telefono', e.target.value)}
                      placeholder="021-123456, 0981-123456"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="contacto@clinica.com.py"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Estado y observaciones */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="activa"
                  checked={formData.activa}
                  onChange={(e) => handleInputChange('activa', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="activa">Clínica activa (disponible para remisiones)</Label>
              </div>

              <div>
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) => handleInputChange('observaciones', e.target.value)}
                  placeholder="Notas adicionales, horarios especiales, instrucciones de entrega..."
                  rows={3}
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Guardando...' : (clinica ? 'Actualizar' : 'Registrar')} Clínica
              </Button>
            </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}