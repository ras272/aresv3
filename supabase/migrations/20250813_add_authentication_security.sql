-- ===============================================
-- MIGRACIÓN: Sistema de Autenticación Segura
-- ===============================================

-- ===============================================
-- ACTUALIZAR TABLA: usuarios
-- ===============================================
-- Agregar columnas de seguridad a la tabla usuarios existente
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS refresh_token TEXT,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ DEFAULT NOW();

-- ===============================================
-- TABLA: login_attempts (Auditoría de intentos de login)
-- ===============================================
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    attempted_at TIMESTAMPTZ DEFAULT NOW(),
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- TABLA: active_sessions (Gestión de sesiones activas)
-- ===============================================
CREATE TABLE IF NOT EXISTS active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    refresh_token_hash TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- ÍNDICES PARA RENDIMIENTO
-- ===============================================

-- Índices para usuarios (nuevas columnas)
CREATE INDEX IF NOT EXISTS idx_usuarios_refresh_token ON usuarios(refresh_token);
CREATE INDEX IF NOT EXISTS idx_usuarios_last_login ON usuarios(last_login);
CREATE INDEX IF NOT EXISTS idx_usuarios_login_attempts ON usuarios(login_attempts);
CREATE INDEX IF NOT EXISTS idx_usuarios_locked_until ON usuarios(locked_until);

-- Índices para login_attempts
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_attempted_at ON login_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_success ON login_attempts(success);

-- Índices para active_sessions
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_refresh_token_hash ON active_sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_active_sessions_expires_at ON active_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_used_at ON active_sessions(last_used_at);

-- ===============================================
-- RLS (Row Level Security)
-- ===============================================
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo (AJUSTAR EN PRODUCCIÓN)
CREATE POLICY "Enable all operations for all users" ON login_attempts FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON active_sessions FOR ALL USING (true);

-- ===============================================
-- FUNCIONES DE UTILIDAD
-- ===============================================

-- Función para limpiar sesiones expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $
DECLARE
    sessions_deleted INTEGER;
BEGIN
    DELETE FROM active_sessions 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS sessions_deleted = ROW_COUNT;
    RETURN sessions_deleted;
END;
$ LANGUAGE plpgsql;

-- Función para limpiar intentos de login antiguos (más de 30 días)
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS INTEGER AS $
DECLARE
    attempts_deleted INTEGER;
BEGIN
    DELETE FROM login_attempts 
    WHERE attempted_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS attempts_deleted = ROW_COUNT;
    RETURN attempts_deleted;
END;
$ LANGUAGE plpgsql;

-- Función para registrar intento de login
CREATE OR REPLACE FUNCTION log_login_attempt(
    p_email VARCHAR(255),
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_success BOOLEAN DEFAULT false,
    p_failure_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $
DECLARE
    attempt_id UUID;
BEGIN
    INSERT INTO login_attempts (
        email,
        ip_address,
        user_agent,
        success,
        failure_reason
    ) VALUES (
        p_email,
        p_ip_address,
        p_user_agent,
        p_success,
        p_failure_reason
    ) RETURNING id INTO attempt_id;
    
    RETURN attempt_id;
END;
$ LANGUAGE plpgsql;

-- Función para crear sesión activa
CREATE OR REPLACE FUNCTION create_active_session(
    p_user_id UUID,
    p_refresh_token_hash TEXT,
    p_expires_at TIMESTAMPTZ,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $
DECLARE
    session_id UUID;
BEGIN
    INSERT INTO active_sessions (
        user_id,
        refresh_token_hash,
        expires_at,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_refresh_token_hash,
        p_expires_at,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO session_id;
    
    -- Actualizar last_login del usuario
    UPDATE usuarios 
    SET last_login = NOW(),
        login_attempts = 0,  -- Reset intentos fallidos en login exitoso
        locked_until = NULL  -- Desbloquear cuenta si estaba bloqueada
    WHERE id = p_user_id;
    
    RETURN session_id;
END;
$ LANGUAGE plpgsql;

-- Función para incrementar intentos fallidos de login
CREATE OR REPLACE FUNCTION increment_failed_login_attempts(
    p_email VARCHAR(255)
)
RETURNS INTEGER AS $
DECLARE
    current_attempts INTEGER;
    user_id UUID;
BEGIN
    -- Obtener usuario y intentos actuales
    SELECT id, login_attempts INTO user_id, current_attempts
    FROM usuarios 
    WHERE email = p_email AND activo = true;
    
    IF user_id IS NULL THEN
        RETURN 0; -- Usuario no encontrado o inactivo
    END IF;
    
    -- Incrementar intentos
    current_attempts := current_attempts + 1;
    
    -- Actualizar intentos y bloquear si es necesario
    IF current_attempts >= 5 THEN
        UPDATE usuarios 
        SET login_attempts = current_attempts,
            locked_until = NOW() + INTERVAL '30 minutes'
        WHERE id = user_id;
    ELSE
        UPDATE usuarios 
        SET login_attempts = current_attempts
        WHERE id = user_id;
    END IF;
    
    RETURN current_attempts;
END;
$ LANGUAGE plpgsql;

-- ===============================================
-- VISTAS ÚTILES
-- ===============================================

-- Vista de usuarios con información de seguridad
CREATE OR REPLACE VIEW vista_usuarios_seguridad AS
SELECT 
    u.id,
    u.nombre,
    u.email,
    u.rol,
    u.activo,
    u.last_login,
    u.login_attempts,
    u.locked_until,
    u.password_changed_at,
    u.created_at,
    u.updated_at,
    CASE 
        WHEN u.locked_until IS NOT NULL AND u.locked_until > NOW() THEN true
        ELSE false
    END as is_locked,
    COUNT(s.id) as active_sessions_count
FROM usuarios u
LEFT JOIN active_sessions s ON u.id = s.user_id AND s.expires_at > NOW()
GROUP BY u.id, u.nombre, u.email, u.rol, u.activo, u.last_login, 
         u.login_attempts, u.locked_until, u.password_changed_at, 
         u.created_at, u.updated_at
ORDER BY u.created_at DESC;

-- Vista de intentos de login recientes
CREATE OR REPLACE VIEW vista_login_attempts_recientes AS
SELECT 
    la.id,
    la.email,
    la.ip_address,
    la.user_agent,
    la.success,
    la.attempted_at,
    la.failure_reason,
    u.nombre as usuario_nombre,
    u.activo as usuario_activo
FROM login_attempts la
LEFT JOIN usuarios u ON la.email = u.email
WHERE la.attempted_at > NOW() - INTERVAL '24 hours'
ORDER BY la.attempted_at DESC;

-- ===============================================
-- COMENTARIOS
-- ===============================================
COMMENT ON TABLE login_attempts IS 'Registro de auditoría para todos los intentos de login (exitosos y fallidos)';
COMMENT ON TABLE active_sessions IS 'Sesiones activas con tokens de refresh para gestión segura de autenticación';
COMMENT ON FUNCTION cleanup_expired_sessions IS 'Función para limpiar sesiones expiradas automáticamente';
COMMENT ON FUNCTION cleanup_old_login_attempts IS 'Función para limpiar intentos de login antiguos (>30 días)';
COMMENT ON FUNCTION log_login_attempt IS 'Función para registrar intentos de login con información de auditoría';
COMMENT ON FUNCTION create_active_session IS 'Función para crear una nueva sesión activa y actualizar información del usuario';
COMMENT ON FUNCTION increment_failed_login_attempts IS 'Función para incrementar intentos fallidos y bloquear cuenta si es necesario';
COMMENT ON VIEW vista_usuarios_seguridad IS 'Vista con información de seguridad de usuarios incluyendo estado de bloqueo';
COMMENT ON VIEW vista_login_attempts_recientes IS 'Vista de intentos de login de las últimas 24 horas';

-- ===============================================
-- ACTUALIZAR ROLES ENUM (si es necesario)
-- ===============================================
-- Agregar roles adicionales si no existen
DO $$ 
BEGIN
    -- Verificar si necesitamos agregar más roles
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'admin' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
        ALTER TYPE user_role ADD VALUE 'admin';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'gerente' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
        ALTER TYPE user_role ADD VALUE 'gerente';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'vendedor' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
        ALTER TYPE user_role ADD VALUE 'vendedor';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'cliente' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
        ALTER TYPE user_role ADD VALUE 'cliente';
    END IF;
END $$;