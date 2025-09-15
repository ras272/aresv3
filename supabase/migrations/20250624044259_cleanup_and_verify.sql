-- ===============================================
-- VERIFICACIÓN FINAL DEL SISTEMA
-- ===============================================

-- Crear vista optimizada para verificar usuarios activos
CREATE OR REPLACE VIEW active_users AS
SELECT 
    up.id,
    up.email,
    up.name,
    up.role,
    up.empresa,
    up.telefono,
    up.is_active,
    up.last_login,
    up.created_at
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
WHERE up.is_active = true
ORDER BY up.created_at DESC;

-- Verificar que todo esté funcionando perfectamente
SELECT 'Total usuarios activos' as info, count(*) as valor FROM active_users
UNION ALL
SELECT 'Admin users' as info, count(*) as valor FROM active_users WHERE role = 'admin'
UNION ALL  
SELECT 'Gerente users' as info, count(*) as valor FROM active_users WHERE role = 'gerente'
UNION ALL
SELECT 'Vendedor users' as info, count(*) as valor FROM active_users WHERE role = 'vendedor'
UNION ALL
SELECT 'Tecnico users' as info, count(*) as valor FROM active_users WHERE role = 'tecnico'
UNION ALL
SELECT 'Cliente users' as info, count(*) as valor FROM active_users WHERE role = 'cliente';;
