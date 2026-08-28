-- Panel v2 — cierra el hueco de "Ranking de velocidad": trackea primer
-- contacto real (trigger, no depende de que el frontend lo llame a mano) y
-- reasignación automática de leads sin contactar por timeout ("soltados").
-- Todo en la base NUEVA (vdcpmbajlyqgohrwpkeo). Solo backend — el reporte
-- que lee esto se arma después.

-- Cuándo se reasignó cada cliente + a quién, para el conteo de "soltados"
-- por vendedor (no se borra nunca, aunque el lead pase a un tercero).
create table if not exists public.cliente_reasignaciones (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  vendedor_anterior_id uuid references public.perfiles(id),
  vendedor_nuevo_id uuid references public.perfiles(id),
  motivo text not null default 'timeout_sin_contactar',
  created_at timestamptz not null default now()
);

create index if not exists cliente_reasignaciones_cliente_idx on public.cliente_reasignaciones(cliente_id);
create index if not exists cliente_reasignaciones_vendedor_anterior_idx on public.cliente_reasignaciones(vendedor_anterior_id);

alter table public.cliente_reasignaciones enable row level security;

drop policy if exists "ver_reasignaciones" on public.cliente_reasignaciones;
create policy "ver_reasignaciones" on public.cliente_reasignaciones for select to authenticated using (true);

-- Marca cuándo fue la última reasignación automática, para no re-soltar el
-- mismo lead en cada corrida del cron antes de que pase otro ciclo completo.
alter table public.clientes add column if not exists ultima_reasignacion_en timestamptz;

-- Trigger: apenas un cliente sale de "sin_contactar" queda registrado el
-- primer contacto real en cliente_actividades — de ahí sale el "tiempo medio
-- en contestar" por vendedor, sin depender de que el frontend inserte nada.
create or replace function public.log_primer_contacto_cliente()
returns trigger
language plpgsql
as $$
begin
  if old.pipeline_stage = 'sin_contactar' and new.pipeline_stage <> 'sin_contactar' then
    insert into public.cliente_actividades (cliente_id, tipo, descripcion, autor_id, created_at)
    values (new.id, 'llamada', 'Primer contacto (automático)', new.vendedor_id, coalesce(new.ultimo_contacto, now()));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_log_primer_contacto on public.clientes;
create trigger trg_log_primer_contacto
  after update on public.clientes
  for each row
  execute function public.log_primer_contacto_cliente();

-- Reasigna leads "sin_contactar" que llevan más de `umbral_minutos` sin
-- respuesta, rotando entre vendedores disponibles del mismo canal_ingreso
-- (misma regla de cola separada walk-in / digital que usa el alta manual).
-- Corre por cron cada 10 minutos (ver cron.schedule más abajo).
create or replace function public.reasignar_leads_vencidos(umbral_minutos int default 60)
returns int
language plpgsql
as $$
declare
  fila record;
  candidato uuid;
  total int := 0;
begin
  for fila in
    select c.id, c.vendedor_id, c.canal_ingreso, c.created_at
    from public.clientes c
    where c.pipeline_stage = 'sin_contactar'
      and c.vendedor_id is not null
      and coalesce(c.ultima_reasignacion_en, c.created_at) < now() - (umbral_minutos || ' minutes')::interval
  loop
    -- vendedor del mismo canal, disponible, distinto del actual, con el
    -- lead más viejo de ese canal (mismo criterio de rotación del alta).
    select p.id into candidato
    from public.perfiles p
    left join public.disponibilidad_vendedor d on d.vendedor_id = p.id
    left join lateral (
      select max(cl.created_at) as ultimo
      from public.clientes cl
      where cl.vendedor_id = p.id and cl.canal_ingreso = fila.canal_ingreso
    ) u on true
    where p.activo = true
      and p.id <> fila.vendedor_id
      and (d.recibir_leads is null or d.recibir_leads = true)
    order by u.ultimo asc nulls first
    limit 1;

    if candidato is not null then
      insert into public.cliente_reasignaciones (cliente_id, vendedor_anterior_id, vendedor_nuevo_id)
      values (fila.id, fila.vendedor_id, candidato);

      update public.clientes
      set vendedor_id = candidato, ultima_reasignacion_en = now()
      where id = fila.id;

      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, mensaje, link)
      values (candidato, 'cliente', 'novedad', 'Te reasignaron un lead sin contactar', 'Pasó ' || umbral_minutos || ' minutos sin respuesta con el vendedor anterior.', '/panel-v2/clientes');

      total := total + 1;
    end if;
  end loop;

  return total;
end;
$$;

-- Habilita pg_cron (en Supabase suele venir disponible; si esta línea da
-- error de permisos, hay que activar la extensión "pg_cron" a mano desde
-- Database → Extensions en el dashboard y volver a correr solo el bloque de
-- abajo).
create extension if not exists pg_cron;

select cron.schedule(
  'reasignar-leads-vencidos',
  '*/10 * * * *',
  $$select public.reasignar_leads_vencidos(60)$$
) where not exists (select 1 from cron.job where jobname = 'reasignar-leads-vencidos');
