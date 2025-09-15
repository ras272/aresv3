-- Corregir trigger para actualizar también cantidad_actual
BEGIN;

-- Actualizar la función del trigger para manejar cantidad_actual
CREATE OR REPLACE FUNCTION actualizar_cantidad_disponible()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Si el producto permite fraccionamiento, calcular basado en cajas y unidades sueltas
    IF COALESCE(NEW.permite_fraccionamiento, false) THEN
        NEW.cantidaddisponible := (COALESCE(NEW.cajas_completas, 0) * COALESCE(NEW.unidades_por_paquete, 1)) + COALESCE(NEW.unidades_sueltas, 0);
        
        -- NUEVO: También actualizar cantidad_actual para compatibilidad con vistas existentes
        NEW.cantidad_actual := NEW.cantidaddisponible;
    END IF;
    
    RETURN NEW;
END;
$$;

-- El trigger ya existe, pero vamos a recrearlo para asegurar que funciona correctamente
DROP TRIGGER IF EXISTS trg_actualizar_cantidad_disponible ON stock_items;
CREATE TRIGGER trg_actualizar_cantidad_disponible
    BEFORE INSERT OR UPDATE OF cajas_completas, unidades_sueltas, unidades_por_paquete, permite_fraccionamiento
    ON stock_items
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_cantidad_disponible();

COMMIT;;
