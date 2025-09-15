-- Parte 2: VISTA Y TRIGGER (Versión Simplificada)

BEGIN;

-- Eliminar vista existente si hay conflictos
DROP VIEW IF EXISTS v_stock_disponible_fraccionado;

-- Crear vista para stock con formato legible incluyendo fraccionamiento
CREATE VIEW v_stock_disponible_fraccionado AS
SELECT 
    si.id,
    si.codigo_item,
    si.nombre,
    si.marca,
    si.modelo,
    si.cantidad_actual,
    si.cajas_completas,
    si.unidades_sueltas,
    si.unidades_por_paquete,
    si.permite_fraccionamiento,
    si.cantidaddisponible,
    si.estado,
    si.ubicacion_id,
    si.precio,
    si.moneda,
    -- Stock en formato legible
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
            COALESCE(si.cantidaddisponible, 0) || ' unidades'
    END as stock_formato_legible,
    -- Unidades totales calculadas
    CASE 
        WHEN COALESCE(si.permite_fraccionamiento, false) THEN
            (COALESCE(si.cajas_completas, 0) * COALESCE(si.unidades_por_paquete, 1)) + COALESCE(si.unidades_sueltas, 0)
        ELSE
            COALESCE(si.cantidaddisponible, 0)
    END as unidades_totales,
    -- Estado del stock
    CASE 
        WHEN COALESCE(si.cantidaddisponible, 0) = 0 THEN 'Sin stock'
        WHEN COALESCE(si.cantidaddisponible, 0) <= COALESCE(si.cantidad_minima, 5) THEN 'Stock bajo'
        ELSE 'Disponible'
    END as estado_stock
FROM stock_items si
WHERE COALESCE(si.estado::text, 'Disponible') = 'Disponible'
ORDER BY si.nombre, si.marca;

-- Crear función para actualizar cantidaddisponible basada en fraccionamiento
CREATE OR REPLACE FUNCTION actualizar_cantidad_disponible()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Si el producto permite fraccionamiento, calcular basado en cajas y unidades sueltas
    IF COALESCE(NEW.permite_fraccionamiento, false) THEN
        NEW.cantidaddisponible := (COALESCE(NEW.cajas_completas, 0) * COALESCE(NEW.unidades_por_paquete, 1)) + COALESCE(NEW.unidades_sueltas, 0);
    END IF;
    
    RETURN NEW;
END;
$$;

-- Crear trigger para actualizar automáticamente cantidaddisponible
DROP TRIGGER IF EXISTS trg_actualizar_cantidad_disponible ON stock_items;
CREATE TRIGGER trg_actualizar_cantidad_disponible
    BEFORE INSERT OR UPDATE OF cajas_completas, unidades_sueltas, unidades_por_paquete, permite_fraccionamiento
    ON stock_items
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_cantidad_disponible();

COMMIT;;
