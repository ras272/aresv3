-- ===============================================
-- MIGRACIÓN: Agregar campos de definición de precios a catalogo_productos
-- Fecha: 2025-09-14
-- Descripción: Añade campos para manejar la definición de precios de productos
-- ===============================================

BEGIN;

-- Agregar columnas de definición de precios a catalogo_productos
ALTER TABLE public.catalogo_productos 
ADD COLUMN IF NOT EXISTS precio_base NUMERIC(12,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS moneda_base VARCHAR(3) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS factor_conversion NUMERIC(10,4) DEFAULT 1.0000,
ADD COLUMN IF NOT EXISTS costo_flete NUMERIC(12,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS costo_transporte NUMERIC(12,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS otros_costos NUMERIC(12,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS margen_utilidad NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS iva_percent NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS precio_venta_neto NUMERIC(12,4),
ADD COLUMN IF NOT EXISTS precio_final_lista NUMERIC(12,4);

-- Agregar comentarios descriptivos
COMMENT ON COLUMN public.catalogo_productos.precio_base IS 'Precio base del producto en la moneda especificada';
COMMENT ON COLUMN public.catalogo_productos.moneda_base IS 'Moneda del precio base';
COMMENT ON COLUMN public.catalogo_productos.factor_conversion IS 'Factor de conversión de moneda (ej: EUR->USD)';
COMMENT ON COLUMN public.catalogo_productos.costo_flete IS 'Costo de flete asociado al producto';
COMMENT ON COLUMN public.catalogo_productos.costo_transporte IS 'Costo de transporte asociado al producto';
COMMENT ON COLUMN public.catalogo_productos.otros_costos IS 'Otros costos asociados al producto';
COMMENT ON COLUMN public.catalogo_productos.margen_utilidad IS 'Margen de utilidad aplicado al producto (%)';
COMMENT ON COLUMN public.catalogo_productos.iva_percent IS 'Porcentaje de IVA aplicado al producto';
COMMENT ON COLUMN public.catalogo_productos.precio_venta_neto IS 'Precio de venta neto calculado';
COMMENT ON COLUMN public.catalogo_productos.precio_final_lista IS 'Precio final de lista con IVA';

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_catalogo_precios_base ON catalogo_productos(precio_base);
CREATE INDEX IF NOT EXISTS idx_catalogo_precios_venta ON catalogo_productos(precio_venta_neto);
CREATE INDEX IF NOT EXISTS idx_catalogo_precios_final ON catalogo_productos(precio_final_lista);

-- Crear tabla para historial de precios
CREATE TABLE IF NOT EXISTS historial_precios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES catalogo_productos(id) ON DELETE CASCADE,
    precio_base NUMERIC(12,4),
    moneda_base VARCHAR(3),
    factor_conversion NUMERIC(10,4),
    costo_flete NUMERIC(12,4),
    costo_transporte NUMERIC(12,4),
    otros_costos NUMERIC(12,4),
    margen_utilidad NUMERIC(5,2),
    iva_percent NUMERIC(5,2),
    precio_venta_neto NUMERIC(12,4),
    precio_final_lista NUMERIC(12,4),
    usuario_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para historial_precios
CREATE INDEX IF NOT EXISTS idx_historial_precios_producto ON historial_precios(producto_id);
CREATE INDEX IF NOT EXISTS idx_historial_precios_fecha ON historial_precios(created_at);

-- Crear función para insertar en historial de precios
CREATE OR REPLACE FUNCTION registrar_historial_precio()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO historial_precios (
        producto_id,
        precio_base,
        moneda_base,
        factor_conversion,
        costo_flete,
        costo_transporte,
        otros_costos,
        margen_utilidad,
        iva_percent,
        precio_venta_neto,
        precio_final_lista,
        usuario_id
    ) VALUES (
        NEW.id,
        NEW.precio_base,
        NEW.moneda_base,
        NEW.factor_conversion,
        NEW.costo_flete,
        NEW.costo_transporte,
        NEW.otros_costos,
        NEW.margen_utilidad,
        NEW.iva_percent,
        NEW.precio_venta_neto,
        NEW.precio_final_lista,
        NULL -- En una implementación real, aquí iría el ID del usuario actual
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para registrar cambios en precios
-- Solo se ejecuta cuando cambian campos relacionados con precios
CREATE OR REPLACE TRIGGER trigger_registrar_historial_precio
    AFTER UPDATE OF 
        precio_base, 
        moneda_base, 
        factor_conversion, 
        costo_flete, 
        costo_transporte, 
        otros_costos, 
        margen_utilidad, 
        iva_percent,
        precio_venta_neto,
        precio_final_lista
    ON catalogo_productos
    FOR EACH ROW
    WHEN (
        OLD.precio_base IS DISTINCT FROM NEW.precio_base OR
        OLD.moneda_base IS DISTINCT FROM NEW.moneda_base OR
        OLD.factor_conversion IS DISTINCT FROM NEW.factor_conversion OR
        OLD.costo_flete IS DISTINCT FROM NEW.costo_flete OR
        OLD.costo_transporte IS DISTINCT FROM NEW.costo_transporte OR
        OLD.otros_costos IS DISTINCT FROM NEW.otros_costos OR
        OLD.margen_utilidad IS DISTINCT FROM NEW.margen_utilidad OR
        OLD.iva_percent IS DISTINCT FROM NEW.iva_percent OR
        OLD.precio_venta_neto IS DISTINCT FROM NEW.precio_venta_neto OR
        OLD.precio_final_lista IS DISTINCT FROM NEW.precio_final_lista
    )
    EXECUTE FUNCTION registrar_historial_precio();

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Migración de definición de precios completada exitosamente';
    RAISE NOTICE '📦 Columnas agregadas a catalogo_productos';
    RAISE NOTICE '🔍 Índices creados para optimizar consultas de precios';
    RAISE NOTICE '📊 Tabla historial_precios disponible';
    RAISE NOTICE '🛡️ Trigger para historial de precios implementado';
END $$;

COMMIT;