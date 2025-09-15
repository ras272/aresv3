-- ===============================================
-- MIGRACIÓN: Eliminación del Sistema de Cartuchos
-- Fecha: 2025-01-15
-- Descripción: Elimina todas las referencias al sistema de cartuchos HIFU
-- ===============================================

-- Eliminar tabla de conocimiento específico de cartuchos
DROP TABLE IF EXISTS ia_conocimiento_cartuchos CASCADE;

-- Actualizar referencias de cartuchos en componentes_disponibles
UPDATE componentes_disponibles 
SET 
    tipo_componente = CASE 
        WHEN tipo_componente = 'Cartucho' THEN 'Transductor'
        ELSE tipo_componente
    END,
    nombre = REPLACE(REPLACE(nombre, 'Cartucho', 'Transductor'), 'cartucho', 'transductor')
WHERE tipo_componente = 'Cartucho' OR nombre ILIKE '%cartucho%';

-- Actualizar referencias en productos_carga
UPDATE productos_carga 
SET 
    producto = REPLACE(REPLACE(producto, 'Cartuchos', 'Transductores'), 'Cartucho', 'Transductor'),
    observaciones = REPLACE(REPLACE(observaciones, 'Cartuchos', 'Transductores'), 'cartucho', 'transductor')
WHERE producto ILIKE '%cartucho%' OR observaciones ILIKE '%cartucho%';

-- Actualizar referencias en la migración de organización de carpetas
UPDATE componentes_disponibles 
SET tipo_componente = 'Transductor'
WHERE tipo_componente = 'Cartucho';

-- Limpiar conversaciones de IA relacionadas con cartuchos
UPDATE ia_conversaciones 
SET 
    consulta = REPLACE(REPLACE(consulta, 'cartucho', 'componente'), 'Cartucho', 'Componente'),
    respuesta = REPLACE(REPLACE(respuesta, 'cartucho', 'componente'), 'Cartucho', 'Componente')
WHERE consulta ILIKE '%cartucho%' OR respuesta ILIKE '%cartucho%';

-- Limpiar patrones aprendidos relacionados con cartuchos
UPDATE ia_patrones_aprendidos 
SET 
    patron = REPLACE(REPLACE(patron, 'cartucho', 'componente'), 'Cartucho', 'Componente'),
    descripcion = REPLACE(REPLACE(descripcion, 'cartucho', 'componente'), 'Cartucho', 'Componente')
WHERE patron ILIKE '%cartucho%' OR descripcion ILIKE '%cartucho%';

-- Actualizar contexto de memoria de IA
UPDATE ia_patrones_aprendidos 
SET contexto_origen = 'componente_consulta'
WHERE contexto_origen = 'cartucho_consulta';

-- Crear vista para verificar la limpieza
CREATE OR REPLACE VIEW cartuchos_cleanup_verification AS
SELECT 
    'componentes_disponibles' as tabla,
    COUNT(*) as registros_con_cartucho
FROM componentes_disponibles 
WHERE nombre ILIKE '%cartucho%' OR tipo_componente ILIKE '%cartucho%'

UNION ALL

SELECT 
    'productos_carga' as tabla,
    COUNT(*) as registros_con_cartucho
FROM productos_carga 
WHERE producto ILIKE '%cartucho%' OR observaciones ILIKE '%cartucho%'

UNION ALL

SELECT 
    'ia_conversaciones' as tabla,
    COUNT(*) as registros_con_cartucho
FROM ia_conversaciones 
WHERE consulta ILIKE '%cartucho%' OR respuesta ILIKE '%cartucho%'

UNION ALL

SELECT 
    'ia_patrones_aprendidos' as tabla,
    COUNT(*) as registros_con_cartucho
FROM ia_patrones_aprendidos 
WHERE patron ILIKE '%cartucho%' OR descripcion ILIKE '%cartucho%';

-- Comentario sobre la vista
COMMENT ON VIEW cartuchos_cleanup_verification IS 'Vista para verificar que se eliminaron todas las referencias a cartuchos';

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Migración de eliminación del sistema de cartuchos completada';
    RAISE NOTICE '🗑️ Tabla ia_conocimiento_cartuchos eliminada';
    RAISE NOTICE '🔄 Referencias de cartuchos actualizadas a transductores';
    RAISE NOTICE '🧹 Conversaciones y patrones de IA limpiados';
    RAISE NOTICE '📊 Vista de verificación creada: cartuchos_cleanup_verification';
    RAISE NOTICE '⚠️ Verificar que no queden referencias ejecutando: SELECT * FROM cartuchos_cleanup_verification;';
END $$;