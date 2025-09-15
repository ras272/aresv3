-- ===============================================
-- Migración: Agregar numero_serie a movimientos_stock
-- Fecha: 2025-02-08
-- Descripción: Agregar campo numero_serie para trazabilidad completa
-- ===============================================

-- 1. Agregar la columna numero_serie a la tabla movimientos_stock
ALTER TABLE public.movimientos_stock 
ADD COLUMN numero_serie VARCHAR(100);

-- 2. Agregar comentario descriptivo
COMMENT ON COLUMN public.movimientos_stock.numero_serie IS 'Número de serie del producto en el movimiento (para trazabilidad)';

-- 3. Crear índice para mejorar búsquedas por número de serie
CREATE INDEX idx_movimientos_stock_numero_serie ON public.movimientos_stock(numero_serie);

-- 4. Actualizar datos existentes (opcional - los movimientos futuros tendrán el número de serie)
-- Los movimientos pasados quedarán con numero_serie NULL, lo cual es aceptable;
