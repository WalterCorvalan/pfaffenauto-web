-- La policy restrictive "restringir_editar_completo" (sql_rls_multimedia_vehiculos.sql,
-- ya aplicada) es "for all" -- eso incluye SELECT. Como las restrictive se
-- combinan con AND sobre cualquier policy permissive, terminaba bloqueando
-- hasta VER las fotos a cualquier usuario sin el permiso puntual
-- 'vehiculos.editar_completo' (la mayoría de los vendedores). El panel
-- mostraba el ícono de auto de relleno en vez de la miniatura real.
--
-- Fix: la restricción de permiso solo debe aplicar a escritura (insert/update/delete),
-- no a lectura -- cualquier usuario logueado puede VER fotos del stock.
drop policy if exists "restringir_editar_completo" on public.multimedia_vehiculos;

create policy "restringir_editar_completo"
  on public.multimedia_vehiculos as restrictive
  for insert
  to authenticated
  with check (public.tiene_permiso(auth.uid(), 'vehiculos.editar_completo'));

create policy "restringir_editar_completo_update"
  on public.multimedia_vehiculos as restrictive
  for update
  to authenticated
  using (public.tiene_permiso(auth.uid(), 'vehiculos.editar_completo'))
  with check (public.tiene_permiso(auth.uid(), 'vehiculos.editar_completo'));

create policy "restringir_editar_completo_delete"
  on public.multimedia_vehiculos as restrictive
  for delete
  to authenticated
  using (public.tiene_permiso(auth.uid(), 'vehiculos.editar_completo'));

drop policy if exists "authenticated_select_multimedia_vehiculos" on public.multimedia_vehiculos;

create policy "authenticated_select_multimedia_vehiculos"
  on public.multimedia_vehiculos
  for select
  to authenticated
  using (true);
