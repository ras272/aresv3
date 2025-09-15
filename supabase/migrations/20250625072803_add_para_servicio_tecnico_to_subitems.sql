-- Agregar columna para control manual de servicio técnico
-- Migración: 2025-01-15 - Control manual de subitems para servicio técnico

-- 1. Agregar la nueva columna a la tabla subitems
ALTER TABLE public.subitems 
ADD COLUMN para_servicio_tecnico BOOLEAN DEFAULT FALSE;

-- 2. Agregar comentario descriptivo
COMMENT ON COLUMN public.subitems.para_servicio_tecnico IS 'Indica si este subitem está marcado manualmente para ir al servicio técnico';

-- 3. Actualizar datos existentes (opcional - por defecto serán FALSE)
UPDATE public.subitems 
SET para_servicio_tecnico = FALSE 
WHERE para_servicio_tecnico IS NULL;;
