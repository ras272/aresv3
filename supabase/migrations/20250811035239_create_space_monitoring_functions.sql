-- Función para obtener tamaño de la base de datos
CREATE OR REPLACE FUNCTION get_database_size()
RETURNS text AS $$
BEGIN
  RETURN pg_size_pretty(pg_database_size(current_database()));
END;
$$ LANGUAGE plpgsql;

-- Función para obtener tamaño por tabla
CREATE OR REPLACE FUNCTION get_tables_sizes()
RETURNS TABLE(table_name text, size text) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename as table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
  FROM pg_tables 
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de optimización
CREATE OR REPLACE FUNCTION get_optimization_stats()
RETURNS TABLE(
  metric text,
  current_value bigint,
  recommended_action text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Movimientos Stock Antiguos'::text,
    COUNT(*)::bigint,
    CASE 
      WHEN COUNT(*) > 1000 THEN 'Ejecutar limpieza'
      ELSE 'OK'
    END::text
  FROM movimientos_stock 
  WHERE created_at < NOW() - INTERVAL '2 years'
  
  UNION ALL
  
  SELECT 
    'Alertas Leídas Antiguas'::text,
    COUNT(*)::bigint,
    CASE 
      WHEN COUNT(*) > 100 THEN 'Ejecutar limpieza'
      ELSE 'OK'
    END::text
  FROM alertas_stock 
  WHERE leida = true AND fecha_creacion < NOW() - INTERVAL '6 months'
  
  UNION ALL
  
  SELECT 
    'Sesiones Expiradas'::text,
    COUNT(*)::bigint,
    CASE 
      WHEN COUNT(*) > 50 THEN 'Ejecutar limpieza'
      ELSE 'OK'
    END::text
  FROM user_sessions 
  WHERE logout_at IS NOT NULL AND logout_at < NOW() - INTERVAL '3 months';
END;
$$ LANGUAGE plpgsql;;
