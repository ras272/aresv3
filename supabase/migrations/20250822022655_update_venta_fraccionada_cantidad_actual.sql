-- Actualizar función de venta fraccionada para mantener cantidad_actual sincronizada
BEGIN;

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
    v_unidades_faltantes INTEGER;
    v_nuevas_unidades_totales INTEGER;
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
        v_unidades_a_vender := p_cantidad_solicitada * COALESCE(v_stock_item.unidades_por_paquete, 1);
        
        -- Validar cajas disponibles
        IF COALESCE(v_stock_item.cajas_completas, 0) < p_cantidad_solicitada THEN
            RETURN json_build_object(
                'success', false,
                'error', 'No hay suficientes cajas disponibles'
            );
        END IF;
        
        -- Vender cajas completas
        UPDATE stock_items SET
            cajas_completas = COALESCE(cajas_completas, 0) - p_cantidad_solicitada,
            updated_at = NOW()
        WHERE id = p_stock_item_id;
        
    ELSE
        -- Venta por unidades
        v_unidades_a_vender := p_cantidad_solicitada;
        
        IF NOT COALESCE(v_stock_item.permite_fraccionamiento, false) THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Este producto no permite venta por unidades'
            );
        END IF;
        
        -- Verificar si hay suficientes unidades sueltas
        IF COALESCE(v_stock_item.unidades_sueltas, 0) >= v_unidades_a_vender THEN
            -- Hay suficientes unidades sueltas
            UPDATE stock_items SET
                unidades_sueltas = COALESCE(unidades_sueltas, 0) - v_unidades_a_vender,
                updated_at = NOW()
            WHERE id = p_stock_item_id;
        ELSE
            -- Necesita abrir cajas
            v_unidades_faltantes := v_unidades_a_vender - COALESCE(v_stock_item.unidades_sueltas, 0);
            v_cajas_a_abrir := CEIL(v_unidades_faltantes::DECIMAL / COALESCE(v_stock_item.unidades_por_paquete, 1));
            
            -- Verificar que hay suficientes cajas para abrir
            IF COALESCE(v_stock_item.cajas_completas, 0) < v_cajas_a_abrir THEN
                RETURN json_build_object(
                    'success', false,
                    'error', 'No hay suficiente stock total para la venta'
                );
            END IF;
            
            -- Abrir cajas y vender unidades
            UPDATE stock_items SET
                cajas_completas = COALESCE(cajas_completas, 0) - v_cajas_a_abrir,
                unidades_sueltas = (COALESCE(unidades_sueltas, 0) + (v_cajas_a_abrir * COALESCE(unidades_por_paquete, 1))) - v_unidades_a_vender,
                updated_at = NOW()
            WHERE id = p_stock_item_id;
        END IF;
    END IF;

    -- NUEVO: Calcular y actualizar campos de cantidad después de la venta
    SELECT 
        (COALESCE(cajas_completas, 0) * COALESCE(unidades_por_paquete, 1)) + COALESCE(unidades_sueltas, 0)
    INTO v_nuevas_unidades_totales
    FROM stock_items 
    WHERE id = p_stock_item_id;
    
    -- Actualizar cantidaddisponible y cantidad_actual para sincronización
    UPDATE stock_items SET
        cantidaddisponible = v_nuevas_unidades_totales,
        cantidad_actual = v_nuevas_unidades_totales
    WHERE id = p_stock_item_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Venta procesada exitosamente',
        'unidades_vendidas', v_unidades_a_vender,
        'tipo_venta', p_tipo_venta,
        'cantidad_solicitada', p_cantidad_solicitada,
        'cajas_abiertas', v_cajas_a_abrir,
        'unidades_restantes', v_nuevas_unidades_totales
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Error interno: ' || SQLERRM
        );
END;
$$;

COMMIT;;
