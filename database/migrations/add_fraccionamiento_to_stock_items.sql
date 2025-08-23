-- Migración: Agregar soporte para fraccionamiento en stock_items
-- Fecha: 2025-01-22
-- Descripción: Agrega columnas para manejo de cajas, unidades sueltas y fraccionamiento

BEGIN;

-- Agregar columnas para fraccionamiento si no existen
ALTER TABLE stock_items 
ADD COLUMN IF NOT EXISTS cajas_completas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unidades_sueltas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unidades_por_paquete INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS permite_fraccionamiento BOOLEAN DEFAULT false;

-- Agregar restricciones
ALTER TABLE stock_items 
ADD CONSTRAINT IF NOT EXISTS chk_cajas_completas_no_negative 
    CHECK (cajas_completas >= 0);

ALTER TABLE stock_items 
ADD CONSTRAINT IF NOT EXISTS chk_unidades_sueltas_no_negative 
    CHECK (unidades_sueltas >= 0);

ALTER TABLE stock_items 
ADD CONSTRAINT IF NOT EXISTS chk_unidades_por_paquete_positive 
    CHECK (unidades_por_paquete > 0);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_stock_items_fraccionamiento 
    ON stock_items (permite_fraccionamiento);

CREATE INDEX IF NOT EXISTS idx_stock_items_cajas_sueltas 
    ON stock_items (cajas_completas, unidades_sueltas);

-- Actualizar productos existentes que no tienen fraccionamiento
UPDATE stock_items 
SET 
    cajas_completas = 0,
    unidades_sueltas = COALESCE(cantidad_disponible, 0),
    unidades_por_paquete = 1,
    permite_fraccionamiento = false
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
        WHEN si.permite_fraccionamiento THEN
            CASE 
                WHEN si.cajas_completas > 0 AND si.unidades_sueltas > 0 THEN
                    si.cajas_completas || ' cajas + ' || si.unidades_sueltas || ' unidades sueltas'
                WHEN si.cajas_completas > 0 THEN
                    si.cajas_completas || ' cajas (' || si.unidades_por_paquete || ' u/caja)'
                WHEN si.unidades_sueltas > 0 THEN
                    si.unidades_sueltas || ' unidades sueltas'
                ELSE
                    '0 unidades'
            END
        ELSE
            COALESCE(si.cantidad_disponible, 0) || ' unidades'
    END as stock_formato_legible,
    CASE 
        WHEN si.permite_fraccionamiento THEN
            (si.cajas_completas * si.unidades_por_paquete) + si.unidades_sueltas
        ELSE
            COALESCE(si.cantidad_disponible, 0)
    END as unidades_totales,
    CASE 
        WHEN si.cantidad_disponible = 0 THEN 'Sin stock'
        WHEN si.cantidad_disponible <= COALESCE(si.cantidad_minima, 5) THEN 'Stock bajo'
        ELSE 'Disponible'
    END as estado
FROM stock_items si
WHERE si.estado = 'Disponible'
ORDER BY si.nombre, si.marca;

-- Crear función para actualizar cantidad_disponible basada en fraccionamiento
CREATE OR REPLACE FUNCTION actualizar_cantidad_disponible()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Si el producto permite fraccionamiento, calcular basado en cajas y unidades sueltas
    IF NEW.permite_fraccionamiento THEN
        NEW.cantidad_disponible := (NEW.cajas_completas * NEW.unidades_por_paquete) + NEW.unidades_sueltas;
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

-- Comentarios
COMMENT ON COLUMN stock_items.cajas_completas IS 'Número de cajas completas disponibles';
COMMENT ON COLUMN stock_items.unidades_sueltas IS 'Número de unidades sueltas (fuera de cajas)';
COMMENT ON COLUMN stock_items.unidades_por_paquete IS 'Número de unidades por caja/paquete';
COMMENT ON COLUMN stock_items.permite_fraccionamiento IS 'Indica si el producto puede ser fraccionado (venta por unidades)';

COMMENT ON VIEW v_stock_disponible_fraccionado IS 'Vista con información completa de stock incluyendo fraccionamiento';

COMMIT;
