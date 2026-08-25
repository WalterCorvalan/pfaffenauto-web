-- Mismo patrón de audit encontrado en postventa y peritajes: vendedor de
-- prueba pudo (1) robarse un caso de postventa ajeno (asignado_a), (2) borrar
-- eventos/notas de un caso ajeno, (3) editar un peritaje ajeno.

-- postventa_casos: mismo candado de ownership que cotizaciones/senas.
drop policy if exists "restringir_escritura_ajena" on postventa_casos;
create policy "restringir_escritura_ajena" on postventa_casos as restrictive for all to authenticated
using (
  asignado_a is null
  or asignado_a = auth.uid()
  or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin', 'encargado'))
)
with check (
  asignado_a is null
  or asignado_a = auth.uid()
  or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin', 'encargado'))
);

-- postventa_eventos: es historial de un caso (como historial_cambios) —
-- nadie edita/borra, solo se agrega.
drop policy if exists "postventa_eventos_bloquear_update" on postventa_eventos;
create policy "postventa_eventos_bloquear_update" on postventa_eventos as restrictive
  for update to authenticated using (false);

drop policy if exists "postventa_eventos_bloquear_delete" on postventa_eventos;
create policy "postventa_eventos_bloquear_delete" on postventa_eventos as restrictive
  for delete to authenticated using (false);

-- peritajes: ownership por realizado_por, igual que las demás operaciones.
drop policy if exists "restringir_escritura_ajena" on peritajes;
create policy "restringir_escritura_ajena" on peritajes as restrictive for all to authenticated
using (
  realizado_por is null
  or realizado_por = auth.uid()
  or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin', 'encargado'))
)
with check (
  realizado_por is null
  or realizado_por = auth.uid()
  or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin', 'encargado'))
);
