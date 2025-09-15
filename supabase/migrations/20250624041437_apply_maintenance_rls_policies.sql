-- ===============================================
-- POLÍTICAS RLS PARA MANTENIMIENTOS Y SUBITEMS
-- ===============================================

-- Políticas para mantenimientos
CREATE POLICY "Mantenimientos view policy" ON mantenimientos
    FOR SELECT USING (
        has_any_role(ARRAY['admin', 'gerente', 'vendedor', 'tecnico']::user_role[]) OR
        (has_role('cliente'::user_role) AND EXISTS (
            SELECT 1 FROM equipos 
            WHERE equipos.id = mantenimientos.equipo_id 
            AND equipos.cliente = (SELECT empresa FROM user_profiles WHERE id = auth.uid())
        ))
    );

CREATE POLICY "Mantenimientos create policy" ON mantenimientos
    FOR INSERT WITH CHECK (
        has_any_role(ARRAY['admin', 'gerente', 'tecnico']::user_role[]) OR
        (has_role('cliente'::user_role) AND EXISTS (
            SELECT 1 FROM equipos 
            WHERE equipos.id = mantenimientos.equipo_id 
            AND equipos.cliente = (SELECT empresa FROM user_profiles WHERE id = auth.uid())
        ))
    );

CREATE POLICY "Mantenimientos update policy" ON mantenimientos
    FOR UPDATE USING (
        has_any_role(ARRAY['admin', 'gerente', 'tecnico']::user_role[])
    );

CREATE POLICY "Mantenimientos delete policy" ON mantenimientos
    FOR DELETE USING (
        has_role('admin'::user_role)
    );

-- Políticas para subitems
CREATE POLICY "Subitems view policy" ON subitems
    FOR SELECT USING (
        has_any_role(ARRAY['admin', 'gerente', 'vendedor', 'tecnico']::user_role[])
    );

CREATE POLICY "Subitems create policy" ON subitems
    FOR INSERT WITH CHECK (
        has_any_role(ARRAY['admin', 'gerente', 'vendedor']::user_role[])
    );

CREATE POLICY "Subitems update policy" ON subitems
    FOR UPDATE USING (
        has_any_role(ARRAY['admin', 'gerente', 'vendedor']::user_role[])
    );

CREATE POLICY "Subitems delete policy" ON subitems
    FOR DELETE USING (
        has_role('admin'::user_role)
    );;
