-- ===============================================
-- CREAR TABLA UBICACIONES_STOCK
-- ===============================================

CREATE TABLE IF NOT EXISTS ubicaciones_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    tipo tipo_ubicacion NOT NULL DEFAULT 'Almacen',
    estado estado_ubicacion NOT NULL DEFAULT 'Activa',
    parent_id UUID REFERENCES ubicaciones_stock(id) ON DELETE CASCADE,
    path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- RLS (Row Level Security)
-- ===============================================
ALTER TABLE ubicaciones_stock ENABLE ROW LEVEL SECURITY;

-- Política permisiva para desarrollo
DO $$ BEGIN
    CREATE POLICY "Enable all operations for all users" ON ubicaciones_stock FOR ALL USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;;
