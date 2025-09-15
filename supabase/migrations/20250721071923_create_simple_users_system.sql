-- ===============================================
-- MIGRACIÓN: Sistema Simple de Usuarios
-- ===============================================

-- Crear tabla de usuarios del sistema (independiente de auth.users)
CREATE TABLE IF NOT EXISTS sistema_usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) DEFAULT 'demo_password', -- Para demo
    rol user_role NOT NULL DEFAULT 'tecnico',
    activo BOOLEAN DEFAULT true,
    ultimo_acceso TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sistema_usuarios_email ON sistema_usuarios(email);
CREATE INDEX IF NOT EXISTS idx_sistema_usuarios_rol ON sistema_usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_sistema_usuarios_activo ON sistema_usuarios(activo);

-- Trigger para updated_at
CREATE TRIGGER update_sistema_usuarios_updated_at
    BEFORE UPDATE ON sistema_usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE sistema_usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for all users" ON sistema_usuarios FOR ALL USING (true);

-- Insertar usuarios iniciales
INSERT INTO sistema_usuarios (nombre, email, rol, activo) 
VALUES 
  ('Super Administrador', 'superadmin@arestech.com', 'super_admin', true),
  ('María González - Contabilidad', 'contabilidad@arestech.com', 'contabilidad', true),
  ('Javier López - Técnico', 'tecnico@arestech.com', 'tecnico', true)
ON CONFLICT (email) DO UPDATE SET
  rol = EXCLUDED.rol,
  nombre = EXCLUDED.nombre,
  updated_at = NOW();

-- Comentarios
COMMENT ON TABLE sistema_usuarios IS 'Usuarios del sistema con roles específicos para control de acceso';
COMMENT ON COLUMN sistema_usuarios.rol IS 'super_admin: acceso total, contabilidad: facturación/archivos/documentos/clínicas/tareas, tecnico: dashboard/equipos/inventario/calendario (solo lectura)';;
