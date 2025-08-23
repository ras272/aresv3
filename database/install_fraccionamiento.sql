-- Script de instalación completa del sistema de fraccionamiento
-- Ejecutar en orden para configurar todas las funcionalidades

-- 1. Migración de columnas para fraccionamiento
\i 'database/migrations/add_fraccionamiento_to_stock_items.sql'

-- 2. Función principal de ingreso fraccionado
\i 'database/functions/procesar_ingreso_fraccionado.sql'

-- 3. Funciones auxiliares de fraccionamiento
\i 'database/functions/funciones_fraccionamiento.sql'

-- 4. Verificaciones finales
DO $$
BEGIN
    -- Verificar que las columnas existen
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stock_items' 
        AND column_name = 'cajas_completas'
    ) THEN
        RAISE EXCEPTION 'Error: Columna cajas_completas no existe en stock_items';
    END IF;

    -- Verificar que las funciones existen
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'procesar_ingreso_fraccionado'
        AND routine_type = 'FUNCTION'
    ) THEN
        RAISE EXCEPTION 'Error: Función procesar_ingreso_fraccionado no existe';
    END IF;

    -- Verificar que la vista existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'v_stock_disponible_fraccionado'
    ) THEN
        RAISE EXCEPTION 'Error: Vista v_stock_disponible_fraccionado no existe';
    END IF;

    RAISE NOTICE 'Sistema de fraccionamiento instalado correctamente';
END
$$;

-- 5. Datos de prueba (opcional)
INSERT INTO stock_items (
    id,
    codigo_item,
    nombre,
    marca,
    modelo,
    tipo_componente,
    cajas_completas,
    unidades_sueltas,
    unidades_por_paquete,
    cantidad_disponible,
    permite_fraccionamiento,
    ubicacion_fisica,
    precio,
    moneda,
    cantidad_minima,
    estado,
    fecha_ingreso,
    fecha_actualizacion,
    creado_por,
    actualizado_por,
    imagen,
    observaciones
) VALUES 
(
    gen_random_uuid(),
    'TEST-FRAC-001',
    'Paracetamol 500mg',
    'GenericoPharma',
    'GEN-500',
    'Medicamento',
    10, -- 10 cajas
    5,  -- 5 unidades sueltas
    20, -- 20 unidades por caja
    205, -- Total: (10*20) + 5 = 205
    true, -- Permite fraccionamiento
    'Farmacia - Estante A',
    0.50,
    'USD',
    50,
    'Disponible',
    NOW(),
    NOW(),
    'Sistema',
    'Sistema',
    NULL,
    'Producto de prueba para fraccionamiento'
) ON CONFLICT (codigo_item) DO NOTHING;

-- Mostrar resumen final
SELECT 
    'Instalación completa' as status,
    COUNT(*) as productos_con_fraccionamiento
FROM stock_items 
WHERE permite_fraccionamiento = true;
