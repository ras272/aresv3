-- Script de instalación completa del sistema de fraccionamiento (Versión Corregida)
-- Parte 1: MIGRACIÓN DE TABLAS

BEGIN;

-- Agregar columnas para fraccionamiento si no existen
ALTER TABLE stock_items 
ADD COLUMN IF NOT EXISTS cajas_completas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unidades_sueltas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unidades_por_paquete INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS permite_fraccionamiento BOOLEAN DEFAULT false;

-- Agregar restricciones (sin IF NOT EXISTS)
DO $$
BEGIN
    -- Intentar agregar restricción cajas_completas
    BEGIN
        ALTER TABLE stock_items 
        ADD CONSTRAINT chk_cajas_completas_no_negative 
            CHECK (cajas_completas >= 0);
    EXCEPTION
        WHEN duplicate_object THEN
            NULL; -- Ignorar si ya existe
    END;

    -- Intentar agregar restricción unidades_sueltas
    BEGIN
        ALTER TABLE stock_items 
        ADD CONSTRAINT chk_unidades_sueltas_no_negative 
            CHECK (unidades_sueltas >= 0);
    EXCEPTION
        WHEN duplicate_object THEN
            NULL; -- Ignorar si ya existe
    END;

    -- Intentar agregar restricción unidades_por_paquete
    BEGIN
        ALTER TABLE stock_items 
        ADD CONSTRAINT chk_unidades_por_paquete_positive 
            CHECK (unidades_por_paquete > 0);
    EXCEPTION
        WHEN duplicate_object THEN
            NULL; -- Ignorar si ya existe
    END;
END $$;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_stock_items_fraccionamiento 
    ON stock_items (permite_fraccionamiento);

CREATE INDEX IF NOT EXISTS idx_stock_items_cajas_sueltas 
    ON stock_items (cajas_completas, unidades_sueltas);

-- Actualizar productos existentes que no tienen fraccionamiento
UPDATE stock_items 
SET 
    cajas_completas = COALESCE(cajas_completas, 0),
    unidades_sueltas = COALESCE(unidades_sueltas, COALESCE(cantidaddisponible, 0)),
    unidades_por_paquete = COALESCE(unidades_por_paquete, 1),
    permite_fraccionamiento = COALESCE(permite_fraccionamiento, false)
WHERE 
    cajas_completas IS NULL 
    OR unidades_sueltas IS NULL 
    OR unidades_por_paquete IS NULL 
    OR permite_fraccionamiento IS NULL;

COMMIT;;
