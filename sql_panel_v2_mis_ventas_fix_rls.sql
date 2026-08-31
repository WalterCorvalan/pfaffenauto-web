-- Panel v2 — "Mis Ventas", fix: comision_tiers y premios_consignaciones se
-- crearon sin RLS (único gap encontrado en la auditoría de seguridad de
-- toda la base nova). Mismo patrón "equipo" que el resto del proyecto.

alter table public.comision_tiers enable row level security;
drop policy if exists "equipo_comision_tiers" on public.comision_tiers;
create policy "equipo_comision_tiers" on public.comision_tiers for all to authenticated using (true) with check (true);

alter table public.premios_consignaciones enable row level security;
drop policy if exists "equipo_premios_consignaciones" on public.premios_consignaciones;
create policy "equipo_premios_consignaciones" on public.premios_consignaciones for all to authenticated using (true) with check (true);
