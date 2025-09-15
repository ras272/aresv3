-- ===============================================
-- LIMPIAR Y CONFIGURAR AUTENTICACIÓN REAL
-- ===============================================

-- Eliminar tabla demo (no la necesitamos más)
DROP TABLE IF EXISTS demo_users CASCADE;

-- Asegurar que el trigger funcione correctamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS create_user_profile();

-- Recrear función mejorada para crear perfiles
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, name, role, empresa, telefono, is_active)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'cliente'),
        COALESCE(NEW.raw_user_meta_data->>'empresa', 'Ares Paraguay'),
        COALESCE(NEW.raw_user_meta_data->>'telefono', NULL),
        true
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Función para obtener el usuario actual con rol
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM user_profiles 
        WHERE id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;;
