-- ===============================================
-- POLÍTICAS RLS PARA EQUIPOS Y MANTENIMIENTOS
-- ===============================================

-- Políticas para equipos
CREATE POLICY "Equipos view policy" ON equipos
    FOR SELECT USING (
        has_any_role(ARRAY['admin', 'gerente', 'vendedor', 'tecnico']::user_role[]) OR
        (has_role('cliente'::user_role) AND cliente = (
            SELECT empresa FROM user_profiles WHERE id = auth.uid()
        ))
    );

CREATE POLICY "Equipos create policy" ON equipos
    FOR INSERT WITH CHECK (
        has_any_role(ARRAY['admin', 'gerente', 'tecnico']::user_role[])
    );

CREATE POLICY "Equipos update policy" ON equipos
    FOR UPDATE USING (
        has_any_role(ARRAY['admin', 'gerente', 'tecnico']::user_role[])
    );

CREATE POLICY "Equipos delete policy" ON equipos
    FOR DELETE USING (
        has_role('admin'::user_role)
    );

-- Políticas para componentes_equipo
CREATE POLICY "Componentes view policy" ON componentes_equipo
    FOR SELECT USING (
        has_any_role(ARRAY['admin', 'gerente', 'vendedor', 'tecnico']::user_role[]) OR
        (has_role('cliente'::user_role) AND EXISTS (
            SELECT 1 FROM equipos 
            WHERE equipos.id = componentes_equipo.equipo_id 
            AND equipos.cliente = (SELECT empresa FROM user_profiles WHERE id = auth.uid())
        ))
    );

CREATE POLICY "Componentes create policy" ON componentes_equipo
    FOR INSERT WITH CHECK (
        has_any_role(ARRAY['admin', 'gerente', 'tecnico']::user_role[])
    );

CREATE POLICY "Componentes update policy" ON componentes_equipo
    FOR UPDATE USING (
        has_any_role(ARRAY['admin', 'gerente', 'tecnico']::user_role[])
    );

CREATE POLICY "Componentes delete policy" ON componentes_equipo
    FOR DELETE USING (
        has_role('admin'::user_role)
    );;
