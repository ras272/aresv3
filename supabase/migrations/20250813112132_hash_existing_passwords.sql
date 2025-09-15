-- Función para hashear contraseñas existentes
CREATE OR REPLACE FUNCTION hash_plain_passwords()
RETURNS TABLE(email text, status text) AS $$
DECLARE
    user_record RECORD;
    hashed_password text;
BEGIN
    -- Iterar sobre usuarios con contraseñas en texto plano
    FOR user_record IN 
        SELECT id, email, password_hash 
        FROM usuarios 
        WHERE password_hash NOT LIKE '$2%' -- No es bcrypt hash
        AND password_hash != '$2b$10$dummy.hash.for.demo.purposes.only'
    LOOP
        -- Hashear la contraseña usando crypt con bcrypt
        hashed_password := crypt(user_record.password_hash, gen_salt('bf', 12));
        
        -- Actualizar el usuario
        UPDATE usuarios 
        SET password_hash = hashed_password,
            password_changed_at = NOW()
        WHERE id = user_record.id;
        
        -- Retornar resultado
        email := user_record.email;
        status := 'hashed';
        RETURN NEXT;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;;
