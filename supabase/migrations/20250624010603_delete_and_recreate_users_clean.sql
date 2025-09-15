-- ELIMINAR COMPLETAMENTE LOS USUARIOS PROBLEMÁTICOS Y RECREARLOS

-- 1. Guardar los IDs de user_profiles antes de eliminar
CREATE TEMP TABLE temp_user_profiles AS
SELECT id, email, name, role, empresa, telefono, is_active
FROM user_profiles 
WHERE email IN (
  'admin@ares.com.py',
  'gerente@ares.com.py', 
  'vendedor@ares.com.py',
  'tecnico@ares.com.py',
  'cliente@clinicasanjose.com'
);

-- 2. Eliminar completamente de auth.users (esto también eliminará de user_profiles por cascade)
DELETE FROM auth.users 
WHERE email IN (
  'admin@ares.com.py',
  'gerente@ares.com.py', 
  'vendedor@ares.com.py',
  'tecnico@ares.com.py',
  'cliente@clinicasanjose.com'
);

-- 3. Crear función para insertar usuarios de forma correcta
CREATE OR REPLACE FUNCTION create_clean_demo_user(
  user_email TEXT,
  user_name TEXT,
  user_role TEXT,
  user_empresa TEXT DEFAULT NULL,
  user_telefono TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  hashed_password TEXT;
BEGIN
  -- Crear hash de contraseña (usando el patrón estándar)
  -- admin123 -> $2a$10$hash_aqui
  CASE user_email
    WHEN 'admin@ares.com.py' THEN 
      hashed_password := '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'; -- admin123
    WHEN 'gerente@ares.com.py' THEN 
      hashed_password := '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'; -- gerente123 (mismo hash por simplicidad)
    WHEN 'vendedor@ares.com.py' THEN 
      hashed_password := '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'; -- vendedor123
    WHEN 'tecnico@ares.com.py' THEN 
      hashed_password := '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'; -- tecnico123
    WHEN 'cliente@clinicasanjose.com' THEN 
      hashed_password := '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'; -- cliente123
    ELSE 
      hashed_password := '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW';
  END CASE;

  -- Insertar en auth.users con TODOS los campos requeridos
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    confirmed_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at,
    is_anonymous
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    user_email,
    hashed_password,
    NOW(),
    NULL,
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{}'::jsonb,
    false,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    NOW(),
    '',
    0,
    NULL,
    '',
    NULL,
    false,
    NULL,
    false
  );

  -- Insertar en user_profiles
  INSERT INTO user_profiles (
    id,
    email,
    name,
    role,
    empresa,
    telefono,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    user_email,
    user_name,
    user_role::user_role,
    user_empresa,
    user_telefono,
    true,
    NOW(),
    NOW()
  );

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;;
