-- ======================================================
-- MIGRACIÓN: Sistema Mejorado de Fraccionamiento
-- Fecha: 2025-01-21
-- Descripción: Mejora el manejo de productos fraccionables
-- ======================================================

-- 1. Agregar campos faltantes en productos_carga si no existen
DO $$ 
BEGIN
    -- Verificar y agregar campo unidades_por_paquete si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'productos_carga' 
                   AND column_name = 'unidades_por_paquete') THEN
        ALTER TABLE productos_carga 
        ADD COLUMN unidades_por_paquete INTEGER DEFAULT 1 CHECK (unidades_por_paquete > 0);
        COMMENT ON COLUMN productos_carga.unidades_por_paquete IS 
        'Número de unidades individuales contenidas en cada paquete/caja';
    END IF;

    -- Verificar y agregar campo permite_fraccionamiento si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'productos_carga' 
                   AND column_name = 'permite_fraccionamiento') THEN
        ALTER TABLE productos_carga 
        ADD COLUMN permite_fraccionamiento BOOLEAN DEFAULT false;
        COMMENT ON COLUMN productos_carga.permite_fraccionamiento IS 
        'Indica si el producto puede venderse por unidades individuales';
    END IF;

    -- Verificar y agregar campo unidades_sueltas si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'productos_carga' 
                   AND column_name = 'unidades_sueltas') THEN
        ALTER TABLE productos_carga 
        ADD COLUMN unidades_sueltas INTEGER DEFAULT 0 CHECK (unidades_sueltas >= 0);
        COMMENT ON COLUMN productos_carga.unidades_sueltas IS 
        'Número de unidades sueltas disponibles (fuera de paquetes completos)';
    END IF;
END $$;

-- 2. Agregar campos a stock_items para mejor manejo
DO $$ 
BEGIN
    -- Campo para rastrear unidades disponibles en cajas fraccionables
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stock_items' 
                   AND column_name = 'unidades_por_paquete') THEN
        ALTER TABLE stock_items 
        ADD COLUMN unidades_por_paquete INTEGER DEFAULT 1;
        COMMENT ON COLUMN stock_items.unidades_por_paquete IS 
        'Unidades por paquete heredado del producto_carga';
    END IF;

    -- Campo para saber si permite fraccionamiento
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stock_items' 
                   AND column_name = 'permite_fraccionamiento') THEN
        ALTER TABLE stock_items 
        ADD COLUMN permite_fraccionamiento BOOLEAN DEFAULT false;
        COMMENT ON COLUMN stock_items.permite_fraccionamiento IS 
        'Indica si permite venta fraccionada';
    END IF;

    -- Campo para unidades sueltas disponibles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stock_items' 
                   AND column_name = 'unidades_sueltas') THEN
        ALTER TABLE stock_items 
        ADD COLUMN unidades_sueltas INTEGER DEFAULT 0 CHECK (unidades_sueltas >= 0);
        COMMENT ON COLUMN stock_items.unidades_sueltas IS 
        'Unidades sueltas disponibles para venta';
    END IF;

    -- Campo para cajas completas disponibles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stock_items' 
                   AND column_name = 'cajas_completas') THEN
        ALTER TABLE stock_items 
        ADD COLUMN cajas_completas INTEGER DEFAULT 0 CHECK (cajas_completas >= 0);
        COMMENT ON COLUMN stock_items.cajas_completas IS 
        'Número de cajas/paquetes completos disponibles';
    END IF;
END $$;

-- 3. Mejorar tabla stock_cajas_abiertas
DO $$ 
BEGIN
    -- Agregar campo para rastrear de qué caja se abrió
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stock_cajas_abiertas' 
                   AND column_name = 'numero_caja_original') THEN
        ALTER TABLE stock_cajas_abiertas 
        ADD COLUMN numero_caja_original INTEGER DEFAULT 1;
        COMMENT ON COLUMN stock_cajas_abiertas.numero_caja_original IS 
        'Número de caja que se abrió (para trazabilidad)';
    END IF;

    -- Campo para usuario que abrió la caja
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stock_cajas_abiertas' 
                   AND column_name = 'abierto_por') THEN
        ALTER TABLE stock_cajas_abiertas 
        ADD COLUMN abierto_por VARCHAR(255);
        COMMENT ON COLUMN stock_cajas_abiertas.abierto_por IS 
        'Usuario que realizó la apertura de la caja';
    END IF;

    -- Campo para motivo de apertura
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stock_cajas_abiertas' 
                   AND column_name = 'motivo_apertura') THEN
        ALTER TABLE stock_cajas_abiertas 
        ADD COLUMN motivo_apertura TEXT;
        COMMENT ON COLUMN stock_cajas_abiertas.motivo_apertura IS 
        'Motivo o referencia de la apertura (ej: Remisión #123)';
    END IF;
END $$;

-- 4. Agregar campos a productos_remision para manejo de fraccionamiento
DO $$ 
BEGIN
    -- Campo para tipo de unidad vendida
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'productos_remision' 
                   AND column_name = 'tipo_unidad') THEN
        ALTER TABLE productos_remision 
        ADD COLUMN tipo_unidad VARCHAR(50) DEFAULT 'unidad'
        CHECK (tipo_unidad IN ('caja', 'unidad', 'paquete'));
        COMMENT ON COLUMN productos_remision.tipo_unidad IS 
        'Tipo de unidad vendida: caja, unidad o paquete';
    END IF;

    -- Campo para factor de conversión usado
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'productos_remision' 
                   AND column_name = 'factor_conversion') THEN
        ALTER TABLE productos_remision 
        ADD COLUMN factor_conversion INTEGER DEFAULT 1;
        COMMENT ON COLUMN productos_remision.factor_conversion IS 
        'Factor de conversión aplicado (ej: 6 si es caja de 6 unidades)';
    END IF;

    -- Campo para cantidad en unidades base
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'productos_remision' 
                   AND column_name = 'cantidad_unidades_base') THEN
        ALTER TABLE productos_remision 
        ADD COLUMN cantidad_unidades_base INTEGER;
        COMMENT ON COLUMN productos_remision.cantidad_unidades_base IS 
        'Cantidad total en unidades base para cálculos de stock';
    END IF;
END $$;

-- 5. Agregar campos a movimientos_stock para mejor trazabilidad
DO $$ 
BEGIN
    -- Campo para tipo de unidad en movimiento
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'movimientos_stock' 
                   AND column_name = 'tipo_unidad_movimiento') THEN
        ALTER TABLE movimientos_stock 
        ADD COLUMN tipo_unidad_movimiento VARCHAR(50) DEFAULT 'unidad';
        COMMENT ON COLUMN movimientos_stock.tipo_unidad_movimiento IS 
        'Tipo de unidad del movimiento: caja o unidad';
    END IF;

    -- Campo para cajas afectadas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'movimientos_stock' 
                   AND column_name = 'cajas_afectadas') THEN
        ALTER TABLE movimientos_stock 
        ADD COLUMN cajas_afectadas INTEGER DEFAULT 0;
        COMMENT ON COLUMN movimientos_stock.cajas_afectadas IS 
        'Número de cajas completas afectadas en el movimiento';
    END IF;

    -- Campo para unidades sueltas afectadas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'movimientos_stock' 
                   AND column_name = 'unidades_sueltas_afectadas') THEN
        ALTER TABLE movimientos_stock 
        ADD COLUMN unidades_sueltas_afectadas INTEGER DEFAULT 0;
        COMMENT ON COLUMN movimientos_stock.unidades_sueltas_afectadas IS 
        'Número de unidades sueltas afectadas en el movimiento';
    END IF;
END $$;

-- 6. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_stock_items_fraccionables 
ON stock_items(permite_fraccionamiento) WHERE permite_fraccionamiento = true;

CREATE INDEX IF NOT EXISTS idx_stock_cajas_abiertas_item 
ON stock_cajas_abiertas(stock_item_id);

CREATE INDEX IF NOT EXISTS idx_productos_carga_fraccionables 
ON productos_carga(permite_fraccionamiento) WHERE permite_fraccionamiento = true;

-- 7. Vista para stock disponible con fraccionamiento
CREATE OR REPLACE VIEW v_stock_disponible_fraccionado AS
SELECT 
    si.id,
    si.codigo_item,
    si.nombre,
    si.marca,
    si.modelo,
    si.cajas_completas,
    si.unidades_sueltas,
    si.unidades_por_paquete,
    si.permite_fraccionamiento,
    -- Cálculo de unidades totales disponibles
    (si.cajas_completas * si.unidades_por_paquete) + si.unidades_sueltas AS unidades_totales,
    -- Stock en formato legible
    CASE 
        WHEN si.permite_fraccionamiento THEN
            CASE 
                WHEN si.cajas_completas > 0 AND si.unidades_sueltas > 0 THEN
                    si.cajas_completas || ' caja(s) + ' || si.unidades_sueltas || ' unidad(es)'
                WHEN si.cajas_completas > 0 THEN
                    si.cajas_completas || ' caja(s)'
                ELSE
                    si.unidades_sueltas || ' unidad(es)'
            END
        ELSE
            si.cantidad_actual || ' unidad(es)'
    END AS stock_formato_legible,
    si.estado,
    si.ubicacion_id,
    si.precio,
    si.moneda
FROM stock_items si
WHERE si.estado = 'Disponible';

-- 8. Comentarios adicionales en tablas
COMMENT ON TABLE stock_cajas_abiertas IS 
'Registro de cajas/paquetes que han sido abiertos para venta fraccionada';

COMMENT ON TABLE producto_presentaciones IS 
'Define las diferentes presentaciones de venta de un producto (caja, unidad, etc.)';
