-- ===============================================
-- MIGRACIÓN: CORREGIR PROCESAMIENTO DE ORGANIZACIÓN POR CARPETAS
-- ===============================================

-- Actualizar registros existentes que no tienen carpeta asignada
UPDATE componentes_disponibles 
SET 
    carpeta_principal = COALESCE(marca, 'Sin Marca'),
    ruta_carpeta = COALESCE(marca, 'Sin Marca'),
    tipo_destino = 'stock',
    tipo_componente = CASE 
        WHEN nombre ILIKE '%pieza de mano%' OR nombre ILIKE '%handpiece%' THEN 'Pieza de mano'
        WHEN nombre ILIKE '%cartucho%' OR nombre ILIKE '%cartridge%' THEN 'Cartucho'
        WHEN nombre ILIKE '%transductor%' OR nombre ILIKE '%transducer%' THEN 'Transductor'
        WHEN nombre ILIKE '%cable%' THEN 'Cable'
        WHEN nombre ILIKE '%sensor%' THEN 'Sensor'
        WHEN nombre ILIKE '%aplicador%' THEN 'Aplicador'
        WHEN nombre ILIKE '%punta%' OR nombre ILIKE '%tip%' THEN 'Punta/Tip'
        ELSE 'Componente'
    END
WHERE carpeta_principal IS NULL OR carpeta_principal = '';

-- Crear función para debug de errores de carpeta
CREATE OR REPLACE FUNCTION debug_folder_processing()
RETURNS TABLE (
    total_componentes INTEGER,
    sin_carpeta INTEGER,
    con_carpeta INTEGER,
    marcas_disponibles TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_componentes,
        COUNT(CASE WHEN carpeta_principal IS NULL OR carpeta_principal = '' THEN 1 END)::INTEGER as sin_carpeta,
        COUNT(CASE WHEN carpeta_principal IS NOT NULL AND carpeta_principal != '' THEN 1 END)::INTEGER as con_carpeta,
        ARRAY_AGG(DISTINCT marca ORDER BY marca) as marcas_disponibles
    FROM componentes_disponibles;
END;
$$ LANGUAGE plpgsql;;
