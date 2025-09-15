-- Crear tabla de productos en remisiones
CREATE TABLE IF NOT EXISTS productos_remision (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  remision_id UUID NOT NULL REFERENCES remisiones(id) ON DELETE CASCADE,
  componente_id UUID REFERENCES componentes_disponibles(id),
  nombre VARCHAR(255) NOT NULL,
  marca VARCHAR(100) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  numero_serie VARCHAR(100),
  cantidad_solicitada INTEGER NOT NULL CHECK (cantidad_solicitada > 0),
  cantidad_disponible INTEGER NOT NULL DEFAULT 0,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_productos_remision_remision ON productos_remision(remision_id);
CREATE INDEX IF NOT EXISTS idx_productos_remision_componente ON productos_remision(componente_id);
CREATE INDEX IF NOT EXISTS idx_productos_remision_nombre ON productos_remision(nombre);;
