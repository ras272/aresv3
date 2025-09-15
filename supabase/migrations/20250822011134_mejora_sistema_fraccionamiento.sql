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
END $$;;
