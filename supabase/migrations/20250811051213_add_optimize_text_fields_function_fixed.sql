-- Función para optimizar campos de texto eliminando espacios innecesarios
CREATE OR REPLACE FUNCTION optimize_text_fields()
RETURNS JSON AS $$
DECLARE
    mantenimientos_count INTEGER;
    equipos_count INTEGER;
    mercaderias_count INTEGER;
    total_count INTEGER;
    result JSON;
BEGIN
    -- Optimizar campos de texto en mantenimientos
    UPDATE mantenimientos 
    SET 
        descripcion = TRIM(descripcion),
        comentarios = TRIM(comentarios)
    WHERE 
        (descripcion IS NOT NULL AND descripcion != TRIM(descripcion))
        OR (comentarios IS NOT NULL AND comentarios != TRIM(comentarios));
    
    GET DIAGNOSTICS mantenimientos_count = ROW_COUNT;
    
    -- Optimizar campos de texto en equipos
    UPDATE equipos 
    SET observaciones = TRIM(observaciones)
    WHERE observaciones IS NOT NULL AND observaciones != TRIM(observaciones);
    
    GET DIAGNOSTICS equipos_count = ROW_COUNT;
    
    -- Optimizar campos de texto en mercaderias
    UPDATE mercaderias 
    SET 
        descripcion = TRIM(descripcion),
        observaciones = TRIM(observaciones)
    WHERE 
        (descripcion IS NOT NULL AND descripcion != TRIM(descripcion))
        OR (observaciones IS NOT NULL AND observaciones != TRIM(observaciones));
    
    GET DIAGNOSTICS mercaderias_count = ROW_COUNT;
    
    -- Calcular total
    total_count := mantenimientos_count + equipos_count + mercaderias_count;
    
    -- Construir resultado
    result := json_build_object(
        'optimized_count', total_count,
        'mantenimientos_optimized', mantenimientos_count,
        'equipos_optimized', equipos_count,
        'mercaderias_optimized', mercaderias_count,
        'status', 'completed',
        'timestamp', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;;
