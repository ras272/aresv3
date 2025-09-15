-- Agregar nuevo estado "Esperando repuestos" al enum
ALTER TYPE estado_mantenimiento ADD VALUE 'Esperando repuestos';

-- Agregar comentario explicativo
COMMENT ON TYPE estado_mantenimiento IS 'Estados: Pendiente, En proceso, Esperando repuestos, Finalizado';;
