-- Simular completamente el proceso de autenticación de Supabase
CREATE OR REPLACE FUNCTION simulate_supabase_auth_lookup(user_email TEXT)
RETURNS TABLE(
  test_passed BOOLEAN,
  error_message TEXT,
  user_found BOOLEAN,
  all_fields_valid BOOLEAN
) AS $$
DECLARE
  test_result RECORD;
  field_check BOOLEAN := true;
  error_msg TEXT := '';
BEGIN
  BEGIN
    -- Esta consulta simula exactamente lo que hace Supabase Auth internamente
    SELECT 
      u.id,
      u.instance_id,
      u.aud,
      u.role,
      u.email,
      u.encrypted_password,
      u.email_confirmed_at,
      u.invited_at,
      u.confirmation_token,        -- Este era el campo problemático
      u.confirmation_sent_at,
      u.recovery_token,
      u.recovery_sent_at,
      u.email_change_token_new,
      u.email_change,
      u.email_change_sent_at,
      u.last_sign_in_at,
      u.raw_app_meta_data,
      u.raw_user_meta_data,
      u.is_super_admin,
      u.created_at,
      u.updated_at,
      u.phone,
      u.phone_confirmed_at,
      u.phone_change,
      u.phone_change_token,
      u.phone_change_sent_at,
      u.confirmed_at,
      u.email_change_token_current,
      u.email_change_confirm_status,
      u.banned_until,
      u.reauthentication_token,
      u.reauthentication_sent_at,
      u.is_sso_user,
      u.deleted_at,
      u.is_anonymous
    INTO test_result
    FROM auth.users u
    WHERE u.email = user_email AND u.deleted_at IS NULL;
    
    IF test_result.id IS NULL THEN
      RETURN QUERY SELECT false, 'Usuario no encontrado'::TEXT, false, false;
    ELSE
      -- Verificar que todos los campos críticos estén correctos
      field_check := (
        test_result.confirmation_token IS NOT NULL AND
        test_result.recovery_token IS NOT NULL AND
        test_result.email_change_token_new IS NOT NULL AND
        test_result.email_change_token_current IS NOT NULL AND
        test_result.phone_change_token IS NOT NULL AND
        test_result.reauthentication_token IS NOT NULL AND
        test_result.instance_id IS NOT NULL AND
        test_result.raw_app_meta_data IS NOT NULL
      );
      
      RETURN QUERY SELECT true, 'OK'::TEXT, true, field_check;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
    RETURN QUERY SELECT false, error_msg::TEXT, false, false;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Probar con el usuario admin
SELECT * FROM simulate_supabase_auth_lookup('admin@ares.com.py');;
