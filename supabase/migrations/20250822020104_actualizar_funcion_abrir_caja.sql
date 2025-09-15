-- Actualizar función para registrar en stock_cajas_abiertas
BEGIN;

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
    IF NOT COALESCE(v_stock_item.permite_fraccionamiento, false) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Este producto no permite fraccionamiento'
        );
    END IF;

    -- Validar que hay cajas disponibles
    IF COALESCE(v_stock_item.cajas_completas, 0) <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No hay cajas disponibles para abrir'
        );
    END IF;

    -- Actualizar el stock: reducir 1 caja, agregar unidades sueltas
    UPDATE stock_items SET
        cajas_completas = COALESCE(cajas_completas, 0) - 1,
        unidades_sueltas = COALESCE(unidades_sueltas, 0) + COALESCE(unidades_por_paquete, 1),
        updated_at = NOW()
    WHERE id = p_stock_item_id;

    -- Registrar la apertura de caja
    INSERT INTO stock_cajas_abiertas (
        stock_item_id,
        unidades_liberadas,
        unidades_restantes,
        factor_original,
        presentacion_nombre,
        numero_caja_original,
        abierto_por,
        motivo_apertura
    ) VALUES (
        p_stock_item_id,
        COALESCE(v_stock_item.unidades_por_paquete, 1),
        COALESCE(v_stock_item.unidades_por_paquete, 1),
        COALESCE(v_stock_item.unidades_por_paquete, 1),
        'Caja de ' || COALESCE(v_stock_item.unidades_por_paquete, 1) || ' unidades',
        COALESCE(v_stock_item.cajas_completas, 0),
        p_usuario,
        p_motivo
    );

    RETURN json_build_object(
        'success', true,
        'message', 'Caja abierta exitosamente. Se agregaron ' || COALESCE(v_stock_item.unidades_por_paquete, 1) || ' unidades sueltas',
        'cajas_restantes', COALESCE(v_stock_item.cajas_completas, 0) - 1,
        'unidades_sueltas_nuevas', COALESCE(v_stock_item.unidades_sueltas, 0) + COALESCE(v_stock_item.unidades_por_paquete, 1)
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
