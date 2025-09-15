-- Agregar columna para control manual de servicio técnico en productos principales
-- Migración: 2025-01-15 - Control manual de productos principales para servicio técnico

-- 1. Agregar la nueva columna a la tabla productos_carga (NO productos)
ALTER TABLE public.productos_carga 
ADD COLUMN para_servicio_tecnico BOOLEAN DEFAULT FALSE;

-- 2. Agregar comentario descriptivo
COMMENT ON COLUMN public.productos_carga.para_servicio_tecnico IS 'Indica si este producto está marcado manualmente para ir al servicio técnico (modo rápido)';

-- 3. Actualizar datos existentes (opcional - por defecto serán FALSE)
UPDATE public.productos_carga 
SET para_servicio_tecnico = FALSE 
WHERE para_servicio_tecnico IS NULL;;
