-- Agregar columna numero_reporte a la tabla mantenimientos
ALTER TABLE mantenimientos 
ADD COLUMN numero_reporte VARCHAR(20) UNIQUE;

-- Crear índice para búsquedas rápidas
CREATE INDEX idx_mantenimientos_numero_reporte ON mantenimientos(numero_reporte);

-- Comentario para documentar el campo
COMMENT ON COLUMN mantenimientos.numero_reporte IS 'Identificador único del reporte en formato RPT-YYYYMMDD-XXX';;
