// 🎫 Tipos para el sistema de tickets de ServTec
export interface TicketFormData {
  equipoId: string;
  titulo: string;
  descripcion: string;
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  tipo: 'Preventivo' | 'Correctivo' | 'Emergencia' | 'Instalación';
  tecnicoAsignado?: string;
  fechaProgramada?: string;
  ubicacion?: string;
  cliente?: string;
}

export interface TicketCreationResponse {
  success: boolean;
  ticketId?: string;
  message: string;
}

export interface EquipoOption {
  id: string;
  nombre: string;
  cliente: string;
  ubicacion: string;
  estado: string;
}

export interface TecnicoOption {
  id: string;
  nombre: string;
  especialidad?: string;
  disponible: boolean;
}

// Estados del modal
export type TicketModalStep = 'equipo' | 'detalles' | 'asignacion' | 'confirmacion';

export interface TicketModalState {
  isOpen: boolean;
  currentStep: TicketModalStep;
  formData: Partial<TicketFormData>;
  loading: boolean;
  error?: string;
}