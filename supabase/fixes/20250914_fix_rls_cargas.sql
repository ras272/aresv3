-- Fix 400 error (column "role" does not exist) on insert into cargas_mercaderia
-- Context: Policies referenced user_profiles.role; when missing/mismatched it breaks inserts.

-- 1) Make sure RLS is enabled (idempotent)
ALTER TABLE IF EXISTS public.cargas_mercaderia ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.productos_carga ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subitems ENABLE ROW LEVEL SECURITY;

-- 2) Add permissive policies for anon to unblock inserts from the app
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cargas_mercaderia' AND policyname = 'cargas_insert_anon'
  ) THEN
    CREATE POLICY "cargas_insert_anon" ON public.cargas_mercaderia
      FOR INSERT TO anon WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cargas_mercaderia' AND policyname = 'cargas_select_anon'
  ) THEN
    CREATE POLICY "cargas_select_anon" ON public.cargas_mercaderia
      FOR SELECT TO anon USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'productos_carga' AND policyname = 'productos_insert_anon'
  ) THEN
    CREATE POLICY "productos_insert_anon" ON public.productos_carga
      FOR INSERT TO anon WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'productos_carga' AND policyname = 'productos_select_anon'
  ) THEN
    CREATE POLICY "productos_select_anon" ON public.productos_carga
      FOR SELECT TO anon USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'subitems' AND policyname = 'subitems_insert_anon'
  ) THEN
    CREATE POLICY "subitems_insert_anon" ON public.subitems
      FOR INSERT TO anon WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'subitems' AND policyname = 'subitems_select_anon'
  ) THEN
    CREATE POLICY "subitems_select_anon" ON public.subitems
      FOR SELECT TO anon USING (true);
  END IF;
END $$;

-- 3) Optional: ensure helper enum/table exist to avoid future role-related errors
DO $$
BEGIN
  -- Create enum if missing
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin','gerente','vendedor','tecnico','cliente');
  END IF;

  -- Add column to user_profiles if the table and column are missing
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD COLUMN role user_role NOT NULL DEFAULT 'cliente';
  END IF;

  -- Add missing columns used by the app
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'productos_carga'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'productos_carga' AND column_name = 'para_servicio_tecnico'
  ) THEN
    ALTER TABLE public.productos_carga
      ADD COLUMN para_servicio_tecnico boolean DEFAULT false;
  END IF;
END $$;

-- NOTE: These policies are permissive to unblock development.
-- Tighten them later to use has_role()/has_any_role() once user_profiles.role is guaranteed.

-- 4) Stock system: allow anon writes needed by the UI flow
DO $$
BEGIN
  -- stock_items
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='stock_items' AND policyname='stock_items_insert_anon'
  ) THEN
    CREATE POLICY "stock_items_insert_anon" ON public.stock_items FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='stock_items' AND policyname='stock_items_update_anon'
  ) THEN
    CREATE POLICY "stock_items_update_anon" ON public.stock_items FOR UPDATE TO anon USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='stock_items' AND policyname='stock_items_select_anon'
  ) THEN
    CREATE POLICY "stock_items_select_anon" ON public.stock_items FOR SELECT TO anon USING (true);
  END IF;

  -- movimientos_stock (write-only operations from client)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='movimientos_stock' AND policyname='movimientos_insert_anon'
  ) THEN
    CREATE POLICY "movimientos_insert_anon" ON public.movimientos_stock FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='movimientos_stock' AND policyname='movimientos_select_anon'
  ) THEN
    CREATE POLICY "movimientos_select_anon" ON public.movimientos_stock FOR SELECT TO anon USING (true);
  END IF;

  -- transacciones_stock (some flows log to this table)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='transacciones_stock'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='transacciones_stock' AND policyname='transacciones_insert_anon'
    ) THEN
      CREATE POLICY "transacciones_insert_anon" ON public.transacciones_stock FOR INSERT TO anon WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='transacciones_stock' AND policyname='transacciones_select_anon'
    ) THEN
      CREATE POLICY "transacciones_select_anon" ON public.transacciones_stock FOR SELECT TO anon USING (true);
    END IF;
  END IF;
END $$;
