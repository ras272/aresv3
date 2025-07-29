-- ===============================================
-- MIGRACIÓN: Agregar precio del servicio a mantenimientos
-- ===============================================

-- Agregar columna para el precio del servicio
ALTER TABLE public.mantenimientos 
ADD COLUMN precio_servicio DECIMAL(12,2) DEFAULT NULL;

-- Agregar comentario descriptivo
COMMENT ON COLUMN public.mantenimientos.precio_servicio IS 'Precio del servicio técnico en guaraníes (se completa cuando se genera el reporte)';

-- Verificar la estructura actualizada
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'mantenimientos' 
  AND table_schema = 'public'
ORDER BY ordinal_position;