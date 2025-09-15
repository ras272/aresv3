-- ===============================================
-- MIGRACIÓN: Auto-asignación a Javier Lopez
-- Fecha: 2025-01-15
-- Descripción: Configura auto-asignación al técnico principal
-- ===============================================

-- Actualizar mantenimientos existentes sin técnico asignado
UPDATE mantenimientos 
SET tecnico_asignado = 'Javier Lopez'
WHERE tecnico_asignado IS NULL 
   OR tecnico_asignado = '' 
   OR tecnico_asignado = 'sin-asignar';

-- Actualizar mantenimientos futuros programados sin técnico
UPDATE mantenimientos 
SET tecnico_asignado = 'Javier Lopez'
WHERE es_programado = TRUE 
  AND fecha_programada > NOW()
  AND (tecnico_asignado IS NULL OR tecnico_asignado = '');

-- Crear función para auto-asignar en nuevos mantenimientos
CREATE OR REPLACE FUNCTION auto_asignar_tecnico_principal()
RETURNS TRIGGER AS $$
BEGIN
    -- Si no hay técnico asignado, asignar a Javier Lopez
    IF NEW.tecnico_asignado IS NULL OR NEW.tecnico_asignado = '' THEN
        NEW.tecnico_asignado := 'Javier Lopez';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para auto-asignación
DROP TRIGGER IF EXISTS trigger_auto_asignar_tecnico ON mantenimientos;
CREATE TRIGGER trigger_auto_asignar_tecnico
    BEFORE INSERT OR UPDATE ON mantenimientos
    FOR EACH ROW
    EXECUTE FUNCTION auto_asignar_tecnico_principal();

-- Crear vista para tickets de Javier Lopez
CREATE OR REPLACE VIEW vista_tickets_javier AS
SELECT 
    m.id,
    m.equipo_id,
    e.nombre_equipo,
    e.cliente,
    e.ubicacion,
    m.tipo,
    m.descripcion,
    m.prioridad,
    m.estado,
    m.fecha,
    m.fecha_programada,
    m.tecnico_asignado,
    m.comentarios,
    m.created_at,
    -- Calcular urgencia basada en prioridad y fecha
    CASE 
        WHEN m.prioridad = 'Crítica' THEN 4
        WHEN m.prioridad = 'Alta' THEN 3
        WHEN m.prioridad = 'Media' THEN 2
        ELSE 1
    END as nivel_urgencia,
    -- Calcular días desde creación
    EXTRACT(days FROM NOW() - m.created_at)::INTEGER as dias_desde_creacion,
    -- Estado de vencimiento
    CASE 
        WHEN m.fecha_programada < NOW() AND m.estado != 'Finalizado' THEN 'Vencido'
        WHEN m.fecha_programada <= NOW() + INTERVAL '1 day' AND m.estado != 'Finalizado' THEN 'Próximo'
        ELSE 'Normal'
    END as estado_vencimiento
FROM mantenimientos m
LEFT JOIN equipos e ON m.equipo_id = e.id
WHERE m.tecnico_asignado = 'Javier Lopez'
ORDER BY 
    nivel_urgencia DESC,
    m.fecha_programada ASC NULLS LAST,
    m.created_at DESC;

-- Comentarios
COMMENT ON FUNCTION auto_asignar_tecnico_principal() IS 'Auto-asigna todos los mantenimientos a Javier Lopez como técnico principal';
COMMENT ON VIEW vista_tickets_javier IS 'Vista optimizada de todos los tickets asignados a Javier Lopez con información de urgencia';

-- Estadísticas para Javier Lopez
CREATE OR REPLACE VIEW estadisticas_javier AS
SELECT 
    COUNT(*) as total_tickets,
    COUNT(*) FILTER (WHERE estado = 'Pendiente') as pendientes,
    COUNT(*) FILTER (WHERE estado = 'En proceso') as en_proceso,
    COUNT(*) FILTER (WHERE estado = 'Finalizado') as finalizados,
    COUNT(*) FILTER (WHERE prioridad = 'Crítica' AND estado != 'Finalizado') as criticos_pendientes,
    COUNT(*) FILTER (WHERE fecha_programada < NOW() AND estado != 'Finalizado') as vencidos,
    COUNT(*) FILTER (WHERE DATE(fecha_programada) = CURRENT_DATE AND estado != 'Finalizado') as hoy,
    COUNT(*) FILTER (WHERE DATE(fecha_programada) = CURRENT_DATE + 1 AND estado != 'Finalizado') as mañana,
    ROUND(AVG(EXTRACT(days FROM 
        CASE 
            WHEN estado = 'Finalizado' THEN fecha::timestamp - created_at
            ELSE NOW() - created_at
        END
    )), 1) as promedio_dias_resolucion
FROM mantenimientos 
WHERE tecnico_asignado = 'Javier Lopez';

COMMENT ON VIEW estadisticas_javier IS 'Estadísticas de productividad y carga de trabajo de Javier Lopez';

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Migración de auto-asignación completada';
    RAISE NOTICE '👨‍🔧 Técnico principal: Javier Lopez';
    RAISE NOTICE '🔧 Trigger de auto-asignación activado';
    RAISE NOTICE '📊 Vistas de seguimiento creadas';
    RAISE NOTICE '📈 Ejecutar: SELECT * FROM estadisticas_javier; para ver métricas';
END $$;