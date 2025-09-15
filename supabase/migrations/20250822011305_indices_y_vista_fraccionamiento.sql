-- 6. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_stock_items_fraccionables 
ON stock_items(permite_fraccionamiento) WHERE permite_fraccionamiento = true;

CREATE INDEX IF NOT EXISTS idx_stock_cajas_abiertas_item 
ON stock_cajas_abiertas(stock_item_id);

CREATE INDEX IF NOT EXISTS idx_productos_carga_fraccionables 
ON productos_carga(permite_fraccionamiento) WHERE permite_fraccionamiento = true;

-- 7. Vista para stock disponible con fraccionamiento
CREATE OR REPLACE VIEW v_stock_disponible_fraccionado AS
SELECT 
    si.id,
    si.codigo_item,
    si.nombre,
    si.marca,
    si.modelo,
    COALESCE(si.cajas_completas, 0) as cajas_completas,
    COALESCE(si.unidades_sueltas, 0) as unidades_sueltas,
    COALESCE(si.unidades_por_paquete, 1) as unidades_por_paquete,
    COALESCE(si.permite_fraccionamiento, false) as permite_fraccionamiento,
    -- Cálculo de unidades totales disponibles
    (COALESCE(si.cajas_completas, 0) * COALESCE(si.unidades_por_paquete, 1)) + COALESCE(si.unidades_sueltas, 0) AS unidades_totales,
    -- Stock en formato legible
    CASE 
        WHEN COALESCE(si.permite_fraccionamiento, false) THEN
            CASE 
                WHEN si.cajas_completas > 0 AND si.unidades_sueltas > 0 THEN
                    si.cajas_completas || ' caja(s) + ' || si.unidades_sueltas || ' unidad(es)'
                WHEN si.cajas_completas > 0 THEN
                    si.cajas_completas || ' caja(s)'
                WHEN si.unidades_sueltas > 0 THEN
                    si.unidades_sueltas || ' unidad(es)'
                ELSE
                    'Sin stock'
            END
        ELSE
            COALESCE(si.cantidad_actual, 0) || ' unidad(es)'
    END AS stock_formato_legible,
    si.estado,
    si.ubicacion_id,
    si.precio,
    si.moneda,
    si.cantidad_minima,
    si.cantidad_actual
FROM stock_items si
WHERE si.estado = 'Disponible';

-- 8. Comentarios adicionales en tablas
COMMENT ON TABLE stock_cajas_abiertas IS 
'Registro de cajas/paquetes que han sido abiertos para venta fraccionada';

COMMENT ON TABLE producto_presentaciones IS 
'Define las diferentes presentaciones de venta de un producto (caja, unidad, etc.)';;
