-- ===============================================
-- MIGRACIÓN: Agregar campos para organización por carpetas
-- ===============================================

-- Agregar nuevos campos para organización por carpetas
ALTER TABLE componentes_disponibles 
ADD COLUMN IF NOT EXISTS carpeta_principal VARCHAR(100),
ADD COLUMN IF NOT EXISTS subcarpeta VARCHAR(100),
ADD COLUMN IF NOT EXISTS ruta_carpeta VARCHAR(255),
ADD COLUMN IF NOT EXISTS tipo_destino VARCHAR(20) CHECK (tipo_destino IN ('stock', 'cliente', 'reparacion'));

-- Crear índices para optimizar consultas por carpeta
CREATE INDEX IF NOT EXISTS idx_componentes_carpeta_principal ON componentes_disponibles(carpeta_principal);
CREATE INDEX IF NOT EXISTS idx_componentes_ruta_carpeta ON componentes_disponibles(ruta_carpeta);
CREATE INDEX IF NOT EXISTS idx_componentes_marca_tipo ON componentes_disponibles(marca, tipo_destino);
CREATE INDEX IF NOT EXISTS idx_componentes_tipo_destino ON componentes_disponibles(tipo_destino);

-- Comentarios para documentar los nuevos campos
COMMENT ON COLUMN componentes_disponibles.carpeta_principal IS 'Carpeta principal basada en marca o "Servicio Técnico"';
COMMENT ON COLUMN componentes_disponibles.subcarpeta IS 'Subcarpeta para organización jerárquica (ej: marca dentro de Servicio Técnico)';
COMMENT ON COLUMN componentes_disponibles.ruta_carpeta IS 'Ruta completa de la carpeta (ej: "Ares", "Servicio Técnico/Ares")';
COMMENT ON COLUMN componentes_disponibles.tipo_destino IS 'Tipo de destino original: stock, cliente, reparacion';

-- Actualizar productos existentes con organización básica por marca
UPDATE componentes_disponibles 
SET 
    carpeta_principal = CASE 
        WHEN ubicacion_fisica LIKE '%Servicio Técnico%' THEN 'Servicio Técnico'
        ELSE COALESCE(marca, 'Sin Marca')
    END,
    subcarpeta = CASE 
        WHEN ubicacion_fisica LIKE '%Servicio Técnico%' THEN marca
        ELSE NULL
    END,
    ruta_carpeta = CASE 
        WHEN ubicacion_fisica LIKE '%Servicio Técnico%' THEN 'Servicio Técnico/' || COALESCE(marca, 'Sin Marca')
        ELSE COALESCE(marca, 'Sin Marca')
    END,
    tipo_destino = CASE 
        WHEN ubicacion_fisica LIKE '%Servicio Técnico%' THEN 'reparacion'
        ELSE 'stock'
    END
WHERE carpeta_principal IS NULL;

-- Actualizar ubicaciones físicas para que sean consistentes con la estructura de carpetas
UPDATE componentes_disponibles 
SET ubicacion_fisica = CASE 
    WHEN tipo_destino = 'reparacion' THEN 'Servicio Técnico - Estante ' || COALESCE(marca, 'General')
    ELSE 'Almacén General - Estante ' || COALESCE(marca, 'General')
END
WHERE ubicacion_fisica IS NULL OR ubicacion_fisica = '';

-- Crear función para mantener consistencia automática
CREATE OR REPLACE FUNCTION actualizar_organizacion_carpetas()
RETURNS TRIGGER AS $$
BEGIN
    -- Determinar carpeta principal y subcarpeta basado en marca y tipo_destino
    IF NEW.tipo_destino = 'reparacion' THEN
        NEW.carpeta_principal := 'Servicio Técnico';
        NEW.subcarpeta := COALESCE(NEW.marca, 'Sin Marca');
        NEW.ruta_carpeta := 'Servicio Técnico/' || COALESCE(NEW.marca, 'Sin Marca');
        NEW.ubicacion_fisica := 'Servicio Técnico - Estante ' || COALESCE(NEW.marca, 'General');
    ELSE
        NEW.carpeta_principal := COALESCE(NEW.marca, 'Sin Marca');
        NEW.subcarpeta := NULL;
        NEW.ruta_carpeta := COALESCE(NEW.marca, 'Sin Marca');
        NEW.ubicacion_fisica := 'Almacén General - Estante ' || COALESCE(NEW.marca, 'General');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para mantener consistencia automática
DROP TRIGGER IF EXISTS trigger_actualizar_organizacion_carpetas ON componentes_disponibles;
CREATE TRIGGER trigger_actualizar_organizacion_carpetas
    BEFORE INSERT OR UPDATE ON componentes_disponibles
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_organizacion_carpetas();

-- Crear vista para estadísticas de carpetas
CREATE OR REPLACE VIEW vista_estadisticas_carpetas AS
SELECT 
    carpeta_principal,
    subcarpeta,
    ruta_carpeta,
    tipo_destino,
    COUNT(*) as total_productos,
    SUM(cantidad_disponible) as total_unidades,
    COUNT(CASE WHEN cantidad_disponible <= 5 AND cantidad_disponible > 0 THEN 1 END) as productos_stock_bajo,
    MAX(updated_at) as ultima_actualizacion,
    array_agg(DISTINCT marca) as marcas
FROM componentes_disponibles
WHERE cantidad_disponible > 0
GROUP BY carpeta_principal, subcarpeta, ruta_carpeta, tipo_destino
ORDER BY carpeta_principal, subcarpeta;

COMMENT ON VIEW vista_estadisticas_carpetas IS 'Vista con estadísticas por carpeta para optimizar consultas de UI';;
