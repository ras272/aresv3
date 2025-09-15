-- Eliminar la constraint de clave foránea que causa el problema
ALTER TABLE transacciones_sortly 
DROP CONSTRAINT IF EXISTS transacciones_sortly_created_by_fkey;

-- Cambiar el tipo de la columna created_by para que sea un simple varchar
-- ya que no referencia la tabla auth.users sino que almacena el ID del usuario de nuestro sistema JWT
ALTER TABLE transacciones_sortly 
ALTER COLUMN created_by TYPE varchar(255);

-- Hacer la columna opcional
ALTER TABLE transacciones_sortly 
ALTER COLUMN created_by DROP NOT NULL;;
