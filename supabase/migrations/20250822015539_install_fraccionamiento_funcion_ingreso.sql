-- Parte 3: FUNCIÓN DE INGRESO FRACCIONADO

BEGIN;

-- Función para procesar ingreso de productos con fraccionamiento
CREATE OR REPLACE FUNCTION public.procesar_ingreso_fraccionado(
    p_producto_carga_id UUID,
    p_cantidad_cajas INTEGER,
    p_unidades_por_caja INTEGER,
    p_permite_fraccionamiento BOOLEAN,
    p_usuario TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_producto_carga RECORD;
    v_stock_item_id UUID;
    v_stock_existente RECORD;
    v_unidades_totales INTEGER;
    v_resultado JSON;
BEGIN
    -- Validar parámetros
    IF p_cantidad_cajas <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'La cantidad de cajas debe ser mayor a 0'
        );
    END IF;

    IF p_unidades_por_caja <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Las unidades por caja deben ser mayor a 0'
        );
    END IF;

    -- Obtener información del producto de la carga
    SELECT * INTO v_producto_carga
    FROM productos_carga pc
    WHERE pc.id = p_producto_carga_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No se encontró el producto en la carga'
        );
    END IF;

    -- Calcular unidades totales
    v_unidades_totales := p_cantidad_cajas * p_unidades_por_caja;

    -- Buscar si ya existe un stock item para este producto
    SELECT * INTO v_stock_existente
    FROM stock_items si
    WHERE si.nombre = v_producto_carga.producto
      AND si.marca = v_producto_carga.marca
      AND si.modelo = v_producto_carga.modelo
      AND COALESCE(si.permite_fraccionamiento, false) = p_permite_fraccionamiento
    LIMIT 1;

    -- Si existe stock, actualizar
    IF FOUND THEN
        v_stock_item_id := v_stock_existente.id;
        
        UPDATE stock_items SET
            cajas_completas = COALESCE(cajas_completas, 0) + p_cantidad_cajas,
            unidades_por_paquete = p_unidades_por_caja,
            cantidaddisponible = COALESCE(cantidaddisponible, 0) + v_unidades_totales,
            permite_fraccionamiento = p_permite_fraccionamiento,
            updated_at = NOW()
        WHERE id = v_stock_item_id;

    ELSE
        -- Crear nuevo stock item
        v_stock_item_id := gen_random_uuid();
        
        INSERT INTO stock_items (
            id,
            codigo_item,
            nombre,
            marca,
            modelo,
            cajas_completas,
            unidades_sueltas,
            unidades_por_paquete,
            cantidaddisponible,
            permite_fraccionamiento,
            precio,
            moneda,
            cantidad_minima,
            estado,
            fecha_ingreso,
            created_at,
            updated_at,
            producto_carga_id,
            observaciones
        ) VALUES (
            v_stock_item_id,
            'AUTO-' || EXTRACT(epoch FROM NOW())::text,
            v_producto_carga.producto,
            v_producto_carga.marca,
            v_producto_carga.modelo,
            p_cantidad_cajas,
            0, -- unidades_sueltas inicia en 0
            p_unidades_por_caja,
            v_unidades_totales,
            p_permite_fraccionamiento,
            0,
            'USD',
            GREATEST(p_unidades_por_caja, 5), -- cantidad mínima
            'Disponible',
            CURRENT_DATE,
            NOW(),
            NOW(),
            p_producto_carga_id,
            'Ingresado desde carga con fraccionamiento'
        );
    END IF;

    -- Construir respuesta exitosa
    v_resultado := json_build_object(
        'success', true,
        'message', 'Producto ingresado exitosamente',
        'stock_item_id', v_stock_item_id,
        'cantidad_ingresada', v_unidades_totales,
        'cantidad_cajas', p_cantidad_cajas,
        'unidades_por_caja', p_unidades_por_caja,
        'permite_fraccionamiento', p_permite_fraccionamiento
    );

    RETURN v_resultado;

EXCEPTION
    WHEN OTHERS THEN
        -- Log del error
        RAISE LOG 'Error en procesar_ingreso_fraccionado: % %', SQLSTATE, SQLERRM;
        
        RETURN json_build_object(
            'success', false,
            'error', 'Error interno: ' || SQLERRM
        );
END;
$$;

COMMIT;;
