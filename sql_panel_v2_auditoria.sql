-- Auditoría de nova: RLS, integridad de FKs, índices faltantes, cron jobs.
-- Función temporal de uso único (se puede borrar después con
-- `drop function public.panel_v2_audit();`) — no altera datos, solo lee.
create or replace function public.panel_v2_audit()
returns jsonb
language plpgsql
security definer  
set search_path = public
as $$
declare
  result jsonb;
  tablas jsonb := '[]'::jsonb;
  fks_sin_indice jsonb := '[]'::jsonb;
  huerfanos jsonb := '[]'::jsonb;
  cron_jobs jsonb := '[]'::jsonb;
  fila record;
  cnt bigint;
  q text;
begin
  -- 1) Tablas: filas reales, RLS, cantidad de políticas, políticas abiertas a anon.
  for fila in
    select c.relname as tabla, c.relrowsecurity as rls
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
    order by c.relname
  loop
    execute format('select count(*) from public.%I', fila.tabla) into cnt;
    tablas := tablas || jsonb_build_object(
      'tabla', fila.tabla,
      'filas', cnt,
      'rls_habilitado', fila.rls,
      'politicas', (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = fila.tabla),
      'politicas_para_anon', (
        select coalesce(array_agg(p.policyname), '{}')
        from pg_policies p
        where p.schemaname = 'public' and p.tablename = fila.tabla and 'anon' = any(p.roles)
      )
    );
  end loop;

  -- 2) Columnas FK sin índice propio (afecta performance de joins/deletes).
  select coalesce(jsonb_agg(jsonb_build_object(
      'tabla', con.conrelid::regclass::text,
      'columna', a.attname,
      'constraint', con.conname
    )), '[]'::jsonb)
  into fks_sin_indice
  from pg_constraint con
  join pg_attribute a on a.attrelid = con.conrelid and a.attnum = any(con.conkey)
  where con.contype = 'f'
    and con.connamespace = 'public'::regnamespace
    and not exists (
      select 1 from pg_index i
      where i.indrelid = con.conrelid and a.attnum = any(i.indkey)
    );

  -- 3) Filas huérfanas: FK con valor que no matchea ninguna fila del padre.
  for fila in
    select
      con.conname,
      con.conrelid::regclass::text as tabla_hija,
      a.attname as columna_hija,
      con.confrelid::regclass::text as tabla_padre,
      af.attname as columna_padre
    from pg_constraint con
    join pg_attribute a on a.attrelid = con.conrelid and a.attnum = con.conkey[1]
    join pg_attribute af on af.attrelid = con.confrelid and af.attnum = con.confkey[1]
    where con.contype = 'f' and con.connamespace = 'public'::regnamespace
      and array_length(con.conkey, 1) = 1
  loop
    q := format(
      'select count(*) from %s h where h.%I is not null and not exists (select 1 from %s p where p.%I = h.%I)',
      fila.tabla_hija, fila.columna_hija, fila.tabla_padre, fila.columna_padre, fila.columna_hija
    );
    execute q into cnt;
    if cnt > 0 then
      huerfanos := huerfanos || jsonb_build_object(
        'constraint', fila.conname, 'tabla', fila.tabla_hija, 'columna', fila.columna_hija,
        'referencia', fila.tabla_padre, 'filas_huerfanas', cnt
      );
    end if;
  end loop;

  -- 4) Cron jobs (si pg_cron está disponible).
  begin
    select coalesce(jsonb_agg(jsonb_build_object('jobname', jobname, 'schedule', schedule, 'active', active)), '[]'::jsonb)
    into cron_jobs from cron.job;
  exception when undefined_table then
    cron_jobs := '"pg_cron no disponible"'::jsonb;
  end;

  result := jsonb_build_object(
    'tablas', tablas,
    'fks_sin_indice', fks_sin_indice,
    'filas_huerfanas', huerfanos,
    'cron_jobs', cron_jobs
  );
  return result;
end;
$$;

-- Detalle de las políticas abiertas a anon (para confirmar que estén bien
-- acotadas, no un "using (true)" que expone toda la tabla).
create or replace function public.panel_v2_audit_policies_anon()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'tabla', tablename, 'politica', policyname, 'comando', cmd, 'using', qual, 'with_check', with_check
  )), '[]'::jsonb)
  from pg_policies
  where schemaname = 'public' and 'anon' = any(roles);
$$;
