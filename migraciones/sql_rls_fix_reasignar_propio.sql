-- Corrige regresión: las políticas "restringir_escritura_ajena" de hoy
-- mezclaban "quién puede tocar la fila" (debe mirar el dueño ANTES del
-- cambio) con "a quién se la reasigna" (no debería importar si ya sos
-- dueño). Eso bloqueaba que un vendedor reasignara SU PROPIO lead/seña/venta
-- a un colega — la UI lo permite, RLS lo frenaba con error.
--
-- Separamos en 3 políticas por tabla:
--   INSERT: el creador debe auto-asignarse o dejar sin asignar (salvo
--           admin/encargado) — evita fabricar un registro a nombre de otro.
--   UPDATE: USING mira el dueño ACTUAL de la fila (antes del cambio);
--           WITH CHECK = true — si ya podés tocarla, el valor nuevo es libre,
--           incluida la reasignación a cualquier colega.
--   DELETE: mismo criterio que UPDATE en USING.

do $$
declare
  t text;
  col text;
  tablas_vendedor text[] := array['cotizaciones', 'senas', 'boletos_venta', 'whatsapp_conversaciones', 'instagram_conversaciones', 'web_chat_conversaciones'];
begin
  foreach t in array tablas_vendedor
  loop
    col := 'vendedor_id';
    execute format('drop policy if exists "restringir_escritura_ajena" on %I', t);
    execute format('drop policy if exists "restringir_insert_ajeno" on %I', t);
    execute format('drop policy if exists "restringir_update_ajeno" on %I', t);
    execute format('drop policy if exists "restringir_delete_ajeno" on %I', t);

    execute format(
      'create policy "restringir_insert_ajeno" on %I as restrictive for insert to authenticated ' ||
      'with check (%I is null or %I = auth.uid() or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in (''admin'', ''encargado'')))',
      t, col, col
    );
    execute format(
      'create policy "restringir_update_ajeno" on %I as restrictive for update to authenticated ' ||
      'using (%I is null or %I = auth.uid() or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in (''admin'', ''encargado''))) ' ||
      'with check (true)',
      t, col, col
    );
    execute format(
      'create policy "restringir_delete_ajeno" on %I as restrictive for delete to authenticated ' ||
      'using (%I is null or %I = auth.uid() or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in (''admin'', ''encargado'')))',
      t, col, col
    );
  end loop;
end $$;

do $$
begin
  drop policy if exists "restringir_escritura_ajena" on postventa_casos;
  drop policy if exists "restringir_insert_ajeno" on postventa_casos;
  drop policy if exists "restringir_update_ajeno" on postventa_casos;
  drop policy if exists "restringir_delete_ajeno" on postventa_casos;

  create policy "restringir_insert_ajeno" on postventa_casos as restrictive for insert to authenticated
    with check (asignado_a is null or asignado_a = auth.uid() or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin', 'encargado')));
  create policy "restringir_update_ajeno" on postventa_casos as restrictive for update to authenticated
    using (asignado_a is null or asignado_a = auth.uid() or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin', 'encargado')))
    with check (true);
  create policy "restringir_delete_ajeno" on postventa_casos as restrictive for delete to authenticated
    using (asignado_a is null or asignado_a = auth.uid() or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin', 'encargado')));

  drop policy if exists "restringir_escritura_ajena" on peritajes;
  drop policy if exists "restringir_insert_ajeno" on peritajes;
  drop policy if exists "restringir_update_ajeno" on peritajes;
  drop policy if exists "restringir_delete_ajeno" on peritajes;

  create policy "restringir_insert_ajeno" on peritajes as restrictive for insert to authenticated
    with check (realizado_por is null or realizado_por = auth.uid() or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin', 'encargado')));
  create policy "restringir_update_ajeno" on peritajes as restrictive for update to authenticated
    using (realizado_por is null or realizado_por = auth.uid() or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin', 'encargado')))
    with check (true);
  create policy "restringir_delete_ajeno" on peritajes as restrictive for delete to authenticated
    using (realizado_por is null or realizado_por = auth.uid() or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin', 'encargado')));
end $$;
