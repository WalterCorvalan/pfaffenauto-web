-- Auditoría (2026-09-03): liquidaciones_sueldo usa "using(true)" para
-- cualquier autenticado — cualquier empleado puede ver o editar el sueldo
-- y la liquidación de cualquier otro (incluida la propia, subiéndose el
-- total). Acá no aplica el patrón "dueño" de ventas/comisiones: el sueldo
-- de uno no lo debe poder tocar uno mismo, solo admin/finanzas. Restrictiva
-- sobre insert/update/delete; select queda igual (el liquidador ya lista
-- "liquidaciones generadas" para todos los empleados a quien tenga acceso
-- a la pantalla).

drop policy if exists "restringir_escritura_admin_finanzas" on public.liquidaciones_sueldo;
drop policy if exists "restringir_escritura_admin_finanzas_ins" on public.liquidaciones_sueldo;
drop policy if exists "restringir_escritura_admin_finanzas_upd" on public.liquidaciones_sueldo;
drop policy if exists "restringir_escritura_admin_finanzas_del" on public.liquidaciones_sueldo;

create policy "restringir_escritura_admin_finanzas_ins" on public.liquidaciones_sueldo as restrictive for insert to authenticated
with check (
  exists (select 1 from public.perfiles p where p.id = auth.uid() and ('admin' = any(p.roles) or 'finanzas' = any(p.roles)))
);
create policy "restringir_escritura_admin_finanzas_upd" on public.liquidaciones_sueldo as restrictive for update to authenticated
using (
  exists (select 1 from public.perfiles p where p.id = auth.uid() and ('admin' = any(p.roles) or 'finanzas' = any(p.roles)))
)
with check (
  exists (select 1 from public.perfiles p where p.id = auth.uid() and ('admin' = any(p.roles) or 'finanzas' = any(p.roles)))
);
create policy "restringir_escritura_admin_finanzas_del" on public.liquidaciones_sueldo as restrictive for delete to authenticated
using (
  exists (select 1 from public.perfiles p where p.id = auth.uid() and ('admin' = any(p.roles) or 'finanzas' = any(p.roles)))
);
