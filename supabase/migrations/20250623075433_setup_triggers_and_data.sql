-- ===============================================
-- TRIGGERS PARA UPDATED_AT
-- ===============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas
CREATE TRIGGER update_cargas_mercaderia_updated_at
    BEFORE UPDATE ON cargas_mercaderia
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_productos_carga_updated_at
    BEFORE UPDATE ON productos_carga
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subitems_updated_at
    BEFORE UPDATE ON subitems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_equipos_updated_at
    BEFORE UPDATE ON equipos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_componentes_equipo_updated_at
    BEFORE UPDATE ON componentes_equipo
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_mantenimientos_updated_at
    BEFORE UPDATE ON mantenimientos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===============================================
-- RLS (Row Level Security) - BÁSICO
-- ===============================================
-- Por ahora habilitamos RLS pero permitimos todo (para desarrollo)
-- En producción, ajustar según necesidades de seguridad

ALTER TABLE cargas_mercaderia ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos_carga ENABLE ROW LEVEL SECURITY;
ALTER TABLE subitems ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE componentes_equipo ENABLE ROW LEVEL SECURITY;
ALTER TABLE mantenimientos ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo (AJUSTAR EN PRODUCCIÓN)
CREATE POLICY "Enable all operations for all users" ON cargas_mercaderia FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON productos_carga FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON subitems FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON equipos FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON componentes_equipo FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON mantenimientos FOR ALL USING (true);;
