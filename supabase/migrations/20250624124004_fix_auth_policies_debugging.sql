-- Crear política temporal más permisiva para debugging de autenticación
DROP POLICY IF EXISTS "Temporary permissive policy for debugging" ON user_profiles;

CREATE POLICY "Temporary permissive policy for debugging" ON user_profiles
    FOR ALL USING (true);

-- Temporalmente deshabilitar RLS en user_profiles para debugging
-- ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;;
