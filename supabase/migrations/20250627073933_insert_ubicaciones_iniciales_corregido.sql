-- ===============================================
-- INSERTAR UBICACIONES INICIALES
-- ===============================================

INSERT INTO ubicaciones_stock (nombre, descripcion, codigo, tipo) VALUES
('Almacén Principal', 'Almacén principal de la empresa', 'ALM-001', 'Almacen'),
('Taller Técnico', 'Área de reparación y mantenimiento', 'TAL-001', 'Area'),
('Equipos en Campo', 'Equipos instalados en clientes', 'CAM-001', 'Area'),
('Área de Cuarentena', 'Productos en revisión o cuarentena', 'CUA-001', 'Area')
ON CONFLICT (codigo) DO NOTHING;;
