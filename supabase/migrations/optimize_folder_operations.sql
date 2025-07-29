-- ===============================================
-- MIGRACIÓN: OPTIMIZACIÓN DE OPERACIONES DE CARPETAS
-- ===============================================

-- Agregar columnas de carpeta si no existen
DO $$ 
BEGIN
    -- Verificar y agregar columnas de organización por carpetas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'componentes_disponibles' AND column_name = 'carpeta_principal') THEN
        ALTER TABLE componentes_disponibles ADD COLUMN carpeta_principal VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'componentes_disponibles' AND column_name = 'subcarpeta') THEN
        ALTER TABLE componentes_disponibles ADD COLUMN subcarpeta VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'componentes_disponibles' AND column_name = 'ruta_carpeta') THEN
        ALTER TABLE componentes_disponibles ADD COLUMN ruta_carpeta VARCHAR(200);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'componentes_disponibles' AND column_name = 'tipo_destino') THEN
        ALTER TABLE componentes_disponibles ADD COLUMN tipo_destino VARCHAR(20) DEFAULT 'stock';
    END IF;
END $$;

-- ===============================================
-- ÍNDICES OPTIMIZADOS PARA OPERACIONES DE CARPETAS
-- ===============================================

-- Índices principales para consultas de carpetas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_componentes_carpeta_principal 
ON componentes_disponibles(carpeta_principal) 
WHERE carpeta_principal IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_componentes_ruta_carpeta 
ON componentes_disponibles(ruta_carpeta) 
WHERE ruta_carpeta IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_componentes_tipo_destino 
ON componentes_disponibles(tipo_destino);

-- Índices compuestos para consultas complejas de carpetas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_componentes_marca_tipo_destino 
ON componentes_disponibles(marca, tipo_destino) 
WHERE marca IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_componentes_carpeta_subcarpeta 
ON componentes_disponibles(carpeta_principal, subcarpeta) 
WHERE carpeta_principal IS NOT NULL;

-- Índice para estadísticas de carpetas (cantidad disponible > 0)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_componentes_carpeta_stock_disponible 
ON componentes_disponibles(carpeta_principal, cantidad_disponible) 
WHERE cantidad_disponible > 0 AND carpeta_principal IS NOT NULL;

-- Índice para búsqueda de texto en carpetas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_componentes_nombre_carpeta 
ON componentes_disponibles(nombre, carpeta_principal) 
WHERE carpeta_principal IS NOT NULL;

-- Índice para consultas de ubicación física y carpeta
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_componentes_ubicacion_carpeta 
ON componentes_disponibles(ubicacion_fisica, ruta_carpeta) 
WHERE ubicacion_fisica IS NOT NULL AND ruta_carpeta IS NOT NULL;

-- ===============================================
-- VISTAS OPTIMIZADAS PARA ESTADÍSTICAS DE CARPETAS
-- ===============================================

-- Vista para estadísticas de carpetas principales
CREATE OR REPLACE VIEW vista_estadisticas_carpetas AS
SELECT 
    carpeta_principal,
    subcarpeta,
    ruta_carpeta,
    tipo_destino,
    COUNT(*) as total_productos,
    SUM(cantidad_disponible) as total_unidades,
    COUNT(CASE WHEN cantidad_disponible <= 5 THEN 1 END) as productos_stock_bajo,
    COUNT(CASE WHEN cantidad_disponible = 0 THEN 1 END) as productos_sin_stock,
    AVG(cantidad_disponible) as promedio_stock,
    MIN(fecha_ingreso) as fecha_primer_ingreso,
    MAX(updated_at) as ultima_actualizacion,
    ARRAY_AGG(DISTINCT marca ORDER BY marca) as marcas_en_carpeta
FROM componentes_disponibles 
WHERE carpeta_principal IS NOT NULL
GROUP BY carpeta_principal, subcarpeta, ruta_carpeta, tipo_destino
ORDER BY carpeta_principal, subcarpeta;

-- Vista para jerarquía de carpetas con conteos
CREATE OR REPLACE VIEW vista_jerarquia_carpetas AS
WITH carpetas_principales AS (
    SELECT 
        carpeta_principal,
        COUNT(*) as total_productos,
        SUM(cantidad_disponible) as total_unidades,
        COUNT(CASE WHEN cantidad_disponible <= 5 THEN 1 END) as productos_stock_bajo
    FROM componentes_disponibles 
    WHERE carpeta_principal IS NOT NULL
    GROUP BY carpeta_principal
),
subcarpetas AS (
    SELECT 
        carpeta_principal,
        subcarpeta,
        COUNT(*) as total_productos,
        SUM(cantidad_disponible) as total_unidades,
        COUNT(CASE WHEN cantidad_disponible <= 5 THEN 1 END) as productos_stock_bajo
    FROM componentes_disponibles 
    WHERE carpeta_principal IS NOT NULL AND subcarpeta IS NOT NULL
    GROUP BY carpeta_principal, subcarpeta
)
SELECT 
    cp.carpeta_principal,
    NULL as subcarpeta,
    'principal' as tipo_carpeta,
    cp.total_productos,
    cp.total_unidades,
    cp.productos_stock_bajo,
    0 as nivel
FROM carpetas_principales cp
UNION ALL
SELECT 
    sc.carpeta_principal,
    sc.subcarpeta,
    'subcarpeta' as tipo_carpeta,
    sc.total_productos,
    sc.total_unidades,
    sc.productos_stock_bajo,
    1 as nivel
FROM subcarpetas sc
ORDER BY carpeta_principal, nivel, subcarpeta;

-- Vista para productos organizados por carpetas (optimizada para UI)
CREATE OR REPLACE VIEW vista_productos_por_carpeta AS
SELECT 
    cd.*,
    CASE 
        WHEN cd.subcarpeta IS NOT NULL THEN cd.carpeta_principal || ' > ' || cd.subcarpeta
        ELSE cd.carpeta_principal
    END as ruta_display,
    CASE 
        WHEN cd.cantidad_disponible = 0 THEN 'sin_stock'
        WHEN cd.cantidad_disponible <= 5 THEN 'stock_bajo'
        WHEN cd.cantidad_disponible <= 10 THEN 'stock_medio'
        ELSE 'stock_normal'
    END as nivel_stock,
    CASE 
        WHEN cd.tipo_destino = 'reparacion' THEN 'Servicio Técnico'
        WHEN cd.tipo_destino = 'cliente' THEN 'Cliente Específico'
        ELSE 'Stock General'
    END as categoria_destino
FROM componentes_disponibles cd
WHERE cd.carpeta_principal IS NOT NULL
ORDER BY cd.carpeta_principal, cd.subcarpeta, cd.nombre;

-- ===============================================
-- FUNCIONES OPTIMIZADAS PARA CONSULTAS DE CARPETAS
-- ===============================================

-- Función para obtener estadísticas de una carpeta específica
CREATE OR REPLACE FUNCTION obtener_estadisticas_carpeta(p_ruta_carpeta TEXT)
RETURNS TABLE (
    total_productos BIGINT,
    total_unidades BIGINT,
    productos_stock_bajo BIGINT,
    productos_sin_stock BIGINT,
    marcas_distintas BIGINT,
    valor_total_estimado NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT,
        SUM(cantidad_disponible)::BIGINT,
        COUNT(CASE WHEN cantidad_disponible <= 5 THEN 1 END)::BIGINT,
        COUNT(CASE WHEN cantidad_disponible = 0 THEN 1 END)::BIGINT,
        COUNT(DISTINCT marca)::BIGINT,
        COALESCE(SUM(cantidad_disponible * COALESCE(precio_unitario, 0)), 0)::NUMERIC
    FROM componentes_disponibles 
    WHERE ruta_carpeta = p_ruta_carpeta;
END;
$$ LANGUAGE plpgsql STABLE;

-- Función para buscar productos en carpetas (optimizada)
CREATE OR REPLACE FUNCTION buscar_productos_en_carpetas(
    p_termino_busqueda TEXT,
    p_carpeta_principal TEXT DEFAULT NULL,
    p_tipo_destino TEXT DEFAULT NULL,
    p_limite INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    nombre TEXT,
    marca VARCHAR,
    modelo VARCHAR,
    cantidad_disponible INTEGER,
    carpeta_principal VARCHAR,
    subcarpeta VARCHAR,
    ruta_carpeta VARCHAR,
    ubicacion_fisica TEXT,
    relevancia REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cd.id,
        cd.nombre,
        cd.marca,
        cd.modelo,
        cd.cantidad_disponible,
        cd.carpeta_principal,
        cd.subcarpeta,
        cd.ruta_carpeta,
        cd.ubicacion_fisica,
        -- Calcular relevancia basada en coincidencias
        (
            CASE WHEN cd.nombre ILIKE '%' || p_termino_busqueda || '%' THEN 3 ELSE 0 END +
            CASE WHEN cd.marca ILIKE '%' || p_termino_busqueda || '%' THEN 2 ELSE 0 END +
            CASE WHEN cd.modelo ILIKE '%' || p_termino_busqueda || '%' THEN 1 ELSE 0 END +
            CASE WHEN cd.numero_serie ILIKE '%' || p_termino_busqueda || '%' THEN 2 ELSE 0 END
        )::REAL as relevancia
    FROM componentes_disponibles cd
    WHERE 
        cd.carpeta_principal IS NOT NULL
        AND (
            cd.nombre ILIKE '%' || p_termino_busqueda || '%' OR
            cd.marca ILIKE '%' || p_termino_busqueda || '%' OR
            cd.modelo ILIKE '%' || p_termino_busqueda || '%' OR
            cd.numero_serie ILIKE '%' || p_termino_busqueda || '%' OR
            cd.observaciones ILIKE '%' || p_termino_busqueda || '%'
        )
        AND (p_carpeta_principal IS NULL OR cd.carpeta_principal = p_carpeta_principal)
        AND (p_tipo_destino IS NULL OR cd.tipo_destino = p_tipo_destino)
        AND cd.cantidad_disponible > 0
    ORDER BY relevancia DESC, cd.nombre
    LIMIT p_limite;
END;
$$ LANGUAGE plpgsql STABLE;

-- Función para obtener jerarquía de carpetas con conteos (caché-friendly)
CREATE OR REPLACE FUNCTION obtener_jerarquia_carpetas_con_cache()
RETURNS TABLE (
    carpeta_principal VARCHAR,
    subcarpeta VARCHAR,
    tipo_carpeta TEXT,
    total_productos BIGINT,
    total_unidades BIGINT,
    productos_stock_bajo BIGINT,
    nivel INTEGER,
    icono TEXT,
    color TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vjc.carpeta_principal,
        vjc.subcarpeta,
        vjc.tipo_carpeta,
        vjc.total_productos,
        vjc.total_unidades,
        vjc.productos_stock_bajo,
        vjc.nivel,
        -- Asignar iconos según tipo de carpeta
        CASE 
            WHEN vjc.carpeta_principal = 'Servicio Técnico' THEN '🔧'
            WHEN vjc.tipo_carpeta = 'subcarpeta' THEN '📁'
            ELSE '📂'
        END as icono,
        -- Asignar colores según estado de stock
        CASE 
            WHEN vjc.productos_stock_bajo > vjc.total_productos * 0.5 THEN '#EF4444'
            WHEN vjc.productos_stock_bajo > 0 THEN '#F59E0B'
            ELSE '#10B981'
        END as color
    FROM vista_jerarquia_carpetas vjc
    ORDER BY vjc.carpeta_principal, vjc.nivel, vjc.subcarpeta;
END;
$$ LANGUAGE plpgsql STABLE;

-- ===============================================
-- TRIGGERS PARA MANTENER CONSISTENCIA DE CARPETAS
-- ===============================================

-- Función para actualizar automáticamente la ruta de carpeta
CREATE OR REPLACE FUNCTION actualizar_ruta_carpeta()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar ruta_carpeta basada en carpeta_principal y subcarpeta
    IF NEW.subcarpeta IS NOT NULL AND NEW.subcarpeta != '' THEN
        NEW.ruta_carpeta := NEW.carpeta_principal || '/' || NEW.subcarpeta;
    ELSE
        NEW.ruta_carpeta := NEW.carpeta_principal;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar ruta automáticamente
DROP TRIGGER IF EXISTS trigger_actualizar_ruta_carpeta ON componentes_disponibles;
CREATE TRIGGER trigger_actualizar_ruta_carpeta
    BEFORE INSERT OR UPDATE OF carpeta_principal, subcarpeta
    ON componentes_disponibles
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_ruta_carpeta();

-- ===============================================
-- CONFIGURACIÓN DE CACHÉ PARA CONSULTAS FRECUENTES
-- ===============================================

-- Crear tabla para caché de estadísticas de carpetas
CREATE TABLE IF NOT EXISTS cache_estadisticas_carpetas (
    id SERIAL PRIMARY KEY,
    ruta_carpeta VARCHAR(200) NOT NULL UNIQUE,
    total_productos INTEGER NOT NULL DEFAULT 0,
    total_unidades INTEGER NOT NULL DEFAULT 0,
    productos_stock_bajo INTEGER NOT NULL DEFAULT 0,
    ultima_actualizacion TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_cache_ruta CHECK (ruta_carpeta IS NOT NULL AND ruta_carpeta != '')
);

-- Índice para el caché
CREATE INDEX IF NOT EXISTS idx_cache_estadisticas_ruta ON cache_estadisticas_carpetas(ruta_carpeta);
CREATE INDEX IF NOT EXISTS idx_cache_estadisticas_actualizacion ON cache_estadisticas_carpetas(ultima_actualizacion);

-- Función para actualizar caché de estadísticas
CREATE OR REPLACE FUNCTION actualizar_cache_estadisticas_carpetas()
RETURNS VOID AS $$
BEGIN
    -- Limpiar caché existente
    DELETE FROM cache_estadisticas_carpetas;
    
    -- Insertar estadísticas actualizadas
    INSERT INTO cache_estadisticas_carpetas (ruta_carpeta, total_productos, total_unidades, productos_stock_bajo)
    SELECT 
        ruta_carpeta,
        total_productos::INTEGER,
        total_unidades::INTEGER,
        productos_stock_bajo::INTEGER
    FROM vista_estadisticas_carpetas
    WHERE ruta_carpeta IS NOT NULL;
    
    -- Log de actualización
    RAISE NOTICE 'Caché de estadísticas de carpetas actualizado: % registros', (SELECT COUNT(*) FROM cache_estadisticas_carpetas);
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- CONFIGURACIÓN DE PERFORMANCE
-- ===============================================

-- Configurar parámetros de performance para consultas de carpetas
ALTER TABLE componentes_disponibles SET (fillfactor = 90);

-- Estadísticas extendidas para el optimizador de consultas
CREATE STATISTICS IF NOT EXISTS stats_carpeta_marca_tipo 
ON carpeta_principal, marca, tipo_destino 
FROM componentes_disponibles;

CREATE STATISTICS IF NOT EXISTS stats_ruta_cantidad_ubicacion 
ON ruta_carpeta, cantidad_disponible, ubicacion_fisica 
FROM componentes_disponibles;

-- Actualizar estadísticas
ANALYZE componentes_disponibles;

-- ===============================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ===============================================

COMMENT ON INDEX idx_componentes_carpeta_principal IS 'Índice principal para consultas por carpeta principal';
COMMENT ON INDEX idx_componentes_ruta_carpeta IS 'Índice para consultas por ruta completa de carpeta';
COMMENT ON INDEX idx_componentes_marca_tipo_destino IS 'Índice compuesto para consultas por marca y tipo de destino';
COMMENT ON INDEX idx_componentes_carpeta_stock_disponible IS 'Índice optimizado para estadísticas de stock por carpeta';

COMMENT ON VIEW vista_estadisticas_carpetas IS 'Vista optimizada para estadísticas de carpetas con métricas de stock';
COMMENT ON VIEW vista_jerarquia_carpetas IS 'Vista jerárquica de carpetas con conteos para navegación UI';
COMMENT ON VIEW vista_productos_por_carpeta IS 'Vista optimizada de productos organizados por carpetas para UI';

COMMENT ON FUNCTION obtener_estadisticas_carpeta(TEXT) IS 'Función optimizada para obtener estadísticas de una carpeta específica';
COMMENT ON FUNCTION buscar_productos_en_carpetas(TEXT, TEXT, TEXT, INTEGER) IS 'Función de búsqueda optimizada con relevancia y filtros de carpeta';
COMMENT ON FUNCTION obtener_jerarquia_carpetas_con_cache() IS 'Función para obtener jerarquía de carpetas con iconos y colores para UI';

COMMENT ON TABLE cache_estadisticas_carpetas IS 'Caché de estadísticas de carpetas para mejorar performance de consultas frecuentes';

-- ===============================================
-- FINALIZACIÓN
-- ===============================================

-- Actualizar caché inicial
SELECT actualizar_cache_estadisticas_carpetas();

-- Log de finalización
DO $$
BEGIN
    RAISE NOTICE 'Migración de optimización de carpetas completada exitosamente';
    RAISE NOTICE 'Índices creados: %', (
        SELECT COUNT(*) 
        FROM pg_indexes 
        WHERE tablename = 'componentes_disponibles' 
        AND indexname LIKE 'idx_componentes_carpeta%'
    );
    RAISE NOTICE 'Vistas creadas: %', (
        SELECT COUNT(*) 
        FROM information_schema.views 
        WHERE table_name LIKE 'vista_%carpeta%'
    );
END $$;