-- Crear tabla para gestión documental de cargas
CREATE TABLE IF NOT EXISTS documentos_carga (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  carga_id UUID NOT NULL,
  codigo_carga TEXT NOT NULL,
  nombre TEXT NOT NULL,
  tipo_documento TEXT NOT NULL,
  archivo_nombre TEXT NOT NULL,
  archivo_tamaño INTEGER NOT NULL,
  archivo_tipo TEXT NOT NULL,
  archivo_url TEXT NOT NULL,
  observaciones TEXT,
  fecha_subida TIMESTAMP WITH TIME ZONE NOT NULL,
  subido_por TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_documentos_carga_carga_id ON documentos_carga(carga_id);
CREATE INDEX IF NOT EXISTS idx_documentos_carga_codigo_carga ON documentos_carga(codigo_carga);
CREATE INDEX IF NOT EXISTS idx_documentos_carga_created_at ON documentos_carga(created_at);

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_documentos_carga_updated_at 
    BEFORE UPDATE ON documentos_carga 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE documentos_carga ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir todas las operaciones (ajustar según necesidades de seguridad)
CREATE POLICY "Enable all operations for documentos_carga" ON documentos_carga
    FOR ALL USING (true);

-- Comentarios para documentación
COMMENT ON TABLE documentos_carga IS 'Tabla para almacenar documentos asociados a cargas de mercadería';
COMMENT ON COLUMN documentos_carga.carga_id IS 'ID de la carga de mercadería asociada';
COMMENT ON COLUMN documentos_carga.codigo_carga IS 'Código de la carga para referencia rápida';
COMMENT ON COLUMN documentos_carga.tipo_documento IS 'Tipo de documento (Factura Paraguay Box, Documento DHL, etc.)';
COMMENT ON COLUMN documentos_carga.archivo_url IS 'URL del archivo en Cloudinary o servicio de almacenamiento';