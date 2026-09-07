-- Rate limiting durable (Finding #3 de la auditoría de seguridad 2026-09-07):
-- lib/rateLimit.ts usaba un Map en memoria de proceso, que en un deploy
-- serverless multi-instancia no frena nada en serio (cada instancia tiene
-- su propio contador). Esta tabla + función mueven el conteo a Postgres,
-- compartido por todas las instancias, con el incremento hecho de forma
-- atómica (una sola sentencia, sin race condition entre el select y el update).

create table if not exists rate_limits (
  clave text primary key,
  intentos integer not null default 1,
  vence_en timestamptz not null
);

alter table rate_limits enable row level security;
-- Sin policies: solo se accede con la service-role key desde el server,
-- que de por sí bypassea RLS. Cualquier acceso con la anon key queda negado.

create or replace function rate_limit_check(p_clave text, p_limite integer, p_ventana_ms bigint)
returns table(ok boolean, retry_after_seconds integer)
language plpgsql
security definer
as $$
declare
  v_ahora timestamptz := now();
  v_row rate_limits;
begin
  insert into rate_limits (clave, intentos, vence_en)
  values (p_clave, 1, v_ahora + (p_ventana_ms || ' milliseconds')::interval)
  on conflict (clave) do update set
    intentos = case
      when rate_limits.vence_en < v_ahora then 1
      else rate_limits.intentos + 1
    end,
    vence_en = case
      when rate_limits.vence_en < v_ahora then v_ahora + (p_ventana_ms || ' milliseconds')::interval
      else rate_limits.vence_en
    end
  returning * into v_row;

  if v_row.intentos > p_limite then
    return query select false, greatest(1, ceil(extract(epoch from (v_row.vence_en - v_ahora)))::integer);
  else
    return query select true, 0;
  end if;
end;
$$;

-- Housekeeping opcional: borra entradas vencidas hace rato (correr cada tanto,
-- ej. desde un cron de Supabase, no es indispensable porque la tabla es chica).
create or replace function rate_limits_limpiar_vencidos()
returns void
language sql
as $$
  delete from rate_limits where vence_en < now() - interval '1 day';
$$;
