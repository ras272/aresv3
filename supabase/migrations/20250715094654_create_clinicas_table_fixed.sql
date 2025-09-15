-- Crear función para actualizar updated_at (si no existe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear tabla de clínicas
CREATE TABLE IF NOT EXISTS clinicas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  direccion TEXT NOT NULL,
  ciudad VARCHAR(100) NOT NULL,
  telefono VARCHAR(50),
  email VARCHAR(255),
  contacto_principal VARCHAR(255),
  observaciones TEXT,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_clinicas_activa ON clinicas(activa);
CREATE INDEX IF NOT EXISTS idx_clinicas_ciudad ON clinicas(ciudad);
CREATE INDEX IF NOT EXISTS idx_clinicas_nombre ON clinicas(nombre);

-- Crear trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_clinicas_updated_at ON clinicas;
CREATE TRIGGER update_clinicas_updated_at 
    BEFORE UPDATE ON clinicas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();;
