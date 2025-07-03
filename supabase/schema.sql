-- ===============================================
-- SCHEMA ARES PARAGUAY - SISTEMA DE MERCADERÍAS
-- ===============================================

-- Crear enums
CREATE TYPE tipo_producto AS ENUM ('Insumo', 'Repuesto', 'Equipo Médico');
CREATE TYPE estado_componente AS ENUM ('Operativo', 'En reparacion', 'Fuera de servicio');
CREATE TYPE estado_mantenimiento AS ENUM ('Pendiente', 'En proceso', 'Finalizado');

-- ===============================================
-- TABLA: cargas_mercaderia
-- ===============================================
CREATE TABLE cargas_mercaderia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_carga VARCHAR(50) UNIQUE NOT NULL,
    fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
    destino TEXT NOT NULL,
    observaciones_generales TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para cargas_mercaderia
CREATE INDEX idx_cargas_codigo ON cargas_mercaderia(codigo_carga);
CREATE INDEX idx_cargas_fecha ON cargas_mercaderia(fecha_ingreso);

-- ===============================================
-- TABLA: productos_carga
-- ===============================================
CREATE TABLE productos_carga (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carga_id UUID NOT NULL REFERENCES cargas_mercaderia(id) ON DELETE CASCADE,
    producto TEXT NOT NULL,
    tipo_producto tipo_producto NOT NULL,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    numero_serie VARCHAR(100),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    observaciones TEXT,
    imagen TEXT, -- URL o base64 de la imagen
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para productos_carga
CREATE INDEX idx_productos_carga_id ON productos_carga(carga_id);
CREATE INDEX idx_productos_tipo ON productos_carga(tipo_producto);
CREATE INDEX idx_productos_numero_serie ON productos_carga(numero_serie);

-- ===============================================
-- TABLA: subitems
-- ===============================================
CREATE TABLE subitems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES productos_carga(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    numero_serie VARCHAR(100) NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para subitems
CREATE INDEX idx_subitems_producto_id ON subitems(producto_id);

-- ===============================================
-- TABLA: equipos (para Servicio Técnico)
-- ===============================================
CREATE TABLE equipos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente TEXT NOT NULL,
    ubicacion TEXT NOT NULL,
    nombre_equipo TEXT NOT NULL,
    tipo_equipo TEXT NOT NULL,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    numero_serie_base VARCHAR(100) NOT NULL,
    accesorios TEXT NOT NULL,
    fecha_entrega DATE NOT NULL,
    observaciones TEXT,
    codigo_carga_origen VARCHAR(50), -- Referencia al código de carga que lo originó
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para equipos
CREATE INDEX idx_equipos_cliente ON equipos(cliente);
CREATE INDEX idx_equipos_numero_serie ON equipos(numero_serie_base);
CREATE INDEX idx_equipos_codigo_carga ON equipos(codigo_carga_origen);

-- ===============================================
-- TABLA: componentes_equipo
-- ===============================================
CREATE TABLE componentes_equipo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    numero_serie VARCHAR(100) NOT NULL,
    estado estado_componente NOT NULL DEFAULT 'Operativo',
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para componentes_equipo
CREATE INDEX idx_componentes_equipo_id ON componentes_equipo(equipo_id);
CREATE INDEX idx_componentes_estado ON componentes_equipo(estado);

-- ===============================================
-- TABLA: mantenimientos
-- ===============================================
CREATE TABLE mantenimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
    componente_id UUID REFERENCES componentes_equipo(id) ON DELETE SET NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    descripcion TEXT NOT NULL,
    estado estado_mantenimiento NOT NULL DEFAULT 'Pendiente',
    comentarios TEXT,
    archivo_nombre VARCHAR(255),
    archivo_tamaño INTEGER,
    archivo_tipo VARCHAR(100),
    reporte_generado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mantenimientos
CREATE INDEX idx_mantenimientos_equipo_id ON mantenimientos(equipo_id);
CREATE INDEX idx_mantenimientos_componente_id ON mantenimientos(componente_id);
CREATE INDEX idx_mantenimientos_estado ON mantenimientos(estado);
CREATE INDEX idx_mantenimientos_fecha ON mantenimientos(fecha);

-- ===============================================
-- TRIGGERS PARA UPDATED_AT
-- ===============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas
CREATE TRIGGER update_cargas_mercaderia_updated_at
    BEFORE UPDATE ON cargas_mercaderia
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_productos_carga_updated_at
    BEFORE UPDATE ON productos_carga
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subitems_updated_at
    BEFORE UPDATE ON subitems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_equipos_updated_at
    BEFORE UPDATE ON equipos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_componentes_equipo_updated_at
    BEFORE UPDATE ON componentes_equipo
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_mantenimientos_updated_at
    BEFORE UPDATE ON mantenimientos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===============================================
-- RLS (Row Level Security) - BÁSICO
-- ===============================================
-- Por ahora habilitamos RLS pero permitimos todo (para desarrollo)
-- En producción, ajustar según necesidades de seguridad

ALTER TABLE cargas_mercaderia ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos_carga ENABLE ROW LEVEL SECURITY;
ALTER TABLE subitems ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE componentes_equipo ENABLE ROW LEVEL SECURITY;
ALTER TABLE mantenimientos ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo (AJUSTAR EN PRODUCCIÓN)
CREATE POLICY "Enable all operations for all users" ON cargas_mercaderia FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON productos_carga FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON subitems FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON equipos FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON componentes_equipo FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON mantenimientos FOR ALL USING (true);

-- ===============================================
-- DATOS DE EJEMPLO
-- ===============================================
-- Insertar datos de ejemplo para pruebas
INSERT INTO cargas_mercaderia (codigo_carga, fecha_ingreso, destino, observaciones_generales) VALUES
('ENTRADA-20241201-001', '2024-12-01', 'Hospital Central - Cardiología', 'Carga completa de equipamiento Classys para ampliación del servicio'),
('ENTRADA-20241201-002', '2024-12-01', 'Clínica San José - UCI', 'Reposición mensual de filtros y repuestos');

-- Obtener IDs de las cargas para referencias
DO $$
DECLARE
    carga1_id UUID;
    carga2_id UUID;
    producto1_id UUID;
    producto2_id UUID;
    equipo1_id UUID;
BEGIN
    -- Obtener IDs de cargas
    SELECT id INTO carga1_id FROM cargas_mercaderia WHERE codigo_carga = 'ENTRADA-20241201-001';
    SELECT id INTO carga2_id FROM cargas_mercaderia WHERE codigo_carga = 'ENTRADA-20241201-002';
    
    -- Insertar productos para carga 1
    INSERT INTO productos_carga (carga_id, producto, tipo_producto, marca, modelo, numero_serie, cantidad, observaciones) VALUES
    (carga1_id, 'Equipo Ultraformer III', 'Equipo Médico', 'Classys', 'Ultraformer III', 'CL-UF3-2024-001', 1, 'Equipo principal de ultrasonido focalizado'),
    (carga1_id, 'Cartuchos para Ultraformer', 'Insumo', 'Classys', 'Cartucho DS-4.5', 'CL-CART-DS45-LOTE001', 50, 'Cartuchos desechables para tratamiento facial'),
    (carga1_id, 'Gel Conductor', 'Insumo', 'Classys', 'Gel-Conductor-Premium', NULL, 20, 'Gel conductor específico para ultrasonido');
    
    -- Insertar productos para carga 2
    INSERT INTO productos_carga (carga_id, producto, tipo_producto, marca, modelo, numero_serie, cantidad, observaciones) VALUES
    (carga2_id, 'Filtros HEPA', 'Insumo', 'MedFilter', 'HF-200', NULL, 50, 'Filtros para sistema de ventilación UCI'),
    (carga2_id, 'Cables de Repuesto ECG', 'Repuesto', 'Philips', 'ECG-Cable-Set-12', NULL, 10, 'Cables de repuesto para monitores de cardiología');
    
    -- Obtener ID del equipo médico para subitems
    SELECT id INTO producto1_id FROM productos_carga WHERE numero_serie = 'CL-UF3-2024-001';
    
    -- Insertar subitems para el equipo médico
    INSERT INTO subitems (producto_id, nombre, numero_serie, cantidad) VALUES
    (producto1_id, 'Transductor 4.5MHz', 'CL-UF3-2024-001-T45', 1),
    (producto1_id, 'Transductor 7MHz', 'CL-UF3-2024-001-T7', 1);
    
    -- Crear equipo en servicio técnico (simulando la integración automática)
    INSERT INTO equipos (cliente, ubicacion, nombre_equipo, tipo_equipo, marca, modelo, numero_serie_base, accesorios, fecha_entrega, observaciones, codigo_carga_origen) VALUES
    ('Hospital Central', 'Hospital Central - Cardiología', 'Equipo Ultraformer III-ENTRADA-20241201-001', 'Equipo Ultraformer III', 'Classys', 'Ultraformer III', 'CL-UF3-2024-001', 'Transductor 4.5MHz, Transductor 7MHz', '2024-12-01', 'Ingresado automáticamente desde el módulo de mercaderías. Código de carga: ENTRADA-20241201-001. Carga completa de equipamiento Classys para ampliación del servicio', 'ENTRADA-20241201-001');
    
    -- Obtener ID del equipo para componentes
    SELECT id INTO equipo1_id FROM equipos WHERE codigo_carga_origen = 'ENTRADA-20241201-001';
    
    -- Insertar componentes del equipo
    INSERT INTO componentes_equipo (equipo_id, nombre, numero_serie, estado, observaciones) VALUES
    (equipo1_id, 'Equipo Principal', 'CL-UF3-2024-001', 'Operativo', 'Cantidad: 1. Equipo principal de ultrasonido focalizado'),
    (equipo1_id, 'Transductor 4.5MHz', 'CL-UF3-2024-001-T45', 'Operativo', 'Cantidad: 1'),
    (equipo1_id, 'Transductor 7MHz', 'CL-UF3-2024-001-T7', 'Operativo', 'Cantidad: 1');
    
END $$;

-- ===============================================
-- COMENTARIOS FINALES
-- ===============================================
COMMENT ON TABLE cargas_mercaderia IS 'Tabla principal de cargas de mercadería - cada registro representa una carga completa';
COMMENT ON TABLE productos_carga IS 'Productos individuales dentro de cada carga - puede haber múltiples productos por carga';
COMMENT ON TABLE subitems IS 'Componentes/accesorios de equipos médicos - solo para productos tipo "Equipo Médico"';
COMMENT ON TABLE equipos IS 'Equipos registrados en el módulo de Servicio Técnico - se pobla automáticamente desde mercaderías';
COMMENT ON TABLE componentes_equipo IS 'Componentes de cada equipo en Servicio Técnico';
COMMENT ON TABLE mantenimientos IS 'Registros de mantenimiento para equipos y componentes';

-- ===============================================
-- VISTA ÚTIL: Resumen de cargas
-- ===============================================
CREATE VIEW vista_resumen_cargas AS
SELECT 
    c.id,
    c.codigo_carga,
    c.fecha_ingreso,
    c.destino,
    c.observaciones_generales,
    COUNT(p.id) as total_productos,
    COUNT(CASE WHEN p.tipo_producto = 'Equipo Médico' THEN 1 END) as equipos_medicos,
    COUNT(CASE WHEN p.tipo_producto = 'Insumo' THEN 1 END) as insumos,
    COUNT(CASE WHEN p.tipo_producto = 'Repuesto' THEN 1 END) as repuestos,
    c.created_at
FROM cargas_mercaderia c
LEFT JOIN productos_carga p ON c.id = p.carga_id
GROUP BY c.id, c.codigo_carga, c.fecha_ingreso, c.destino, c.observaciones_generales, c.created_at
ORDER BY c.created_at DESC;

COMMENT ON VIEW vista_resumen_cargas IS 'Vista que muestra resumen de cada carga con contadores por tipo de producto'; 