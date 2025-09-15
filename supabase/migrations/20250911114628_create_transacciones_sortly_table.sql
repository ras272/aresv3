-- Tabla para transacciones históricas de Sortly
CREATE TABLE IF NOT EXISTS transacciones_sortly (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha_transaccion date NOT NULL,
  tipo_documento varchar(50) NOT NULL CHECK (tipo_documento IN ('Factura', 'Orden de Servicio', 'REM', 'Remisión', 'Otro')),
  numero_documento varchar(100),
  producto_descripcion text NOT NULL,
  cantidad numeric(10,2) DEFAULT 1,
  cliente_destino varchar(255),
  observaciones text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by uuid REFERENCES auth.users(id)
);

-- Índices para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_transacciones_sortly_fecha ON transacciones_sortly(fecha_transaccion DESC);
CREATE INDEX IF NOT EXISTS idx_transacciones_sortly_tipo ON transacciones_sortly(tipo_documento);
CREATE INDEX IF NOT EXISTS idx_transacciones_sortly_producto ON transacciones_sortly USING gin(to_tsvector('spanish', producto_descripcion));

-- RLS (Row Level Security)
ALTER TABLE transacciones_sortly ENABLE ROW LEVEL SECURITY;

-- Política para permitir que todos los usuarios autenticados puedan ver y manipular las transacciones
CREATE POLICY "Los usuarios autenticados pueden ver transacciones sortly" ON transacciones_sortly
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Los usuarios autenticados pueden insertar transacciones sortly" ON transacciones_sortly
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Los usuarios autenticados pueden actualizar transacciones sortly" ON transacciones_sortly
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Los usuarios autenticados pueden eliminar transacciones sortly" ON transacciones_sortly
  FOR DELETE USING (auth.role() = 'authenticated');

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transacciones_sortly_updated_at 
  BEFORE UPDATE ON transacciones_sortly 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();;
