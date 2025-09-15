-- Crear enum para monedas
CREATE TYPE moneda_tipo AS ENUM ('USD', 'GS');

-- Agregar campos de precio y moneda a catalogo_productos
ALTER TABLE catalogo_productos 
ADD COLUMN precio DECIMAL(12,2) DEFAULT 0 CHECK (precio >= 0),
ADD COLUMN moneda moneda_tipo DEFAULT 'USD',
ADD COLUMN categoria VARCHAR(100),
ADD COLUMN codigo_producto VARCHAR(50) UNIQUE,
ADD COLUMN precio_minimo DECIMAL(12,2) DEFAULT 0 CHECK (precio_minimo >= 0),
ADD COLUMN precio_maximo DECIMAL(12,2) DEFAULT 0 CHECK (precio_maximo >= 0),
ADD COLUMN margen_utilidad DECIMAL(5,2) DEFAULT 0 CHECK (margen_utilidad >= 0 AND margen_utilidad <= 100),
ADD COLUMN disponible_para_venta BOOLEAN DEFAULT true;

-- Agregar campos de precio y moneda a stock_items (heredados del catálogo)
ALTER TABLE stock_items 
ADD COLUMN precio DECIMAL(12,2) DEFAULT 0 CHECK (precio >= 0),
ADD COLUMN moneda moneda_tipo DEFAULT 'USD',
ADD COLUMN catalogo_producto_id UUID REFERENCES catalogo_productos(id),
ADD COLUMN cantidadDisponible INTEGER DEFAULT 0 CHECK (cantidadDisponible >= 0);

-- Actualizar mantenimientos para incluir moneda en precio_servicio
ALTER TABLE mantenimientos 
ADD COLUMN moneda_servicio moneda_tipo DEFAULT 'GS';

-- Crear índices para optimización
CREATE INDEX idx_catalogo_productos_precio ON catalogo_productos(precio, moneda);
CREATE INDEX idx_catalogo_productos_categoria ON catalogo_productos(categoria);
CREATE INDEX idx_catalogo_productos_codigo ON catalogo_productos(codigo_producto);
CREATE INDEX idx_stock_items_precio ON stock_items(precio, moneda);
CREATE INDEX idx_stock_items_catalogo ON stock_items(catalogo_producto_id);
CREATE INDEX idx_mantenimientos_precio_moneda ON mantenimientos(precio_servicio, moneda_servicio);

-- Crear función para sincronizar precios desde catálogo
CREATE OR REPLACE FUNCTION sync_stock_prices_from_catalog()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar stock_items cuando se actualiza el precio en catálogo
  UPDATE stock_items 
  SET 
    precio = NEW.precio,
    moneda = NEW.moneda,
    updated_at = NOW()
  WHERE catalogo_producto_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para sincronización automática
CREATE TRIGGER trigger_sync_catalog_prices
  AFTER UPDATE OF precio, moneda ON catalogo_productos
  FOR EACH ROW
  EXECUTE FUNCTION sync_stock_prices_from_catalog();

-- Comentarios para documentación
COMMENT ON COLUMN catalogo_productos.precio IS 'Precio base del producto en la moneda especificada';
COMMENT ON COLUMN catalogo_productos.moneda IS 'Moneda del precio: USD o GS (Guaraníes)';
COMMENT ON COLUMN catalogo_productos.codigo_producto IS 'Código único del producto para identificación';
COMMENT ON COLUMN catalogo_productos.categoria IS 'Categoría del producto (Insumos, Repuestos, etc.)';
COMMENT ON COLUMN catalogo_productos.margen_utilidad IS 'Porcentaje de margen de utilidad aplicado';
COMMENT ON COLUMN stock_items.catalogo_producto_id IS 'Referencia al producto en el catálogo para heredar precios';
COMMENT ON COLUMN stock_items.cantidadDisponible IS 'Campo normalizado para cantidad disponible (compatibility)';
COMMENT ON COLUMN mantenimientos.moneda_servicio IS 'Moneda del precio del servicio técnico';;
