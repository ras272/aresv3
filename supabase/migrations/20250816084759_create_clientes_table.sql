-- Tabla de clientes con información de contacto
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  whatsapp VARCHAR(20),
  email VARCHAR(255),
  direccion TEXT,
  ciudad VARCHAR(100),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes(telefono);
CREATE INDEX IF NOT EXISTS idx_clientes_whatsapp ON clientes(whatsapp);
CREATE INDEX IF NOT EXISTS idx_clientes_activo ON clientes(activo);

-- Comentarios
COMMENT ON TABLE clientes IS 'Información de contacto de clientes';
COMMENT ON COLUMN clientes.nombre IS 'Nombre completo del cliente o empresa';
COMMENT ON COLUMN clientes.telefono IS 'Número de teléfono principal';
COMMENT ON COLUMN clientes.whatsapp IS 'Número de WhatsApp (formato internacional)';
COMMENT ON COLUMN clientes.email IS 'Correo electrónico de contacto';;
