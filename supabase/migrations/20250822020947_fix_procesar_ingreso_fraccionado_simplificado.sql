-- Versión simplificada de la función
BEGIN;

CREATE OR REPLACE FUNCTION public.procesar_ingreso_fraccionado(
    p_producto_carga_id TEXT,
    p_cantidad_cajas INTEGER,
    p_unidades_por_caja INTEGER,
    p_permite_fraccionamiento BOOLEAN,
    p_usuario TEXT,
    p_producto_nombre TEXT DEFAULT NULL,
    p_producto_marca TEXT DEFAULT NULL,
    p_producto_modelo TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stock_item_id UUID;
    v_stock_existente RECORD;
    v_unidades_totales INTEGER;
    v_nombre_producto TEXT;
    v_marca_producto TEXT;
    v_modelo_producto TEXT;
    v_producto_carga_uuid UUID;
BEGIN
    -- Validar parámetros básicos
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

    -- Validar que tenemos el nombre del producto
    IF p_producto_nombre IS NULL OR trim(p_producto_nombre) = '' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Se requiere el nombre del producto'
        );
    END IF;

    -- Intentar convertir a UUID si es posible, pero no es crítico
    BEGIN
        v_producto_carga_uuid := p_producto_carga_id::UUID;
    EXCEPTION
        WHEN invalid_text_representation THEN
            v_producto_carga_uuid := NULL;
    END;

    -- Si tenemos un UUID válido, intentar obtener información del producto existente
    IF v_producto_carga_uuid IS NOT NULL THEN
        SELECT producto, marca, modelo INTO v_nombre_producto, v_marca_producto, v_modelo_producto
        FROM productos_carga
        WHERE id = v_producto_carga_uuid;
    END IF;

    -- Usar parámetros si no se encontró en la base de datos
    v_nombre_producto := COALESCE(v_nombre_producto, trim(p_producto_nombre));
    v_marca_producto := COALESCE(v_marca_producto, COALESCE(p_producto_marca, 'Sin marca'));
    v_modelo_producto := COALESCE(v_modelo_producto, COALESCE(p_producto_modelo, v_nombre_producto));

    -- Calcular unidades totales
    v_unidades_totales := p_cantidad_cajas * p_unidades_por_caja;

    -- Buscar si ya existe un stock item para este producto
    SELECT * INTO v_stock_existente
    FROM stock_items si
    WHERE si.nombre = v_nombre_producto
      AND si.marca = v_marca_producto
      AND si.modelo = v_modelo_producto
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
            v_nombre_producto,
            v_marca_producto,
            v_modelo_producto,
            p_cantidad_cajas,
            0, -- unidades_sueltas inicia en 0
            p_unidades_por_caja,
            v_unidades_totales,
            p_permite_fraccionamiento,
            0,
            'USD',
            GREATEST(p_unidades_por_caja, 5),
            'Disponible',
            CURRENT_DATE,
            NOW(),
            NOW(),
            v_producto_carga_uuid,
            'Ingresado desde carga con fraccionamiento'
        );
    END IF;

    -- Retornar resultado exitoso
    RETURN json_build_object(
        'success', true,
        'message', 'Producto ingresado exitosamente al stock',
        'stock_item_id', v_stock_item_id,
        'cantidad_ingresada', v_unidades_totales,
        'cantidad_cajas', p_cantidad_cajas,
        'unidades_por_caja', p_unidades_por_caja,
        'permite_fraccionamiento', p_permite_fraccionamiento,
        'producto_nombre', v_nombre_producto,
        'marca', v_marca_producto,
        'modelo', v_modelo_producto
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error en procesar_ingreso_fraccionado: % %', SQLSTATE, SQLERRM;
        
        RETURN json_build_object(
            'success', false,
            'error', 'Error interno: ' || SQLERRM
        );
END;
$$;

COMMIT;;
