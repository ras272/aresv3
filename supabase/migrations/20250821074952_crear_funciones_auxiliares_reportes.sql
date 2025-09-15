-- Función para obtener resumen detallado de un producto
CREATE OR REPLACE FUNCTION obtener_resumen_producto(p_stock_item_id UUID)
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
BEGIN
    SELECT json_build_object(
        'producto', json_build_object(
            'id', vsd.stock_item_id,
            'codigo', vsd.codigo_item,
            'nombre', vsd.nombre,
            'marca', vsd.marca,
            'modelo', vsd.modelo,
            'precio_base', vsd.precio_base,
            'moneda', vsd.moneda
        ),
        'stock', json_build_object(
            'cajas_stock', vsd.cajas_stock,
            'unidades_sueltas', vsd.unidades_sueltas,
            'cajas_completas_disponibles', vsd.cajas_completas_disponibles,
            'total_unidades_disponibles', vsd.total_unidades_disponibles,
            'factor_conversion', vsd.factor_default
        ),
        'presentaciones', (
            SELECT json_agg(
                json_build_object(
                    'id', presentacion_id,
                    'nombre', nombre_presentacion,
                    'factor_conversion', factor_conversion,
                    'precio_venta', precio_venta,
                    'unidades_disponibles', unidades_disponibles,
                    'puede_vender', puede_vender_completa,
                    'es_default', es_default
                )
            )
            FROM obtener_stock_por_presentaciones(p_stock_item_id)
        ),
        'caja_abierta', CASE 
            WHEN vsd.caja_abierta_id IS NOT NULL THEN
                json_build_object(
                    'tiene_caja_abierta', true,
                    'unidades_restantes', vsd.unidades_sueltas,
                    'factor_original', vsd.factor_caja_abierta,
                    'porcentaje_usado', ROUND(((vsd.factor_caja_abierta - vsd.unidades_sueltas)::NUMERIC / vsd.factor_caja_abierta * 100), 2)
                )
            ELSE
                json_build_object('tiene_caja_abierta', false)
        END,
        'alertas', json_build_object(
            'stock_bajo', vsd.total_unidades_disponibles <= 5,
            'requiere_reposicion', vsd.cajas_stock < 2
        )
    )
    INTO v_resultado
    FROM vista_stock_disponible vsd
    WHERE vsd.stock_item_id = p_stock_item_id;
    
    RETURN COALESCE(v_resultado, json_build_object('error', 'Producto no encontrado'));
END;
$$ LANGUAGE plpgsql;

-- Función para obtener productos con stock crítico
CREATE OR REPLACE FUNCTION obtener_productos_stock_critico(p_limite INTEGER DEFAULT 5)
RETURNS TABLE (
    stock_item_id UUID,
    nombre TEXT,
    marca TEXT,
    total_unidades_disponibles INTEGER,
    cajas_stock INTEGER,
    factor_conversion NUMERIC,
    nivel_criticidad TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vsd.stock_item_id,
        vsd.nombre,
        vsd.marca,
        vsd.total_unidades_disponibles,
        vsd.cajas_stock,
        vsd.factor_default as factor_conversion,
        CASE 
            WHEN vsd.total_unidades_disponibles = 0 THEN 'SIN_STOCK'
            WHEN vsd.total_unidades_disponibles <= 2 THEN 'CRITICO'
            WHEN vsd.total_unidades_disponibles <= p_limite THEN 'BAJO'
            ELSE 'NORMAL'
        END as nivel_criticidad
    FROM vista_stock_disponible vsd
    WHERE vsd.total_unidades_disponibles <= p_limite
    ORDER BY vsd.total_unidades_disponibles ASC, vsd.nombre;
END;
$$ LANGUAGE plpgsql;

-- Función para simular venta (sin ejecutar)
CREATE OR REPLACE FUNCTION simular_venta(
    p_stock_item_id UUID,
    p_tipo_venta TEXT, -- 'caja_completa' o 'unidades'
    p_cantidad INTEGER,
    p_presentacion_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_stock_actual INTEGER;
    v_unidades_sueltas INTEGER;
    v_factor_conversion NUMERIC;
    v_total_disponible INTEGER;
    v_resultado JSON;
BEGIN
    -- Obtener datos actuales
    SELECT 
        vsd.cajas_stock,
        vsd.unidades_sueltas,
        vsd.factor_default,
        vsd.total_unidades_disponibles
    INTO 
        v_stock_actual,
        v_unidades_sueltas,
        v_factor_conversion,
        v_total_disponible
    FROM vista_stock_disponible vsd
    WHERE vsd.stock_item_id = p_stock_item_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Producto no encontrado');
    END IF;
    
    -- Simular según tipo de venta
    IF p_tipo_venta = 'caja_completa' THEN
        IF v_stock_actual >= p_cantidad THEN
            v_resultado := json_build_object(
                'success', true,
                'tipo_venta', 'caja_completa',
                'cantidad_solicitada', p_cantidad,
                'unidades_que_se_venderian', p_cantidad * v_factor_conversion,
                'stock_resultante', json_build_object(
                    'cajas', v_stock_actual - p_cantidad,
                    'unidades_sueltas', v_unidades_sueltas,
                    'total_unidades', (v_stock_actual - p_cantidad) * v_factor_conversion + v_unidades_sueltas
                )
            );
        ELSE
            v_resultado := json_build_object(
                'success', false,
                'error', 'Stock insuficiente de cajas completas',
                'disponible', v_stock_actual,
                'solicitado', p_cantidad
            );
        END IF;
    ELSE
        -- Venta por unidades
        IF v_total_disponible >= p_cantidad THEN
            v_resultado := json_build_object(
                'success', true,
                'tipo_venta', 'unidades',
                'cantidad_solicitada', p_cantidad,
                'total_disponible', v_total_disponible,
                'stock_resultante', json_build_object(
                    'total_unidades_restantes', v_total_disponible - p_cantidad
                ),
                'nota', 'Cálculo exacto requiere ejecutar la función de venta'
            );
        ELSE
            v_resultado := json_build_object(
                'success', false,
                'error', 'Stock insuficiente de unidades',
                'disponible', v_total_disponible,
                'solicitado', p_cantidad
            );
        END IF;
    END IF;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;;
