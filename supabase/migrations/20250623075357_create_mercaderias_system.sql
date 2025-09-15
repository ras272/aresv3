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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mantenimientos
CREATE INDEX idx_mantenimientos_equipo_id ON mantenimientos(equipo_id);
CREATE INDEX idx_mantenimientos_componente_id ON mantenimientos(componente_id);
CREATE INDEX idx_mantenimientos_estado ON mantenimientos(estado);
CREATE INDEX idx_mantenimientos_fecha ON mantenimientos(fecha);;
