-- Dev: allow anon UPDATE on componentes_equipo to fix PGRST116 on update
ALTER TABLE IF EXISTS public.componentes_equipo ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='componentes_equipo' AND policyname='componentes_equipo_update_anon'
  ) THEN
    CREATE POLICY "componentes_equipo_update_anon" ON public.componentes_equipo
      FOR UPDATE TO anon USING (true);
  END IF;
END $$;