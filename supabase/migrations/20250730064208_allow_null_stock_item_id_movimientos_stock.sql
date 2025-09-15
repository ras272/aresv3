-- Permitir NULL en stock_item_id para movimientos de componentes_disponibles
-- Esto es necesario para el sistema híbrido que maneja tanto stock_items como componentes_disponibles

ALTER TABLE movimientos_stock 
ALTER COLUMN stock_item_id DROP NOT NULL;

-- Agregar comentario para documentar el cambio
COMMENT ON COLUMN movimientos_stock.stock_item_id IS 
'ID del item en stock_items. NULL para movimientos de componentes_disponibles (usar codigo_item para referencia)';;
