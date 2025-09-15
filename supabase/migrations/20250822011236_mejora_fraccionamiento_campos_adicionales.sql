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
END $$;;
