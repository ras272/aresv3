-- Eliminar la constraint de tipo_documento ya que no la usaremos más
ALTER TABLE transacciones_sortly 
DROP CONSTRAINT IF EXISTS transacciones_sortly_tipo_documento_check;

-- Agregar los dos campos separados
ALTER TABLE transacciones_sortly 
ADD COLUMN factura_os varchar(100),
ADD COLUMN remision varchar(100);

-- Hacer opcional el campo tipo_documento existente (lo mantenemos por compatibilidad)
ALTER TABLE transacciones_sortly 
ALTER COLUMN tipo_documento DROP NOT NULL;;
