-- ===============================================
-- TABLA SEPARADA PARA USUARIOS DEMO
-- ===============================================

-- Crear tabla específica para usuarios demo (sin FK constraint)
CREATE TABLE demo_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'cliente',
    empresa TEXT,
    telefono TEXT,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Índices para demo_users
CREATE INDEX idx_demo_users_email ON demo_users(email);
CREATE INDEX idx_demo_users_role ON demo_users(role);
CREATE INDEX idx_demo_users_active ON demo_users(is_active);

-- Habilitar RLS
ALTER TABLE demo_users ENABLE ROW LEVEL SECURITY;

-- Política permisiva para usuarios demo (solo lectura para todos)
CREATE POLICY "Demo users are readable by all" ON demo_users
    FOR SELECT USING (true);

-- Insertar usuarios demo
INSERT INTO demo_users (email, name, role, telefono, empresa, is_active, created_at, last_login) VALUES
('admin@ares.com.py', 'Administrador Sistema', 'admin', '+595 21 123-4567', 'Ares Paraguay', true, '2024-01-01T00:00:00Z', '2024-12-13T10:00:00Z'),
('gerente@ares.com.py', 'María González - Gerente', 'gerente', '+595 21 123-4568', 'Ares Paraguay', true, '2024-01-01T00:00:00Z', '2024-12-13T09:30:00Z'),
('vendedor@ares.com.py', 'Carlos López - Vendedor', 'vendedor', '+595 21 123-4569', 'Ares Paraguay', true, '2024-01-01T00:00:00Z', '2024-12-13T09:00:00Z'),
('tecnico@ares.com.py', 'Roberto Kim - Técnico', 'tecnico', '+595 21 123-4570', 'Ares Paraguay', true, '2024-01-01T00:00:00Z', '2024-12-13T08:45:00Z'),
('cliente@clinicasanjose.com', 'Dra. Ana Rodríguez', 'cliente', '+595 21 987-6543', 'Clínica San José', true, '2024-02-01T00:00:00Z', '2024-12-12T16:00:00Z');;
