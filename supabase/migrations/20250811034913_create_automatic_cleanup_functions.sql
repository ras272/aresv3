-- Función para limpiar datos antiguos automáticamente
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Limpiar movimientos de stock muy antiguos (más de 2 años)
  DELETE FROM movimientos_stock 
  WHERE created_at < NOW() - INTERVAL '2 years';
  
  -- Limpiar alertas leídas antiguas (más de 6 meses)
  DELETE FROM alertas_stock 
  WHERE leida = true AND fecha_creacion < NOW() - INTERVAL '6 months';
  
  -- Limpiar sesiones expiradas
  DELETE FROM user_sessions 
  WHERE logout_at IS NOT NULL AND logout_at < NOW() - INTERVAL '3 months';
  
  -- Limpiar actividad de archivos antigua (más de 1 año)
  DELETE FROM actividad_archivos 
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Limpiar versiones de archivo muy antiguas (mantener solo últimas 5)
  DELETE FROM versiones_archivo 
  WHERE id NOT IN (
    SELECT id FROM versiones_archivo v1
    WHERE (
      SELECT COUNT(*) FROM versiones_archivo v2 
      WHERE v2.archivo_id = v1.archivo_id AND v2.version >= v1.version
    ) <= 5
  );
  
  RAISE NOTICE 'Limpieza automática completada';
END;
$$ LANGUAGE plpgsql;

-- Función para comprimir campos JSON grandes
CREATE OR REPLACE FUNCTION compress_large_json()
RETURNS void AS $$
BEGIN
  -- Comprimir metadatos grandes en archivos
  UPDATE archivos 
  SET metadatos = jsonb_strip_nulls(metadatos)
  WHERE length(metadatos::text) > 1000;
  
  -- Limpiar repuestos utilizados vacíos
  UPDATE mantenimientos 
  SET repuestos_utilizados = '[]'::jsonb
  WHERE repuestos_utilizados = 'null'::jsonb OR repuestos_utilizados = '{}'::jsonb;
  
  RAISE NOTICE 'Compresión JSON completada';
END;
$$ LANGUAGE plpgsql;

-- Función combinada de optimización
CREATE OR REPLACE FUNCTION optimize_database()
RETURNS void AS $$
BEGIN
  PERFORM cleanup_old_data();
  PERFORM compress_large_json();
  
  -- VACUUM para recuperar espacio
  VACUUM ANALYZE;
  
  RAISE NOTICE 'Optimización completa de base de datos finalizada';
END;
$$ LANGUAGE plpgsql;;
