-- Agregar campo para número de carga personalizado
ALTER TABLE cargas_mercaderia 
ADD COLUMN numero_carga_personalizado VARCHAR(255);

-- Agregar comentario explicativo
COMMENT ON COLUMN cargas_mercaderia.numero_carga_personalizado IS 'Número de carga/envío personalizado ingresado por el usuario (AWB, BL, etc.)';

-- Crear índice para búsquedas rápidas
CREATE INDEX idx_cargas_mercaderia_numero_personalizado 
ON cargas_mercaderia(numero_carga_personalizado) 
WHERE numero_carga_personalizado IS NOT NULL;;
