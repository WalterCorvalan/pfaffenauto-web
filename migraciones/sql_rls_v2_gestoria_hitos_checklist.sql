-- Auditoría sector Finanzas/Comercial (2026-09-09): app/panel-v2/gestoria/
-- GestoriaClient.tsx (toggleHito/toggleChecklist) escribe directo contra
-- expediente_hitos y expediente_checklist sin ningún chequeo de rol en el
-- cliente, y estas tablas no tienen ninguna política propia versionada en
-- migraciones/ (grep sin resultados) -- si RLS está en modo permisivo por
-- default o alguna política vieja quedó abierta, cualquier autenticado
-- puede marcar hitos/documentos de cualquier expediente como completados.
--
-- Mismo patrón que sql_rls_v2_ventas_comisiones.sql: política RESTRICTIVE
-- (AND con lo que ya exista) que solo permite escritura a los mismos roles
-- que ya pueden operar Gestoría en el resto del panel (page.tsx:
-- puedeVerLiquidacion = admin/finanzas/gestoria) + encargado, que también
-- ve el módulo en el sidebar (layout.tsx, modulo: "gestoria").

drop policy if exists "restringir_escritura_gestoria" on public.expediente_hitos;
create policy "restringir_escritura_gestoria" on public.expediente_hitos as restrictive for all to authenticated
using (
  exists (select 1 from public.perfiles p where p.id = auth.uid() and (
    'admin' = any(p.roles) or 'finanzas' = any(p.roles) or 'gestoria' = any(p.roles) or 'encargado' = any(p.roles)
  ))
)
with check (
  exists (select 1 from public.perfiles p where p.id = auth.uid() and (
    'admin' = any(p.roles) or 'finanzas' = any(p.roles) or 'gestoria' = any(p.roles) or 'encargado' = any(p.roles)
  ))
);

drop policy if exists "restringir_escritura_gestoria" on public.expediente_checklist;
create policy "restringir_escritura_gestoria" on public.expediente_checklist as restrictive for all to authenticated
using (
  exists (select 1 from public.perfiles p where p.id = auth.uid() and (
    'admin' = any(p.roles) or 'finanzas' = any(p.roles) or 'gestoria' = any(p.roles) or 'encargado' = any(p.roles)
  ))
)
with check (
  exists (select 1 from public.perfiles p where p.id = auth.uid() and (
    'admin' = any(p.roles) or 'finanzas' = any(p.roles) or 'gestoria' = any(p.roles) or 'encargado' = any(p.roles)
  ))
);

alter table public.expediente_hitos enable row level security;
alter table public.expediente_hitos force row level security;
alter table public.expediente_checklist enable row level security;
alter table public.expediente_checklist force row level security;
