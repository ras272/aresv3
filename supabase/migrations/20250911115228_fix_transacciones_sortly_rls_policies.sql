-- Eliminar las políticas anteriores
DROP POLICY IF EXISTS "Los usuarios autenticados pueden ver transacciones sortly" ON transacciones_sortly;
DROP POLICY IF EXISTS "Los usuarios autenticados pueden insertar transacciones sortly" ON transacciones_sortly;
DROP POLICY IF EXISTS "Los usuarios autenticados pueden actualizar transacciones sortly" ON transacciones_sortly;
DROP POLICY IF EXISTS "Los usuarios autenticados pueden eliminar transacciones sortly" ON transacciones_sortly;

-- Crear nuevas políticas correctas usando auth.uid()
CREATE POLICY "Los usuarios autenticados pueden ver transacciones sortly" ON transacciones_sortly
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Los usuarios autenticados pueden insertar transacciones sortly" ON transacciones_sortly
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Los usuarios autenticados pueden actualizar transacciones sortly" ON transacciones_sortly
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Los usuarios autenticados pueden eliminar transacciones sortly" ON transacciones_sortly
  FOR DELETE USING (auth.uid() IS NOT NULL);;
