-- Phase 1 RLS hardening: anon read-only on core domain tables
-- This migration is intended to be applied after moving writes to server-side API routes.
-- It drops permissive policies and keeps only SELECT for anon; INSERT/UPDATE/DELETE remain denied for anon.

-- Helper DO block to safely apply per-table changes
-- Note: Adjust the table list to match your project if needed.

-- cargas_mercaderia
alter table if exists public.cargas_mercaderia enable row level security;
drop policy if exists "Enable all operations for all users" on public.cargas_mercaderia;
drop policy if exists "Allow all" on public.cargas_mercaderia;
drop policy if exists "Allow read to anon" on public.cargas_mercaderia;
create policy "Allow read to anon" on public.cargas_mercaderia for select using (true);
-- productos_carga
alter table if exists public.productos_carga enable row level security;
drop policy if exists "Enable all operations for all users" on public.productos_carga;
drop policy if exists "Allow all" on public.productos_carga;
drop policy if exists "Allow read to anon" on public.productos_carga;
create policy "Allow read to anon" on public.productos_carga for select using (true);
-- subitems
alter table if exists public.subitems enable row level security;
drop policy if exists "Enable all operations for all users" on public.subitems;
drop policy if exists "Allow all" on public.subitems;
drop policy if exists "Allow read to anon" on public.subitems;
create policy "Allow read to anon" on public.subitems for select using (true);
-- equipos
alter table if exists public.equipos enable row level security;
drop policy if exists "Enable all operations for all users" on public.equipos;
drop policy if exists "Allow all" on public.equipos;
drop policy if exists "Allow read to anon" on public.equipos;
create policy "Allow read to anon" on public.equipos for select using (true);
-- componentes_equipo
alter table if exists public.componentes_equipo enable row level security;
drop policy if exists "Enable all operations for all users" on public.componentes_equipo;
drop policy if exists "Allow all" on public.componentes_equipo;
drop policy if exists "Allow read to anon" on public.componentes_equipo;
create policy "Allow read to anon" on public.componentes_equipo for select using (true);
-- mantenimientos
alter table if exists public.mantenimientos enable row level security;
drop policy if exists "Enable all operations for all users" on public.mantenimientos;
drop policy if exists "Allow all" on public.mantenimientos;
drop policy if exists "Allow read to anon" on public.mantenimientos;
create policy "Allow read to anon" on public.mantenimientos for select using (true);
-- documentos_carga
alter table if exists public.documentos_carga enable row level security;
drop policy if exists "Enable all operations for all users" on public.documentos_carga;
drop policy if exists "Allow all" on public.documentos_carga;
drop policy if exists "Allow read to anon" on public.documentos_carga;
create policy "Allow read to anon" on public.documentos_carga for select using (true);
-- stock system
alter table if exists public.stock_items enable row level security;
drop policy if exists "Enable all operations for all users" on public.stock_items;
drop policy if exists "Allow all" on public.stock_items;
drop policy if exists "Allow read to anon" on public.stock_items;
create policy "Allow read to anon" on public.stock_items for select using (true);
alter table if exists public.movimientos_stock enable row level security;
drop policy if exists "Enable all operations for all users" on public.movimientos_stock;
drop policy if exists "Allow all" on public.movimientos_stock;
drop policy if exists "Allow read to anon" on public.movimientos_stock;
create policy "Allow read to anon" on public.movimientos_stock for select using (true);
alter table if exists public.ubicaciones_stock enable row level security;
drop policy if exists "Enable all operations for all users" on public.ubicaciones_stock;
drop policy if exists "Allow all" on public.ubicaciones_stock;
drop policy if exists "Allow read to anon" on public.ubicaciones_stock;
create policy "Allow read to anon" on public.ubicaciones_stock for select using (true);
alter table if exists public.alertas_stock enable row level security;
drop policy if exists "Enable all operations for all users" on public.alertas_stock;
drop policy if exists "Allow all" on public.alertas_stock;
drop policy if exists "Allow read to anon" on public.alertas_stock;
create policy "Allow read to anon" on public.alertas_stock for select using (true);
-- remisiones
alter table if exists public.remisiones enable row level security;
drop policy if exists "Enable all operations for all users" on public.remisiones;
drop policy if exists "Allow all" on public.remisiones;
drop policy if exists "Allow read to anon" on public.remisiones;
create policy "Allow read to anon" on public.remisiones for select using (true);
-- repuestos (if present)
alter table if exists public.repuestos_stock enable row level security;
drop policy if exists "Enable all operations for all users" on public.repuestos_stock;
drop policy if exists "Allow all" on public.repuestos_stock;
drop policy if exists "Allow read to anon" on public.repuestos_stock;
create policy "Allow read to anon" on public.repuestos_stock for select using (true);
alter table if exists public.movimientos_repuestos enable row level security;
drop policy if exists "Enable all operations for all users" on public.movimientos_repuestos;
drop policy if exists "Allow all" on public.movimientos_repuestos;
drop policy if exists "Allow read to anon" on public.movimientos_repuestos;
create policy "Allow read to anon" on public.movimientos_repuestos for select using (true);
alter table if exists public.repuestos_equipos enable row level security;
drop policy if exists "Enable all operations for all users" on public.repuestos_equipos;
drop policy if exists "Allow all" on public.repuestos_equipos;
drop policy if exists "Allow read to anon" on public.repuestos_equipos;
create policy "Allow read to anon" on public.repuestos_equipos for select using (true);
