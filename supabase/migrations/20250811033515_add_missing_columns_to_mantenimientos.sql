-- Agregar columnas faltantes a la tabla mantenimientos
ALTER TABLE mantenimientos 
ADD COLUMN IF NOT EXISTS archivo_factura_pdf JSONB,
ADD COLUMN IF NOT EXISTS fecha_programada TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS es_programado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS es_recurrente BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS frecuencia_mantenimiento VARCHAR(20),
ADD COLUMN IF NOT EXISTS proximo_mantenimiento TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS dias_notificacion_anticipada INTEGER,
ADD COLUMN IF NOT EXISTS notificacion_enviada BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tiempo_estimado DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS tiempo_real DECIMAL(4,2);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_mantenimientos_fecha_programada ON mantenimientos(fecha_programada);
CREATE INDEX IF NOT EXISTS idx_mantenimientos_es_programado ON mantenimientos(es_programado);
CREATE INDEX IF NOT EXISTS idx_mantenimientos_tecnico_asignado ON mantenimientos(tecnico_asignado);

-- Comentarios para documentar las nuevas columnas
COMMENT ON COLUMN mantenimientos.archivo_factura_pdf IS 'PDF de la factura del sistema externo en formato JSON';
COMMENT ON COLUMN mantenimientos.fecha_programada IS 'Fecha y hora programada para el mantenimiento';
COMMENT ON COLUMN mantenimientos.es_programado IS 'Indica si es un mantenimiento programado';
COMMENT ON COLUMN mantenimientos.es_recurrente IS 'Indica si es un mantenimiento recurrente';
COMMENT ON COLUMN mantenimientos.frecuencia_mantenimiento IS 'Frecuencia del mantenimiento recurrente';
COMMENT ON COLUMN mantenimientos.proximo_mantenimiento IS 'Fecha del próximo mantenimiento automático';
COMMENT ON COLUMN mantenimientos.dias_notificacion_anticipada IS 'Días antes para notificar';
COMMENT ON COLUMN mantenimientos.notificacion_enviada IS 'Si ya se envió la notificación';
COMMENT ON COLUMN mantenimientos.tiempo_estimado IS 'Tiempo estimado en horas';
COMMENT ON COLUMN mantenimientos.tiempo_real IS 'Tiempo real trabajado en horas';;
