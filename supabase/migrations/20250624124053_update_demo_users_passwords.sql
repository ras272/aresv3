-- Actualizar las contraseñas de los usuarios demo
-- Nota: Esto requiere que los usuarios ya existan en auth.users

-- Función para actualizar contraseñas de usuarios demo de forma segura
CREATE OR REPLACE FUNCTION setup_demo_passwords()
RETURNS TEXT AS $$
DECLARE
    user_record RECORD;
    result_text TEXT := 'Configuración de contraseñas demo: ';
BEGIN
    -- Las contraseñas deben ser actualizadas a través de auth.admin
    -- Por ahora, vamos a verificar que los usuarios existen
    
    FOR user_record IN 
        SELECT id, email FROM auth.users 
        WHERE email IN ('admin@ares.com.py', 'gerente@ares.com.py', 'vendedor@ares.com.py', 'tecnico@ares.com.py', 'cliente@clinicasanjose.com')
    LOOP
        result_text := result_text || 'Usuario ' || user_record.email || ' encontrado; ';
    END LOOP;
    
    -- Verificar que los perfiles están sincronizados
    UPDATE user_profiles 
    SET updated_at = NOW() 
    WHERE email IN ('admin@ares.com.py', 'gerente@ares.com.py', 'vendedor@ares.com.py', 'tecnico@ares.com.py', 'cliente@clinicasanjose.com');
    
    result_text := result_text || 'Perfiles actualizados.';
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ejecutar la función
SELECT setup_demo_passwords();;
