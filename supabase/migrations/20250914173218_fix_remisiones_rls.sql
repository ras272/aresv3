-- Dev RLS policies for remisiones module (anon writes enabled)
ALTER TABLE IF EXISTS public.remisiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.productos_remision ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- remisiones
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='remisiones' AND policyname='remisiones_select_anon'
  ) THEN
    CREATE POLICY "remisiones_select_anon" ON public.remisiones FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='remisiones' AND policyname='remisiones_insert_anon'
  ) THEN
    CREATE POLICY "remisiones_insert_anon" ON public.remisiones FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='remisiones' AND policyname='remisiones_update_anon'
  ) THEN
    CREATE POLICY "remisiones_update_anon" ON public.remisiones FOR UPDATE TO anon USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='remisiones' AND policyname='remisiones_delete_anon'
  ) THEN
    CREATE POLICY "remisiones_delete_anon" ON public.remisiones FOR DELETE TO anon USING (true);
  END IF;

  -- productos_remision
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='productos_remision'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='productos_remision' AND policyname='productos_remision_select_anon'
    ) THEN
      CREATE POLICY "productos_remision_select_anon" ON public.productos_remision FOR SELECT TO anon USING (true);
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='productos_remision' AND policyname='productos_remision_insert_anon'
    ) THEN
      CREATE POLICY "productos_remision_insert_anon" ON public.productos_remision FOR INSERT TO anon WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='productos_remision' AND policyname='productos_remision_update_anon'
    ) THEN
      CREATE POLICY "productos_remision_update_anon" ON public.productos_remision FOR UPDATE TO anon USING (true);
    END IF;
  END IF;
END $$;