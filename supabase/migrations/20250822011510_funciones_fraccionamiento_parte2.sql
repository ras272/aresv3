-- 3. Función para procesar venta con fraccionamiento
CREATE OR REPLACE FUNCTION procesar_venta_fraccionada(
    p_stock_item_id UUID,
    p_cantidad_solicitada INTEGER,
    p_tipo_venta VARCHAR(50), -- 'caja' o 'unidad'
    p_usuario VARCHAR(255),
    p_referencia VARCHAR(255) DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_stock_item RECORD;
    v_unidades_a_descontar INTEGER;
    v_cajas_a_descontar INTEGER := 0;
    v_unidades_sueltas_a_descontar INTEGER := 0;
    v_unidades_sobrantes INTEGER := 0;
    v_resultado JSONB;
BEGIN
    -- Obtener información del item
    SELECT * INTO v_stock_item
    FROM stock_items
    WHERE id = p_stock_item_id
    FOR UPDATE;
    
    -- Validaciones básicas
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Item de stock no encontrado'
        );
    END IF;
    
    -- Calcular unidades totales a descontar
    IF p_tipo_venta = 'caja' THEN
        v_unidades_a_descontar := p_cantidad_solicitada * COALESCE(v_stock_item.unidades_por_paquete, 1);
        v_cajas_a_descontar := p_cantidad_solicitada;
        
        -- Verificar disponibilidad de cajas
        IF COALESCE(v_stock_item.cajas_completas, 0) < p_cantidad_solicitada THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', format('Solo hay %s caja(s) disponible(s)', COALESCE(v_stock_item.cajas_completas, 0))
            );
        END IF;
    ELSE -- venta por unidades
        v_unidades_a_descontar := p_cantidad_solicitada;
        
        -- Verificar disponibilidad total
        IF ((COALESCE(v_stock_item.cajas_completas, 0) * COALESCE(v_stock_item.unidades_por_paquete, 1)) + 
            COALESCE(v_stock_item.unidades_sueltas, 0)) < p_cantidad_solicitada THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', format('Stock insuficiente. Disponible: %s unidades totales',
                    (COALESCE(v_stock_item.cajas_completas, 0) * COALESCE(v_stock_item.unidades_por_paquete, 1)) + COALESCE(v_stock_item.unidades_sueltas, 0))
            );
        END IF;
        
        -- Calcular de dónde sacar las unidades
        IF COALESCE(v_stock_item.unidades_sueltas, 0) >= p_cantidad_solicitada THEN
            -- Alcanza con las unidades sueltas
            v_unidades_sueltas_a_descontar := p_cantidad_solicitada;
        ELSE
            -- Necesitamos abrir cajas
            v_unidades_sueltas_a_descontar := COALESCE(v_stock_item.unidades_sueltas, 0);
            v_unidades_a_descontar := p_cantidad_solicitada - COALESCE(v_stock_item.unidades_sueltas, 0);
            
            -- Calcular cuántas cajas abrir
            v_cajas_a_descontar := CEIL(v_unidades_a_descontar::NUMERIC / COALESCE(v_stock_item.unidades_por_paquete, 1));
            
            -- Calcular unidades sobrantes que quedan como sueltas
            v_unidades_sobrantes := (v_cajas_a_descontar * COALESCE(v_stock_item.unidades_por_paquete, 1)) - v_unidades_a_descontar;
        END IF;
    END IF;
    
    -- Actualizar stock
    UPDATE stock_items
    SET 
        cajas_completas = GREATEST(0, COALESCE(cajas_completas, 0) - v_cajas_a_descontar),
        unidades_sueltas = CASE 
            WHEN p_tipo_venta = 'caja' THEN COALESCE(unidades_sueltas, 0)
            ELSE GREATEST(0, COALESCE(unidades_sueltas, 0) - v_unidades_sueltas_a_descontar + v_unidades_sobrantes)
        END,
        cantidad_actual = GREATEST(0, COALESCE(cantidad_actual, 0) - p_cantidad_solicitada),
        updated_at = NOW()
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
        tipo_unidad_movimiento,
        cajas_afectadas,
        unidades_sueltas_afectadas,
        producto_nombre,
        producto_marca,
        producto_modelo,
        codigo_item
    ) VALUES (
        p_stock_item_id,
        'Salida',
        p_cantidad_solicitada,
        v_stock_item.cantidad_actual,
        GREATEST(0, COALESCE(v_stock_item.cantidad_actual, 0) - p_cantidad_solicitada),
        'Venta',
        format('Venta de %s %s', p_cantidad_solicitada, p_tipo_venta),
        p_usuario,
        p_referencia,
        p_tipo_venta,
        v_cajas_a_descontar,
        v_unidades_sueltas_a_descontar,
        v_stock_item.nombre,
        v_stock_item.marca,
        v_stock_item.modelo,
        v_stock_item.codigo_item
    );
    
    -- Preparar resultado
    SELECT * INTO v_stock_item
    FROM stock_items
    WHERE id = p_stock_item_id;
    
    v_resultado := jsonb_build_object(
        'success', true,
        'message', format('Venta procesada: %s %s', p_cantidad_solicitada, p_tipo_venta),
        'stock_restante', jsonb_build_object(
            'cajas_completas', COALESCE(v_stock_item.cajas_completas, 0),
            'unidades_sueltas', COALESCE(v_stock_item.unidades_sueltas, 0),
            'unidades_totales', (COALESCE(v_stock_item.cajas_completas, 0) * COALESCE(v_stock_item.unidades_por_paquete, 1)) + COALESCE(v_stock_item.unidades_sueltas, 0)
        ),
        'movimiento', jsonb_build_object(
            'cajas_vendidas', v_cajas_a_descontar,
            'unidades_sueltas_vendidas', v_unidades_sueltas_a_descontar
        )
    );
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;;
