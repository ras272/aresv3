-- ===============================================
-- MIGRACIÓN: Agregar campos de fraccionamiento a stock_items
-- Fecha: 2025-01-21
-- Descripción: Añade campos para manejar productos con unidades fraccionables en la tabla stock_items
-- ===============================================

-- 1. Verificar y agregar columna activo si no existe
DO $$
BEGIN
    -- Verificar si la columna activo existe, si no, agregarla
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_items' AND column_name = 'activo') THEN
        ALTER TABLE public.stock_items ADD COLUMN activo BOOLEAN DEFAULT TRUE;
        RAISE NOTICE '✅ Columna activo agregada a stock_items';
    ELSE
        RAISE NOTICE '✅ Columna activo ya existe en stock_items';
    END IF;
END $$;

-- 2. Agregar columnas de fraccionamiento a stock_items
ALTER TABLE public.stock_items 
ADD COLUMN IF NOT EXISTS unidades_por_paquete INTEGER DEFAULT 1 CHECK (unidades_por_paquete > 0),
ADD COLUMN IF NOT EXISTS permite_fraccionamiento BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS unidades_sueltas INTEGER DEFAULT 0 CHECK (unidades_sueltas >= 0);

-- 3. Agregar comentarios descriptivos
COMMENT ON COLUMN public.stock_items.unidades_por_paquete IS 'Número de unidades individuales contenidas en cada paquete/caja';
COMMENT ON COLUMN public.stock_items.permite_fraccionamiento IS 'Indica si el producto puede venderse por unidades individuales (no solo por paquetes completos)';
COMMENT ON COLUMN public.stock_items.unidades_sueltas IS 'Número de unidades sueltas disponibles (fuera de paquetes completos)';

-- 4. Crear índices para mejorar rendimiento
CREATE INDEX idx_stock_items_permite_fraccionamiento ON stock_items(permite_fraccionamiento) WHERE permite_fraccionamiento = TRUE;
CREATE INDEX idx_stock_items_unidades_sueltas ON stock_items(unidades_sueltas) WHERE unidades_sueltas > 0;

-- 5. Actualizar datos existentes (establecer valores por defecto)
UPDATE public.stock_items 
SET 
    unidades_por_paquete = 1,
    permite_fraccionamiento = FALSE,
    unidades_sueltas = 0
WHERE 
    unidades_por_paquete IS NULL 
    OR permite_fraccionamiento IS NULL 
    OR unidades_sueltas IS NULL;

-- 6. Crear vista para stock fraccionable
CREATE OR REPLACE VIEW stock_items_fraccionables AS
SELECT 
    si.*,
    ub.nombre as ubicacion_nombre,
    calcular_unidades_totales(si.cantidad_actual, si.unidades_por_paquete, si.unidades_sueltas) as total_unidades_disponibles,
    CASE 
        WHEN si.permite_fraccionamiento THEN 'Fraccionable'
        ELSE 'Solo paquetes completos'
    END as tipo_venta,
    -- Calcular cuántos paquetes completos están disponibles
    FLOOR((si.cantidad_actual * si.unidades_por_paquete - si.unidades_sueltas) / si.unidades_por_paquete) as paquetes_completos_disponibles,
    -- Calcular el total de unidades considerando tanto paquetes como unidades sueltas
    (si.cantidad_actual * si.unidades_por_paquete) + si.unidades_sueltas as unidades_totales
FROM stock_items si
LEFT JOIN ubicaciones_stock ub ON si.ubicacion_id = ub.id
WHERE si.permite_fraccionamiento = TRUE
  AND (
    -- Verificar si la columna activo existe antes de usarla
    (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_items' AND column_name = 'activo') AND si.activo = TRUE)
    OR 
    (NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_items' AND column_name = 'activo'))
  );

COMMENT ON VIEW stock_items_fraccionables IS 'Vista que muestra todos los stock items que permiten venta fraccionada con información consolidada';

-- 6. Crear función de validación para fraccionamiento en stock_items
CREATE OR REPLACE FUNCTION validar_fraccionamiento_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Si permite fraccionamiento, debe tener al menos 1 unidad por paquete
    IF NEW.permite_fraccionamiento = TRUE AND NEW.unidades_por_paquete < 1 THEN
        RAISE EXCEPTION 'Los productos fraccionables deben tener al menos 1 unidad por paquete';
    END IF;
    
    -- Las unidades sueltas no pueden exceder el total de unidades en paquetes
    IF NEW.unidades_sueltas > (NEW.cantidad_actual * NEW.unidades_por_paquete) THEN
        RAISE EXCEPTION 'Las unidades sueltas (%) no pueden exceder el total de unidades en stock (%)', 
            NEW.unidades_sueltas, (NEW.cantidad_actual * NEW.unidades_por_paquete);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Crear trigger de validación para stock_items
CREATE TRIGGER trigger_validar_fraccionamiento_stock
    BEFORE INSERT OR UPDATE ON stock_items
    FOR EACH ROW EXECUTE FUNCTION validar_fraccionamiento_stock();

-- 8. Verificar si necesitamos crear o actualizar la vista vista_stock_critico
DO $$
BEGIN
    -- Verificar si la columna activo existe
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_items' AND column_name = 'activo') THEN
        -- La columna activo existe, crear vista con filtro activo
        DROP VIEW IF EXISTS vista_stock_critico;
        CREATE VIEW vista_stock_critico AS
        SELECT 
            si.*,
            COALESCE(ub.nombre, 'Sin ubicación') as ubicacion_nombre,
            COALESCE(ub.codigo, 'N/A') as ubicacion_codigo,
            -- Información de fraccionamiento
            si.unidades_por_paquete,
            si.permite_fraccionamiento,
            si.unidades_sueltas,
            CASE 
                WHEN si.permite_fraccionamiento THEN 
                    calcular_unidades_totales(si.cantidad_actual, si.unidades_por_paquete, si.unidades_sueltas)
                ELSE 
                    si.cantidad_actual
            END as unidades_totales_disponibles,
            CASE 
                WHEN si.permite_fraccionamiento THEN 'Fraccionable'
                ELSE 'Solo paquetes completos'
            END as tipo_venta
        FROM stock_items si
        LEFT JOIN ubicaciones_stock ub ON si.ubicacion_id = ub.id
        WHERE si.cantidad_actual <= si.cantidad_minima
          AND si.activo = TRUE
        ORDER BY 
            CASE 
                WHEN si.cantidad_actual = 0 THEN 1
                WHEN si.cantidad_actual <= si.cantidad_minima / 2 THEN 2
                ELSE 3
            END,
            si.nombre;
    ELSE
        -- La columna activo no existe, crear vista sin filtro activo
        DROP VIEW IF EXISTS vista_stock_critico;
        CREATE VIEW vista_stock_critico AS
        SELECT 
            si.*,
            COALESCE(ub.nombre, 'Sin ubicación') as ubicacion_nombre,
            COALESCE(ub.codigo, 'N/A') as ubicacion_codigo,
            -- Información de fraccionamiento
            si.unidades_por_paquete,
            si.permite_fraccionamiento,
            si.unidades_sueltas,
            CASE 
                WHEN si.permite_fraccionamiento THEN 
                    calcular_unidades_totales(si.cantidad_actual, si.unidades_por_paquete, si.unidades_sueltas)
                ELSE 
                    si.cantidad_actual
            END as unidades_totales_disponibles,
            CASE 
                WHEN si.permite_fraccionamiento THEN 'Fraccionable'
                ELSE 'Solo paquetes completos'
            END as tipo_venta
        FROM stock_items si
        LEFT JOIN ubicaciones_stock ub ON si.ubicacion_id = ub.id
        WHERE si.cantidad_actual <= si.cantidad_minima
        ORDER BY 
            CASE 
                WHEN si.cantidad_actual = 0 THEN 1
                WHEN si.cantidad_actual <= si.cantidad_minima / 2 THEN 2
                ELSE 3
            END,
            si.nombre;
    END IF;
END $$;

-- 9. Crear función para transferir datos de fraccionamiento desde productos_carga
CREATE OR REPLACE FUNCTION transferir_fraccionamiento_a_stock(
    p_producto_carga_id UUID,
    p_stock_item_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_unidades_por_paquete INTEGER;
    v_permite_fraccionamiento BOOLEAN;
    v_unidades_sueltas INTEGER;
BEGIN
    -- Obtener datos de fraccionamiento desde productos_carga
    SELECT 
        unidades_por_paquete,
        permite_fraccionamiento,
        unidades_sueltas
    INTO 
        v_unidades_por_paquete,
        v_permite_fraccionamiento,
        v_unidades_sueltas
    FROM productos_carga
    WHERE id = p_producto_carga_id;
    
    -- Si no se encontró el producto, usar valores por defecto
    IF NOT FOUND THEN
        v_unidades_por_paquete := 1;
        v_permite_fraccionamiento := FALSE;
        v_unidades_sueltas := 0;
    END IF;
    
    -- Actualizar el stock item con los datos de fraccionamiento
    UPDATE stock_items
    SET 
        unidades_por_paquete = v_unidades_por_paquete,
        permite_fraccionamiento = v_permite_fraccionamiento,
        unidades_sueltas = v_unidades_sueltas,
        updated_at = NOW()
    WHERE id = p_stock_item_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION transferir_fraccionamiento_a_stock IS 'Transfiere información de fraccionamiento desde productos_carga hacia stock_items';

-- 10. Crear función para migrar datos existentes de componentes_disponibles
CREATE OR REPLACE FUNCTION migrar_fraccionamiento_componentes()
RETURNS INTEGER AS $$
DECLARE
    componente RECORD;
    contador INTEGER := 0;
BEGIN
    -- Recorrer todos los componentes_disponibles y actualizar stock_items correspondientes
    FOR componente IN 
        SELECT cd.*, si.id as stock_item_id
        FROM componentes_disponibles cd
        LEFT JOIN stock_items si ON (
            si.nombre = cd.nombre AND 
            si.marca = cd.marca AND 
            si.modelo = cd.modelo AND
            COALESCE(si.numero_serie, '') = COALESCE(cd.numero_serie, '')
        )
        WHERE si.id IS NOT NULL
    LOOP
        -- Actualizar stock_items con valores por defecto de fraccionamiento
        UPDATE stock_items
        SET 
            unidades_por_paquete = 1,
            permite_fraccionamiento = FALSE,
            unidades_sueltas = 0,
            updated_at = NOW()
        WHERE id = componente.stock_item_id
          AND (unidades_por_paquete IS NULL 
               OR permite_fraccionamiento IS NULL 
               OR unidades_sueltas IS NULL);
               
        contador := contador + 1;
    END LOOP;
    
    RETURN contador;
END;
$$ LANGUAGE plpgsql;

-- 11. Ejecutar migración de datos existentes
SELECT migrar_fraccionamiento_componentes() as componentes_migrados;

-- 12. Verificar la estructura actualizada
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'stock_items' 
  AND table_schema = 'public'
  AND column_name IN ('unidades_por_paquete', 'permite_fraccionamiento', 'unidades_sueltas')
ORDER BY ordinal_position;

-- 13. Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Migración de fraccionamiento para stock_items completada exitosamente';
    RAISE NOTICE '📦 Columnas agregadas a stock_items: unidades_por_paquete, permite_fraccionamiento, unidades_sueltas';
    RAISE NOTICE '🔍 Índices creados para optimizar consultas de stock fraccionable';
    RAISE NOTICE '🛡️ Triggers de validación implementados para stock_items';
    RAISE NOTICE '📊 Vista stock_items_fraccionables disponible';
    RAISE NOTICE '🔄 Vista vista_stock_critico actualizada con información de fraccionamiento';
    RAISE NOTICE '🔧 Función transferir_fraccionamiento_a_stock() disponible';
    RAISE NOTICE '📈 Función migrar_fraccionamiento_componentes() ejecutada';
    RAISE NOTICE '⚠️ Recuerda actualizar las funciones de transferencia de datos para usar transferir_fraccionamiento_a_stock()';
END $$;
