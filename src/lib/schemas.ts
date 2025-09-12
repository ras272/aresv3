import { z } from 'zod';

export const componenteFormSchema = z.object({
  nombre: z.string().min(1, 'El nombre del componente es obligatorio'),
  numeroSerie: z.string().min(1, 'El número de serie es obligatorio'),
  estado: z.enum(['Operativo', 'En reparacion', 'Fuera de servicio']),
  observaciones: z.string().optional(),
});

export const componenteSchema = z.object({
  id: z.string(),
  nombre: z.string().min(1, 'El nombre del componente es obligatorio'),
  numeroSerie: z.string().min(1, 'El número de serie es obligatorio'),
  estado: z.enum(['Operativo', 'En reparacion', 'Fuera de servicio']),
  observaciones: z.string().optional(),
});

export const equipoSchema = z.object({
  cliente: z.string().min(2, 'El cliente debe tener al menos 2 caracteres'),
  ubicacion: z.string().min(1, 'La ubicación es obligatoria'),
  nombreEquipo: z.string().min(1, 'El nombre del equipo es obligatorio'),
  tipoEquipo: z.string().min(1, 'Selecciona un tipo de equipo'),
  marca: z.string().min(1, 'La marca es obligatoria'),
  numeroSerieBase: z.string().min(1, 'El número de serie base es obligatorio'),
  componentes: z.array(componenteFormSchema).min(1, 'Debe agregar al menos un componente'),
  accesorios: z.string().min(1, 'Describe los accesorios incluidos'),
  fechaEntrega: z.string().min(1, 'La fecha de entrega es obligatoria'),
  observaciones: z.string().optional(),
});

export const mantenimientoSchema = z.object({
  descripcion: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  estado: z.enum(['Pendiente', 'En proceso', 'Finalizado']),
  comentarios: z.string().optional(),
  componenteId: z.string().optional(),
});

// Schemas para el módulo de Ingreso de Mercaderías - REDISEÑADO para múltiples productos por carga
export const subItemSchema = z.object({
  nombre: z.string().min(1, 'El nombre del subitem es obligatorio'),
  numeroSerie: z.string().optional(), // 🔧 OPCIONAL - No todos los accesorios tienen número de serie
  cantidad: z.number().min(1, 'La cantidad debe ser mayor a 0'),
  paraServicioTecnico: z.boolean().optional(), // 🎯 NUEVO: Control manual para servicio técnico
});

export const productoCargaSchema = z.object({
  producto: z.string().min(1, 'El nombre del producto es obligatorio'),
  tipoProducto: z.enum(['Insumo', 'Repuesto', 'Equipo Médico'], {
    required_error: 'Debe seleccionar un tipo de producto',
  }),
  marca: z.string().min(1, 'La marca es obligatoria'),
  modelo: z.string().min(1, 'El modelo es obligatorio'),
  numeroSerie: z.string().optional(),
  cantidad: z.number().min(1, 'La cantidad debe ser mayor a 0'),
  observaciones: z.string().optional(),
  paraServicioTecnico: z.boolean().optional(), // 🎯 NUEVO: Control manual para servicio técnico
  imagen: z.string().optional(),
  // Nuevos campos específicos para equipos estéticos
  voltaje: z.string().optional(),
  frecuencia: z.string().optional(),
  tipoTratamiento: z.string().optional(),
  registroSanitario: z.string().optional(),
  documentosAduaneros: z.string().optional(),
  subitems: z.array(subItemSchema).optional(),
}).refine((data) => {
  // Si es equipo médico, el número de serie es obligatorio
  if (data.tipoProducto === 'Equipo Médico') {
    return data.numeroSerie && data.numeroSerie.length > 0;
  }
  return true;
}, {
  message: 'El número de serie es obligatorio para equipos médicos',
  path: ['numeroSerie'],
});

export const cargaMercaderiaSchema = z.object({
  tipoCarga: z.enum(['stock', 'cliente', 'reparacion', 'repuestos'], {
    required_error: 'Debe seleccionar el tipo de carga'
  }),
  // Campos condicionales para cliente específico
  cliente: z.string().optional(),
  ubicacionServicio: z.string().optional(),
  // Observaciones generales para ambos tipos
  observacionesGenerales: z.string().optional(),
  // Número de carga personalizado (AWB, BL, etc.)
  numeroCargaPersonalizado: z.string().optional(),
  productos: z.array(productoCargaSchema).min(1, 'Debe agregar al menos un producto a la carga'),
}).refine((data) => {
  // Si es para cliente específico o reparación, cliente y ubicación son requeridos
  if (data.tipoCarga === 'cliente' || data.tipoCarga === 'reparacion') {
    return data.cliente && data.cliente.length > 0 && 
           data.ubicacionServicio && data.ubicacionServicio.length > 0;
  }
  return true;
}, {
  message: 'Cliente e Ubicación/Servicio son requeridos para cargas de cliente específico o reparación',
  path: ['cliente'] // Esto mostrará el error en el campo cliente
});

// Schemas anteriores mantenidos para compatibilidad
export const ingresoMercaderiaSchema = z.object({
  producto: z.string().min(1, 'El nombre del producto es obligatorio'),
  tipoProducto: z.enum(['Insumo', 'Repuesto', 'Equipo Médico'], {
    required_error: 'Debe seleccionar un tipo de producto',
  }),
  marca: z.string().min(1, 'La marca es obligatoria'),
  modelo: z.string().min(1, 'El modelo es obligatorio'),
  numeroSerie: z.string().optional(),
  cantidad: z.number().min(1, 'La cantidad debe ser mayor a 0'),
  destino: z.string().min(1, 'El destino es obligatorio'),
  observaciones: z.string().optional(),
  imagen: z.string().optional(),
  subitems: z.array(subItemSchema).optional(),
}).refine((data) => {
  // Si es equipo médico, el número de serie es obligatorio
  if (data.tipoProducto === 'Equipo Médico') {
    return data.numeroSerie && data.numeroSerie.length > 0;
  }
  return true;
}, {
  message: 'El número de serie es obligatorio para equipos médicos',
  path: ['numeroSerie'],
});

// ===============================================
// ESQUEMAS PARA EL SISTEMA DE REPUESTOS
// ===============================================

// Eliminamos la segunda importación de z ya que ya está importada al inicio del archivo

export const repuestoSchema = z.object({
  id: z.string().optional(),
  codigo_repuesto: z.string().optional(),
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional().nullable(),
  marca: z.string().optional().nullable(),
  modelo: z.string().optional().nullable(),
  numero_serie: z.string().optional().nullable(),
  lote: z.string().optional().nullable(),
  cantidad_actual: z.number().min(0, 'La cantidad debe ser mayor o igual a 0'),
  cantidad_minima: z.number().min(1, 'La cantidad mínima debe ser mayor a 0'),
  unidad_medida: z.string().optional().default('unidad'),
  estado: z.enum(['Disponible', 'Reservado', 'En_uso', 'Dañado', 'Vencido']).default('Disponible'),
  categoria: z.string().optional().nullable(),
  subcategoria: z.string().optional().nullable(),
  proveedor: z.string().optional().nullable(),
  precio_unitario: z.number().optional().nullable(),
  moneda: z.string().optional().default('USD'),
  fecha_ingreso: z.string().optional().nullable(),
  fecha_vencimiento: z.string().optional().nullable(),
  fotos: z.array(z.string()).optional().nullable(),
  documentos: z.array(z.string()).optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  observaciones: z.string().optional().nullable(),
  activo: z.boolean().optional().default(true),
});

export const movimientoRepuestoSchema = z.object({
  id: z.string().optional(),
  repuesto_id: z.string().min(1, 'El ID del repuesto es requerido'),
  tipo_movimiento: z.enum(['Entrada', 'Salida', 'Transferencia', 'Ajuste', 'Asignacion']),
  cantidad: z.number().min(1, 'La cantidad debe ser mayor a 0'),
  cantidad_anterior: z.number().min(0),
  cantidad_nueva: z.number().min(0),
  motivo: z.string().min(1, 'El motivo es requerido'),
  referencia_externa: z.string().optional().nullable(),
  usuario: z.string().optional().nullable(),
  costo_unitario: z.number().optional().nullable(),
  costo_total: z.number().optional().nullable(),
  observaciones: z.string().optional().nullable(),
});

export const asignacionRepuestoSchema = z.object({
  repuesto_id: z.string().min(1, 'El ID del repuesto es requerido'),
  equipo_id: z.string().min(1, 'El ID del equipo es requerido'),
  mantenimiento_id: z.string().optional().nullable(),
  cantidad_usada: z.number().min(1, 'La cantidad usada debe ser mayor a 0'),
  tecnico_responsable: z.string().optional().nullable(),
  motivo_uso: z.string().min(1, 'El motivo de uso es requerido'),
  observaciones: z.string().optional().nullable(),
});

export type ComponenteFormData = z.infer<typeof componenteFormSchema>;
export type ComponenteData = z.infer<typeof componenteSchema>;
export type EquipoFormData = z.infer<typeof equipoSchema>;
export type MantenimientoFormData = z.infer<typeof mantenimientoSchema>;
export type SubItemFormData = z.infer<typeof subItemSchema>;
export type ProductoCargaFormData = z.infer<typeof productoCargaSchema>;
export type CargaMercaderiaFormData = z.infer<typeof cargaMercaderiaSchema>;
export type IngresoMercaderiaFormData = z.infer<typeof ingresoMercaderiaSchema>; 
export type RepuestoFormData = z.infer<typeof repuestoSchema>;
export type MovimientoRepuestoFormData = z.infer<typeof movimientoRepuestoSchema>;
export type AsignacionRepuestoFormData = z.infer<typeof asignacionRepuestoSchema>;