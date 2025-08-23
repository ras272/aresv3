-- Script de instalación completa del sistema de fraccionamiento (Versión Corregida)
-- Ejecutar este archivo completo en la consola SQL de Supabase

BEGIN;

---------------------------
-- 1. MIGRACIÓN DE TABLAS
---------------------------

-- Agregar columnas para fraccionamiento si no existen
ALTER TABLE stock_items 
ADD COLUMN IF NOT EXISTS cajas_completas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unidades_sueltas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unidades_por_paquete INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS permite_fraccionamiento BOOLEAN DEFAULT false;

-- Agregar restricciones (sin IF NOT EXISTS)
DO $$
BEGIN
    -- Intentar agregar restricción cajas_completas
    BEGIN
        ALTER TABLE stock_items 
        ADD CONSTRAINT chk_cajas_completas_no_negative 
            CHECK (cajas_completas >= 0);
    EXCEPTION
        WHEN duplicate_object THEN
            NULL; -- Ignorar si ya existe
    END;

    -- Intentar agregar restricción unidades_sueltas
    BEGIN
        ALTER TABLE stock_items 
        ADD CONSTRAINT chk_unidades_sueltas_no_negative 
            CHECK (unidades_sueltas >= 0);
    EXCEPTION
        WHEN duplicate_object THEN
            NULL; -- Ignorar si ya existe
    END;

    -- Intentar agregar restricción unidades_por_paquete
    BEGIN
        ALTER TABLE stock_items 
        ADD CONSTRAINT chk_unidades_por_paquete_positive 
            CHECK (unidades_por_paquete > 0);
    EXCEPTION
        WHEN duplicate_object THEN
            NULL; -- Ignorar si ya existe
    END;
END $$;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_stock_items_fraccionamiento 
    ON stock_items (permite_fraccionamiento);

CREATE INDEX IF NOT EXISTS idx_stock_items_cajas_sueltas 
    ON stock_items (cajas_completas, unidades_sueltas);

-- Actualizar productos existentes que no tienen fraccionamiento
UPDATE stock_items 
SET 
    cajas_completas = COALESCE(cajas_completas, 0),
    unidades_sueltas = COALESCE(unidades_sueltas, COALESCE(cantidad_disponible, 0)),
    unidades_por_paquete = COALESCE(unidades_por_paquete, 1),
    permite_fraccionamiento = COALESCE(permite_fraccionamiento, false)
WHERE 
    cajas_completas IS NULL 
    OR unidades_sueltas IS NULL 
    OR unidades_por_paquete IS NULL 
    OR permite_fraccionamiento IS NULL;

-- Crear vista para stock con formato legible incluyendo fraccionamiento
CREATE OR REPLACE VIEW v_stock_disponible_fraccionado AS
SELECT 
    si.*,
    CASE 
        WHEN COALESCE(si.permite_fraccionamiento, false) THEN
            CASE 
                WHEN COALESCE(si.cajas_completas, 0) > 0 AND COALESCE(si.unidades_sueltas, 0) > 0 THEN
                    COALESCE(si.cajas_completas, 0) || ' cajas + ' || COALESCE(si.unidades_sueltas, 0) || ' unidades sueltas'
                WHEN COALESCE(si.cajas_completas, 0) > 0 THEN
                    COALESCE(si.cajas_completas, 0) || ' cajas (' || COALESCE(si.unidades_por_paquete, 1) || ' u/caja)'
                WHEN COALESCE(si.unidades_sueltas, 0) > 0 THEN
                    COALESCE(si.unidades_sueltas, 0) || ' unidades sueltas'
                ELSE
                    '0 unidades'
            END
        ELSE
            COALESCE(si.cantidad_disponible, 0) || ' unidades'
    END as stock_formato_legible,
    CASE 
        WHEN COALESCE(si.permite_fraccionamiento, false) THEN
            (COALESCE(si.cajas_completas, 0) * COALESCE(si.unidades_por_paquete, 1)) + COALESCE(si.unidades_sueltas, 0)
        ELSE
            COALESCE(si.cantidad_disponible, 0)
    END as unidades_totales,
    CASE 
        WHEN COALESCE(si.cantidad_disponible, 0) = 0 THEN 'Sin stock'
        WHEN COALESCE(si.cantidad_disponible, 0) <= COALESCE(si.cantidad_minima, 5) THEN 'Stock bajo'
        ELSE 'Disponible'
    END as estado
FROM stock_items si
WHERE COALESCE(si.estado, 'Disponible') = 'Disponible'
ORDER BY si.nombre, si.marca;

-- Crear función para actualizar cantidad_disponible basada en fraccionamiento
CREATE OR REPLACE FUNCTION actualizar_cantidad_disponible()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Si el producto permite fraccionamiento, calcular basado en cajas y unidades sueltas
    IF COALESCE(NEW.permite_fraccionamiento, false) THEN
        NEW.cantidad_disponible := (COALESCE(NEW.cajas_completas, 0) * COALESCE(NEW.unidades_por_paquete, 1)) + COALESCE(NEW.unidades_sueltas, 0);
    END IF;
    
    RETURN NEW;
END;
$$;

-- Crear trigger para actualizar automáticamente cantidad_disponible
DROP TRIGGER IF EXISTS trg_actualizar_cantidad_disponible ON stock_items;
CREATE TRIGGER trg_actualizar_cantidad_disponible
    BEFORE INSERT OR UPDATE OF cajas_completas, unidades_sueltas, unidades_por_paquete, permite_fraccionamiento
    ON stock_items
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_cantidad_disponible();

---------------------------
-- 2. FUNCIÓN DE INGRESO FRACCIONADO
---------------------------

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
      AND COALESCE(si.permite_fraccionamiento, false) = p_permite_fraccionamiento
    LIMIT 1;

    -- Si existe stock, actualizar
    IF FOUND THEN
        v_stock_item_id := v_stock_existente.id;
        
        UPDATE stock_items SET
            cajas_completas = COALESCE(cajas_completas, 0) + p_cantidad_cajas,
            unidades_por_paquete = p_unidades_por_caja,
            cantidad_disponible = COALESCE(cantidad_disponible, 0) + v_unidades_totales,
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
            cantidad_disponible,
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
            v_unidades_totales,
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

    -- Registrar el movimiento de stock (solo si existe la tabla)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'movimientos_stock') THEN
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
    END IF;

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

---------------------------
-- 3. FUNCIONES AUXILIARES
---------------------------

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
        fecha_actualizacion = NOW(),
        actualizado_por = p_usuario
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

-- Función para procesar venta fraccionada
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
            fecha_actualizacion = NOW(),
            actualizado_por = p_usuario
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
                fecha_actualizacion = NOW(),
                actualizado_por = p_usuario
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
                fecha_actualizacion = NOW(),
                actualizado_por = p_usuario
            WHERE id = p_stock_item_id;
        END IF;
    END IF;

    RETURN json_build_object(
        'success', true,
        'message', 'Venta procesada exitosamente',
        'unidades_vendidas', v_unidades_a_vender,
        'tipo_venta', p_tipo_venta,
        'cantidad_solicitada', p_cantidad_solicitada,
        'cajas_abiertas', v_cajas_a_abrir
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Error interno: ' || SQLERRM
        );
END;
$$;

---------------------------
-- 4. PERMISOS Y COMENTARIOS
---------------------------

-- Otorgar permisos para todas las funciones
GRANT EXECUTE ON FUNCTION public.procesar_ingreso_fraccionado(UUID, INTEGER, INTEGER, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.procesar_ingreso_fraccionado(UUID, INTEGER, INTEGER, BOOLEAN, TEXT) TO anon;

GRANT EXECUTE ON FUNCTION public.abrir_caja_para_fraccionamiento(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.abrir_caja_para_fraccionamiento(UUID, TEXT, TEXT) TO anon;

GRANT EXECUTE ON FUNCTION public.validar_disponibilidad_venta(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validar_disponibilidad_venta(UUID, INTEGER, TEXT) TO anon;

GRANT EXECUTE ON FUNCTION public.procesar_venta_fraccionada(UUID, INTEGER, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.procesar_venta_fraccionada(UUID, INTEGER, TEXT, TEXT, TEXT) TO anon;

---------------------------
-- 5. VERIFICACIÓN FINAL
---------------------------

DO $$
BEGIN
    -- Verificar que las columnas existen
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stock_items' 
        AND column_name = 'cajas_completas'
    ) THEN
        RAISE EXCEPTION 'Error: Columna cajas_completas no existe en stock_items';
    END IF;

    -- Verificar que las funciones existen
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'procesar_ingreso_fraccionado'
        AND routine_type = 'FUNCTION'
    ) THEN
        RAISE EXCEPTION 'Error: Función procesar_ingreso_fraccionado no existe';
    END IF;

    RAISE NOTICE 'Sistema de fraccionamiento instalado correctamente';
END
$$;

-- Mostrar resumen final
SELECT 
    'Instalación completa' as status,
    'Sistema de fraccionamiento listo' as mensaje,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'stock_items' AND column_name IN ('cajas_completas', 'unidades_sueltas', 'unidades_por_paquete', 'permite_fraccionamiento')) as columnas_agregadas,
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name LIKE '%fraccion%' OR routine_name LIKE '%ingreso_fraccionado%') as funciones_creadas;

COMMIT;
