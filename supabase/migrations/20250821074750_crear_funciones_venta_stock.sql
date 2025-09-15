-- Función para procesar venta de producto (caja completa)
CREATE OR REPLACE FUNCTION vender_producto_caja_completa(
    p_stock_item_id UUID,
    p_presentacion_id UUID,
    p_cantidad INTEGER,
    p_motivo VARCHAR DEFAULT 'Venta',
    p_usuario VARCHAR DEFAULT NULL,
    p_referencia_externa VARCHAR DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_stock_actual INTEGER;
    v_factor_conversion NUMERIC;
    v_nueva_cantidad INTEGER;
    v_movimiento_id UUID;
    v_resultado JSON;
BEGIN
    -- Obtener datos actuales
    SELECT si.cantidad_actual, pp.factor_conversion
    INTO v_stock_actual, v_factor_conversion
    FROM stock_items si
    INNER JOIN producto_presentaciones pp ON si.id = pp.stock_item_id
    WHERE si.id = p_stock_item_id 
      AND pp.id = p_presentacion_id
      AND si.estado = 'Disponible';
      
    -- Validar que hay stock suficiente
    IF v_stock_actual IS NULL OR v_stock_actual < p_cantidad THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Stock insuficiente',
            'stock_actual', COALESCE(v_stock_actual, 0),
            'solicitado', p_cantidad
        );
    END IF;
    
    -- Calcular nueva cantidad
    v_nueva_cantidad := v_stock_actual - p_cantidad;
    
    -- Actualizar stock
    UPDATE stock_items 
    SET cantidad_actual = v_nueva_cantidad,
        updated_at = now()
    WHERE id = p_stock_item_id;
    
    -- Registrar movimiento
    INSERT INTO movimientos_stock (
        stock_item_id,
        tipo_movimiento,
        cantidad,
        cantidad_anterior,
        cantidad_nueva,
        motivo,
        descripcion,
        usuario_responsable,
        referencia_externa,
        fecha_movimiento
    ) VALUES (
        p_stock_item_id,
        'Salida',
        p_cantidad,
        v_stock_actual,
        v_nueva_cantidad,
        p_motivo,
        format('Venta de %s cajas completas (factor: %s)', p_cantidad, v_factor_conversion),
        p_usuario,
        p_referencia_externa,
        now()
    ) RETURNING id INTO v_movimiento_id;
    
    -- Retornar resultado
    RETURN json_build_object(
        'success', true,
        'stock_anterior', v_stock_actual,
        'stock_nuevo', v_nueva_cantidad,
        'cantidad_vendida', p_cantidad,
        'unidades_totales_vendidas', p_cantidad * v_factor_conversion,
        'movimiento_id', v_movimiento_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Error interno: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql;;
