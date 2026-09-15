-- Corrige la visibilidad por sector del rol "encargado" en
-- Configuración → Empresa → Visibilidad por sector:
--
-- - Clientes: pasa a visible (el encargado no lo veía).
-- - Finanzas, Cobros, Tesorería, Liquidaciones, Mis Comisiones, Reportes:
--   pasan a NO visibles para el sector encargado.
--
-- Correr una sola vez en el editor SQL de Supabase (proyecto v2/nova).

insert into public.visibilidad_sector (modulo, sector, visible)
values ('clientes', 'encargado', true)
on conflict (modulo, sector) do update set visible = true;

insert into public.visibilidad_sector (modulo, sector, visible)
values
  ('finanzas', 'encargado', false),
  ('cobros', 'encargado', false),
  ('tesoreria', 'encargado', false),
  ('liquidaciones', 'encargado', false),
  ('comisiones', 'encargado', false),
  ('reportes', 'encargado', false)
on conflict (modulo, sector) do update set visible = false;
