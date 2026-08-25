-- Mismo hallazgo de siempre: cualquier vendedor podía editar el precio de un
-- presupuesto ajeno, o borrar un resp_civil ajeno. Mismo candado ya probado
-- en las otras 8 tablas — INSERT/UPDATE/DELETE separados para no repetir la
-- regresión de "no puedo reasignar lo mío a un colega".

do $$
declare
  t text;
  tablas text[] := array['presupuestos', 'resp_civil'];
begin
  foreach t in array tablas
  loop
    execute format('drop policy if exists "restringir_insert_ajeno" on %I', t);
    execute format('drop policy if exists "restringir_update_ajeno" on %I', t);
    execute format('drop policy if exists "restringir_delete_ajeno" on %I', t);

    execute format(
      'create policy "restringir_insert_ajeno" on %I as restrictive for insert to authenticated ' ||
      'with check (vendedor_id is null or vendedor_id = auth.uid() or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in (''admin'', ''encargado'')))',
      t
    );
    execute format(
      'create policy "restringir_update_ajeno" on %I as restrictive for update to authenticated ' ||
      'using (vendedor_id is null or vendedor_id = auth.uid() or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in (''admin'', ''encargado''))) ' ||
      'with check (true)',
      t
    );
    execute format(
      'create policy "restringir_delete_ajeno" on %I as restrictive for delete to authenticated ' ||
      'using (vendedor_id is null or vendedor_id = auth.uid() or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in (''admin'', ''encargado'')))',
      t
    );
  end loop;
end $$;
