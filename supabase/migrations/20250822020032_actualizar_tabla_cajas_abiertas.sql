-- Actualizar tabla stock_cajas_abiertas para el fraccionamiento
BEGIN;

-- Agregar la columna que falta
ALTER TABLE stock_cajas_abiertas 
ADD COLUMN IF NOT EXISTS unidades_liberadas INTEGER;

-- Actualizar registros existentes
UPDATE stock_cajas_abiertas 
SET unidades_liberadas = factor_original
WHERE unidades_liberadas IS NULL;

-- Hacer la columna NOT NULL después de actualizarla
ALTER TABLE stock_cajas_abiertas 
ALTER COLUMN unidades_liberadas SET NOT NULL;

COMMIT;;
