-- Actualizar solo los campos que se pueden modificar de forma segura

-- 1. Actualizar campos seguros en auth.users
UPDATE auth.users 
SET 
  instance_id = '00000000-0000-0000-0000-000000000000'::uuid,
  raw_app_meta_data = '{"provider": "email", "providers": ["email"]}'::jsonb,
  raw_user_meta_data = '{}'::jsonb,
  is_sso_user = false,
  is_anonymous = false,
  updated_at = NOW(),
  phone_change = '',
  phone_change_token = '',
  email_change_token_current = '',
  email_change_confirm_status = 0,
  reauthentication_token = ''
WHERE email IN (
  'admin@ares.com.py',
  'gerente@ares.com.py', 
  'vendedor@ares.com.py',
  'tecnico@ares.com.py',
  'cliente@clinicasanjose.com'
);;
