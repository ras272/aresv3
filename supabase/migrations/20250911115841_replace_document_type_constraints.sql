-- Eliminar la constraint antigua
ALTER TABLE transacciones_sortly 
DROP CONSTRAINT transacciones_sortly_tipo_documento_check;

-- Actualizar los datos existentes para usar los nuevos tipos
UPDATE transacciones_sortly 
SET tipo_documento = 'FACTURA/OS' 
WHERE tipo_documento IN ('Factura', 'Facturas');

UPDATE transacciones_sortly 
SET tipo_documento = 'REMISIÓN' 
WHERE tipo_documento IN ('REM', 'Remisión', 'Remision', 'Orden de Servicio', 'Otro');

-- Crear la nueva constraint con solo los dos tipos requeridos
ALTER TABLE transacciones_sortly 
ADD CONSTRAINT transacciones_sortly_tipo_documento_check 
CHECK (tipo_documento IN ('FACTURA/OS', 'REMISIÓN'));;
