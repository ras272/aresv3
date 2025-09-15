-- Agregar campos para precios de fraccionamiento en catálogo de productos
ALTER TABLE catalogo_productos 
ADD COLUMN IF NOT EXISTS precio_por_caja NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS precio_por_unidad NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS moneda_caja VARCHAR(10) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS moneda_unidad VARCHAR(10) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS permite_fraccionamiento BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS unidades_por_caja INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS precio_original NUMERIC(10,2); -- Para mantener compatibilidad

-- Comentarios para documentar
COMMENT ON COLUMN catalogo_productos.precio_por_caja IS 'Precio cuando se vende la caja completa';
COMMENT ON COLUMN catalogo_productos.precio_por_unidad IS 'Precio cuando se vende por unidad individual';
COMMENT ON COLUMN catalogo_productos.precio_original IS 'Precio original del sistema anterior (por compatibilidad)';
COMMENT ON COLUMN catalogo_productos.permite_fraccionamiento IS 'Si este producto se puede vender por unidad o solo por caja';

-- Migrar datos existentes (opcional)
UPDATE catalogo_productos 
SET precio_original = precio,
    precio_por_caja = precio
WHERE precio_original IS NULL;;
