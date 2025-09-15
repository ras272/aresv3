-- ===============================================
-- POLÍTICAS RLS PARA TABLAS DE NEGOCIO
-- ===============================================

-- Políticas para cargas_mercaderia
CREATE POLICY "Mercaderias view policy" ON cargas_mercaderia
    FOR SELECT USING (
        has_any_role(ARRAY['admin', 'gerente', 'vendedor', 'tecnico']::user_role[])
    );

CREATE POLICY "Mercaderias create policy" ON cargas_mercaderia
    FOR INSERT WITH CHECK (
        has_any_role(ARRAY['admin', 'gerente', 'vendedor']::user_role[])
    );

CREATE POLICY "Mercaderias update policy" ON cargas_mercaderia
    FOR UPDATE USING (
        has_any_role(ARRAY['admin', 'gerente', 'vendedor']::user_role[])
    );

CREATE POLICY "Mercaderias delete policy" ON cargas_mercaderia
    FOR DELETE USING (
        has_role('admin'::user_role)
    );

-- Políticas para productos_carga
CREATE POLICY "Productos view policy" ON productos_carga
    FOR SELECT USING (
        has_any_role(ARRAY['admin', 'gerente', 'vendedor', 'tecnico']::user_role[])
    );

CREATE POLICY "Productos create policy" ON productos_carga
    FOR INSERT WITH CHECK (
        has_any_role(ARRAY['admin', 'gerente', 'vendedor']::user_role[])
    );

CREATE POLICY "Productos update policy" ON productos_carga
    FOR UPDATE USING (
        has_any_role(ARRAY['admin', 'gerente', 'vendedor']::user_role[])
    );

CREATE POLICY "Productos delete policy" ON productos_carga
    FOR DELETE USING (
        has_role('admin'::user_role)
    );;
