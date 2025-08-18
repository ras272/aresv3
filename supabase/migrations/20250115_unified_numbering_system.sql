-- ===============================================
-- MIGRACIÓN: Sistema de Numeración Unificado
-- Fecha: 2025-01-15
-- Descripción: Agrega columnas para el sistema de numeración centralizado
-- ===============================================

-- Agregar columnas para diferentes tipos de números en mantenimientos
ALTER TABLE mantenimientos 
ADD COLUMN IF NOT EXISTS numero_formulario VARCHAR(50),
ADD COLUMN IF NOT EXISTS numero_orden_trabajo VARCHAR(50);

-- Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_mantenimientos_numero_formulario ON mantenimientos(numero_formulario);
CREATE INDEX IF NOT EXISTS idx_mantenimientos_numero_orden_trabajo ON mantenimientos(numero_orden_trabajo);

-- Comentarios sobre las nuevas columnas
COMMENT ON COLUMN mantenimientos.numero_formulario IS 'Número de formulario de asistencia técnica (FORM-YYYYMMDD-XXX)';
COMMENT ON COLUMN mantenimientos.numero_orden_trabajo IS 'Número de orden de trabajo (OT-YYYYMMDD-XXX)';

-- Crear tabla para facturas (si no existe)
CREATE TABLE IF NOT EXISTS facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_factura VARCHAR(50) UNIQUE NOT NULL,
    mantenimiento_id UUID REFERENCES mantenimientos(id) ON DELETE CASCADE,
    cliente_nombre VARCHAR(255) NOT NULL,
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    impuestos DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Pagada', 'Vencida', 'Cancelada')),
    observaciones TEXT,
    archivo_pdf JSONB, -- Para almacenar información del archivo PDF
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para facturas
CREATE INDEX IF NOT EXISTS idx_facturas_numero_factura ON facturas(numero_factura);
CREATE INDEX IF NOT EXISTS idx_facturas_mantenimiento_id ON facturas(mantenimiento_id);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON facturas(estado);
CREATE INDEX IF NOT EXISTS idx_facturas_fecha_emision ON facturas(fecha_emision);

-- Comentarios sobre la tabla facturas
COMMENT ON TABLE facturas IS 'Facturas generadas para servicios técnicos';
COMMENT ON COLUMN facturas.numero_factura IS 'Número único de factura (FACT-YYYYMMDD-XXXX)';

-- Crear tabla para remisiones (si no existe)
CREATE TABLE IF NOT EXISTS remisiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_remision VARCHAR(50) UNIQUE NOT NULL,
    mantenimiento_id UUID REFERENCES mantenimientos(id) ON DELETE CASCADE,
    cliente_nombre VARCHAR(255) NOT NULL,
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo_remision VARCHAR(50) NOT NULL DEFAULT 'Entrega' CHECK (tipo_remision IN ('Entrega', 'Retiro', 'Traslado')),
    descripcion TEXT NOT NULL,
    items JSONB, -- Para almacenar lista de items/repuestos
    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'En tránsito', 'Entregada', 'Cancelada')),
    observaciones TEXT,
    archivo_pdf JSONB, -- Para almacenar información del archivo PDF
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para remisiones
CREATE INDEX IF NOT EXISTS idx_remisiones_numero_remision ON remisiones(numero_remision);
CREATE INDEX IF NOT EXISTS idx_remisiones_mantenimiento_id ON remisiones(mantenimiento_id);
CREATE INDEX IF NOT EXISTS idx_remisiones_estado ON remisiones(estado);
CREATE INDEX IF NOT EXISTS idx_remisiones_fecha_emision ON remisiones(fecha_emision);

-- Comentarios sobre la tabla remisiones
COMMENT ON TABLE remisiones IS 'Remisiones de entrega de repuestos y equipos';
COMMENT ON COLUMN remisiones.numero_remision IS 'Número único de remisión (REM-YYYYMMDD-XXXX)';

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_facturas_updated_at ON facturas;
CREATE TRIGGER update_facturas_updated_at
    BEFORE UPDATE ON facturas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_remisiones_updated_at ON remisiones;
CREATE TRIGGER update_remisiones_updated_at
    BEFORE UPDATE ON remisiones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Función para validar formato de números
CREATE OR REPLACE FUNCTION validate_number_format(number_value TEXT, prefix_expected TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Validar que el número tenga el formato correcto: PREFIX-YYYYMMDD-XXX(X)
    RETURN number_value ~ ('^' || prefix_expected || '-\d{8}-\d{3,4}$');
END;
$$ LANGUAGE plpgsql;

-- Constraints para validar formatos de números
ALTER TABLE mantenimientos 
ADD CONSTRAINT IF NOT EXISTS chk_numero_reporte_format 
CHECK (numero_reporte IS NULL OR validate_number_format(numero_reporte, 'RPT'));

ALTER TABLE mantenimientos 
ADD CONSTRAINT IF NOT EXISTS chk_numero_formulario_format 
CHECK (numero_formulario IS NULL OR validate_number_format(numero_formulario, 'FORM'));

ALTER TABLE mantenimientos 
ADD CONSTRAINT IF NOT EXISTS chk_numero_orden_trabajo_format 
CHECK (numero_orden_trabajo IS NULL OR validate_number_format(numero_orden_trabajo, 'OT'));

ALTER TABLE facturas 
ADD CONSTRAINT IF NOT EXISTS chk_numero_factura_format 
CHECK (validate_number_format(numero_factura, 'FACT'));

ALTER TABLE remisiones 
ADD CONSTRAINT IF NOT EXISTS chk_numero_remision_format 
CHECK (validate_number_format(numero_remision, 'REM'));

-- Vista para estadísticas de numeración
CREATE OR REPLACE VIEW numbering_stats AS
SELECT 
    'reporte' as document_type,
    COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as total_today,
    COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) as total_this_month,
    (SELECT numero_reporte FROM mantenimientos WHERE numero_reporte IS NOT NULL ORDER BY created_at DESC LIMIT 1) as last_number
FROM mantenimientos WHERE numero_reporte IS NOT NULL

UNION ALL

SELECT 
    'formulario' as document_type,
    COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as total_today,
    COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) as total_this_month,
    (SELECT numero_formulario FROM mantenimientos WHERE numero_formulario IS NOT NULL ORDER BY created_at DESC LIMIT 1) as last_number
FROM mantenimientos WHERE numero_formulario IS NOT NULL

UNION ALL

SELECT 
    'orden_trabajo' as document_type,
    COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as total_today,
    COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) as total_this_month,
    (SELECT numero_orden_trabajo FROM mantenimientos WHERE numero_orden_trabajo IS NOT NULL ORDER BY created_at DESC LIMIT 1) as last_number
FROM mantenimientos WHERE numero_orden_trabajo IS NOT NULL

UNION ALL

SELECT 
    'factura' as document_type,
    COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as total_today,
    COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) as total_this_month,
    (SELECT numero_factura FROM facturas ORDER BY created_at DESC LIMIT 1) as last_number
FROM facturas

UNION ALL

SELECT 
    'remision' as document_type,
    COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as total_today,
    COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) as total_this_month,
    (SELECT numero_remision FROM remisiones ORDER BY created_at DESC LIMIT 1) as last_number
FROM remisiones;

-- Comentario sobre la vista
COMMENT ON VIEW numbering_stats IS 'Vista con estadísticas de numeración para todos los tipos de documentos';

-- Insertar datos de ejemplo para testing (opcional)
-- INSERT INTO facturas (numero_factura, cliente_nombre, total) VALUES 
-- ('FACT-20250115-0001', 'Cliente Test', 150000.00);

-- INSERT INTO remisiones (numero_remision, cliente_nombre, descripcion) VALUES 
-- ('REM-20250115-0001', 'Cliente Test', 'Entrega de repuestos');

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Migración del Sistema de Numeración Unificado completada exitosamente';
    RAISE NOTICE '📋 Tablas creadas/actualizadas: mantenimientos, facturas, remisiones';
    RAISE NOTICE '🔢 Columnas agregadas: numero_formulario, numero_orden_trabajo';
    RAISE NOTICE '📊 Vista creada: numbering_stats';
    RAISE NOTICE '✅ Constraints de validación aplicados';
END $$;