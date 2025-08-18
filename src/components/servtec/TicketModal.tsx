// 🎫 Modal para crear tickets de mantenimiento en ServTec
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { TicketForm } from './TicketForm';
import { crearTicket } from '@/lib/database/tickets';
import { useAppStore } from '@/store/useAppStore';
import { TECNICO_PRINCIPAL } from '@/lib/constants/technician';
import type { TicketFormData, EquipoOption, TecnicoOption } from './types';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketCreated?: (ticketId: string) => void;
}

export function TicketModal({ isOpen, onClose, onTicketCreated }: TicketModalProps) {
  const { equipos, loadAllData } = useAppStore();
  
  // Estados del modal
  const [formData, setFormData] = useState<Partial<TicketFormData>>({});
  const [tecnicos, setTecnicos] = useState<TecnicoOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  // Auto-asignar a Javier Lopez - No necesitamos cargar técnicos
  useEffect(() => {
    if (isOpen) {
      // Auto-asignar al técnico principal al abrir el modal
      setFormData(prev => ({
        ...prev,
        tecnicoAsignado: TECNICO_PRINCIPAL.nombre
      }));
    }
  }, [isOpen]);

  // Limpiar formulario cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setFormData({});
      setError(undefined);
    }
  }, [isOpen]);

  const cargarTecnicos = async () => {
    try {
      const tecnicosData = await obtenerTecnicosDisponibles();
      setTecnicos(tecnicosData);
    } catch (error) {
      console.error('Error cargando técnicos:', error);
      toast.error('Error al cargar la lista de técnicos');
    }
  };

  // Convertir equipos del store al formato requerido
  const equiposOptions: EquipoOption[] = equipos.map(equipo => ({
    id: equipo.id,
    nombre: equipo.nombreEquipo || equipo.nombre_equipo || 'Equipo sin nombre',
    cliente: equipo.cliente || 'Cliente no especificado',
    ubicacion: equipo.ubicacion || 'Ubicación no especificada',
    estado: equipo.estado || 'Desconocido'
  }));

  const handleFormChange = (newData: Partial<TicketFormData>) => {
    setFormData(newData);
    setError(undefined); // Limpiar error cuando el usuario modifica el formulario
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(undefined);

    try {
      // Validar datos requeridos (técnico se auto-asigna)
      if (!formData.equipoId || !formData.titulo || !formData.descripcion || !formData.prioridad || !formData.tipo) {
        setError('Por favor completa todos los campos requeridos');
        setLoading(false);
        return;
      }

      // Asegurar que el técnico principal esté asignado
      const formDataConTecnico = {
        ...formData,
        tecnicoAsignado: TECNICO_PRINCIPAL.nombre
      };

      // Crear el ticket con técnico auto-asignado
      const response = await crearTicket(formDataConTecnico as TicketFormData);

      if (response.success) {
        toast.success('¡Ticket creado exitosamente!', {
          description: `Ticket ${response.ticketId} ha sido creado y asignado.`
        });

        // Recargar datos para actualizar la vista
        await loadAllData();

        // Notificar al componente padre
        if (onTicketCreated && response.ticketId) {
          onTicketCreated(response.ticketId);
        }

        // Cerrar modal
        onClose();
      } else {
        setError(response.message);
        toast.error('Error al crear el ticket', {
          description: response.message
        });
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      setError('Error inesperado al crear el ticket');
      toast.error('Error inesperado al crear el ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (loading) return; // Prevenir cierre durante carga
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-8">
        <DialogHeader className="mb-6">
          <DialogTitle className="flex items-center gap-2 text-xl">
            🎫 Crear Nuevo Ticket de Mantenimiento
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          <TicketForm
            formData={formData}
            equipos={equiposOptions}
            tecnicos={tecnicos}
            onFormChange={handleFormChange}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
            error={error}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook personalizado para usar el modal de tickets
export function useTicketModal() {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return {
    isOpen,
    openModal,
    closeModal,
    TicketModal: (props: Omit<TicketModalProps, 'isOpen' | 'onClose'>) => (
      <TicketModal {...props} isOpen={isOpen} onClose={closeModal} />
    )
  };
}