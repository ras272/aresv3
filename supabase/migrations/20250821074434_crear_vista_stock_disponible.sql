-- Vista optimizada para calcular stock disponible con presentaciones múltiples
CREATE OR REPLACE VIEW vista_stock_disponible AS 
SELECT 
    si.id as stock_item_id,
    si.codigo_item,
    si.nombre,
    si.marca,
    si.modelo,
    si.cantidad_actual as cajas_stock,
    si.estado,
    si.ubicacion_id,
    si.precio as precio_base,
    si.moneda,
    
    -- Presentación por defecto (unidad base)
    pp_default.id as presentacion_default_id,
    pp_default.nombre as unidad_base,
    pp_default.factor_conversion as factor_default,
    
    -- Cajas abiertas
    sca.id as caja_abierta_id,
    COALESCE(sca.unidades_restantes, 0) as unidades_sueltas,
    COALESCE(sca.factor_original, pp_default.factor_conversion) as factor_caja_abierta,
    
    -- Cálculos de disponibilidad
    CASE 
        WHEN pp_default.factor_conversion > 1 THEN
            -- Para productos con factor > 1 (ej: caja de 6)
            si.cantidad_actual  -- cajas completas disponibles
        ELSE
            -- Para productos individuales
            si.cantidad_actual
    END as cajas_completas_disponibles,
    
    -- Total de unidades individuales disponibles
    (si.cantidad_actual * COALESCE(pp_default.factor_conversion, 1) + COALESCE(sca.unidades_restantes, 0)) as total_unidades_disponibles,
    
    -- Información adicional
    si.fecha_vencimiento,
    si.observaciones,
    si.created_at,
    si.updated_at
    
FROM stock_items si
LEFT JOIN producto_presentaciones pp_default ON si.id = pp_default.stock_item_id AND pp_default.es_default = true
LEFT JOIN stock_cajas_abiertas sca ON si.id = sca.stock_item_id
WHERE si.estado = 'Disponible'
ORDER BY si.nombre, si.marca;;
