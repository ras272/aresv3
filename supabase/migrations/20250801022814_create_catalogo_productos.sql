-- Crear tabla para catálogo de productos
CREATE TABLE catalogo_productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marca VARCHAR(100) NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Evitar productos duplicados por marca
    UNIQUE(marca, nombre)
);

-- Índices para mejor rendimiento
CREATE INDEX idx_catalogo_marca ON catalogo_productos(marca);
CREATE INDEX idx_catalogo_activo ON catalogo_productos(activo);
CREATE INDEX idx_catalogo_nombre ON catalogo_productos(nombre);

-- Trigger para updated_at
CREATE TRIGGER update_catalogo_productos_updated_at
    BEFORE UPDATE ON catalogo_productos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE catalogo_productos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for all users" ON catalogo_productos FOR ALL USING (true);

-- Insertar productos existentes desde componentes_disponibles
INSERT INTO catalogo_productos (marca, nombre, descripcion)
SELECT DISTINCT 
    marca,
    nombre,
    'Importado automáticamente desde inventario existente' as descripcion
FROM componentes_disponibles
WHERE marca IS NOT NULL AND nombre IS NOT NULL
ON CONFLICT (marca, nombre) DO NOTHING;

-- Comentario
COMMENT ON TABLE catalogo_productos IS 'Catálogo maestro de productos organizados por marca para facilitar la selección en mercaderías';;
