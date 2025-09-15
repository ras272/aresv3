-- ===============================================
-- LIMPIAR TABLAS DE AUTENTICACIÓN PROBLEMÁTICAS
-- ===============================================

-- Limpiar usuarios problemáticos de auth.users
DELETE FROM auth.users WHERE email IN (
    'admin@ares.com.py',
    'gerente@ares.com.py',
    'vendedor@ares.com.py',
    'tecnico@ares.com.py',
    'cliente@clinicasanjose.com'
);

-- Limpiar user_profiles (por cascada)
DELETE FROM user_profiles WHERE email IN (
    'admin@ares.com.py',
    'gerente@ares.com.py',
    'vendedor@ares.com.py',
    'tecnico@ares.com.py',
    'cliente@clinicasanjose.com'
);

-- Limpiar user_sessions
DELETE FROM user_sessions;

-- Verificar que las tablas estén limpias
SELECT 'Usuarios en auth.users' as tabla, count(*) as total FROM auth.users
UNION ALL
SELECT 'Usuarios en user_profiles' as tabla, count(*) as total FROM user_profiles
UNION ALL
SELECT 'Sesiones activas' as tabla, count(*) as total FROM user_sessions;;
