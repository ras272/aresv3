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
ADD COLUMN IF NOT EXISTS tiempo_estimado DECIMAL(5,2), -- en horas
ADD COLUMN IF NOT EXISTS tiempo_real DECIMAL(5,2); -- en horas

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
    -- Calcular si está vencido
    CASE 
        WHEN m.fecha_programada < NOW() AND m.estado != 'Finalizado' THEN TRUE
        ELSE FALSE
    END as esta_vencido,
    -- Calcular días hasta mantenimiento
    CASE 
        WHEN m.fecha_programada IS NOT NULL THEN 
            EXTRACT(days FROM m.fecha_programada - NOW())::INTEGER
        ELSE NULL
    END as dias_hasta_mantenimiento
FROM mantenimientos m
LEFT JOIN equipos e ON m.equipo_id = e.id
LEFT JOIN tecnicos t ON m.tecnico_asignado = t.nombre
WHERE m.es_programado = TRUE OR m.tipo = 'Preventivo'
ORDER BY m.fecha_programada ASC;

-- 🔔 Crear función para generar mantenimientos recurrentes
CREATE OR REPLACE FUNCTION generar_proximo_mantenimiento()
RETURNS TRIGGER AS $$
DECLARE
    intervalo_meses INTEGER;
    nueva_fecha TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Solo para mantenimientos preventivos recurrentes finalizados
    IF NEW.estado = 'Finalizado' AND NEW.es_recurrente = TRUE AND NEW.tipo = 'Preventivo' THEN
        -- Calcular el intervalo en meses según la frecuencia
        CASE NEW.frecuencia_mantenimiento
            WHEN 'Mensual' THEN intervalo_meses := 1;
            WHEN 'Bimestral' THEN intervalo_meses := 2;
            WHEN 'Trimestral' THEN intervalo_meses := 3;
            WHEN 'Semestral' THEN intervalo_meses := 6;
            WHEN 'Anual' THEN intervalo_meses := 12;
            ELSE intervalo_meses := 3; -- Por defecto trimestral
        END CASE;
        
        -- Calcular nueva fecha
        nueva_fecha := COALESCE(NEW.fecha_programada, NEW.fecha) + (intervalo_meses || ' months')::INTERVAL;
        
        -- Crear nuevo mantenimiento programado
        INSERT INTO mantenimientos (
            equipo_id,
            fecha,
            fecha_programada,
            descripcion,
            estado,
            tipo,
            es_programado,
            es_recurrente,
            frecuencia_mantenimiento,
            tecnico_asignado,
            prioridad,
            tiempo_estimado,
            dias_notificacion_anticipada
        ) VALUES (
            NEW.equipo_id,
            nueva_fecha,
            nueva_fecha,
            NEW.descripcion,
            'Pendiente',
            'Preventivo',
            TRUE,
            TRUE,
            NEW.frecuencia_mantenimiento,
            NEW.tecnico_asignado,
            NEW.prioridad,
            NEW.tiempo_estimado,
            NEW.dias_notificacion_anticipada
        );
        
        -- Actualizar fecha del próximo mantenimiento en el registro actual
        UPDATE mantenimientos 
        SET proximo_mantenimiento = nueva_fecha
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para generar mantenimientos recurrentes
DROP TRIGGER IF EXISTS trigger_generar_proximo_mantenimiento ON mantenimientos;
CREATE TRIGGER trigger_generar_proximo_mantenimiento
    AFTER UPDATE ON mantenimientos
    FOR EACH ROW
    EXECUTE FUNCTION generar_proximo_mantenimiento();

-- 📧 Crear función para notificaciones (preparar para futuras integraciones)
CREATE OR REPLACE FUNCTION marcar_notificaciones_pendientes()
RETURNS TABLE(
    mantenimiento_id UUID,
    equipo_nombre TEXT,
    cliente TEXT,
    fecha_programada TIMESTAMP WITH TIME ZONE,
    dias_restantes INTEGER,
    tecnico TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id as mantenimiento_id,
        e.nombre_equipo as equipo_nombre,
        e.cliente,
        m.fecha_programada,
        EXTRACT(days FROM m.fecha_programada - NOW())::INTEGER as dias_restantes,
        m.tecnico_asignado as tecnico
    FROM mantenimientos m
    LEFT JOIN equipos e ON m.equipo_id = e.id
    WHERE 
        m.es_programado = TRUE 
        AND m.estado = 'Pendiente'
        AND m.notificacion_enviada = FALSE
        AND m.fecha_programada <= NOW() + (COALESCE(m.dias_notificacion_anticipada, 7) || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- 👨‍💻 Insertar técnico de ARES
INSERT INTO tecnicos (nombre, especialidades) VALUES 
('Javier Lopez', ARRAY['Equipos Médicos Generales', 'Equipos de Imagen', 'Electromedicina', 'Ultrasonido', 'Monitores', 'Desfibriladores'])
ON CONFLICT DO NOTHING;

-- 🗓️ Crear algunos planes de mantenimiento de ejemplo
INSERT INTO planes_mantenimiento (equipo_id, tipo_equipo, mantenimientos_requeridos, fecha_inicio_plan) 
SELECT 
    e.id,
    e.tipo_equipo,
    CASE e.tipo_equipo
        WHEN 'Electrocardiógrafo' THEN '[
            {
                "tipo": "Preventivo",
                "descripcion": "Calibración y limpieza de electrodos",
                "frecuencia": "Trimestral",
                "tiempoEstimado": 2,
                "prioridad": "Media",
                "instrucciones": "Verificar conexiones, limpiar electrodos, calibrar según manual"
            },
            {
                "tipo": "Preventivo", 
                "descripcion": "Verificación completa del sistema",
                "frecuencia": "Semestral",
                "tiempoEstimado": 4,
                "prioridad": "Alta",
                "instrucciones": "Revisión completa de hardware y software"
            }
        ]'::jsonb
        WHEN 'Monitor de Signos Vitales' THEN '[
            {
                "tipo": "Preventivo",
                "descripcion": "Calibración de sensores",
                "frecuencia": "Bimestral", 
                "tiempoEstimado": 1.5,
                "prioridad": "Alta",
                "instrucciones": "Calibrar sensores de presión, temperatura y oximetría"
            }
        ]'::jsonb
        ELSE '[
            {
                "tipo": "Preventivo",
                "descripcion": "Mantenimiento preventivo general", 
                "frecuencia": "Trimestral",
                "tiempoEstimado": 2,
                "prioridad": "Media",
                "instrucciones": "Revisión general según manual del fabricante"
            }
        ]'::jsonb
    END,
    NOW() - INTERVAL '1 month'
FROM equipos e
LIMIT 5;

-- 📝 Comentarios de la migración
COMMENT ON TABLE planes_mantenimiento IS 'Planes de mantenimiento preventivo por tipo de equipo';
COMMENT ON TABLE tecnicos IS 'Técnicos disponibles para asignación de mantenimientos';
COMMENT ON VIEW vista_calendario_mantenimientos IS 'Vista unificada para el calendario de mantenimientos con información completa';
COMMENT ON FUNCTION generar_proximo_mantenimiento() IS 'Genera automáticamente el próximo mantenimiento cuando se finaliza uno recurrente';
COMMENT ON FUNCTION marcar_notificaciones_pendientes() IS 'Identifica mantenimientos que requieren notificación anticipada'; 