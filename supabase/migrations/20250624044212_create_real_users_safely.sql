-- ===============================================
-- CREAR USUARIOS REALES DE FORMA SEGURA
-- ===============================================

-- Crear administrador
SELECT create_user_with_signup(
    'admin@ares.com.py',
    'admin123',
    'Administrador Sistema',
    'admin',
    'Ares Paraguay',
    '+595 21 123-4567'
);

-- Crear gerente
SELECT create_user_with_signup(
    'gerente@ares.com.py',
    'gerente123',
    'María González - Gerente',
    'gerente',
    'Ares Paraguay',
    '+595 21 123-4568'
);

-- Crear vendedor
SELECT create_user_with_signup(
    'vendedor@ares.com.py',
    'vendedor123',
    'Carlos López - Vendedor',
    'vendedor',
    'Ares Paraguay',
    '+595 21 123-4569'
);

-- Crear técnico
SELECT create_user_with_signup(
    'tecnico@ares.com.py',
    'tecnico123',
    'Roberto Kim - Técnico',
    'tecnico',
    'Ares Paraguay',
    '+595 21 123-4570'
);

-- Crear cliente
SELECT create_user_with_signup(
    'cliente@clinicasanjose.com',
    'cliente123',
    'Dra. Ana Rodríguez',
    'cliente',
    'Clínica San José',
    '+595 21 987-6543'
);;
