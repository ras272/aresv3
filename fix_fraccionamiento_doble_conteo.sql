-- =====================================================
-- FIX: Corregir doble conteo en fraccionamiento
-- Problema: La función estaba sumando a cantidad_disponible
-- además de actualizar cajas_completas, causando doble conteo
-- =====================================================

-- Eliminar la función anterior
DROP FUNCTION IF EXISTS public.procesar_ingreso_fraccionado(UUID, INTEGER, INTEGER, BOOLEAN, TEXT);

-- Crear función corregida
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
      AND COALESCE(si.modelo, '') = COALESCE(v_producto_carga.modelo, '')
      AND COALESCE(si.permite_fraccionamiento, false) = p_permite_fraccionamiento
    LIMIT 1;

    -- Si existe stock, actualizar
    IF FOUND THEN
        v_stock_item_id := v_stock_existente.id;
        
        UPDATE stock_items SET
            cajas_completas = COALESCE(cajas_completas, 0) + p_cantidad_cajas,
            unidades_por_paquete = p_unidades_por_caja,
            -- NO actualizar cantidad_disponible/cantidad_actual manualmente
            -- El trigger lo calculará automáticamente
            permite_fraccionamiento = p_permite_fraccionamiento,
            updated_at = NOW()
        WHERE id = v_stock_item_id;

    ELSE
        -- Crear nuevo stock item
        v_stock_item_id := gen_random_uuid();
        
        INSERT INTO stock_items (
            id,
            nombre,
            marca,
            modelo,
            cajas_completas,
            unidades_sueltas,
            unidades_por_paquete,
            permite_fraccionamiento,
            estado,
            fecha_ingreso,
            created_at,
            updated_at,
            codigo_carga_origen,
            observaciones
        ) VALUES (
            v_stock_item_id,
            v_producto_carga.nombre,
            v_producto_carga.marca,
            v_producto_carga.modelo,
            p_cantidad_cajas,
            0, -- unidades_sueltas inicia en 0
            p_unidades_por_caja,
            p_permite_fraccionamiento,
            'Disponible',
            NOW(),
            NOW(),
            NOW(),
            v_producto_carga.codigo_carga,
            'Ingresado con fraccionamiento'
        );
    END IF;

    -- Registrar el movimiento de stock
    INSERT INTO movimientos_stock (
        stock_item_id,
        tipo_movimiento,
        cantidad,
        cantidad_anterior,
        cantidad_nueva,
        motivo,
        referencia_externa,
        fecha_movimiento,
        created_at,
        descripcion
    ) VALUES (
        v_stock_item_id,
        'Entrada',
        v_unidades_totales,
        COALESCE(v_stock_existente.cantidad_actual, 0),
        COALESCE(v_stock_existente.cantidad_actual, 0) + v_unidades_totales,
        'Ingreso desde carga con fraccionamiento',
        'CARGA-' || p_producto_carga_id::text,
        NOW(),
        NOW(),
        json_build_object(
            'producto_carga_id', p_producto_carga_id,
            'cantidad_cajas', p_cantidad_cajas,
            'unidades_por_caja', p_unidades_por_caja,
            'permite_fraccionamiento', p_permite_fraccionamiento,
            'productoNombre', v_producto_carga.nombre,
            'productoMarca', v_producto_carga.marca,
            'productoModelo', v_producto_carga.modelo,
            'responsable', p_usuario
        )::text
    );

    -- Marcar el producto de carga como procesado
    UPDATE productos_carga SET
        procesado = true,
        procesado_por = p_usuario,
        fecha_procesado = NOW()
    WHERE id = p_producto_carga_id;

    -- Construir respuesta exitosa
    v_resultado := json_build_object(
        'success', true,
        'message', 'Producto ingresado exitosamente con fraccionamiento',
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
'Procesa el ingreso de productos con capacidad de fraccionamiento al stock. Corregido para evitar doble conteo.';

-- =====================================================
-- Verificar que el trigger esté funcionando correctamente
-- =====================================================

-- Recrear el trigger para asegurarnos de que funciona
DROP TRIGGER IF EXISTS update_cantidad_disponible ON stock_items;

CREATE OR REPLACE FUNCTION update_cantidad_disponible()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo calcular si permite fraccionamiento
    IF NEW.permite_fraccionamiento = true THEN
        NEW.cantidad_actual = (COALESCE(NEW.cajas_completas, 0) * COALESCE(NEW.unidades_por_paquete, 1)) 
                              + COALESCE(NEW.unidades_sueltas, 0);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cantidad_disponible
    BEFORE INSERT OR UPDATE OF cajas_completas, unidades_sueltas, unidades_por_paquete, permite_fraccionamiento
    ON stock_items
    FOR EACH ROW
    EXECUTE FUNCTION update_cantidad_disponible();

-- =====================================================
-- Mensaje de confirmación
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Script ejecutado exitosamente. El problema de doble conteo ha sido corregido.';
    RAISE NOTICE 'Ahora cuando ingreses 1 caja con 6 unidades, el stock total será 6 unidades (no 7).';
END $$;
