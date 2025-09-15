-- Crear tabla de remisiones
CREATE TABLE IF NOT EXISTS remisiones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_remision VARCHAR(50) NOT NULL UNIQUE,
  numero_factura VARCHAR(100),
  fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  cliente_id UUID REFERENCES clinicas(id),
  cliente_nombre VARCHAR(255) NOT NULL, -- Denormalizado para histórico
  direccion_entrega TEXT NOT NULL,
  contacto VARCHAR(255),
  telefono VARCHAR(50),
  tipo_remision VARCHAR(50) NOT NULL CHECK (tipo_remision IN ('Instalación', 'Mantenimiento', 'Reparación', 'Entrega')),
  tecnico_responsable VARCHAR(255) NOT NULL DEFAULT 'Javier Lopez',
  descripcion_general TEXT,
  estado VARCHAR(50) NOT NULL DEFAULT 'Borrador' CHECK (estado IN ('Borrador', 'Confirmada', 'En tránsito', 'Entregada', 'Cancelada')),
  fecha_entrega TIMESTAMP WITH TIME ZONE,
  observaciones_entrega TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_remisiones_numero ON remisiones(numero_remision);
CREATE INDEX IF NOT EXISTS idx_remisiones_cliente ON remisiones(cliente_nombre);
CREATE INDEX IF NOT EXISTS idx_remisiones_estado ON remisiones(estado);
CREATE INDEX IF NOT EXISTS idx_remisiones_fecha ON remisiones(fecha);
CREATE INDEX IF NOT EXISTS idx_remisiones_tecnico ON remisiones(tecnico_responsable);

-- Crear trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_remisiones_updated_at ON remisiones;
CREATE TRIGGER update_remisiones_updated_at 
    BEFORE UPDATE ON remisiones 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();;
