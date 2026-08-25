-- CRÍTICO (2026-08-25): probado con un vendedor de prueba sin privilegios.
-- Pudo, con su propia sesión normal:
--   1) UPDATE perfiles SET rol='admin' WHERE id=el suyo → se autopromovió admin.
--   2) INSERT en usuario_permisos otorgándose permisos extra.
--   3) UPDATE whatsapp_conversaciones SET vendedor_id=el suyo en un chat ajeno
--      → robo de conversación, mismo patrón que ya arreglamos en
--      cotizaciones/senas/boletos_venta.
-- La (1) es la más grave: con rol=admin la app entera queda abierta,
-- cualquier otra política que dependa de "rol=admin" deja de proteger nada.

-- ===== A) Nadie que no sea admin puede cambiar rol (ni el propio) =====
-- RLS no puede comparar NEW vs OLD directamente, así que usamos un trigger:
-- columna protegida, no fila protegida.
create or replace function public.proteger_cambio_rol()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.rol is distinct from old.rol then
    if not exists (
      select 1 from public.perfiles p
      where p.id = auth.uid() and p.rol = 'admin'
    ) then
      raise exception 'Solo un admin puede cambiar el rol de un usuario.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_proteger_cambio_rol on public.perfiles;
create trigger trg_proteger_cambio_rol
  before update on public.perfiles
  for each row
  execute function public.proteger_cambio_rol();

-- ===== B) usuario_permisos: solo admin escribe =====
drop policy if exists "restringir_usuario_permisos" on usuario_permisos;
create policy "restringir_usuario_permisos" on usuario_permisos as restrictive for all to authenticated
using (
  exists (select 1 from perfiles p where p.id = auth.uid() and p.rol = 'admin')
)
with check (
  exists (select 1 from perfiles p where p.id = auth.uid() and p.rol = 'admin')
);

-- ===== C) Conversaciones (WA/IG/Web Chat): mismo candado que cotizaciones =====
do $$
declare
  t text;
begin
  foreach t in array array['whatsapp_conversaciones', 'instagram_conversaciones', 'web_chat_conversaciones']
  loop
    execute format('drop policy if exists "restringir_escritura_ajena" on %I', t);
    execute format(
      'create policy "restringir_escritura_ajena" on %I as restrictive for all to authenticated ' ||
      'using (' ||
      '  vendedor_id is null' ||
      '  or vendedor_id = auth.uid()' ||
      '  or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in (''admin'', ''encargado''))' ||
      ') ' ||
      'with check (' ||
      '  vendedor_id is null' ||
      '  or vendedor_id = auth.uid()' ||
      '  or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in (''admin'', ''encargado''))' ||
      ')',
      t
    );
  end loop;
end $$;
