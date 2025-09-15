-- Insertar clientes iniciales con números de WhatsApp
INSERT INTO clientes (nombre, telefono, whatsapp, email) VALUES
('ALEJANDRO BIBOLINI', '0981234567', '+595981234567', 'bibolini@email.com'),
('Ares Paraguay SRL', '0987654321', '+595987654321', 'contacto@aresparaguay.com')
ON CONFLICT DO NOTHING;

-- Agregar más clientes comunes
INSERT INTO clientes (nombre, telefono, whatsapp) VALUES
('Clínica Norte', '0981111111', '+595981111111'),
('Clínica Sur', '0981222222', '+595981222222'),
('Centro Médico Este', '0981333333', '+595981333333'),
('Dr. Martinez', '0981444444', '+595981444444'),
('Dr. Rodriguez', '0981555555', '+595981555555'),
('Clínica San Roque', '0981666666', '+595981666666')
ON CONFLICT DO NOTHING;;
