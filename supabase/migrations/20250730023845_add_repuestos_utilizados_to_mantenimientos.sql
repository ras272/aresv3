-- Migración para agregar repuestos utilizados a mantenimientos
-- Fecha: 2025-01-30
-- Descripción: Agrega el campo repuestos_utilizados para trackear repuestos usados en servicios técnicos

-- Agregar columna para repuestos utilizados (JSON)
ALTER TABLE public.mantenimientos 
ADD COLUMN repuestos_utilizados JSONB DEFAULT '[]'::jsonb;

-- Agregar comentario descriptivo
COMMENT ON COLUMN public.mantenimientos.repuestos_utilizados IS 'Array JSON de repuestos utilizados en el mantenimiento con información de stock';

-- Crear índice para consultas eficientes en repuestos utilizados
CREATE INDEX idx_mantenimientos_repuestos_utilizados ON public.mantenimientos USING GIN (repuestos_utilizados);

-- Verificar la estructura actualizada
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'mantenimientos' 
AND table_schema = 'public'
ORDER BY ordinal_position;;
