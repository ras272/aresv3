-- ===============================================
-- SISTEMA DE AUTENTICACIÓN Y ROLES - ARES PARAGUAY
-- ===============================================

-- Crear enum para roles de usuario
CREATE TYPE user_role AS ENUM ('admin', 'gerente', 'vendedor', 'tecnico', 'cliente');

-- ===============================================
-- TABLA: user_profiles (extiende auth.users de Supabase)
-- ===============================================
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'cliente',
    empresa TEXT, -- Para clientes principalmente
    telefono TEXT,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Índices para user_profiles
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_empresa ON user_profiles(empresa);
CREATE INDEX idx_user_profiles_active ON user_profiles(is_active);

-- ===============================================
-- TABLA: user_sessions (tracking de sesiones)
-- ===============================================
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    login_at TIMESTAMPTZ DEFAULT NOW(),
    logout_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

-- Índices para user_sessions
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX idx_user_sessions_login_at ON user_sessions(login_at);;
