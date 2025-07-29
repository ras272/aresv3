-- ===============================================
-- MIGRACIÓN: Tabla de Mantenimientos/Reclamos
-- ===============================================

-- Crear tabla de mantenimientos
CREATE TABLE public.mantenimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipo_id UUID NOT NULL,
    componente_id UUID,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    descripcion TEXT NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'En proceso', 'Finalizado')),
    comentarios TEXT,
    reporte_generado BOOLEAN DEFAULT FALSE,
    archivo_nombre VARCHAR(255),
    archivo_tamaño INTEGER,
    archivo_tipo VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de componentes de equipo si no existe
CREATE TABLE IF NOT EXISTS public.componentes_equipo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipo_id UUID NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    numero_serie VARCHAR(100),
    estado VARCHAR(30) NOT NULL DEFAULT 'Operativo' CHECK (estado IN ('Operativo', 'En reparacion', 'Fuera de servicio')),
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de equipos si no existe (estructura básica)
CREATE TABLE IF NOT EXISTS public.equipos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_equipo VARCHAR(255) NOT NULL,
    cliente VARCHAR(255) NOT NULL,
    ubicacion VARCHAR(255) NOT NULL,
    tipo_equipo VARCHAR(100) NOT NULL,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    numero_serie_base VARCHAR(100) NOT NULL,
    fecha_entrega DATE NOT NULL,
    accesorios TEXT,
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mantenimientos
CREATE INDEX idx_mantenimientos_equipo_id ON public.mantenimientos(equipo_id);
CREATE INDEX idx_mantenimientos_componente_id ON public.mantenimientos(componente_id);
CREATE INDEX idx_mantenimientos_estado ON public.mantenimientos(estado);
CREATE INDEX idx_mantenimientos_fecha ON public.mantenimientos(fecha);

-- Índices para componentes
CREATE INDEX IF NOT EXISTS idx_componentes_equipo_id ON public.componentes_equipo(equipo_id);
CREATE INDEX IF NOT EXISTS idx_componentes_estado ON public.componentes_equipo(estado);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_mantenimientos_updated_at
    BEFORE UPDATE ON public.mantenimientos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_componentes_updated_at
    BEFORE UPDATE ON public.componentes_equipo
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_equipos_updated_at
    BEFORE UPDATE ON public.equipos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS (Row Level Security) - Políticas permisivas para desarrollo
ALTER TABLE public.mantenimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.componentes_equipo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo (AJUSTAR EN PRODUCCIÓN)
CREATE POLICY "Enable all operations for all users" ON public.mantenimientos FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.componentes_equipo FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.equipos FOR ALL USING (true);

-- Comentarios
COMMENT ON TABLE public.mantenimientos IS 'Tabla de mantenimientos y reclamos de equipos médicos';
COMMENT ON TABLE public.componentes_equipo IS 'Componentes individuales de cada equipo médico';
COMMENT ON TABLE public.equipos IS 'Equipos médicos registrados en el sistema';

-- Datos de ejemplo para pruebas
INSERT INTO public.equipos (nombre_equipo, cliente, ubicacion, tipo_equipo, marca, modelo, numero_serie_base, fecha_entrega, accesorios, observaciones) VALUES
('Ultraformer III - Demo', 'Clínica Estética Bella', 'Asunción - Centro', 'Equipo de Ultrasonido Estético', 'Classys', 'Ultraformer III', 'UF3-2024-001', '2024-01-15', 'Transductores 4MHz y 7MHz, Pedal de control, Manual técnico', 'Equipo de demostración para pruebas del sistema'),
('Hydrafacial MD - Demo', 'Centro Dermatológico Premium', 'San Lorenzo', 'Equipo de Hidrodermabrasión', 'HydraFacial', 'MD Elite', 'HF-2024-002', '2024-01-20', 'Punta Aqua Peel, Kit de limpieza, Serums incluidos', 'Equipo demo con todos los accesorios');

-- Insertar componentes de ejemplo
INSERT INTO public.componentes_equipo (equipo_id, nombre, numero_serie, estado, observaciones) 
SELECT 
    e.id,
    unnest(ARRAY['Transductor 4MHz', 'Transductor 7MHz', 'Pedal de control', 'Cable de alimentación']),
    unnest(ARRAY['T4-001', 'T7-001', 'P-001', 'C-001']),
    'Operativo',
    'Componente de demostración'
FROM public.equipos e 
WHERE e.nombre_equipo = 'Ultraformer III - Demo';

INSERT INTO public.componentes_equipo (equipo_id, nombre, numero_serie, estado, observaciones) 
SELECT 
    e.id,
    unnest(ARRAY['Punta Aqua Peel', 'Bomba de succión', 'Sistema de filtrado', 'Panel de control']),
    unnest(ARRAY['AP-001', 'BS-001', 'SF-001', 'PC-001']),
    'Operativo',
    'Componente de demostración'
FROM public.equipos e 
WHERE e.nombre_equipo = 'Hydrafacial MD - Demo';