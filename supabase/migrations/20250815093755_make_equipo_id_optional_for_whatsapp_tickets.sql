-- Hacer equipo_id opcional para permitir tickets de WhatsApp sin equipo específico
ALTER TABLE mantenimientos 
ALTER COLUMN equipo_id DROP NOT NULL;

-- Agregar comentario explicativo
COMMENT ON COLUMN mantenimientos.equipo_id IS 'ID del equipo (opcional para tickets de WhatsApp sin equipo específico)';;
