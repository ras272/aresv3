-- ===============================================
-- MIGRACIÓN: Agregar Nuevos Roles de Usuario
-- ===============================================

-- Agregar los nuevos roles al enum existente
ALTER TYPE user_role ADD VALUE 'super_admin';
ALTER TYPE user_role ADD VALUE 'contabilidad';;
