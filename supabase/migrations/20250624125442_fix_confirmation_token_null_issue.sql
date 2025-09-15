-- Corregir el problema específico de confirmation_token NULL

-- Actualizar todos los campos de token que son NULL a cadena vacía
UPDATE auth.users 
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE email IN (
  'admin@ares.com.py',
  'gerente@ares.com.py', 
  'vendedor@ares.com.py',
  'tecnico@ares.com.py',
  'cliente@clinicasanjose.com'
);;
