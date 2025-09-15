-- ===============================================
-- DATOS DE EJEMPLO
-- ===============================================
-- Insertar datos de ejemplo para pruebas
INSERT INTO cargas_mercaderia (codigo_carga, fecha_ingreso, destino, observaciones_generales) VALUES
('ENTRADA-20241201-001', '2024-12-01', 'Hospital Central - Cardiología', 'Carga completa de equipamiento Classys para ampliación del servicio'),
('ENTRADA-20241201-002', '2024-12-01', 'Clínica San José - UCI', 'Reposición mensual de filtros y repuestos');

-- ===============================================
-- VISTA ÚTIL: Resumen de cargas
-- ===============================================
CREATE VIEW vista_resumen_cargas AS
SELECT 
    c.id,
    c.codigo_carga,
    c.fecha_ingreso,
    c.destino,
    c.observaciones_generales,
    COUNT(p.id) as total_productos,
    COUNT(CASE WHEN p.tipo_producto = 'Equipo Médico' THEN 1 END) as equipos_medicos,
    COUNT(CASE WHEN p.tipo_producto = 'Insumo' THEN 1 END) as insumos,
    COUNT(CASE WHEN p.tipo_producto = 'Repuesto' THEN 1 END) as repuestos,
    c.created_at
FROM cargas_mercaderia c
LEFT JOIN productos_carga p ON c.id = p.carga_id
GROUP BY c.id, c.codigo_carga, c.fecha_ingreso, c.destino, c.observaciones_generales, c.created_at
ORDER BY c.created_at DESC;;
