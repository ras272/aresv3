-- ===============================================
-- MIGRACIÓN: producto_presentaciones (unidades y cajas)
-- Fecha: 2025-08-21
-- Responsable: Agent Mode (gpt-5)
-- Descripción:
--   Crea la tabla producto_presentaciones para permitir vender un mismo
--   producto en diferentes presentaciones (Unidad, Caja x6, Pack, etc.)
--   con su correspondiente factor de conversión y precio de venta.
--
--   NOTA: Esta migración NO elimina ni modifica precio_unitario en stock_items
--   para evitar romper compatibilidad. Se recomienda ir migrando el uso de
--   precios hacia producto_presentaciones de forma progresiva en la capa de app.
-- ===============================================

-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS producto_presentaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL, -- Ej: 'Unidad', 'Caja x6'
  factor_conversion NUMERIC(12,4) NOT NULL CHECK (factor_conversion > 0),
  precio_venta NUMERIC(12,2), -- Precio de venta de esta presentación (opcional)
  es_activa BOOLEAN NOT NULL DEFAULT TRUE,
  es_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (stock_item_id, nombre)
);

-- Asegurar un único default por producto
CREATE UNIQUE INDEX IF NOT EXISTS uq_producto_presentaciones_default
ON producto_presentaciones (stock_item_id)
WHERE es_default = TRUE;

-- Índices de apoyo
CREATE INDEX IF NOT EXISTS idx_producto_presentaciones_stock_item
  ON producto_presentaciones(stock_item_id);
CREATE INDEX IF NOT EXISTS idx_producto_presentaciones_activa
  ON producto_presentaciones(es_activa);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_producto_presentaciones_updated_at ON producto_presentaciones;
CREATE TRIGGER update_producto_presentaciones_updated_at
  BEFORE UPDATE ON producto_presentaciones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Habilitar RLS
ALTER TABLE producto_presentaciones ENABLE ROW LEVEL SECURITY;

-- Política permisiva para desarrollo (ajustar en producción)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = current_schema()
      AND tablename = 'producto_presentaciones'
      AND policyname = 'Enable all operations for all users'
  ) THEN
    CREATE POLICY "Enable all operations for all users"
      ON producto_presentaciones FOR ALL USING (true);
  END IF;
END $$;

-- Comentarios
COMMENT ON TABLE producto_presentaciones IS 'Presentaciones de venta por producto (unidad, caja, pack) con factor de conversión y precio.';
COMMENT ON COLUMN producto_presentaciones.factor_conversion IS 'Cantidad de unidades base que representa esta presentación (ej: Caja x6 => 6).';
COMMENT ON COLUMN producto_presentaciones.es_default IS 'Indica la presentación por defecto (máximo una por producto).';;
