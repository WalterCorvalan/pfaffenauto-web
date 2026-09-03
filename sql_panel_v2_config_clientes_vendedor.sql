alter table public.configuracion_empresa
  add column if not exists cada_vendedor_ve_solo_sus_clientes boolean not null default false;

-- Con el toggle apagado, se comporta exactamente como antes (todos ven
-- todos los clientes). Prendido: admin y recepción siguen viendo todo, un
-- vendedor solo ve los suyos, y un cliente sin vendedor asignado no
-- aparece para ningún vendedor (vendedor_id = auth.uid() no matchea null).
alter policy "ver_clientes" on public.clientes
  using (
    not exists (select 1 from public.configuracion_empresa where id = true and cada_vendedor_ve_solo_sus_clientes = true)
    or exists (select 1 from public.perfiles p where p.id = (select auth.uid()) and (('admin' = any(p.roles)) or ('recepcion' = any(p.roles))))
    or vendedor_id = (select auth.uid())
  );
