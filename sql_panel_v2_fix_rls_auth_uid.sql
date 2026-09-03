-- Envuelve auth.uid() en (select auth.uid()) para que Postgres lo trate
-- como subplan inicial cacheado en vez de re-evaluarlo fila por fila
-- (warning "Auth RLS Initialization Plan" del Security Advisor).
-- Mismas condiciones que ya estaban, solo cambia esa envoltura.

-- alertas
alter policy "actualizar_propias_alertas" on public.alertas
  using (destinatario_id = (select auth.uid()))
  with check (destinatario_id = (select auth.uid()));

alter policy "borrar_propias_alertas" on public.alertas
  using (destinatario_id = (select auth.uid()));

alter policy "ver_propias_alertas" on public.alertas
  using (destinatario_id = (select auth.uid()));

-- clientes
alter policy "borrar_clientes" on public.clientes
  using (exists (select 1 from perfiles p where p.id = (select auth.uid()) and 'admin' = any(p.roles)));

-- eventos_calendario
alter policy "borrar_eventos" on public.eventos_calendario
  using (
    creado_por = (select auth.uid())
    or exists (select 1 from perfiles p where p.id = (select auth.uid()) and 'admin' = any(p.roles))
  );

alter policy "crear_eventos" on public.eventos_calendario
  with check (creado_por = (select auth.uid()));

alter policy "editar_eventos" on public.eventos_calendario
  using (
    creado_por = (select auth.uid())
    or responsable_id = (select auth.uid())
    or exists (select 1 from perfiles p where p.id = (select auth.uid()) and 'admin' = any(p.roles))
  );

alter policy "ver_eventos" on public.eventos_calendario
  using (
    visibilidad = 'equipo'
    or responsable_id = (select auth.uid())
    or creado_por = (select auth.uid())
    or exists (select 1 from perfiles p where p.id = (select auth.uid()) and 'admin' = any(p.roles))
  );

-- perfiles
alter policy "editar_propio_perfil" on public.perfiles
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
