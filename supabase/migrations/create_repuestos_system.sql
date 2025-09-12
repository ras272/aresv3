-- ===============================================
-- MIGRACIÓN: SISTEMA DE REPUESTOS
-- ===============================================

-- Crear enums para el sistema de repuestos
CREATE TYPE estado_repuesto AS ENUM ('Disponible', 'Reservado', 'En_uso', 'Dañado', 'Vencido');
CREATE TYPE tipo_movimiento_repuesto AS ENUM ('Entrada', 'Salida', 'Transferencia', 'Ajuste', 'Asignacion');

-- ===============================================
-- TABLA: repuestos_stock
-- ===============================================
CREATE TABLE repuestos_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_repuesto VARCHAR(50) UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    marca VARCHAR(100),
    modelo VARCHAR(100),
    numero_serie VARCHAR(100),
    lote VARCHAR(100),
    cantidad_actual INTEGER NOT NULL DEFAULT 0 CHECK (cantidad_actual >= 0),
    cantidad_minima INTEGER NOT NULL DEFAULT 1 CHECK (cantidad_minima > 0),
    unidad_medida VARCHAR(20) DEFAULT 'unidad',
    estado estado_repuesto NOT NULL DEFAULT 'Disponible',
    categoria VARCHAR(100),
    subcategoria VARCHAR(100),
    proveedor VARCHAR(200),
    precio_unitario DECIMAL(12,2),
    moneda VARCHAR(3) DEFAULT 'USD',
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE,
    fecha_ultimo_movimiento TIMESTAMPTZ,
    fotos TEXT[], -- Array de URLs de fotos
    documentos TEXT[], -- Array de URLs de documentos
    tags TEXT[], -- Array de tags para búsqueda
    custom_fields JSONB DEFAULT '{}', -- Campos personalizados
    qr_code TEXT, -- Código QR generado
    barcode TEXT, -- Código de barras
    observaciones TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- TABLA: movimientos_repuestos
-- ===============================================
CREATE TABLE movimientos_repuestos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repuesto_id UUID NOT NULL REFERENCES repuestos_stock(id) ON DELETE CASCADE,
    tipo_movimiento tipo_movimiento_repuesto NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    cantidad_anterior INTEGER NOT NULL,
    cantidad_nueva INTEGER NOT NULL,
    motivo TEXT NOT NULL,
    referencia_externa VARCHAR(100), -- Código de orden, factura, etc.
    usuario VARCHAR(100),
    costo_unitario DECIMAL(12,2),
    costo_total DECIMAL(12,2),
    fecha_movimiento TIMESTAMPTZ DEFAULT NOW(),
    observaciones TEXT,
    metadata JSONB DEFAULT '{}', -- Información adicional del movimiento
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- TABLA: repuestos_equipos (relación entre repuestos y equipos)
-- ===============================================
CREATE TABLE repuestos_equipos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repuesto_id UUID NOT NULL REFERENCES repuestos_stock(id) ON DELETE CASCADE,
    equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
    mantenimiento_id UUID REFERENCES mantenimientos(id) ON DELETE SET NULL,
    cantidad_usada INTEGER NOT NULL CHECK (cantidad_usada > 0),
    fecha_uso TIMESTAMPTZ DEFAULT NOW(),
    tecnico_responsable VARCHAR(100),
    motivo_uso TEXT NOT NULL, -- 'Reparacion', 'Mantenimiento', 'Upgrade', etc.
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- ÍNDICES PARA PERFORMANCE
-- ===============================================

-- Índices para repuestos_stock
CREATE INDEX idx_repuestos_codigo ON repuestos_stock(codigo_repuesto);
CREATE INDEX idx_repuestos_nombre ON repuestos_stock(nombre);
CREATE INDEX idx_repuestos_estado ON repuestos_stock(estado);
CREATE INDEX idx_repuestos_categoria ON repuestos_stock(categoria);
CREATE INDEX idx_repuestos_fecha_vencimiento ON repuestos_stock(fecha_vencimiento);
CREATE INDEX idx_repuestos_tags ON repuestos_stock USING GIN(tags);
CREATE INDEX idx_repuestos_custom_fields ON repuestos_stock USING GIN(custom_fields);
CREATE INDEX idx_repuestos_activo ON repuestos_stock(activo);

-- Índices para movimientos_repuestos
CREATE INDEX idx_movimientos_repuesto ON movimientos_repuestos(repuesto_id);
CREATE INDEX idx_movimientos_tipo ON movimientos_repuestos(tipo_movimiento);
CREATE INDEX idx_movimientos_fecha ON movimientos_repuestos(fecha_movimiento);
CREATE INDEX idx_movimientos_usuario ON movimientos_repuestos(usuario);

-- Índices para repuestos_equipos
CREATE INDEX idx_repuestos_equipos_repuesto ON repuestos_equipos(repuesto_id);
CREATE INDEX idx_repuestos_equipos_equipo ON repuestos_equipos(equipo_id);
CREATE INDEX idx_repuestos_equipos_mantenimiento ON repuestos_equipos(mantenimiento_id);
CREATE INDEX idx_repuestos_equipos_fecha ON repuestos_equipos(fecha_uso);

-- ===============================================
-- FUNCIONES AUXILIARES
-- ===============================================

-- Función para generar códigos de repuesto únicos
CREATE OR REPLACE FUNCTION generar_codigo_repuesto(prefijo TEXT DEFAULT 'REP')
RETURNS TEXT AS $$
DECLARE
    nuevo_codigo TEXT;
    contador INTEGER := 1;
BEGIN
    LOOP
        nuevo_codigo := prefijo || '-' || LPAD(contador::TEXT, 6, '0');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM repuestos_stock WHERE codigo_repuesto = nuevo_codigo);
        contador := contador + 1;
    END LOOP;
    RETURN nuevo_codigo;
END;
$$ LANGUAGE plpgsql;

-- Función para registrar movimientos automáticamente
CREATE OR REPLACE FUNCTION registrar_movimiento_repuesto()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo registrar si la cantidad cambió
    IF OLD.cantidad_actual != NEW.cantidad_actual THEN
        INSERT INTO movimientos_repuestos (
            repuesto_id,
            tipo_movimiento,
            cantidad,
            cantidad_anterior,
            cantidad_nueva,
            motivo,
            usuario
        ) VALUES (
            NEW.id,
            CASE 
                WHEN NEW.cantidad_actual > OLD.cantidad_actual THEN 'Entrada'::tipo_movimiento_repuesto
                ELSE 'Salida'::tipo_movimiento_repuesto
            END,
            ABS(NEW.cantidad_actual - OLD.cantidad_actual),
            OLD.cantidad_actual,
            NEW.cantidad_actual,
            'Ajuste automático',
            'Sistema'
        );
    END IF;
    
    -- Actualizar fecha último movimiento
    NEW.fecha_ultimo_movimiento := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- TRIGGERS
-- ===============================================

-- Trigger para updated_at en repuestos_stock
CREATE TRIGGER update_repuestos_stock_updated_at
    BEFORE UPDATE ON repuestos_stock
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger para registrar movimientos automáticamente
CREATE TRIGGER trigger_registrar_movimiento_repuesto
    BEFORE UPDATE ON repuestos_stock
    FOR EACH ROW EXECUTE FUNCTION registrar_movimiento_repuesto();

-- ===============================================
-- VISTAS ÚTILES
-- ===============================================

-- Vista de uso de repuestos por equipo
CREATE VIEW vista_repuestos_por_equipo AS
SELECT 
    re.*,
    rs.nombre as repuesto_nombre,
    rs.codigo_repuesto,
    e.nombre_equipo,
    e.numero_serie_base,
    m.descripcion as mantenimiento_descripcion
FROM repuestos_equipos re
JOIN repuestos_stock rs ON re.repuesto_id = rs.id
JOIN equipos e ON re.equipo_id = e.id
LEFT JOIN mantenimientos m ON re.mantenimiento_id = m.id
ORDER BY re.fecha_uso DESC;

-- Vista de movimientos recientes de repuestos
CREATE VIEW vista_movimientos_repuestos_recientes AS
SELECT 
    mr.*,
    rs.nombre as repuesto_nombre,
    rs.codigo_repuesto
FROM movimientos_repuestos mr
JOIN repuestos_stock rs ON mr.repuesto_id = rs.id
ORDER BY mr.fecha_movimiento DESC;

-- ===============================================
-- RLS (Row Level Security)
-- ===============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE repuestos_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_repuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE repuestos_equipos ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo (AJUSTAR EN PRODUCCIÓN)
CREATE POLICY "Enable all operations for all users" ON repuestos_stock FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON movimientos_repuestos FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON repuestos_equipos FOR ALL USING (true);

-- ===============================================
-- DATOS INICIALES
-- ===============================================

-- Insertar algunos repuestos de ejemplo
INSERT INTO repuestos_stock (codigo_repuesto, nombre, descripcion, marca, modelo, cantidad_actual, cantidad_minima, estado, categoria, proveedor) VALUES
(generar_codigo_repuesto('REP'), 'Cable de Alimentación', 'Cable de alimentación estándar para equipos médicos', 'Genérico', 'CA-220V', 20, 5, 'Disponible', 'Cables', 'Proveedor General'),
(generar_codigo_repuesto('REP'), 'Fusible 5A', 'Fusible de vidrio 5A para protección de equipos', 'Genérico', 'F-5A', 100, 20, 'Disponible', 'Fusibles', 'Proveedor General'),
(generar_codigo_repuesto('REP'), 'Sensor de Temperatura', 'Sensor NTC de temperatura para monitoreo de equipos', 'Texas Instruments', 'TMP36', 15, 5, 'Disponible', 'Sensores', 'DigiKey');

-- ===============================================
-- COMENTARIOS FINALES
-- ===============================================

COMMENT ON TABLE repuestos_stock IS 'Items individuales de repuestos con trazabilidad completa';
COMMENT ON TABLE movimientos_repuestos IS 'Historial completo de todos los movimientos de repuestos';
COMMENT ON TABLE repuestos_equipos IS 'Relación entre repuestos usados y equipos';

COMMENT ON VIEW vista_repuestos_por_equipo IS 'Uso de repuestos por equipo con información de mantenimiento';
COMMENT ON VIEW vista_movimientos_repuestos_recientes IS 'Movimientos de repuestos ordenados por fecha';