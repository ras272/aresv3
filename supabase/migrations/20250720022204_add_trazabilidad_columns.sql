-- Agregar columnas necesarias para trazabilidad completa
ALTER TABLE movimientos_stock 
ADD COLUMN IF NOT EXISTS producto_nombre VARCHAR(255),
ADD COLUMN IF NOT EXISTS producto_marca VARCHAR(255),
ADD COLUMN IF NOT EXISTS producto_modelo VARCHAR(255),
ADD COLUMN IF NOT EXISTS codigo_item VARCHAR(100),
ADD COLUMN IF NOT EXISTS codigo_carga_origen VARCHAR(100),
ADD COLUMN IF NOT EXISTS numero_factura VARCHAR(100),
ADD COLUMN IF NOT EXISTS cliente VARCHAR(255),
ADD COLUMN IF NOT EXISTS costo_unitario DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS valor_total DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS carpeta_origen VARCHAR(255),
ADD COLUMN IF NOT EXISTS carpeta_destino VARCHAR(255),
ADD COLUMN IF NOT EXISTS ubicacion_fisica VARCHAR(255),
ADD COLUMN IF NOT EXISTS item_type VARCHAR(50) DEFAULT 'stock_item';

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_movimientos_stock_producto ON movimientos_stock(producto_nombre, producto_marca);
CREATE INDEX IF NOT EXISTS idx_movimientos_stock_carpeta ON movimientos_stock(carpeta_origen);
CREATE INDEX IF NOT EXISTS idx_movimientos_stock_codigo_carga ON movimientos_stock(codigo_carga_origen);
CREATE INDEX IF NOT EXISTS idx_movimientos_stock_cliente ON movimientos_stock(cliente);;
