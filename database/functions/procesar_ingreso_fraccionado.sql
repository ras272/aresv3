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
    WHERE si.nombre = v_producto_carga.nombre
      AND si.marca = v_producto_carga.marca
      AND si.modelo = v_producto_carga.modelo
      AND si.permite_fraccionamiento = p_permite_fraccionamiento
    LIMIT 1;

    -- Si existe stock, actualizar
    IF FOUND THEN
        v_stock_item_id := v_stock_existente.id;
        
        UPDATE stock_items SET
            cajas_completas = COALESCE(cajas_completas, 0) + p_cantidad_cajas,
            unidades_por_paquete = p_unidades_por_caja,
            -- NO actualizar cantidad_disponible manualmente si permite fraccionamiento
            -- El trigger lo calculará automáticamente basado en cajas_completas y unidades_sueltas
            permite_fraccionamiento = p_permite_fraccionamiento,
            fecha_actualizacion = NOW(),
            actualizado_por = p_usuario
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
            tipo_componente,
            cajas_completas,
            unidades_sueltas,
            unidades_por_paquete,
            -- NO incluir cantidad_disponible en el INSERT si permite fraccionamiento
            -- El trigger lo calculará automáticamente
            permite_fraccionamiento,
            ubicacion_fisica,
            precio,
            moneda,
            cantidad_minima,
            estado,
            fecha_ingreso,
            fecha_actualizacion,
            creado_por,
            actualizado_por,
            imagen,
            observaciones
        ) VALUES (
            v_stock_item_id,
            COALESCE(v_producto_carga.codigo, 'AUTO-' || EXTRACT(epoch FROM NOW())::text),
            v_producto_carga.nombre,
            v_producto_carga.marca,
            v_producto_carga.modelo,
            COALESCE(v_producto_carga.tipo_componente, 'General'),
            p_cantidad_cajas,
            0, -- unidades_sueltas inicia en 0
            p_unidades_por_caja,
            -- cantidad_disponible será calculada por el trigger
            p_permite_fraccionamiento,
            'Almacén Principal', -- ubicación por defecto
            COALESCE(v_producto_carga.precio, 0),
            COALESCE(v_producto_carga.moneda, 'COP'),
            GREATEST(p_unidades_por_caja, 5), -- cantidad mínima
            'Disponible',
            NOW(),
            NOW(),
            p_usuario,
            p_usuario,
            v_producto_carga.imagen,
            'Ingresado desde carga con fraccionamiento'
        );
    END IF;

    -- Registrar el movimiento de stock
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
        v_stock_item_id,
        'INGRESO',
        COALESCE(v_stock_existente.cantidad_disponible, 0),
        v_unidades_totales,
        COALESCE(v_stock_existente.cantidad_disponible, 0) + v_unidades_totales,
        p_unidades_por_caja,
        CASE WHEN p_permite_fraccionamiento THEN 'CAJA' ELSE 'UNIDAD' END,
        'Ingreso desde carga',
        'CARGA-' || p_producto_carga_id::text,
        p_usuario,
        NOW(),
        json_build_object(
            'producto_carga_id', p_producto_carga_id,
            'cantidad_cajas', p_cantidad_cajas,
            'unidades_por_caja', p_unidades_por_caja,
            'permite_fraccionamiento', p_permite_fraccionamiento,
            'producto_nombre', v_producto_carga.nombre
        )
    );

    -- Marcar el producto de carga como procesado
    UPDATE productos_carga SET
        procesado = true,
        fecha_procesado = NOW(),
        procesado_por = p_usuario,
        stock_item_id = v_stock_item_id
    WHERE id = p_producto_carga_id;

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

-- Otorgar permisos
GRANT EXECUTE ON FUNCTION public.procesar_ingreso_fraccionado(UUID, INTEGER, INTEGER, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.procesar_ingreso_fraccionado(UUID, INTEGER, INTEGER, BOOLEAN, TEXT) TO anon;

-- Comentario de la función
COMMENT ON FUNCTION public.procesar_ingreso_fraccionado(UUID, INTEGER, INTEGER, BOOLEAN, TEXT) IS 
'Procesa el ingreso de productos con capacidad de fraccionamiento al stock';
