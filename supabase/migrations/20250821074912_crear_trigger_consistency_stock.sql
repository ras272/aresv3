-- Trigger para mantener consistencia cuando se eliminan cajas abiertas vacías
CREATE OR REPLACE FUNCTION cleanup_empty_cajas_abiertas()
RETURNS TRIGGER AS $$
BEGIN
    -- Si las unidades restantes llegan a 0, eliminar el registro
    IF NEW.unidades_restantes <= 0 THEN
        DELETE FROM stock_cajas_abiertas WHERE id = NEW.id;
        RETURN NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_empty_cajas
    AFTER UPDATE OF unidades_restantes ON stock_cajas_abiertas
    FOR EACH ROW
    WHEN (NEW.unidades_restantes <= 0)
    EXECUTE FUNCTION cleanup_empty_cajas_abiertas();

-- Trigger para validar que no se permitan valores negativos
CREATE OR REPLACE FUNCTION validate_stock_values()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar cantidad_actual no sea negativa
    IF NEW.cantidad_actual < 0 THEN
        RAISE EXCEPTION 'La cantidad actual no puede ser negativa: %', NEW.cantidad_actual;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_stock_items
    BEFORE UPDATE OF cantidad_actual ON stock_items
    FOR EACH ROW
    EXECUTE FUNCTION validate_stock_values();

-- Trigger para validar unidades restantes en cajas abiertas
CREATE OR REPLACE FUNCTION validate_cajas_abiertas()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar unidades_restantes no sea negativa
    IF NEW.unidades_restantes < 0 THEN
        RAISE EXCEPTION 'Las unidades restantes no pueden ser negativas: %', NEW.unidades_restantes;
    END IF;
    
    -- Validar que no exceda el factor original
    IF NEW.unidades_restantes > NEW.factor_original THEN
        RAISE EXCEPTION 'Las unidades restantes (%) no pueden exceder el factor original (%)', 
            NEW.unidades_restantes, NEW.factor_original;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_cajas_abiertas
    BEFORE INSERT OR UPDATE ON stock_cajas_abiertas
    FOR EACH ROW
    EXECUTE FUNCTION validate_cajas_abiertas();;
