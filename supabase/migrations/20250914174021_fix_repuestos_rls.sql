-- Dev RLS policies for repuestos system (anon writes enabled)
ALTER TABLE IF EXISTS public.repuestos_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.movimientos_repuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.repuestos_equipos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- repuestos_stock
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='repuestos_stock' AND policyname='repuestos_stock_select_anon'
  ) THEN
    CREATE POLICY "repuestos_stock_select_anon" ON public.repuestos_stock FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='repuestos_stock' AND policyname='repuestos_stock_insert_anon'
  ) THEN
    CREATE POLICY "repuestos_stock_insert_anon" ON public.repuestos_stock FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='repuestos_stock' AND policyname='repuestos_stock_update_anon'
  ) THEN
    CREATE POLICY "repuestos_stock_update_anon" ON public.repuestos_stock FOR UPDATE TO anon USING (true);
  END IF;

  -- movimientos_repuestos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='movimientos_repuestos' AND policyname='movimientos_repuestos_select_anon'
  ) THEN
    CREATE POLICY "movimientos_repuestos_select_anon" ON public.movimientos_repuestos FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='movimientos_repuestos' AND policyname='movimientos_repuestos_insert_anon'
  ) THEN
    CREATE POLICY "movimientos_repuestos_insert_anon" ON public.movimientos_repuestos FOR INSERT TO anon WITH CHECK (true);
  END IF;

  -- repuestos_equipos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='repuestos_equipos' AND policyname='repuestos_equipos_select_anon'
  ) THEN
    CREATE POLICY "repuestos_equipos_select_anon" ON public.repuestos_equipos FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='repuestos_equipos' AND policyname='repuestos_equipos_insert_anon'
  ) THEN
    CREATE POLICY "repuestos_equipos_insert_anon" ON public.repuestos_equipos FOR INSERT TO anon WITH CHECK (true);
  END IF;
END $$;