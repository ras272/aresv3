-- ===============================================
-- MIGRAR COMPONENTES EXISTENTES AL SISTEMA STOCK
-- ===============================================

-- Función para migrar componentes_disponibles a stock_items
CREATE OR REPLACE FUNCTION migrar_componentes_a_stock()
RETURNS TABLE(migrados INTEGER, errores INTEGER) AS $$
DECLARE
    componente_record RECORD;
    stock_item_id UUID;
    contador_migrados INTEGER := 0;
    contador_errores INTEGER := 0;
    ubicacion_temp_id UUID;
BEGIN
    -- Obtener ubicación temporal para items sin ubicación específica
    SELECT id INTO ubicacion_temp_id 
    FROM ubicaciones_stock 
    WHERE codigo = 'ALMACEN-TEMP' 
    LIMIT 1;
    
    -- Migrar cada componente disponible
    FOR componente_record IN 
        SELECT * FROM componentes_disponibles 
        WHERE id NOT IN (SELECT componente_disponible_id FROM stock_items WHERE componente_disponible_id IS NOT NULL)
    LOOP
        BEGIN
            -- Crear item en stock
            INSERT INTO stock_items (
                componente_disponible_id,
                codigo_item,
                nombre,
                marca,
                modelo,
                numero_serie,
                cantidad_actual,
                cantidad_minima,
                ubicacion_id,
                estado,
                fecha_ingreso,
                codigo_carga_origen,
                producto_carga_id,
                observaciones
            ) VALUES (
                componente_record.id,
                generar_codigo_item(componente_record.marca, componente_record.modelo, componente_record.fecha_ingreso),
                componente_record.nombre,
                componente_record.marca,
                componente_record.modelo,
                componente_record.numero_serie,
                componente_record.cantidad_disponible,
                CASE 
                    WHEN componente_record.tipo_componente LIKE '%Cartucho%' OR componente_record.tipo_componente LIKE '%Insumo%' THEN 5
                    WHEN componente_record.tipo_componente LIKE '%Repuesto%' THEN 2
                    ELSE 1
                END, -- cantidad_minima basada en tipo
                COALESCE(
                    (SELECT id FROM ubicaciones_stock WHERE nombre LIKE '%' || COALESCE(componente_record.ubicacion_fisica, 'Temporal') || '%' LIMIT 1),
                    ubicacion_temp_id
                ),
                CASE componente_record.estado
                    WHEN 'Disponible' THEN 'Disponible'::estado_stock
                    WHEN 'Asignado' THEN 'En_uso'::estado_stock
                    WHEN 'Dañado' THEN 'Dañado'::estado_stock
                    ELSE 'Disponible'::estado_stock
                END,
                componente_record.fecha_ingreso,
                componente_record.codigo_carga_origen,
                componente_record.producto_carga_id,
                componente_record.observaciones
            ) RETURNING id INTO stock_item_id;
            
            -- Registrar movimiento inicial
            PERFORM registrar_movimiento_stock(
                stock_item_id,
                'Entrada'::tipo_movimiento_stock,
                componente_record.cantidad_disponible,
                'Migración automática desde componentes_disponibles',
                NULL,
                NULL,
                'Sistema - Migración'
            );
            
            contador_migrados := contador_migrados + 1;
            
        EXCEPTION WHEN OTHERS THEN
            contador_errores := contador_errores + 1;
            -- Registrar error en logs si es necesario
            RAISE NOTICE 'Error migrando componente %: %', componente_record.id, SQLERRM;
        END;
    END LOOP;
    
    RETURN QUERY SELECT contador_migrados, contador_errores;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar migración automática
SELECT * FROM migrar_componentes_a_stock();

-- ===============================================
-- FUNCIÓN: Sincronizar stock con componentes_disponibles
-- ===============================================
CREATE OR REPLACE FUNCTION sincronizar_stock_componentes()
RETURNS VOID AS $$
BEGIN
    -- Actualizar cantidad_disponible en componentes_disponibles basado en stock_items
    UPDATE componentes_disponibles 
    SET cantidad_disponible = s.cantidad_actual,
        estado = CASE 
            WHEN s.cantidad_actual > 0 AND s.estado = 'Disponible' THEN 'Disponible'
            WHEN s.cantidad_actual = 0 THEN 'Agotado'
            WHEN s.estado = 'En_uso' THEN 'Asignado'
            WHEN s.estado = 'Dañado' THEN 'Dañado'
            ELSE 'Disponible'
        END,
        updated_at = NOW()
    FROM stock_items s
    WHERE componentes_disponibles.id = s.componente_disponible_id;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- TRIGGER: Sincronización automática al actualizar stock
-- ===============================================
CREATE OR REPLACE FUNCTION trigger_sincronizar_componentes()
RETURNS TRIGGER AS $$
BEGIN
    -- Sincronizar componente relacionado
    IF NEW.componente_disponible_id IS NOT NULL THEN
        UPDATE componentes_disponibles 
        SET cantidad_disponible = NEW.cantidad_actual,
            estado = CASE 
                WHEN NEW.cantidad_actual > 0 AND NEW.estado = 'Disponible' THEN 'Disponible'
                WHEN NEW.cantidad_actual = 0 THEN 'Agotado'
                WHEN NEW.estado = 'En_uso' THEN 'Asignado'
                WHEN NEW.estado = 'Dañado' THEN 'Dañado'
                ELSE 'Disponible'
            END,
            updated_at = NOW()
        WHERE id = NEW.componente_disponible_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_stock_items_sync
    AFTER UPDATE ON stock_items
    FOR EACH ROW EXECUTE FUNCTION trigger_sincronizar_componentes();

-- ===============================================
-- FUNCIÓN: Generar códigos QR para items
-- ===============================================
CREATE OR REPLACE FUNCTION generar_qr_para_stock_items()
RETURNS INTEGER AS $$
DECLARE
    item_record RECORD;
    contador INTEGER := 0;
    qr_data TEXT;
BEGIN
    FOR item_record IN 
        SELECT id, codigo_item, nombre FROM stock_items WHERE codigo_qr IS NULL
    LOOP
        -- Generar datos del QR con información del item
        qr_data := jsonb_build_object(
            'tipo', 'stock_item',
            'id', item_record.id,
            'codigo', item_record.codigo_item,
            'nombre', item_record.nombre,
            'timestamp', extract(epoch from now())
        )::text;
        
        -- Actualizar item con datos del QR
        UPDATE stock_items 
        SET codigo_qr = qr_data,
            updated_at = NOW()
        WHERE id = item_record.id;
        
        contador := contador + 1;
    END LOOP;
    
    RETURN contador;
END;
$$ LANGUAGE plpgsql;

-- Generar códigos QR para items existentes
SELECT generar_qr_para_stock_items() as qr_generados;

-- ===============================================
-- FUNCIÓN: Ejecutar verificación de alertas automáticamente
-- ===============================================
CREATE OR REPLACE FUNCTION ejecutar_verificacion_alertas()
RETURNS TABLE(alertas_creadas INTEGER) AS $$
DECLARE
    alertas_antes INTEGER;
    alertas_despues INTEGER;
BEGIN
    -- Contar alertas antes
    SELECT COUNT(*) INTO alertas_antes FROM alertas_stock WHERE activa = TRUE;
    
    -- Ejecutar verificación
    PERFORM verificar_alertas_stock();
    
    -- Contar alertas después
    SELECT COUNT(*) INTO alertas_despues FROM alertas_stock WHERE activa = TRUE;
    
    RETURN QUERY SELECT (alertas_despues - alertas_antes);
END;
$$ LANGUAGE plpgsql;

-- Ejecutar verificación inicial de alertas
SELECT * FROM ejecutar_verificacion_alertas();

-- ===============================================
-- VISTAS ADICIONALES PARA EL DASHBOARD
-- ===============================================

-- Vista: Stock crítico (cantidad mínima)
CREATE VIEW vista_stock_critico AS
SELECT 
    s.id,
    s.codigo_item,
    s.nombre,
    s.marca,
    s.modelo,
    s.cantidad_actual,
    s.cantidad_minima,
    u.nombre as ubicacion,
    u.codigo as codigo_ubicacion,
    (s.cantidad_minima - s.cantidad_actual) as deficit
FROM stock_items s
LEFT JOIN ubicaciones_stock u ON s.ubicacion_id = u.id
WHERE s.cantidad_actual <= s.cantidad_minima
AND s.estado = 'Disponible'
ORDER BY (s.cantidad_minima - s.cantidad_actual) DESC;

-- Vista: Movimientos recientes
CREATE VIEW vista_movimientos_recientes AS
SELECT 
    m.id,
    m.fecha_movimiento,
    m.tipo_movimiento,
    s.nombre as item_nombre,
    s.codigo_item,
    m.cantidad,
    uo.nombre as ubicacion_origen,
    ud.nombre as ubicacion_destino,
    m.motivo,
    m.usuario_responsable,
    e.cliente as equipo_cliente
FROM movimientos_stock m
JOIN stock_items s ON m.stock_item_id = s.id
LEFT JOIN ubicaciones_stock uo ON m.ubicacion_origen_id = uo.id
LEFT JOIN ubicaciones_stock ud ON m.ubicacion_destino_id = ud.id
LEFT JOIN equipos e ON m.equipo_destino_id = e.id
ORDER BY m.fecha_movimiento DESC;

-- Vista: Alertas activas con prioridad
CREATE VIEW vista_alertas_activas AS
SELECT 
    a.id,
    a.tipo_alerta,
    a.titulo,
    a.mensaje,
    a.prioridad,
    s.nombre as item_nombre,
    s.codigo_item,
    u.nombre as ubicacion,
    a.fecha_creacion,
    a.fecha_limite,
    CASE 
        WHEN a.fecha_limite IS NOT NULL AND a.fecha_limite < NOW() THEN TRUE
        ELSE FALSE
    END as vencida
FROM alertas_stock a
JOIN stock_items s ON a.stock_item_id = s.id
LEFT JOIN ubicaciones_stock u ON s.ubicacion_id = u.id
WHERE a.activa = TRUE
ORDER BY 
    CASE a.prioridad 
        WHEN 'Crítica' THEN 1
        WHEN 'Alta' THEN 2
        WHEN 'Media' THEN 3
        ELSE 4
    END,
    a.fecha_creacion ASC;

COMMENT ON VIEW vista_stock_critico IS 'Items con stock por debajo del mínimo';
COMMENT ON VIEW vista_movimientos_recientes IS 'Historial de movimientos de stock ordenado por fecha';
COMMENT ON VIEW vista_alertas_activas IS 'Alertas activas ordenadas por prioridad';

-- ===============================================
-- POLÍTICAS RLS (Row Level Security)
-- ===============================================
ALTER TABLE ubicaciones_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_stock ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo (AJUSTAR EN PRODUCCIÓN)
CREATE POLICY "Enable all operations for all users" ON ubicaciones_stock FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON stock_items FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON movimientos_stock FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON alertas_stock FOR ALL USING (true);;
