-- 4. Función para validar disponibilidad antes de venta
CREATE OR REPLACE FUNCTION validar_disponibilidad_venta(
    p_stock_item_id UUID,
    p_cantidad INTEGER,
    p_tipo_venta VARCHAR(50) -- 'caja' o 'unidad'
) RETURNS JSONB AS $$
DECLARE
    v_stock RECORD;
    v_disponible BOOLEAN := false;
    v_unidades_necesarias INTEGER;
    v_unidades_disponibles INTEGER;
BEGIN
    SELECT * INTO v_stock
    FROM stock_items
    WHERE id = p_stock_item_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'disponible', false,
            'error', 'Producto no encontrado'
        );
    END IF;
    
    -- Calcular unidades disponibles
    v_unidades_disponibles := (COALESCE(v_stock.cajas_completas, 0) * COALESCE(v_stock.unidades_por_paquete, 1)) + COALESCE(v_stock.unidades_sueltas, 0);
    
    IF p_tipo_venta = 'caja' THEN
        v_unidades_necesarias := p_cantidad * COALESCE(v_stock.unidades_por_paquete, 1);
        v_disponible := COALESCE(v_stock.cajas_completas, 0) >= p_cantidad;
        
        IF NOT v_disponible THEN
            RETURN jsonb_build_object(
                'disponible', false,
                'error', format('Solo hay %s caja(s) disponible(s)', COALESCE(v_stock.cajas_completas, 0)),
                'stock_actual', jsonb_build_object(
                    'cajas', COALESCE(v_stock.cajas_completas, 0),
                    'unidades_sueltas', COALESCE(v_stock.unidades_sueltas, 0),
                    'unidades_totales', v_unidades_disponibles
                )
            );
        END IF;
    ELSE -- unidad
        v_unidades_necesarias := p_cantidad;
        v_disponible := v_unidades_disponibles >= p_cantidad;
        
        IF NOT v_disponible THEN
            RETURN jsonb_build_object(
                'disponible', false,
                'error', format('Solo hay %s unidad(es) disponible(s)', v_unidades_disponibles),
                'stock_actual', jsonb_build_object(
                    'cajas', COALESCE(v_stock.cajas_completas, 0),
                    'unidades_sueltas', COALESCE(v_stock.unidades_sueltas, 0),
                    'unidades_totales', v_unidades_disponibles
                )
            );
        END IF;
    END IF;
    
    RETURN jsonb_build_object(
        'disponible', true,
        'mensaje', 'Stock suficiente',
        'stock_actual', jsonb_build_object(
            'cajas', COALESCE(v_stock.cajas_completas, 0),
            'unidades_sueltas', COALESCE(v_stock.unidades_sueltas, 0),
            'unidades_totales', v_unidades_disponibles
        ),
        'despues_venta', jsonb_build_object(
            'unidades_restantes', v_unidades_disponibles - v_unidades_necesarias
        )
    );
END;
$$ LANGUAGE plpgsql;

-- 5. Función helper para obtener stock formateado
CREATE OR REPLACE FUNCTION obtener_stock_formateado(
    p_stock_item_id UUID
) RETURNS TEXT AS $$
DECLARE
    v_stock RECORD;
    v_formato TEXT;
BEGIN
    SELECT * INTO v_stock
    FROM stock_items
    WHERE id = p_stock_item_id;
    
    IF NOT FOUND THEN
        RETURN 'Item no encontrado';
    END IF;
    
    IF COALESCE(v_stock.permite_fraccionamiento, false) THEN
        IF COALESCE(v_stock.cajas_completas, 0) > 0 AND COALESCE(v_stock.unidades_sueltas, 0) > 0 THEN
            v_formato := format('%s caja(s) + %s unidad(es) [Total: %s u]', 
                v_stock.cajas_completas, 
                v_stock.unidades_sueltas,
                (COALESCE(v_stock.cajas_completas, 0) * COALESCE(v_stock.unidades_por_paquete, 1)) + COALESCE(v_stock.unidades_sueltas, 0));
        ELSIF COALESCE(v_stock.cajas_completas, 0) > 0 THEN
            v_formato := format('%s caja(s) [%s unidades]', 
                v_stock.cajas_completas,
                COALESCE(v_stock.cajas_completas, 0) * COALESCE(v_stock.unidades_por_paquete, 1));
        ELSIF COALESCE(v_stock.unidades_sueltas, 0) > 0 THEN
            v_formato := format('%s unidad(es) suelta(s)', v_stock.unidades_sueltas);
        ELSE
            v_formato := 'Sin stock';
        END IF;
    ELSE
        v_formato := format('%s unidad(es)', COALESCE(v_stock.cantidad_actual, 0));
    END IF;
    
    RETURN v_formato;
END;
$$ LANGUAGE plpgsql;;
