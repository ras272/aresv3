-- =====================================================
-- FIX: Corregir trigger que suma mal caja + unidades
-- Problema: El sistema suma 1 (caja) + 6 (unidades) = 7
-- Solución: cantidad_actual = cajas × unidades_por_caja + unidades_sueltas
-- =====================================================

-- Eliminar triggers existentes que puedan estar causando conflicto
DROP TRIGGER IF EXISTS update_cantidad_disponible ON stock_items;
DROP TRIGGER IF EXISTS trg_actualizar_cantidad_disponible ON stock_items;
DROP TRIGGER IF EXISTS update_cantidad_actual ON stock_items;

-- Eliminar funciones anteriores
DROP FUNCTION IF EXISTS update_cantidad_disponible() CASCADE;
DROP FUNCTION IF EXISTS actualizar_cantidad_disponible() CASCADE;
DROP FUNCTION IF EXISTS update_cantidad_actual() CASCADE;

-- Crear función correcta para calcular cantidad_actual
CREATE OR REPLACE FUNCTION calcular_cantidad_actual_fraccionamiento()
RETURNS TRIGGER AS $$
BEGIN
    -- Si permite fraccionamiento, SIEMPRE recalcular cantidad_actual
    -- basado SOLO en cajas × unidades_por_caja + unidades_sueltas
    IF NEW.permite_fraccionamiento = true THEN
        -- IMPORTANTE: No sumar nada al valor existente, REEMPLAZAR completamente
        NEW.cantidad_actual = (COALESCE(NEW.cajas_completas, 0) * COALESCE(NEW.unidades_por_paquete, 1)) 
                            + COALESCE(NEW.unidades_sueltas, 0);
    ELSE
        -- Si no permite fraccionamiento, dejar cantidad_actual como viene
        -- (no modificar para productos sin fraccionamiento)
        NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger que se ejecuta ANTES de INSERT o UPDATE
CREATE TRIGGER trg_calcular_cantidad_actual
    BEFORE INSERT OR UPDATE 
    ON stock_items
    FOR EACH ROW
    WHEN (NEW.permite_fraccionamiento = true)
    EXECUTE FUNCTION calcular_cantidad_actual_fraccionamiento();

-- =====================================================
-- Corregir datos existentes mal calculados
-- =====================================================

-- Ver estado actual antes de corregir
DO $$
BEGIN
    RAISE NOTICE '=== ANTES DE LA CORRECCIÓN ===';
END $$;

SELECT 
    nombre,
    marca,
    cajas_completas,
    unidades_por_paquete,
    unidades_sueltas,
    cantidad_actual as cantidad_mal_calculada,
    (cajas_completas * unidades_por_paquete + unidades_sueltas) as cantidad_correcta,
    cantidad_actual - (cajas_completas * unidades_por_paquete + unidades_sueltas) as diferencia
FROM stock_items
WHERE permite_fraccionamiento = true;

-- Corregir todos los productos con fraccionamiento
UPDATE stock_items
SET cantidad_actual = (COALESCE(cajas_completas, 0) * COALESCE(unidades_por_paquete, 1)) 
                    + COALESCE(unidades_sueltas, 0)
WHERE permite_fraccionamiento = true;

-- Ver estado después de corregir
DO $$
BEGIN
    RAISE NOTICE '=== DESPUÉS DE LA CORRECCIÓN ===';
END $$;

SELECT 
    nombre,
    marca,
    cajas_completas || ' cajas × ' || unidades_por_paquete || ' u/caja = ' || 
    (cajas_completas * unidades_por_paquete) || ' + ' || 
    unidades_sueltas || ' sueltas = ' || 
    cantidad_actual || ' total' as calculo_completo,
    CASE 
        WHEN cantidad_actual = (cajas_completas * unidades_por_paquete + unidades_sueltas)
        THEN '✅ CORRECTO'
        ELSE '❌ ERROR'
    END as estado
FROM stock_items
WHERE permite_fraccionamiento = true;

-- =====================================================
-- También corregir la función procesar_ingreso_fraccionado
-- para que NO inicialice cantidad_actual con ningún valor
-- =====================================================

DROP FUNCTION IF EXISTS public.procesar_ingreso_fraccionado(UUID, INTEGER, INTEGER, BOOLEAN, TEXT);

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

    -- Calcular unidades totales (solo para registro en movimientos)
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
        
        -- Solo actualizar cajas y configuración
        -- El trigger calculará cantidad_actual automáticamente
        UPDATE stock_items SET
            cajas_completas = COALESCE(cajas_completas, 0) + p_cantidad_cajas,
            unidades_por_paquete = p_unidades_por_caja,
            permite_fraccionamiento = p_permite_fraccionamiento,
            updated_at = NOW()
        WHERE id = v_stock_item_id;

    ELSE
        -- Crear nuevo stock item
        v_stock_item_id := gen_random_uuid();
        
        -- NO incluir cantidad_actual en el INSERT
        -- El trigger lo calculará automáticamente
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
            0,
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

    -- Obtener el stock actualizado para el registro de movimiento
    SELECT cantidad_actual INTO v_stock_existente.cantidad_actual
    FROM stock_items
    WHERE id = v_stock_item_id;

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
        COALESCE(v_stock_existente.cantidad_actual, 0) - v_unidades_totales,
        COALESCE(v_stock_existente.cantidad_actual, 0),
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

-- =====================================================
-- Mensaje final
-- =====================================================
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM stock_items
    WHERE permite_fraccionamiento = true
      AND cantidad_actual = (cajas_completas * unidades_por_paquete + unidades_sueltas);
    
    RAISE NOTICE '✅ Corrección completada';
    RAISE NOTICE '✅ % productos con fraccionamiento ahora tienen el cálculo correcto', v_count;
    RAISE NOTICE '✅ Fórmula: cantidad_actual = (cajas × unidades_por_caja) + unidades_sueltas';
    RAISE NOTICE '✅ Ejemplo: 1 caja × 6 u/caja + 0 sueltas = 6 unidades totales (NO 7)';
END $$;
