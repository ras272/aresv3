-- FUNCIONES: Sistema de Fraccionamiento de Productos
-- Parte 1: Funciones básicas

-- 1. Función para calcular stock disponible con fraccionamiento
CREATE OR REPLACE FUNCTION calcular_stock_disponible(
    p_stock_item_id UUID
) RETURNS TABLE (
    cajas_completas INTEGER,
    unidades_sueltas INTEGER,
    unidades_totales INTEGER,
    permite_fraccionamiento BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(si.cajas_completas, 0)::INTEGER,
        COALESCE(si.unidades_sueltas, 0)::INTEGER,
        (COALESCE(si.cajas_completas, 0) * COALESCE(si.unidades_por_paquete, 1) + COALESCE(si.unidades_sueltas, 0))::INTEGER AS unidades_totales,
        COALESCE(si.permite_fraccionamiento, false)
    FROM stock_items si
    WHERE si.id = p_stock_item_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Función para abrir una caja y convertirla en unidades sueltas
CREATE OR REPLACE FUNCTION abrir_caja_para_fraccionamiento(
    p_stock_item_id UUID,
    p_usuario VARCHAR(255),
    p_motivo TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_stock_item RECORD;
    v_resultado JSONB;
BEGIN
    -- Obtener información del item
    SELECT * INTO v_stock_item
    FROM stock_items
    WHERE id = p_stock_item_id
    FOR UPDATE;
    
    -- Validaciones
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Item de stock no encontrado'
        );
    END IF;
    
    IF NOT COALESCE(v_stock_item.permite_fraccionamiento, false) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Este producto no permite fraccionamiento'
        );
    END IF;
    
    IF COALESCE(v_stock_item.cajas_completas, 0) <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No hay cajas completas disponibles para abrir'
        );
    END IF;
    
    -- Actualizar stock: reducir cajas y aumentar unidades sueltas
    UPDATE stock_items
    SET 
        cajas_completas = COALESCE(cajas_completas, 0) - 1,
        unidades_sueltas = COALESCE(unidades_sueltas, 0) + COALESCE(unidades_por_paquete, 1),
        updated_at = NOW()
    WHERE id = p_stock_item_id;
    
    -- Registrar en stock_cajas_abiertas
    INSERT INTO stock_cajas_abiertas (
        stock_item_id,
        unidades_restantes,
        factor_original,
        presentacion_nombre,
        abierto_por,
        motivo_apertura,
        numero_caja_original
    ) VALUES (
        p_stock_item_id,
        COALESCE(v_stock_item.unidades_por_paquete, 1),
        COALESCE(v_stock_item.unidades_por_paquete, 1),
        'Caja',
        p_usuario,
        p_motivo,
        COALESCE(v_stock_item.cajas_completas, 1)
    );
    
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
        tipo_unidad_movimiento,
        cajas_afectadas,
        unidades_sueltas_afectadas,
        producto_nombre,
        producto_marca,
        producto_modelo,
        codigo_item
    ) VALUES (
        p_stock_item_id,
        'Ajuste',
        COALESCE(v_stock_item.unidades_por_paquete, 1),
        v_stock_item.cantidad_actual,
        v_stock_item.cantidad_actual,
        'Fraccionamiento',
        'Apertura de caja para venta fraccionada',
        p_usuario,
        'caja',
        -1,
        COALESCE(v_stock_item.unidades_por_paquete, 1),
        v_stock_item.nombre,
        v_stock_item.marca,
        v_stock_item.modelo,
        v_stock_item.codigo_item
    );
    
    v_resultado := jsonb_build_object(
        'success', true,
        'message', 'Caja abierta exitosamente',
        'cajas_restantes', COALESCE(v_stock_item.cajas_completas, 0) - 1,
        'unidades_disponibles', COALESCE(v_stock_item.unidades_sueltas, 0) + COALESCE(v_stock_item.unidades_por_paquete, 1)
    );
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;;
