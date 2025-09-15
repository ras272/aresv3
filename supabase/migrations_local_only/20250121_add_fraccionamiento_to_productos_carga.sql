-- ===============================================
-- MIGRACIÓN: Agregar campos de fraccionamiento a productos_carga
-- Fecha: 2025-01-21
-- Descripción: Añade campos para manejar productos con unidades fraccionables
-- ===============================================

-- 1. Agregar columnas de fraccionamiento a productos_carga
ALTER TABLE public.productos_carga 
ADD COLUMN unidades_por_paquete INTEGER DEFAULT 1 CHECK (unidades_por_paquete > 0),
ADD COLUMN permite_fraccionamiento BOOLEAN DEFAULT FALSE,
ADD COLUMN unidades_sueltas INTEGER DEFAULT 0 CHECK (unidades_sueltas >= 0);

-- 2. Agregar comentarios descriptivos
COMMENT ON COLUMN public.productos_carga.unidades_por_paquete IS 'Número de unidades individuales contenidas en cada paquete/caja';
COMMENT ON COLUMN public.productos_carga.permite_fraccionamiento IS 'Indica si el producto puede venderse por unidades individuales (no solo por paquetes completos)';
COMMENT ON COLUMN public.productos_carga.unidades_sueltas IS 'Número de unidades sueltas disponibles (fuera de paquetes completos)';

-- 3. Crear índices para mejorar rendimiento
CREATE INDEX idx_productos_permite_fraccionamiento ON productos_carga(permite_fraccionamiento) WHERE permite_fraccionamiento = TRUE;
CREATE INDEX idx_productos_unidades_sueltas ON productos_carga(unidades_sueltas) WHERE unidades_sueltas > 0;

-- 4. Actualizar datos existentes (establecer valores por defecto)
UPDATE public.productos_carga 
SET 
    unidades_por_paquete = 1,
    permite_fraccionamiento = FALSE,
    unidades_sueltas = 0
WHERE 
    unidades_por_paquete IS NULL 
    OR permite_fraccionamiento IS NULL 
    OR unidades_sueltas IS NULL;

-- 5. Crear función para calcular unidades totales disponibles
CREATE OR REPLACE FUNCTION calcular_unidades_totales(p_cantidad INTEGER, p_unidades_por_paquete INTEGER, p_unidades_sueltas INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN (p_cantidad * p_unidades_por_paquete) + p_unidades_sueltas;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calcular_unidades_totales IS 'Calcula el total de unidades individuales disponibles considerando paquetes y unidades sueltas';

-- 6. Crear vista para productos fraccionables
CREATE OR REPLACE VIEW productos_fraccionables AS
SELECT 
    pc.*,
    cm.codigo_carga,
    cm.fecha_ingreso,
    calcular_unidades_totales(pc.cantidad, pc.unidades_por_paquete, pc.unidades_sueltas) as total_unidades_disponibles,
    CASE 
        WHEN pc.permite_fraccionamiento THEN 'Fraccionable'
        ELSE 'Solo paquetes completos'
    END as tipo_venta
FROM productos_carga pc
JOIN cargas_mercaderia cm ON pc.carga_id = cm.id
WHERE pc.permite_fraccionamiento = TRUE;

COMMENT ON VIEW productos_fraccionables IS 'Vista que muestra todos los productos que permiten venta fraccionada con información consolidada';

-- 7. Crear función de validación para fraccionamiento
CREATE OR REPLACE FUNCTION validar_fraccionamiento()
RETURNS TRIGGER AS $$
BEGIN
    -- Si permite fraccionamiento, debe tener al menos 1 unidad por paquete
    IF NEW.permite_fraccionamiento = TRUE AND NEW.unidades_por_paquete < 1 THEN
        RAISE EXCEPTION 'Los productos fraccionables deben tener al menos 1 unidad por paquete';
    END IF;
    
    -- Las unidades sueltas no pueden exceder el total de unidades en paquetes
    IF NEW.unidades_sueltas > (NEW.cantidad * NEW.unidades_por_paquete) THEN
        RAISE EXCEPTION 'Las unidades sueltas (%) no pueden exceder el total de unidades en paquetes (%)', 
            NEW.unidades_sueltas, (NEW.cantidad * NEW.unidades_por_paquete);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Crear trigger de validación
CREATE TRIGGER trigger_validar_fraccionamiento
    BEFORE INSERT OR UPDATE ON productos_carga
    FOR EACH ROW EXECUTE FUNCTION validar_fraccionamiento();

-- 9. Crear función para obtener estadísticas de fraccionamiento
CREATE OR REPLACE FUNCTION estadisticas_fraccionamiento()
RETURNS TABLE(
    total_productos BIGINT,
    productos_fraccionables BIGINT,
    porcentaje_fraccionables NUMERIC(5,2),
    total_unidades_sueltas BIGINT,
    productos_con_unidades_sueltas BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_productos,
        COUNT(*) FILTER (WHERE permite_fraccionamiento = TRUE)::BIGINT as productos_fraccionables,
        ROUND(
            (COUNT(*) FILTER (WHERE permite_fraccionamiento = TRUE) * 100.0 / NULLIF(COUNT(*), 0)), 
            2
        ) as porcentaje_fraccionables,
        SUM(unidades_sueltas)::BIGINT as total_unidades_sueltas,
        COUNT(*) FILTER (WHERE unidades_sueltas > 0)::BIGINT as productos_con_unidades_sueltas
    FROM productos_carga;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION estadisticas_fraccionamiento IS 'Proporciona estadísticas sobre el uso del sistema de fraccionamiento';

-- 10. Verificar la estructura actualizada
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'productos_carga' 
  AND table_schema = 'public'
  AND column_name IN ('unidades_por_paquete', 'permite_fraccionamiento', 'unidades_sueltas')
ORDER BY ordinal_position;

-- 11. Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Migración de fraccionamiento completada exitosamente';
    RAISE NOTICE '📦 Columnas agregadas: unidades_por_paquete, permite_fraccionamiento, unidades_sueltas';
    RAISE NOTICE '🔍 Índices creados para optimizar consultas de productos fraccionables';
    RAISE NOTICE '🛡️ Triggers de validación implementados';
    RAISE NOTICE '📊 Vista productos_fraccionables disponible';
    RAISE NOTICE '📈 Función estadisticas_fraccionamiento() disponible';
    RAISE NOTICE '🔧 Función calcular_unidades_totales() disponible';
    RAISE NOTICE '⚠️ Ejecutar SELECT * FROM estadisticas_fraccionamiento(); para ver estadísticas';
END $$;
