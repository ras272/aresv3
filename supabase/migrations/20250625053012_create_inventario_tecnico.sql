-- Crear tabla para inventario técnico de componentes/repuestos
-- Migración: 2025-01-15 - Inventario Técnico para Servicio Técnico

-- 1. Crear tabla principal de componentes disponibles
CREATE TABLE public.componentes_disponibles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    producto_carga_id UUID REFERENCES public.productos_carga(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    numero_serie VARCHAR(100),
    tipo_componente VARCHAR(50) NOT NULL, -- 'Pieza de mano', 'Cartucho', 'Transductor', etc.
    cantidad_disponible INTEGER NOT NULL DEFAULT 1,
    cantidad_original INTEGER NOT NULL DEFAULT 1,
    ubicacion_fisica VARCHAR(255), -- Donde está físicamente almacenado
    estado VARCHAR(50) NOT NULL DEFAULT 'Disponible', -- 'Disponible', 'Asignado', 'En reparación'
    observaciones TEXT,
    fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
    codigo_carga_origen VARCHAR(50), -- Referencia al código de carga original
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla para historial de asignaciones
CREATE TABLE public.asignaciones_componentes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    componente_id UUID REFERENCES public.componentes_disponibles(id) ON DELETE CASCADE,
    equipo_id UUID REFERENCES public.equipos(id) ON DELETE CASCADE,
    cantidad_asignada INTEGER NOT NULL DEFAULT 1,
    fecha_asignacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tecnico_responsable VARCHAR(255),
    motivo VARCHAR(255), -- 'Instalación', 'Reemplazo', 'Mantenimiento'
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear índices para mejor performance
CREATE INDEX idx_componentes_disponibles_estado ON public.componentes_disponibles(estado);
CREATE INDEX idx_componentes_disponibles_tipo ON public.componentes_disponibles(tipo_componente);
CREATE INDEX idx_componentes_disponibles_fecha ON public.componentes_disponibles(fecha_ingreso);
CREATE INDEX idx_asignaciones_componente_id ON public.asignaciones_componentes(componente_id);
CREATE INDEX idx_asignaciones_equipo_id ON public.asignaciones_componentes(equipo_id);

-- 4. Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_componentes_disponibles_updated_at
    BEFORE UPDATE ON public.componentes_disponibles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Agregar comentarios descriptivos
COMMENT ON TABLE public.componentes_disponibles IS 'Inventario de componentes/repuestos disponibles para servicio técnico';
COMMENT ON TABLE public.asignaciones_componentes IS 'Historial de asignaciones de componentes a equipos específicos';

-- 6. Crear función para obtener disponibilidad
CREATE OR REPLACE FUNCTION public.get_componente_disponibilidad(componente_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_asignado INTEGER;
    cantidad_original INTEGER;
BEGIN
    -- Obtener cantidad original
    SELECT c.cantidad_original INTO cantidad_original
    FROM public.componentes_disponibles c
    WHERE c.id = componente_uuid;
    
    -- Obtener total asignado
    SELECT COALESCE(SUM(a.cantidad_asignada), 0) INTO total_asignado
    FROM public.asignaciones_componentes a
    WHERE a.componente_id = componente_uuid;
    
    -- Retornar disponible
    RETURN GREATEST(0, cantidad_original - total_asignado);
END;
$$ LANGUAGE plpgsql;;
