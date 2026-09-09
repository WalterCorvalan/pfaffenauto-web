-- Auditoría sector (2026-09-09): saldos_totales_por_moneda ya pasa a
-- SECURITY INVOKER (sql_rls_v2_rpcs_ranking_security_invoker.sql), pero
-- seguía devolviendo totales reales a un usuario descartable sin rol
-- porque cuentas/movimientos_caja no tienen ninguna política restrictiva
-- -- solo "equipo_cuentas"/"equipo_movimientos_caja" (ALL, using true,
-- with check true), abiertas a cualquier autenticado. La restricción que
-- se agregó en el proyecto viejo (sql_rls_critico_financiero.sql, mismo
-- hallazgo, mismo patrón) no está vigente en esta base -- nunca se corrió
-- acá o se pisó después.
--
-- RESTRICTIVE (AND con las permisivas existentes, no las reemplaza) para
-- limitar a admin/encargado/finanzas -- quienes realmente operan Cobros/
-- Tesorería/Liquidaciones -- igual patrón que sql_rls_v2_gestoria_hitos_
-- checklist.sql.

drop policy if exists "restringir_admin_encargado" on public.cuentas;
create policy "restringir_admin_encargado" on public.cuentas as restrictive for all to authenticated
using (
  exists (select 1 from public.perfiles p where p.id = auth.uid() and ('admin' = any(p.roles) or 'encargado' = any(p.roles) or 'finanzas' = any(p.roles)))
)
with check (
  exists (select 1 from public.perfiles p where p.id = auth.uid() and ('admin' = any(p.roles) or 'encargado' = any(p.roles) or 'finanzas' = any(p.roles)))
);

drop policy if exists "restringir_admin_encargado" on public.movimientos_caja;
create policy "restringir_admin_encargado" on public.movimientos_caja as restrictive for all to authenticated
using (
  exists (select 1 from public.perfiles p where p.id = auth.uid() and ('admin' = any(p.roles) or 'encargado' = any(p.roles) or 'finanzas' = any(p.roles)))
)
with check (
  exists (select 1 from public.perfiles p where p.id = auth.uid() and ('admin' = any(p.roles) or 'encargado' = any(p.roles) or 'finanzas' = any(p.roles)))
);
