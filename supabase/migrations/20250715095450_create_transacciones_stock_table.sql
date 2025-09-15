-- Crear tipo enum para transacciones de stock
DO $$ BEGIN
    CREATE TYPE tipo_transaccion_stock AS ENUM ('ENTRADA', 'SALIDA', 'RESERVA', 'AJUSTE', 'DEVOLUCION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Crear tabla de transacciones de stock
CREATE TABLE IF NOT EXISTS transacciones_stock (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  componente_id UUID NOT NULL REFERENCES componentes_disponibles(id),
  tipo tipo_transaccion_stock NOT NULL,
  cantidad INTEGER NOT NULL,
  cantidad_anterior INTEGER NOT NULL,
  cantidad_nueva INTEGER NOT NULL,
  motivo VARCHAR(255) NOT NULL,
  referencia VARCHAR(100), -- REM-20250115-001, CARGA-001, etc.
  numero_factura VARCHAR(100),
  cliente VARCHAR(255),
  tecnico_responsable VARCHAR(255),
  observaciones TEXT,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_transacciones_componente ON transacciones_stock(componente_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_tipo ON transacciones_stock(tipo);
CREATE INDEX IF NOT EXISTS idx_transacciones_fecha ON transacciones_stock(fecha);
CREATE INDEX IF NOT EXISTS idx_transacciones_referencia ON transacciones_stock(referencia);
CREATE INDEX IF NOT EXISTS idx_transacciones_cliente ON transacciones_stock(cliente);;
