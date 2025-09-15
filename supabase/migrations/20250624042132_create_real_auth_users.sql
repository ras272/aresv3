-- ===============================================
-- CREAR USUARIOS REALES EN SUPABASE AUTH
-- ===============================================

-- Insertar usuarios directamente en auth.users con metadata
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    role,
    aud
) VALUES 
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'admin@ares.com.py',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Administrador Sistema", "role": "admin", "empresa": "Ares Paraguay", "telefono": "+595 21 123-4567"}',
    false,
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'gerente@ares.com.py',
    crypt('gerente123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "María González - Gerente", "role": "gerente", "empresa": "Ares Paraguay", "telefono": "+595 21 123-4568"}',
    false,
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'vendedor@ares.com.py',
    crypt('vendedor123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Carlos López - Vendedor", "role": "vendedor", "empresa": "Ares Paraguay", "telefono": "+595 21 123-4569"}',
    false,
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'tecnico@ares.com.py',
    crypt('tecnico123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Roberto Kim - Técnico", "role": "tecnico", "empresa": "Ares Paraguay", "telefono": "+595 21 123-4570"}',
    false,
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'cliente@clinicasanjose.com',
    crypt('cliente123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Dra. Ana Rodríguez", "role": "cliente", "empresa": "Clínica San José", "telefono": "+595 21 987-6543"}',
    false,
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
);;
