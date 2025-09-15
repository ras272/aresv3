-- ===============================================
-- TABLA: usuarios
-- ===============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol user_role NOT NULL DEFAULT 'tecnico',
    activo BOOLEAN DEFAULT true,
    ultimo_acceso TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);

-- ===============================================
-- TABLA: sesiones_usuario
-- ===============================================
CREATE TABLE IF NOT EXISTS sesiones_usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    fecha_inicio TIMESTAMPTZ DEFAULT NOW(),
    fecha_expiracion TIMESTAMPTZ NOT NULL,
    activa BOOLEAN DEFAULT true,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para sesiones
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario_id ON sesiones_usuario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_token ON sesiones_usuario(token);
CREATE INDEX IF NOT EXISTS idx_sesiones_activa ON sesiones_usuario(activa);
CREATE INDEX IF NOT EXISTS idx_sesiones_expiracion ON sesiones_usuario(fecha_expiracion);

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

DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===============================================
-- RLS (Row Level Security)
-- ===============================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones_usuario ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo
DROP POLICY IF EXISTS "Enable all operations for all users" ON usuarios;
DROP POLICY IF EXISTS "Enable all operations for all users" ON sesiones_usuario;

CREATE POLICY "Enable all operations for all users" ON usuarios FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON sesiones_usuario FOR ALL USING (true);

-- ===============================================
-- DATOS DE EJEMPLO - USUARIOS INICIALES
-- ===============================================
INSERT INTO usuarios (nombre, email, password_hash, rol, activo) VALUES
('Super Administrador', 'superadmin@arestech.com', 'admin123', 'super_admin', true),
('María González - Contabilidad', 'contabilidad@arestech.com', 'conta123', 'contabilidad', true),
('Javier López - Técnico', 'tecnico@arestech.com', 'tecnico123', 'tecnico', true)
ON CONFLICT (email) DO NOTHING;;
