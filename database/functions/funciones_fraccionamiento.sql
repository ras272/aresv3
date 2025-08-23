-- Funciones para manejo de fraccionamiento

-- Función para abrir caja para fraccionamiento
CREATE OR REPLACE FUNCTION public.abrir_caja_para_fraccionamiento(
    p_stock_item_id UUID,
    p_usuario TEXT,
    p_motivo TEXT DEFAULT 'Apertura de caja'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stock_item RECORD;
    v_resultado JSON;
BEGIN
    -- Obtener información del stock item
    SELECT * INTO v_stock_item
    FROM stock_items
    WHERE id = p_stock_item_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No se encontró el item de stock'
        );
    END IF;

    -- Validar que permite fraccionamiento
    IF NOT v_stock_item.permite_fraccionamiento THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Este producto no permite fraccionamiento'
        );
    END IF;

    -- Validar que hay cajas disponibles
    IF v_stock_item.cajas_completas <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No hay cajas disponibles para abrir'
        );
    END IF;

    -- Actualizar el stock: reducir 1 caja, agregar unidades sueltas
    UPDATE stock_items SET
        cajas_completas = cajas_completas - 1,
        unidades_sueltas = unidades_sueltas + unidades_por_paquete,
        fecha_actualizacion = NOW(),
        actualizado_por = p_usuario
    WHERE id = p_stock_item_id;

    -- Registrar el movimiento
    INSERT INTO movimientos_stock (
        id,
        stock_item_id,
        tipo_movimiento,
        cantidad_anterior,
        cantidad_movimiento,
        cantidad_nueva,
        unidades_por_paquete,
        tipo_unidad,
        motivo,
        referencia,
        usuario,
        fecha,
        detalles_adicionales
    ) VALUES (
        gen_random_uuid(),
        p_stock_item_id,
        'FRACCIONAMIENTO',
        v_stock_item.cantidad_disponible,
        0, -- No cambia la cantidad total
        v_stock_item.cantidad_disponible,
        v_stock_item.unidades_por_paquete,
        'CAJA',
        p_motivo,
        'FRACCION-' || EXTRACT(epoch FROM NOW())::text,
        p_usuario,
        NOW(),
        json_build_object(
            'cajas_antes', v_stock_item.cajas_completas,
            'sueltas_antes', v_stock_item.unidades_sueltas,
            'cajas_despues', v_stock_item.cajas_completas - 1,
            'sueltas_despues', v_stock_item.unidades_sueltas + v_stock_item.unidades_por_paquete,
            'unidades_por_paquete', v_stock_item.unidades_por_paquete
        )
    );

    RETURN json_build_object(
        'success', true,
        'message', 'Caja abierta exitosamente. Se agregaron ' || v_stock_item.unidades_por_paquete || ' unidades sueltas',
        'cajas_restantes', v_stock_item.cajas_completas - 1,
        'unidades_sueltas_nuevas', v_stock_item.unidades_sueltas + v_stock_item.unidades_por_paquete
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Error interno: ' || SQLERRM
        );
END;
$$;

-- Función para validar disponibilidad de venta
CREATE OR REPLACE FUNCTION public.validar_disponibilidad_venta(
    p_stock_item_id UUID,
    p_cantidad INTEGER,
    p_tipo_venta TEXT -- 'caja' o 'unidad'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stock_item RECORD;
    v_unidades_requeridas INTEGER;
    v_resultado JSON;
BEGIN
    -- Obtener información del stock item
    SELECT * INTO v_stock_item
    FROM stock_items
    WHERE id = p_stock_item_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'disponible', false,
            'error', 'No se encontró el item de stock'
        );
    END IF;

    -- Calcular unidades requeridas
    IF p_tipo_venta = 'caja' THEN
        v_unidades_requeridas := p_cantidad * v_stock_item.unidades_por_paquete;
    ELSE
        v_unidades_requeridas := p_cantidad;
    END IF;

    -- Validar disponibilidad
    IF p_tipo_venta = 'caja' THEN
        -- Para venta por cajas, verificar cajas disponibles
        IF v_stock_item.cajas_completas >= p_cantidad THEN
            RETURN json_build_object(
                'disponible', true,
                'tipo_venta', p_tipo_venta,
                'cantidad_solicitada', p_cantidad,
                'unidades_totales', v_unidades_requeridas,
                'cajas_disponibles', v_stock_item.cajas_completas,
                'message', 'Stock suficiente para venta por cajas'
            );
        ELSE
            RETURN json_build_object(
                'disponible', false,
                'error', 'No hay suficientes cajas disponibles. Disponibles: ' || v_stock_item.cajas_completas || ', Requeridas: ' || p_cantidad
            );
        END IF;
    ELSE
        -- Para venta por unidades
        IF NOT v_stock_item.permite_fraccionamiento THEN
            RETURN json_build_object(
                'disponible', false,
                'error', 'Este producto no permite venta por unidades'
            );
        END IF;

        -- Calcular unidades totales disponibles
        DECLARE
            v_unidades_totales INTEGER := (v_stock_item.cajas_completas * v_stock_item.unidades_por_paquete) + v_stock_item.unidades_sueltas;
        BEGIN
            IF v_unidades_totales >= v_unidades_requeridas THEN
                RETURN json_build_object(
                    'disponible', true,
                    'tipo_venta', p_tipo_venta,
                    'cantidad_solicitada', p_cantidad,
                    'unidades_totales', v_unidades_requeridas,
                    'unidades_disponibles', v_unidades_totales,
                    'requiere_apertura_cajas', v_stock_item.unidades_sueltas < v_unidades_requeridas,
                    'message', 'Stock suficiente para venta por unidades'
                );
            ELSE
                RETURN json_build_object(
                    'disponible', false,
                    'error', 'No hay suficientes unidades disponibles. Disponibles: ' || v_unidades_totales || ', Requeridas: ' || v_unidades_requeridas
                );
            END IF;
        END;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'disponible', false,
            'error', 'Error interno: ' || SQLERRM
        );
END;
$$;

-- Función para procesar venta fraccionada
CREATE OR REPLACE FUNCTION public.procesar_venta_fraccionada(
    p_stock_item_id UUID,
    p_cantidad_solicitada INTEGER,
    p_tipo_venta TEXT, -- 'caja' o 'unidad'
    p_usuario TEXT,
    p_referencia TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stock_item RECORD;
    v_unidades_a_vender INTEGER;
    v_cajas_a_abrir INTEGER := 0;
    v_resultado JSON;
BEGIN
    -- Obtener información del stock item
    SELECT * INTO v_stock_item
    FROM stock_items
    WHERE id = p_stock_item_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No se encontró el item de stock'
        );
    END IF;

    -- Calcular unidades a vender
    IF p_tipo_venta = 'caja' THEN
        v_unidades_a_vender := p_cantidad_solicitada * v_stock_item.unidades_por_paquete;
        
        -- Validar cajas disponibles
        IF v_stock_item.cajas_completas < p_cantidad_solicitada THEN
            RETURN json_build_object(
                'success', false,
                'error', 'No hay suficientes cajas disponibles'
            );
        END IF;
        
        -- Vender cajas completas
        UPDATE stock_items SET
            cajas_completas = cajas_completas - p_cantidad_solicitada,
            fecha_actualizacion = NOW(),
            actualizado_por = p_usuario
        WHERE id = p_stock_item_id;
        
    ELSE
        -- Venta por unidades
        v_unidades_a_vender := p_cantidad_solicitada;
        
        IF NOT v_stock_item.permite_fraccionamiento THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Este producto no permite venta por unidades'
            );
        END IF;
        
        -- Verificar si hay suficientes unidades sueltas
        IF v_stock_item.unidades_sueltas >= v_unidades_a_vender THEN
            -- Hay suficientes unidades sueltas
            UPDATE stock_items SET
                unidades_sueltas = unidades_sueltas - v_unidades_a_vender,
                fecha_actualizacion = NOW(),
                actualizado_por = p_usuario
            WHERE id = p_stock_item_id;
        ELSE
            -- Necesita abrir cajas
            DECLARE
                v_unidades_faltantes INTEGER := v_unidades_a_vender - v_stock_item.unidades_sueltas;
            BEGIN
                v_cajas_a_abrir := CEIL(v_unidades_faltantes::DECIMAL / v_stock_item.unidades_por_paquete);
                
                -- Verificar que hay suficientes cajas para abrir
                IF v_stock_item.cajas_completas < v_cajas_a_abrir THEN
                    RETURN json_build_object(
                        'success', false,
                        'error', 'No hay suficiente stock total para la venta'
                    );
                END IF;
                
                -- Abrir cajas y vender unidades
                UPDATE stock_items SET
                    cajas_completas = cajas_completas - v_cajas_a_abrir,
                    unidades_sueltas = (unidades_sueltas + (v_cajas_a_abrir * unidades_por_paquete)) - v_unidades_a_vender,
                    fecha_actualizacion = NOW(),
                    actualizado_por = p_usuario
                WHERE id = p_stock_item_id;
            END;
        END IF;
    END IF;

    -- Registrar el movimiento de venta
    INSERT INTO movimientos_stock (
        id,
        stock_item_id,
        tipo_movimiento,
        cantidad_anterior,
        cantidad_movimiento,
        cantidad_nueva,
        unidades_por_paquete,
        tipo_unidad,
        motivo,
        referencia,
        usuario,
        fecha,
        detalles_adicionales
    ) VALUES (
        gen_random_uuid(),
        p_stock_item_id,
        'VENTA',
        v_stock_item.cantidad_disponible,
        v_unidades_a_vender,
        v_stock_item.cantidad_disponible - v_unidades_a_vender,
        v_stock_item.unidades_por_paquete,
        CASE WHEN p_tipo_venta = 'caja' THEN 'CAJA' ELSE 'UNIDAD' END,
        'Venta fraccionada',
        p_referencia,
        p_usuario,
        NOW(),
        json_build_object(
            'tipo_venta', p_tipo_venta,
            'cantidad_solicitada', p_cantidad_solicitada,
            'unidades_vendidas', v_unidades_a_vender,
            'cajas_abiertas', v_cajas_a_abrir
        )
    );

    RETURN json_build_object(
        'success', true,
        'message', 'Venta procesada exitosamente',
        'unidades_vendidas', v_unidades_a_vender,
        'tipo_venta', p_tipo_venta,
        'cantidad_solicitada', p_cantidad_solicitada,
        'cajas_abiertas', v_cajas_a_abrir
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Error interno: ' || SQLERRM
        );
END;
$$;

-- Otorgar permisos
GRANT EXECUTE ON FUNCTION public.abrir_caja_para_fraccionamiento(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.abrir_caja_para_fraccionamiento(UUID, TEXT, TEXT) TO anon;

GRANT EXECUTE ON FUNCTION public.validar_disponibilidad_venta(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validar_disponibilidad_venta(UUID, INTEGER, TEXT) TO anon;

GRANT EXECUTE ON FUNCTION public.procesar_venta_fraccionada(UUID, INTEGER, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.procesar_venta_fraccionada(UUID, INTEGER, TEXT, TEXT, TEXT) TO anon;

-- Comentarios
COMMENT ON FUNCTION public.abrir_caja_para_fraccionamiento(UUID, TEXT, TEXT) IS 
'Abre una caja completa para convertirla en unidades sueltas';

COMMENT ON FUNCTION public.validar_disponibilidad_venta(UUID, INTEGER, TEXT) IS 
'Valida si hay suficiente stock para una venta específica';

COMMENT ON FUNCTION public.procesar_venta_fraccionada(UUID, INTEGER, TEXT, TEXT, TEXT) IS 
'Procesa una venta fraccionada, manejando automáticamente la apertura de cajas si es necesario';
