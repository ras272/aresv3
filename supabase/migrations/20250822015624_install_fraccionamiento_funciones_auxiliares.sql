-- Parte 4: FUNCIONES AUXILIARES

BEGIN;

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
    v_unidades_totales INTEGER;
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
        v_unidades_requeridas := p_cantidad * COALESCE(v_stock_item.unidades_por_paquete, 1);
    ELSE
        v_unidades_requeridas := p_cantidad;
    END IF;

    -- Validar disponibilidad
    IF p_tipo_venta = 'caja' THEN
        -- Para venta por cajas, verificar cajas disponibles
        IF COALESCE(v_stock_item.cajas_completas, 0) >= p_cantidad THEN
            RETURN json_build_object(
                'disponible', true,
                'tipo_venta', p_tipo_venta,
                'cantidad_solicitada', p_cantidad,
                'unidades_totales', v_unidades_requeridas,
                'cajas_disponibles', COALESCE(v_stock_item.cajas_completas, 0),
                'message', 'Stock suficiente para venta por cajas'
            );
        ELSE
            RETURN json_build_object(
                'disponible', false,
                'error', 'No hay suficientes cajas disponibles. Disponibles: ' || COALESCE(v_stock_item.cajas_completas, 0) || ', Requeridas: ' || p_cantidad
            );
        END IF;
    ELSE
        -- Para venta por unidades
        IF NOT COALESCE(v_stock_item.permite_fraccionamiento, false) THEN
            RETURN json_build_object(
                'disponible', false,
                'error', 'Este producto no permite venta por unidades'
            );
        END IF;

        -- Calcular unidades totales disponibles
        v_unidades_totales := (COALESCE(v_stock_item.cajas_completas, 0) * COALESCE(v_stock_item.unidades_por_paquete, 1)) + COALESCE(v_stock_item.unidades_sueltas, 0);
        
        IF v_unidades_totales >= v_unidades_requeridas THEN
            RETURN json_build_object(
                'disponible', true,
                'tipo_venta', p_tipo_venta,
                'cantidad_solicitada', p_cantidad,
                'unidades_totales', v_unidades_requeridas,
                'unidades_disponibles', v_unidades_totales,
                'requiere_apertura_cajas', COALESCE(v_stock_item.unidades_sueltas, 0) < v_unidades_requeridas,
                'message', 'Stock suficiente para venta por unidades'
            );
        ELSE
            RETURN json_build_object(
                'disponible', false,
                'error', 'No hay suficientes unidades disponibles. Disponibles: ' || v_unidades_totales || ', Requeridas: ' || v_unidades_requeridas
            );
        END IF;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'disponible', false,
            'error', 'Error interno: ' || SQLERRM
        );
END;
$$;

COMMIT;;
