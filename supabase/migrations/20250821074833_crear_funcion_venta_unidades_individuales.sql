-- Función para procesar venta de unidades individuales
CREATE OR REPLACE FUNCTION vender_producto_unidades_individuales(
    p_stock_item_id UUID,
    p_cantidad_unidades INTEGER,
    p_motivo VARCHAR DEFAULT 'Venta individual',
    p_usuario VARCHAR DEFAULT NULL,
    p_referencia_externa VARCHAR DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_stock_actual INTEGER;
    v_factor_conversion NUMERIC;
    v_unidades_sueltas INTEGER := 0;
    v_caja_abierta_id UUID;
    v_nueva_cantidad_stock INTEGER;
    v_nuevas_unidades_sueltas INTEGER;
    v_movimiento_id UUID;
    v_total_unidades_disponibles INTEGER;
    v_resultado JSON;
BEGIN
    -- Obtener datos actuales
    SELECT 
        si.cantidad_actual,
        pp.factor_conversion,
        COALESCE(sca.unidades_restantes, 0),
        sca.id
    INTO 
        v_stock_actual, 
        v_factor_conversion, 
        v_unidades_sueltas,
        v_caja_abierta_id
    FROM stock_items si
    INNER JOIN producto_presentaciones pp ON si.id = pp.stock_item_id AND pp.es_default = true
    LEFT JOIN stock_cajas_abiertas sca ON si.id = sca.stock_item_id
    WHERE si.id = p_stock_item_id AND si.estado = 'Disponible';
      
    -- Calcular total de unidades disponibles
    v_total_unidades_disponibles := (v_stock_actual * v_factor_conversion) + v_unidades_sueltas;
    
    -- Validar que hay stock suficiente
    IF v_total_unidades_disponibles < p_cantidad_unidades THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Stock insuficiente',
            'unidades_disponibles', v_total_unidades_disponibles,
            'unidades_solicitadas', p_cantidad_unidades
        );
    END IF;
    
    -- Lógica de venta:
    IF v_unidades_sueltas >= p_cantidad_unidades THEN
        -- Caso 1: Hay suficientes unidades sueltas
        v_nuevas_unidades_sueltas := v_unidades_sueltas - p_cantidad_unidades;
        v_nueva_cantidad_stock := v_stock_actual;
        
        -- Actualizar o eliminar caja abierta
        IF v_nuevas_unidades_sueltas > 0 THEN
            UPDATE stock_cajas_abiertas 
            SET unidades_restantes = v_nuevas_unidades_sueltas,
                updated_at = now()
            WHERE id = v_caja_abierta_id;
        ELSE
            DELETE FROM stock_cajas_abiertas WHERE id = v_caja_abierta_id;
        END IF;
        
    ELSE
        -- Caso 2: Necesitamos abrir una nueva caja
        DECLARE
            v_unidades_faltantes INTEGER;
            v_cajas_a_abrir INTEGER;
        BEGIN
            v_unidades_faltantes := p_cantidad_unidades - v_unidades_sueltas;
            v_cajas_a_abrir := CEIL(v_unidades_faltantes::NUMERIC / v_factor_conversion);
            
            -- Actualizar stock de cajas
            v_nueva_cantidad_stock := v_stock_actual - v_cajas_a_abrir;
            
            -- Calcular unidades restantes después de la venta
            v_nuevas_unidades_sueltas := (v_cajas_a_abrir * v_factor_conversion) + v_unidades_sueltas - p_cantidad_unidades;
            
            -- Eliminar caja abierta existente si la había
            IF v_caja_abierta_id IS NOT NULL THEN
                DELETE FROM stock_cajas_abiertas WHERE id = v_caja_abierta_id;
            END IF;
            
            -- Crear nueva caja abierta si quedan unidades
            IF v_nuevas_unidades_sueltas > 0 THEN
                INSERT INTO stock_cajas_abiertas (
                    stock_item_id,
                    unidades_restantes,
                    factor_original,
                    presentacion_nombre,
                    fecha_apertura
                ) VALUES (
                    p_stock_item_id,
                    v_nuevas_unidades_sueltas,
                    v_factor_conversion::INTEGER,
                    'Caja abierta',
                    now()
                );
            END IF;
        END;
    END IF;
    
    -- Actualizar stock principal
    UPDATE stock_items 
    SET cantidad_actual = v_nueva_cantidad_stock,
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
        p_cantidad_unidades,
        v_total_unidades_disponibles,
        (v_nueva_cantidad_stock * v_factor_conversion) + COALESCE(v_nuevas_unidades_sueltas, 0),
        p_motivo,
        format('Venta de %s unidades individuales', p_cantidad_unidades),
        p_usuario,
        p_referencia_externa,
        now()
    ) RETURNING id INTO v_movimiento_id;
    
    -- Retornar resultado
    RETURN json_build_object(
        'success', true,
        'unidades_vendidas', p_cantidad_unidades,
        'stock_cajas_anterior', v_stock_actual,
        'stock_cajas_nuevo', v_nueva_cantidad_stock,
        'unidades_sueltas_anterior', v_unidades_sueltas,
        'unidades_sueltas_nuevo', COALESCE(v_nuevas_unidades_sueltas, 0),
        'total_unidades_disponibles', (v_nueva_cantidad_stock * v_factor_conversion) + COALESCE(v_nuevas_unidades_sueltas, 0),
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
