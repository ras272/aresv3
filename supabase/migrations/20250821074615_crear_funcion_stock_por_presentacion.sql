-- Función para obtener stock disponible por cada presentación de un producto
CREATE OR REPLACE FUNCTION obtener_stock_por_presentaciones(p_stock_item_id UUID)
RETURNS TABLE (
    presentacion_id UUID,
    nombre_presentacion TEXT,
    factor_conversion NUMERIC,
    precio_venta NUMERIC,
    unidades_disponibles INTEGER,
    puede_vender_completa BOOLEAN,
    es_default BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pp.id as presentacion_id,
        pp.nombre as nombre_presentacion,
        pp.factor_conversion,
        pp.precio_venta,
        
        -- Calcular unidades disponibles para esta presentación
        CASE 
            WHEN pp.factor_conversion = 1 THEN
                -- Presentación individual: stock base + unidades sueltas
                (si.cantidad_actual + COALESCE(sca.unidades_restantes, 0))::INTEGER
            ELSE
                -- Presentación múltiple: solo las cajas completas
                si.cantidad_actual::INTEGER
        END as unidades_disponibles,
        
        -- Si puede vender la presentación completa
        CASE 
            WHEN pp.factor_conversion = 1 THEN
                (si.cantidad_actual + COALESCE(sca.unidades_restantes, 0)) >= 1
            ELSE
                si.cantidad_actual >= 1
        END as puede_vender_completa,
        
        pp.es_default
        
    FROM producto_presentaciones pp
    INNER JOIN stock_items si ON pp.stock_item_id = si.id
    LEFT JOIN stock_cajas_abiertas sca ON si.id = sca.stock_item_id
    WHERE pp.stock_item_id = p_stock_item_id
      AND pp.es_activa = true
      AND si.estado = 'Disponible'
    ORDER BY pp.es_default DESC, pp.factor_conversion ASC;
END;
$$ LANGUAGE plpgsql;;
