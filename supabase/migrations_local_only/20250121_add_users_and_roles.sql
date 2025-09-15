-- ===============================================
-- MIGRACIÓN: Sistema de Usuarios y Roles
-- ===============================================

-- Crear enum para roles
CREATE TYPE user_role AS ENUM ('super_admin', 'contabilidad', 'tecnico');

-- ===============================================
-- TABLA: usuarios
-- ===============================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- En producción usar bcrypt
    rol user_role NOT NULL DEFAULT 'tecnico',
    activo BOOLEAN DEFAULT true,
    ultimo_acceso TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para usuarios
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);

-- ===============================================
-- TABLA: sesiones_usuario
-- ===============================================
CREATE TABLE sesiones_usuario (
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
CREATE INDEX idx_sesiones_usuario_id ON sesiones_usuario(usuario_id);
CREATE INDEX idx_sesiones_token ON sesiones_usuario(token);
CREATE INDEX idx_sesiones_activa ON sesiones_usuario(activa);
CREATE INDEX idx_sesiones_expiracion ON sesiones_usuario(fecha_expiracion);

-- ===============================================
-- TRIGGERS PARA UPDATED_AT
-- ===============================================
CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===============================================
-- RLS (Row Level Security)
-- ===============================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones_usuario ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo (AJUSTAR EN PRODUCCIÓN)
CREATE POLICY "Enable all operations for all users" ON usuarios FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON sesiones_usuario FOR ALL USING (true);

-- ===============================================
-- DATOS DE EJEMPLO - USUARIOS INICIALES
-- ===============================================
INSERT INTO usuarios (nombre, email, password_hash, rol, activo) VALUES
('Super Administrador', 'admin@arestech.com', '$2b$10$dummy.hash.for.demo.purposes.only', 'super_admin', true),
('María González - Contabilidad', 'contabilidad@arestech.com', '$2b$10$dummy.hash.for.demo.purposes.only', 'contabilidad', true),
('Javier López - Técnico', 'tecnico@arestech.com', '$2b$10$dummy.hash.for.demo.purposes.only', 'tecnico', true);

-- ===============================================
-- FUNCIÓN: Limpiar sesiones expiradas
-- ===============================================
CREATE OR REPLACE FUNCTION limpiar_sesiones_expiradas()
RETURNS INTEGER AS $
DECLARE
    sesiones_eliminadas INTEGER;
BEGIN
    DELETE FROM sesiones_usuario 
    WHERE fecha_expiracion < NOW() OR activa = false;
    
    GET DIAGNOSTICS sesiones_eliminadas = ROW_COUNT;
    RETURN sesiones_eliminadas;
END;
$ LANGUAGE plpgsql;

-- ===============================================
-- FUNCIÓN: Crear sesión de usuario
-- ===============================================
CREATE OR REPLACE FUNCTION crear_sesion_usuario(
    p_usuario_id UUID,
    p_token VARCHAR(500),
    p_duracion_horas INTEGER DEFAULT 8,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $
DECLARE
    sesion_id UUID;
BEGIN
    -- Desactivar sesiones anteriores del usuario
    UPDATE sesiones_usuario 
    SET activa = false 
    WHERE usuario_id = p_usuario_id AND activa = true;
    
    -- Crear nueva sesión
    INSERT INTO sesiones_usuario (
        usuario_id, 
        token, 
        fecha_expiracion, 
        ip_address, 
        user_agent
    ) VALUES (
        p_usuario_id,
        p_token,
        NOW() + (p_duracion_horas || ' hours')::INTERVAL,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO sesion_id;
    
    -- Actualizar último acceso del usuario
    UPDATE usuarios 
    SET ultimo_acceso = NOW() 
    WHERE id = p_usuario_id;
    
    RETURN sesion_id;
END;
$ LANGUAGE plpgsql;

-- ===============================================
-- VISTA: Usuarios con información de sesión
-- ===============================================
CREATE VIEW vista_usuarios_sesiones AS
SELECT 
    u.id,
    u.nombre,
    u.email,
    u.rol,
    u.activo,
    u.ultimo_acceso,
    u.created_at,
    s.id as sesion_id,
    s.token,
    s.fecha_inicio as sesion_inicio,
    s.fecha_expiracion as sesion_expiracion,
    s.activa as sesion_activa,
    s.ip_address,
    s.user_agent
FROM usuarios u
LEFT JOIN sesiones_usuario s ON u.id = s.usuario_id AND s.activa = true
ORDER BY u.created_at DESC;

-- ===============================================
-- COMENTARIOS
-- ===============================================
COMMENT ON TABLE usuarios IS 'Tabla de usuarios del sistema con roles específicos';
COMMENT ON TABLE sesiones_usuario IS 'Sesiones activas de usuarios para control de acceso';
COMMENT ON TYPE user_role IS 'Roles disponibles: super_admin (acceso total), contabilidad (facturación, archivos, documentos, clínicas, tareas), tecnico (dashboard, equipos, inventario, calendario - solo lectura)';
COMMENT ON FUNCTION crear_sesion_usuario IS 'Función para crear una nueva sesión de usuario y desactivar las anteriores';
COMMENT ON FUNCTION limpiar_sesiones_expiradas IS 'Función para limpiar sesiones expiradas del sistema';