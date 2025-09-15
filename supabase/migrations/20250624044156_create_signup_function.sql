-- ===============================================
-- FUNCIÓN PARA CREAR USUARIOS CON SIGNUP REAL
-- ===============================================

-- Función helper para crear usuarios usando Supabase Auth API
CREATE OR REPLACE FUNCTION create_user_with_signup(
    user_email TEXT,
    user_password TEXT,
    user_name TEXT,
    user_role user_role,
    user_empresa TEXT DEFAULT NULL,
    user_telefono TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Generar un UUID para el usuario
    new_user_id := gen_random_uuid();
    
    -- Insertar directamente en auth.users con el formato correcto
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_sent_at,
        recovery_sent_at,
        email_change_sent_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        role,
        aud
    ) VALUES (
        new_user_id,
        '00000000-0000-0000-0000-000000000000',
        user_email,
        crypt(user_password, gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        json_build_object(
            'name', user_name,
            'role', user_role::text,
            'empresa', user_empresa,
            'telefono', user_telefono
        ),
        false,
        NOW(),
        NOW(),
        'authenticated',
        'authenticated'
    );
    
    -- El trigger automáticamente creará el perfil en user_profiles
    
    RAISE NOTICE 'Usuario % creado exitosamente con rol %', user_email, user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;;
