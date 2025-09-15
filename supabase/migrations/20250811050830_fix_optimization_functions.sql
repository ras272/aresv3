-- Eliminar la función problemática
DROP FUNCTION IF EXISTS optimize_database();

-- Crear función de optimización sin VACUUM
CREATE OR REPLACE FUNCTION optimize_database()
RETURNS jsonb AS $$
DECLARE
  cleanup_result jsonb;
  compress_result jsonb;
  stats jsonb;
BEGIN
  -- Ejecutar limpieza
  SELECT cleanup_old_data_with_stats() INTO cleanup_result;
  
  -- Ejecutar compresión
  SELECT compress_large_json_with_stats() INTO compress_result;
  
  -- Obtener estadísticas finales
  stats := jsonb_build_object(
    'cleanup', cleanup_result,
    'compression', compress_result,
    'timestamp', NOW(),
    'status', 'completed'
  );
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Función de limpieza con estadísticas
CREATE OR REPLACE FUNCTION cleanup_old_data_with_stats()
RETURNS jsonb AS $$
DECLARE
  movimientos_deleted integer := 0;
  alertas_deleted integer := 0;
  sesiones_deleted integer := 0;
  actividad_deleted integer := 0;
BEGIN
  -- Limpiar movimientos de stock antiguos
  DELETE FROM movimientos_stock 
  WHERE created_at < NOW() - INTERVAL '2 years';
  GET DIAGNOSTICS movimientos_deleted = ROW_COUNT;
  
  -- Limpiar alertas leídas antiguas
  DELETE FROM alertas_stock 
  WHERE leida = true AND fecha_creacion < NOW() - INTERVAL '6 months';
  GET DIAGNOSTICS alertas_deleted = ROW_COUNT;
  
  -- Limpiar sesiones expiradas
  DELETE FROM user_sessions 
  WHERE logout_at IS NOT NULL AND logout_at < NOW() - INTERVAL '3 months';
  GET DIAGNOSTICS sesiones_deleted = ROW_COUNT;
  
  -- Limpiar actividad de archivos antigua
  DELETE FROM actividad_archivos 
  WHERE created_at < NOW() - INTERVAL '1 year';
  GET DIAGNOSTICS actividad_deleted = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'movimientos_deleted', movimientos_deleted,
    'alertas_deleted', alertas_deleted,
    'sesiones_deleted', sesiones_deleted,
    'actividad_deleted', actividad_deleted,
    'total_deleted', movimientos_deleted + alertas_deleted + sesiones_deleted + actividad_deleted
  );
END;
$$ LANGUAGE plpgsql;

-- Función de compresión con estadísticas
CREATE OR REPLACE FUNCTION compress_large_json_with_stats()
RETURNS jsonb AS $$
DECLARE
  archivos_compressed integer := 0;
  mantenimientos_cleaned integer := 0;
BEGIN
  -- Comprimir metadatos grandes en archivos
  UPDATE archivos 
  SET metadatos = jsonb_strip_nulls(metadatos)
  WHERE length(metadatos::text) > 1000;
  GET DIAGNOSTICS archivos_compressed = ROW_COUNT;
  
  -- Limpiar repuestos utilizados vacíos
  UPDATE mantenimientos 
  SET repuestos_utilizados = '[]'::jsonb
  WHERE repuestos_utilizados = 'null'::jsonb 
     OR repuestos_utilizados = '{}'::jsonb
     OR repuestos_utilizados IS NULL;
  GET DIAGNOSTICS mantenimientos_cleaned = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'archivos_compressed', archivos_compressed,
    'mantenimientos_cleaned', mantenimientos_cleaned,
    'total_optimized', archivos_compressed + mantenimientos_cleaned
  );
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas detalladas
CREATE OR REPLACE FUNCTION get_detailed_stats()
RETURNS jsonb AS $$
DECLARE
  db_size text;
  table_stats jsonb;
  optimization_stats jsonb;
BEGIN
  -- Tamaño de la base de datos
  SELECT pg_size_pretty(pg_database_size(current_database())) INTO db_size;
  
  -- Estadísticas por tabla (top 10)
  SELECT jsonb_agg(
    jsonb_build_object(
      'table_name', schemaname||'.'||tablename,
      'size', pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)),
      'size_bytes', pg_total_relation_size(schemaname||'.'||tablename)
    ) ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
  ) INTO table_stats
  FROM (
    SELECT schemaname, tablename
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    LIMIT 10
  ) t;
  
  -- Estadísticas de optimización
  SELECT jsonb_build_object(
    'old_movements', (SELECT COUNT(*) FROM movimientos_stock WHERE created_at < NOW() - INTERVAL '2 years'),
    'old_alerts', (SELECT COUNT(*) FROM alertas_stock WHERE leida = true AND fecha_creacion < NOW() - INTERVAL '6 months'),
    'expired_sessions', (SELECT COUNT(*) FROM user_sessions WHERE logout_at IS NOT NULL AND logout_at < NOW() - INTERVAL '3 months'),
    'old_activity', (SELECT COUNT(*) FROM actividad_archivos WHERE created_at < NOW() - INTERVAL '1 year')
  ) INTO optimization_stats;
  
  RETURN jsonb_build_object(
    'database_size', db_size,
    'top_tables', table_stats,
    'optimization_candidates', optimization_stats,
    'timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql;;
