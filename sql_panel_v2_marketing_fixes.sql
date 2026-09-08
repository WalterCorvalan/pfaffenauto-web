-- Paridad v1 -> v2 en Marketing (auditoría 2026-09-08):
-- 1) Pautas: campanas_marketing perdió la asignación por sucursal al migrar.
alter table public.campanas_marketing add column if not exists sucursal_id uuid references public.sucursales(id);
