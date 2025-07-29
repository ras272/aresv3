-- ===============================================
-- MIGRACIÓN: AGREGAR ORGANIZACIÓN POR CARPETAS A COMPONENTES_DISPONIBLES
-- ===============================================

-- Agregar columnas para organización por carpetas
ALTER TABLE componentes_disponibles 
ADD COLUMN IF NOT EXISTS carpeta_principal VARCHAR(200),
ADD COLUMN IF NOT EXISTS subcarpeta VARCHAR(200),
ADD COLUMN IF NOT EXISTS ruta_carpeta TEXT,
ADD COLUMN IF NOT EXISTS tipo_destino VARCHAR(50) DEFAULT 'stock',
ADD COLUMN IF NOT EXISTS tipo_componente VARCHAR(100) DEFAULT 'Componente',
ADD COLUMN IF NOT EXISTS cantidad_original INTEGER DEFAULT 0;

-- Crear índices para las nuevas columnas
CREATE INDEX IF NOT EXISTS idx_componentes_carpeta_principal ON componentes_disponibles(carpeta_principal);
CREATE INDEX IF NOT EXISTS idx_componentes_ruta_carpeta ON componentes_disponibles(ruta_carpeta);
CREATE INDEX IF NOT EXISTS idx_componentes_tipo_destino ON componentes_disponibles(tipo_destino);
CREATE INDEX IF NOT EXISTS idx_componentes_tipo_componente ON componentes_disponibles(tipo_componente);

-- Actualizar registros existentes con valores por defecto
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
    END,
    cantidad_original = COALESCE(cantidad_disponible, 0)
WHERE carpeta_principal IS NULL;

-- Comentarios para documentación
COMMENT ON COLUMN componentes_disponibles.carpeta_principal IS 'Carpeta principal para organización (generalmente la marca)';
COMMENT ON COLUMN componentes_disponibles.subcarpeta IS 'Subcarpeta opcional para organización adicional';
COMMENT ON COLUMN componentes_disponibles.ruta_carpeta IS 'Ruta completa de la carpeta para navegación';
COMMENT ON COLUMN componentes_disponibles.tipo_destino IS 'Tipo de destino: stock, cliente, reparacion';
COMMENT ON COLUMN componentes_disponibles.tipo_componente IS 'Tipo específico del componente para clasificación';
COMMENT ON COLUMN componentes_disponibles.cantidad_original IS 'Cantidad original al momento del ingreso';