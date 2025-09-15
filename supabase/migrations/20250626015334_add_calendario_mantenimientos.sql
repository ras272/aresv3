-- Migración: Calendario de Mantenimientos Programados
-- Fecha: 2025-01-17

-- 🔧 Extender tabla mantenimientos con nuevos campos
ALTER TABLE mantenimientos 
ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'Correctivo' CHECK (tipo IN ('Correctivo', 'Preventivo')),
ADD COLUMN IF NOT EXISTS es_programado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fecha_programada TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tecnico_asignado VARCHAR(255),
ADD COLUMN IF NOT EXISTS prioridad VARCHAR(20) DEFAULT 'Media' CHECK (prioridad IN ('Baja', 'Media', 'Alta', 'Crítica')),
ADD COLUMN IF NOT EXISTS es_recurrente BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS frecuencia_mantenimiento VARCHAR(20) CHECK (frecuencia_mantenimiento IN ('Mensual', 'Bimestral', 'Trimestral', 'Semestral', 'Anual')),
ADD COLUMN IF NOT EXISTS proximo_mantenimiento TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS dias_notificacion_anticipada INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS notificacion_enviada BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tiempo_estimado DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS tiempo_real DECIMAL(5,2);

-- 🗓️ Crear tabla para Planes de Mantenimiento
CREATE TABLE IF NOT EXISTS planes_mantenimiento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
    tipo_equipo VARCHAR(255) NOT NULL,
    mantenimientos_requeridos JSONB NOT NULL,
    fecha_inicio_plan TIMESTAMP WITH TIME ZONE NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 👨‍🔧 Crear tabla para Técnicos
CREATE TABLE IF NOT EXISTS tecnicos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    especialidades TEXT[] DEFAULT ARRAY[]::TEXT[],
    disponibilidad JSONB NOT NULL DEFAULT '{
        "lunes": {"inicio": "08:00", "fin": "17:00", "disponible": true},
        "martes": {"inicio": "08:00", "fin": "17:00", "disponible": true},
        "miercoles": {"inicio": "08:00", "fin": "17:00", "disponible": true},
        "jueves": {"inicio": "08:00", "fin": "17:00", "disponible": true},
        "viernes": {"inicio": "08:00", "fin": "17:00", "disponible": true},
        "sabado": {"inicio": "08:00", "fin": "12:00", "disponible": false},
        "domingo": {"inicio": "08:00", "fin": "12:00", "disponible": false}
    }',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 📊 Crear vista para mantenimientos del calendario
CREATE OR REPLACE VIEW vista_calendario_mantenimientos AS
SELECT 
    m.id,
    m.equipo_id,
    m.fecha,
    m.fecha_programada,
    m.descripcion,
    m.estado,
    m.tipo,
    m.prioridad,
    m.tecnico_asignado,
    m.tiempo_estimado,
    m.es_recurrente,
    m.frecuencia_mantenimiento,
    m.proximo_mantenimiento,
    e.cliente,
    e.nombre_equipo,
    e.marca,
    e.modelo,
    e.ubicacion,
    t.nombre as nombre_tecnico,
    CASE 
        WHEN m.fecha_programada < NOW() AND m.estado != 'Finalizado' THEN TRUE
        ELSE FALSE
    END as esta_vencido,
    CASE 
        WHEN m.fecha_programada IS NOT NULL THEN 
            EXTRACT(days FROM m.fecha_programada - NOW())::INTEGER
        ELSE NULL
    END as dias_hasta_mantenimiento
FROM mantenimientos m
LEFT JOIN equipos e ON m.equipo_id = e.id
LEFT JOIN tecnicos t ON m.tecnico_asignado = t.nombre
WHERE m.es_programado = TRUE OR m.tipo = 'Preventivo'
ORDER BY m.fecha_programada ASC;;
