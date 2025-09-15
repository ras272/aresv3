-- Eliminar las políticas anteriores
DROP POLICY IF EXISTS "Los usuarios autenticados pueden ver transacciones sortly" ON transacciones_sortly;
DROP POLICY IF EXISTS "Los usuarios autenticados pueden insertar transacciones sortly" ON transacciones_sortly;
DROP POLICY IF EXISTS "Los usuarios autenticados pueden actualizar transacciones sortly" ON transacciones_sortly;
DROP POLICY IF EXISTS "Los usuarios autenticados pueden eliminar transacciones sortly" ON transacciones_sortly;

-- Crear políticas más permisivas que funcionan con el sistema ARES
CREATE POLICY "Permitir todas las operaciones para transacciones sortly" ON transacciones_sortly
  FOR ALL USING (true);

-- También podemos deshabilitar RLS temporalmente para esta tabla
-- ALTER TABLE transacciones_sortly DISABLE ROW LEVEL SECURITY;;
