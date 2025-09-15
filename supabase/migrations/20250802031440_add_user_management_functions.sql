-- ===============================================
-- FUNCIONES AUXILIARES PARA GESTIÓN DE USUARIOS
-- ===============================================

-- Función para crear sesión de usuario
CREATE OR REPLACE FUNCTION crear_sesion_usuario(
    p_usuario_id UUID,
    p_token VARCHAR(500),
    p_duracion_horas INTEGER DEFAULT 8,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
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
$$ LANGUAGE plpgsql;

-- Función para limpiar sesiones expiradas
CREATE OR REPLACE FUNCTION limpiar_sesiones_expiradas()
RETURNS INTEGER AS $$
DECLARE
    sesiones_eliminadas INTEGER;
BEGIN
    DELETE FROM sesiones_usuario 
    WHERE fecha_expiracion < NOW() OR activa = false;
    
    GET DIAGNOSTICS sesiones_eliminadas = ROW_COUNT;
    RETURN sesiones_eliminadas;
END;
$$ LANGUAGE plpgsql;

-- Vista para usuarios con información de sesión
CREATE OR REPLACE VIEW vista_usuarios_sesiones AS
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
ORDER BY u.created_at DESC;;
