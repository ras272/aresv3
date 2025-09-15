-- Crear función de prueba para verificar que los usuarios se pueden encontrar correctamente
CREATE OR REPLACE FUNCTION test_user_lookup(user_email TEXT)
RETURNS TABLE(
  found BOOLEAN,
  user_id UUID,
  email TEXT,
  has_password BOOLEAN,
  is_confirmed BOOLEAN,
  all_tokens_empty BOOLEAN,
  error_details TEXT
) AS $$
DECLARE
  user_record RECORD;
  error_msg TEXT := '';
BEGIN
  BEGIN
    -- Intentar encontrar el usuario tal como lo haría Supabase Auth
    SELECT 
      u.id,
      u.email,
      u.encrypted_password IS NOT NULL as has_password,
      u.email_confirmed_at IS NOT NULL as is_confirmed,
      (u.confirmation_token = '' AND u.recovery_token = '' AND u.email_change_token_new = '') as all_tokens_empty
    INTO user_record
    FROM auth.users u
    WHERE u.email = user_email;
    
    IF user_record.id IS NULL THEN
      RETURN QUERY SELECT false, NULL::UUID, ''::TEXT, false, false, false, 'Usuario no encontrado'::TEXT;
    ELSE
      RETURN QUERY SELECT 
        true, 
        user_record.id, 
        user_record.email::TEXT, 
        user_record.has_password, 
        user_record.is_confirmed, 
        user_record.all_tokens_empty,
        'OK'::TEXT;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
    RETURN QUERY SELECT false, NULL::UUID, ''::TEXT, false, false, false, error_msg::TEXT;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Probar la función
SELECT * FROM test_user_lookup('admin@ares.com.py');;
