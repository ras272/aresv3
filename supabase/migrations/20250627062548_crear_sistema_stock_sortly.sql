-- ===============================================
-- SISTEMA DE STOCK TIPO SORTLY PARA ARES
-- ===============================================

-- Crear enums para el sistema de stock
CREATE TYPE tipo_movimiento_stock AS ENUM ('Entrada', 'Salida', 'Transferencia', 'Ajuste', 'Asignacion');
CREATE TYPE estado_ubicacion AS ENUM ('Activa', 'Inactiva', 'Mantenimiento');
CREATE TYPE tipo_ubicacion AS ENUM ('Almacen', 'Estante', 'Contenedor', 'Area', 'Equipo');
CREATE TYPE estado_stock AS ENUM ('Disponible', 'Reservado', 'En_uso', 'Dañado', 'Vencido');

-- ===============================================
-- TABLA: ubicaciones_stock
-- ===============================================
CREATE TABLE ubicaciones_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL, -- ARB-A1-E3 (Almacén-Area-Estante)
    nombre VARCHAR(255) NOT NULL,
    tipo tipo_ubicacion NOT NULL DEFAULT 'Estante',
    descripcion TEXT,
    ubicacion_padre_id UUID REFERENCES ubicaciones_stock(id) ON DELETE SET NULL,
    direccion_fisica TEXT, -- Para almacenes principales
    capacidad_max INTEGER DEFAULT NULL,
    tiene_control_temperatura BOOLEAN DEFAULT FALSE,
    temperatura_min DECIMAL(5,2),
    temperatura_max DECIMAL(5,2),
    imagen_url TEXT, -- Foto de la ubicación
    codigo_qr TEXT, -- Código QR generado
    estado estado_ubicacion DEFAULT 'Activa',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para ubicaciones_stock
CREATE INDEX idx_ubicaciones_codigo ON ubicaciones_stock(codigo);
CREATE INDEX idx_ubicaciones_tipo ON ubicaciones_stock(tipo);
CREATE INDEX idx_ubicaciones_padre ON ubicaciones_stock(ubicacion_padre_id);

-- ===============================================
-- TABLA: stock_items
-- ===============================================
CREATE TABLE stock_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    componente_disponible_id UUID REFERENCES componentes_disponibles(id) ON DELETE SET NULL,
    codigo_item VARCHAR(100) UNIQUE NOT NULL, -- Código único del item
    codigo_barras VARCHAR(100), -- Código de barras físico
    codigo_qr TEXT, -- Código QR generado
    
    -- Información del producto
    nombre VARCHAR(255) NOT NULL,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    numero_serie VARCHAR(100),
    lote VARCHAR(100),
    
    -- Stock y ubicación
    cantidad_actual INTEGER NOT NULL DEFAULT 0,
    cantidad_minima INTEGER DEFAULT 1,
    cantidad_maxima INTEGER DEFAULT NULL,
    ubicacion_id UUID REFERENCES ubicaciones_stock(id) ON DELETE SET NULL,
    
    -- Estados y fechas
    estado estado_stock DEFAULT 'Disponible',
    fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE,
    fecha_ultima_inspeccion DATE,
    
    -- Información de origen
    codigo_carga_origen VARCHAR(50),
    producto_carga_id UUID REFERENCES productos_carga(id) ON DELETE SET NULL,
    
    -- Información adicional
    costo_unitario DECIMAL(10,2),
    observaciones TEXT,
    imagen_url TEXT, -- Foto del item
    
    -- Campos de trazabilidad
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para stock_items
CREATE INDEX idx_stock_codigo_item ON stock_items(codigo_item);
CREATE INDEX idx_stock_codigo_barras ON stock_items(codigo_barras);
CREATE INDEX idx_stock_ubicacion ON stock_items(ubicacion_id);
CREATE INDEX idx_stock_estado ON stock_items(estado);
CREATE INDEX idx_stock_fecha_vencimiento ON stock_items(fecha_vencimiento);
CREATE INDEX idx_stock_componente_disponible ON stock_items(componente_disponible_id);

-- ===============================================
-- TABLA: movimientos_stock
-- ===============================================
CREATE TABLE movimientos_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
    tipo_movimiento tipo_movimiento_stock NOT NULL,
    
    -- Cantidades
    cantidad INTEGER NOT NULL,
    cantidad_anterior INTEGER NOT NULL,
    cantidad_nueva INTEGER NOT NULL,
    
    -- Ubicaciones
    ubicacion_origen_id UUID REFERENCES ubicaciones_stock(id) ON DELETE SET NULL,
    ubicacion_destino_id UUID REFERENCES ubicaciones_stock(id) ON DELETE SET NULL,
    
    -- Información del movimiento
    motivo VARCHAR(255),
    descripcion TEXT,
    referencia_externa VARCHAR(100), -- Número de orden, ticket, etc.
    
    -- Persona responsable
    usuario_responsable VARCHAR(100),
    tecnico_responsable VARCHAR(100),
    
    -- Relaciones con otros módulos
    equipo_destino_id UUID REFERENCES equipos(id) ON DELETE SET NULL,
    mantenimiento_id UUID REFERENCES mantenimientos(id) ON DELETE SET NULL,
    
    -- Campos de auditoría
    fecha_movimiento TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para movimientos_stock
CREATE INDEX idx_movimientos_stock_item ON movimientos_stock(stock_item_id);
CREATE INDEX idx_movimientos_tipo ON movimientos_stock(tipo_movimiento);
CREATE INDEX idx_movimientos_fecha ON movimientos_stock(fecha_movimiento);
CREATE INDEX idx_movimientos_equipo ON movimientos_stock(equipo_destino_id);

-- ===============================================
-- TABLA: alertas_stock
-- ===============================================
CREATE TABLE alertas_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
    tipo_alerta VARCHAR(50) NOT NULL, -- 'stock_minimo', 'vencimiento', 'ubicacion_faltante'
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    prioridad VARCHAR(20) DEFAULT 'Media', -- 'Baja', 'Media', 'Alta', 'Crítica'
    
    -- Estado de la alerta
    activa BOOLEAN DEFAULT TRUE,
    leida BOOLEAN DEFAULT FALSE,
    fecha_leida TIMESTAMPTZ,
    usuario_que_leyo VARCHAR(100),
    
    -- Fechas importantes
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_limite TIMESTAMPTZ, -- Para alertas con vencimiento
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para alertas_stock
CREATE INDEX idx_alertas_stock_item ON alertas_stock(stock_item_id);
CREATE INDEX idx_alertas_activa ON alertas_stock(activa);
CREATE INDEX idx_alertas_tipo ON alertas_stock(tipo_alerta);
CREATE INDEX idx_alertas_prioridad ON alertas_stock(prioridad);

-- ===============================================
-- TRIGGERS PARA UPDATED_AT
-- ===============================================
CREATE TRIGGER update_ubicaciones_stock_updated_at
    BEFORE UPDATE ON ubicaciones_stock
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_stock_items_updated_at
    BEFORE UPDATE ON stock_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_alertas_stock_updated_at
    BEFORE UPDATE ON alertas_stock
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===============================================
-- FUNCIÓN: Generar código único para items
-- ===============================================
CREATE OR REPLACE FUNCTION generar_codigo_item(
    p_marca VARCHAR,
    p_modelo VARCHAR,
    p_fecha DATE DEFAULT CURRENT_DATE
) 
RETURNS VARCHAR AS $$
DECLARE
    codigo_base VARCHAR;
    contador INTEGER;
    codigo_final VARCHAR;
BEGIN
    -- Crear código base: MARCA-MODELO-FECHA
    codigo_base := UPPER(SUBSTRING(p_marca, 1, 3)) || '-' || 
                   UPPER(SUBSTRING(p_modelo, 1, 8)) || '-' ||
                   TO_CHAR(p_fecha, 'YYYYMMDD');
    
    -- Buscar el siguiente número disponible
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(codigo_item FROM LENGTH(codigo_base) + 2) AS INTEGER)
    ), 0) + 1
    INTO contador
    FROM stock_items
    WHERE codigo_item LIKE codigo_base || '-%';
    
    -- Formatear código final
    codigo_final := codigo_base || '-' || LPAD(contador::TEXT, 3, '0');
    
    RETURN codigo_final;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- FUNCIÓN: Registrar movimiento automático
-- ===============================================
CREATE OR REPLACE FUNCTION registrar_movimiento_stock(
    p_stock_item_id UUID,
    p_tipo_movimiento tipo_movimiento_stock,
    p_cantidad INTEGER,
    p_motivo VARCHAR DEFAULT NULL,
    p_ubicacion_destino_id UUID DEFAULT NULL,
    p_equipo_destino_id UUID DEFAULT NULL,
    p_usuario_responsable VARCHAR DEFAULT 'Sistema'
) 
RETURNS UUID AS $$
DECLARE
    item_actual stock_items%ROWTYPE;
    movimiento_id UUID;
BEGIN
    -- Obtener información actual del item
    SELECT * INTO item_actual FROM stock_items WHERE id = p_stock_item_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Stock item no encontrado: %', p_stock_item_id;
    END IF;
    
    -- Crear el movimiento
    INSERT INTO movimientos_stock (
        stock_item_id,
        tipo_movimiento,
        cantidad,
        cantidad_anterior,
        cantidad_nueva,
        ubicacion_origen_id,
        ubicacion_destino_id,
        motivo,
        usuario_responsable,
        equipo_destino_id
    ) VALUES (
        p_stock_item_id,
        p_tipo_movimiento,
        p_cantidad,
        item_actual.cantidad_actual,
        CASE 
            WHEN p_tipo_movimiento = 'Entrada' THEN item_actual.cantidad_actual + p_cantidad
            WHEN p_tipo_movimiento = 'Salida' THEN item_actual.cantidad_actual - p_cantidad
            WHEN p_tipo_movimiento = 'Asignacion' THEN item_actual.cantidad_actual - p_cantidad
            ELSE item_actual.cantidad_actual
        END,
        item_actual.ubicacion_id,
        p_ubicacion_destino_id,
        p_motivo,
        p_usuario_responsable,
        p_equipo_destino_id
    ) RETURNING id INTO movimiento_id;
    
    -- Actualizar cantidad en stock_items
    UPDATE stock_items 
    SET cantidad_actual = CASE 
            WHEN p_tipo_movimiento = 'Entrada' THEN cantidad_actual + p_cantidad
            WHEN p_tipo_movimiento = 'Salida' THEN cantidad_actual - p_cantidad
            WHEN p_tipo_movimiento = 'Asignacion' THEN cantidad_actual - p_cantidad
            ELSE cantidad_actual
        END,
        ubicacion_id = COALESCE(p_ubicacion_destino_id, ubicacion_id),
        updated_at = NOW()
    WHERE id = p_stock_item_id;
    
    RETURN movimiento_id;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- FUNCIÓN: Verificar alertas de stock
-- ===============================================
CREATE OR REPLACE FUNCTION verificar_alertas_stock()
RETURNS VOID AS $$
DECLARE
    item_record RECORD;
BEGIN
    -- Verificar stock mínimo
    FOR item_record IN 
        SELECT id, nombre, cantidad_actual, cantidad_minima, ubicacion_id
        FROM stock_items 
        WHERE cantidad_actual <= cantidad_minima 
        AND estado = 'Disponible'
    LOOP
        -- Crear alerta si no existe una activa
        INSERT INTO alertas_stock (
            stock_item_id,
            tipo_alerta,
            titulo,
            mensaje,
            prioridad
        )
        SELECT 
            item_record.id,
            'stock_minimo',
            'Stock Mínimo Alcanzado',
            'El item ' || item_record.nombre || ' tiene solo ' || 
            item_record.cantidad_actual || ' unidades disponibles.',
            CASE 
                WHEN item_record.cantidad_actual = 0 THEN 'Crítica'
                WHEN item_record.cantidad_actual <= (item_record.cantidad_minima * 0.5) THEN 'Alta'
                ELSE 'Media'
            END
        WHERE NOT EXISTS (
            SELECT 1 FROM alertas_stock 
            WHERE stock_item_id = item_record.id 
            AND tipo_alerta = 'stock_minimo' 
            AND activa = TRUE
        );
    END LOOP;
    
    -- Verificar vencimientos próximos (30 días)
    FOR item_record IN 
        SELECT id, nombre, fecha_vencimiento
        FROM stock_items 
        WHERE fecha_vencimiento IS NOT NULL 
        AND fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days'
        AND estado = 'Disponible'
    LOOP
        INSERT INTO alertas_stock (
            stock_item_id,
            tipo_alerta,
            titulo,
            mensaje,
            prioridad,
            fecha_limite
        )
        SELECT 
            item_record.id,
            'vencimiento',
            'Producto próximo a vencer',
            'El item ' || item_record.nombre || ' vence el ' || 
            TO_CHAR(item_record.fecha_vencimiento, 'DD/MM/YYYY'),
            CASE 
                WHEN item_record.fecha_vencimiento <= CURRENT_DATE + INTERVAL '7 days' THEN 'Crítica'
                WHEN item_record.fecha_vencimiento <= CURRENT_DATE + INTERVAL '15 days' THEN 'Alta'
                ELSE 'Media'
            END,
            item_record.fecha_vencimiento::TIMESTAMPTZ
        WHERE NOT EXISTS (
            SELECT 1 FROM alertas_stock 
            WHERE stock_item_id = item_record.id 
            AND tipo_alerta = 'vencimiento' 
            AND activa = TRUE
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- ===============================================
COMMENT ON TABLE ubicaciones_stock IS 'Ubicaciones físicas del almacén (estantes, áreas, contenedores)';
COMMENT ON TABLE stock_items IS 'Items individuales en el stock con trazabilidad completa';
COMMENT ON TABLE movimientos_stock IS 'Historial completo de movimientos de stock';
COMMENT ON TABLE alertas_stock IS 'Sistema de alertas automáticas para gestión de stock';

-- ===============================================
-- VISTA: Resumen de stock por ubicación
-- ===============================================
CREATE VIEW vista_stock_por_ubicacion AS
SELECT 
    u.id as ubicacion_id,
    u.codigo as codigo_ubicacion,
    u.nombre as nombre_ubicacion,
    u.tipo as tipo_ubicacion,
    COUNT(s.id) as total_items,
    SUM(s.cantidad_actual) as cantidad_total,
    COUNT(CASE WHEN s.estado = 'Disponible' THEN 1 END) as items_disponibles,
    COUNT(CASE WHEN s.cantidad_actual <= s.cantidad_minima THEN 1 END) as items_stock_minimo
FROM ubicaciones_stock u
LEFT JOIN stock_items s ON u.id = s.ubicacion_id
GROUP BY u.id, u.codigo, u.nombre, u.tipo
ORDER BY u.codigo;

-- ===============================================
-- DATOS INICIALES
-- ===============================================
-- Crear ubicaciones principales
INSERT INTO ubicaciones_stock (codigo, nombre, tipo, descripcion, direccion_fisica) VALUES
('ALMACEN-PRINCIPAL', 'Almacén Principal ARES', 'Almacen', 'Almacén principal de equipos y repuestos médicos', 'Sede Central ARES - Asunción'),
('ALMACEN-TEMP', 'Almacén Temporal', 'Almacen', 'Área de recepción y procesamiento de mercaderías', 'Área de carga y descarga'),
('TALLER-TECNICO', 'Taller Técnico', 'Area', 'Área de reparación y mantenimiento técnico', 'Taller de Javier López');

-- Crear áreas dentro del almacén principal
INSERT INTO ubicaciones_stock (codigo, nombre, tipo, descripcion, ubicacion_padre_id) 
SELECT 
    'ALMACEN-PRINCIPAL-A' || i,
    'Área A' || i || ' - Almacén Principal',
    'Area',
    'Área ' || i || ' del almacén principal',
    (SELECT id FROM ubicaciones_stock WHERE codigo = 'ALMACEN-PRINCIPAL')
FROM generate_series(1, 4) as i;

-- Crear estantes en cada área
INSERT INTO ubicaciones_stock (codigo, nombre, tipo, descripcion, ubicacion_padre_id)
SELECT 
    a.codigo || '-E' || e.num,
    'Estante E' || e.num || ' - ' || a.nombre,
    'Estante',
    'Estante ' || e.num || ' en ' || a.nombre,
    a.id
FROM ubicaciones_stock a
CROSS JOIN generate_series(1, 3) as e(num)
WHERE a.codigo LIKE 'ALMACEN-PRINCIPAL-A%' AND a.tipo = 'Area';;
