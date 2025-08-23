-- ==================================================
-- 📦 SISTEMA DE FRACCIONAMIENTO CON BADGES DE ESTADO
-- ==================================================
-- Script completo para implementar badges visuales que
-- distinguen entre cajas completas, cajas abiertas y unidades sueltas
-- 
-- Versión: 1.0
-- Fecha: 2025-01-22
-- ==================================================

-- 🔧 PASO 1: Agregar columna estado_caja a stock_items
ALTER TABLE stock_items 
ADD COLUMN IF NOT EXISTS estado_caja VARCHAR(20) DEFAULT 'cajas_completas'
CHECK (estado_caja IN ('cajas_completas', 'caja_abierta', 'solo_unidades', 'sin_stock'));

-- 🔧 PASO 2: Crear función para actualizar estado_caja automáticamente
CREATE OR REPLACE FUNCTION actualizar_estado_caja()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo procesar si permite fraccionamiento
    IF NEW.permite_fraccionamiento = true THEN
        -- Determinar el estado basado en el stock
        IF NEW.cantidaddisponible = 0 THEN
            NEW.estado_caja = 'sin_stock';
        ELSIF NEW.cajas_completas > 0 AND NEW.unidades_sueltas = 0 THEN
            NEW.estado_caja = 'cajas_completas';
        ELSIF NEW.cajas_completas = 0 AND NEW.unidades_sueltas > 0 THEN
            NEW.estado_caja = 'caja_abierta';
        ELSIF NEW.cajas_completas > 0 AND NEW.unidades_sueltas > 0 THEN
            NEW.estado_caja = 'caja_abierta';  -- Hay cajas completas + unidades sueltas
        ELSE
            NEW.estado_caja = 'solo_unidades';
        END IF;
    ELSE
        -- Para productos sin fraccionamiento, usar lógica simple
        IF NEW.cantidaddisponible = 0 THEN
            NEW.estado_caja = 'sin_stock';
        ELSE
            NEW.estado_caja = 'cajas_completas';  -- Unidades normales
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 🔗 PASO 3: Crear trigger para actualizar estado_caja automáticamente
DROP TRIGGER IF EXISTS trigger_actualizar_estado_caja ON stock_items;

CREATE TRIGGER trigger_actualizar_estado_caja
    BEFORE INSERT OR UPDATE OF cantidaddisponible, unidades_sueltas, cajas_completas, permite_fraccionamiento
    ON stock_items
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_estado_caja();

-- 📊 PASO 4: Actualizar la vista v_stock_disponible_fraccionado con badges
DROP VIEW IF EXISTS v_stock_disponible_fraccionado;

CREATE VIEW v_stock_disponible_fraccionado AS
SELECT 
    id,
    codigo_item,
    nombre,
    marca,
    modelo,
    cantidad_actual,
    cajas_completas,
    unidades_sueltas,
    unidades_por_paquete,
    permite_fraccionamiento,
    cantidaddisponible,
    estado_caja,
    estado,
    ubicacion_id,
    precio,
    moneda,
    
    -- Badge de estado con colores y iconos descriptivos
    CASE estado_caja
        WHEN 'cajas_completas' THEN '📦 Cajas Completas'
        WHEN 'caja_abierta' THEN '📭 Caja Abierta'
        WHEN 'solo_unidades' THEN '🔢 Solo Unidades'
        WHEN 'sin_stock' THEN '❌ Sin Stock'
        ELSE '❓ Estado Desconocido'
    END as badge_estado_caja,
    
    -- Descripción detallada del stock
    CASE 
        WHEN NOT permite_fraccionamiento THEN 
            CONCAT(cantidaddisponible, ' unidades')
        WHEN estado_caja = 'cajas_completas' THEN 
            CONCAT(cajas_completas, ' cajas (', cajas_completas * unidades_por_paquete, ' unidades)')
        WHEN estado_caja = 'caja_abierta' AND cajas_completas > 0 THEN 
            CONCAT(
                unidades_sueltas, ' sueltas + ', 
                cajas_completas, ' cajas (', 
                (cajas_completas * unidades_por_paquete), ' unidades)'
            )
        WHEN estado_caja = 'caja_abierta' THEN 
            CONCAT(unidades_sueltas, ' unidades sueltas')
        WHEN estado_caja = 'solo_unidades' THEN 
            CONCAT(unidades_sueltas, ' unidades')
        WHEN estado_caja = 'sin_stock' THEN 
            'Sin stock disponible'
        ELSE 
            CONCAT(cantidaddisponible, ' unidades')
    END as stock_formato_legible,
    
    -- Total de unidades para cálculos
    (COALESCE(cajas_completas, 0) * COALESCE(unidades_por_paquete, 1)) + COALESCE(unidades_sueltas, 0) as unidades_totales,
    
    -- Estado del stock para alertas
    CASE 
        WHEN cantidaddisponible = 0 THEN 'Sin stock'
        WHEN cantidaddisponible <= 5 THEN 'Stock bajo' 
        WHEN cantidaddisponible <= 10 THEN 'Stock medio'
        ELSE 'Stock suficiente'
    END as estado_stock
    
FROM stock_items
WHERE estado IN ('Disponible', 'Reservado')
ORDER BY nombre, marca, modelo;

-- 🔄 PASO 5: Sincronizar estado_caja existente
-- Actualizar todos los productos existentes para que tengan el estado correcto
UPDATE stock_items 
SET cantidaddisponible = cantidaddisponible  -- Esto dispara el trigger
WHERE permite_fraccionamiento = true;

-- 📝 PASO 6: Comentarios informativos
COMMENT ON COLUMN stock_items.estado_caja IS 'Estado visual de las cajas: cajas_completas, caja_abierta, solo_unidades, sin_stock';
COMMENT ON VIEW v_stock_disponible_fraccionado IS 'Vista principal del stock con información de fraccionamiento y badges de estado';
COMMENT ON FUNCTION actualizar_estado_caja() IS 'Función que actualiza automáticamente el estado visual de las cajas según el stock';

-- ==================================================
-- 🧪 PRUEBAS OPCIONALES
-- ==================================================
-- Descomentar las siguientes líneas para hacer pruebas:

/*
-- Ver todos los productos con fraccionamiento y sus badges
SELECT 
    nombre,
    marca,
    estado_caja,
    badge_estado_caja,
    stock_formato_legible,
    unidades_totales
FROM v_stock_disponible_fraccionado
WHERE permite_fraccionamiento = true
ORDER BY nombre;

-- Estadísticas de estados de caja
SELECT 
    estado_caja,
    badge_estado_caja,
    COUNT(*) as cantidad_productos
FROM v_stock_disponible_fraccionado
WHERE permite_fraccionamiento = true
GROUP BY estado_caja, badge_estado_caja
ORDER BY cantidad_productos DESC;
*/

-- ==================================================
-- ✅ INSTALACIÓN COMPLETADA
-- ==================================================
-- El sistema de badges está listo para usar:
-- 
-- 📦 Cajas Completas: Productos con solo cajas cerradas
-- 📭 Caja Abierta: Productos con unidades sueltas (caja abierta)
-- 🔢 Solo Unidades: Productos solo con unidades individuales
-- ❌ Sin Stock: Productos agotados
-- 
-- Las vistas principales mostrarán automáticamente estos badges
-- tanto en Stock Normal como en Stock Fraccionado.
-- ==================================================
