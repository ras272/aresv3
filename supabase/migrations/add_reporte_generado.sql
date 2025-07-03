-- Migración: Agregar campo reporte_generado a tabla mantenimientos
-- Fecha: 2024-12-09
-- Descripción: Agrega control de reportes generados para validar finalización de mantenimientos

-- Agregar campo reporte_generado a la tabla mantenimientos
ALTER TABLE mantenimientos 
ADD COLUMN IF NOT EXISTS reporte_generado BOOLEAN DEFAULT FALSE;

-- Comentario sobre el campo
COMMENT ON COLUMN mantenimientos.reporte_generado IS 'Indica si se ha generado el reporte técnico para este mantenimiento';

-- Crear índice para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_mantenimientos_reporte_generado ON mantenimientos(reporte_generado);

-- Actualizar mantenimientos existentes finalizados como que ya tienen reporte
-- (asumir que los que ya están finalizados tienen reporte)
UPDATE mantenimientos 
SET reporte_generado = TRUE 
WHERE estado = 'Finalizado' AND reporte_generado IS NULL; 