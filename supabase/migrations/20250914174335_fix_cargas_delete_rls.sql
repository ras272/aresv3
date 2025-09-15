-- Dev: Allow anon DELETE on mercaderías domain tables to enable client-side deletions
ALTER TABLE IF EXISTS public.cargas_mercaderia ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.productos_carga ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subitems ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- cargas_mercaderia DELETE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='cargas_mercaderia' AND policyname='cargas_delete_anon'
  ) THEN
    CREATE POLICY "cargas_delete_anon" ON public.cargas_mercaderia FOR DELETE TO anon USING (true);
  END IF;

  -- productos_carga DELETE (in case manual deletion happens before cascade)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='productos_carga' AND policyname='productos_delete_anon'
  ) THEN
    CREATE POLICY "productos_delete_anon" ON public.productos_carga FOR DELETE TO anon USING (true);
  END IF;

  -- subitems DELETE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='subitems' AND policyname='subitems_delete_anon'
  ) THEN
    CREATE POLICY "subitems_delete_anon" ON public.subitems FOR DELETE TO anon USING (true);
  END IF;
END $$;