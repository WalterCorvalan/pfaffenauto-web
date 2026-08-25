-- documentacion_ventas no tiene columna de dueño propia (vendedor_id) — el
-- dueño real es el de la venta (boletos_venta.vendedor_id). Sin esto,
-- cualquier vendedor podía marcar "verificado" un documento de una venta
-- ajena. documentacion_ventas_archivos cuelga de documentacion_ventas (dos
-- saltos hasta boletos_venta), mismo criterio.

drop policy if exists "restringir_insert_ajeno" on documentacion_ventas;
drop policy if exists "restringir_update_ajeno" on documentacion_ventas;
drop policy if exists "restringir_delete_ajeno" on documentacion_ventas;

create policy "restringir_insert_ajeno" on documentacion_ventas as restrictive for insert to authenticated
  with check (
    exists (
      select 1 from boletos_venta b
      where b.id = venta_id
        and (b.vendedor_id is null or b.vendedor_id = auth.uid())
    )
    or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin', 'encargado'))
  );
create policy "restringir_update_ajeno" on documentacion_ventas as restrictive for update to authenticated
  using (
    exists (
      select 1 from boletos_venta b
      where b.id = venta_id
        and (b.vendedor_id is null or b.vendedor_id = auth.uid())
    )
    or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin', 'encargado'))
  )
  with check (true);
create policy "restringir_delete_ajeno" on documentacion_ventas as restrictive for delete to authenticated
  using (
    exists (
      select 1 from boletos_venta b
      where b.id = venta_id
        and (b.vendedor_id is null or b.vendedor_id = auth.uid())
    )
    or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin', 'encargado'))
  );

drop policy if exists "restringir_insert_ajeno" on documentacion_ventas_archivos;
drop policy if exists "restringir_update_ajeno" on documentacion_ventas_archivos;
drop policy if exists "restringir_delete_ajeno" on documentacion_ventas_archivos;

create policy "restringir_insert_ajeno" on documentacion_ventas_archivos as restrictive for insert to authenticated
  with check (
    exists (
      select 1 from documentacion_ventas d join boletos_venta b on b.id = d.venta_id
      where d.id = documento_id
        and (b.vendedor_id is null or b.vendedor_id = auth.uid())
    )
    or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin', 'encargado'))
  );
create policy "restringir_delete_ajeno" on documentacion_ventas_archivos as restrictive for delete to authenticated
  using (
    exists (
      select 1 from documentacion_ventas d join boletos_venta b on b.id = d.venta_id
      where d.id = documento_id
        and (b.vendedor_id is null or b.vendedor_id = auth.uid())
    )
    or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin', 'encargado'))
  );
