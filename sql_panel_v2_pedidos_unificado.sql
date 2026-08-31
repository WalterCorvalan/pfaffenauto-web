-- Panel v2 — Unifica "Pedidos" y "Pedidos (búsquedas de clientes)" en un
-- solo módulo: "Pedidos". Eran dos tablas separadas por una duda de scope de
-- v1 que ya no aplica — el usuario pidió lo mejor de las dos juntas. Ambas
-- tablas están vacías/solo con datos de prueba en este momento, así que no
-- hace falta migrar filas reales.
--
-- pedidos se queda con todo: cliente_id opcional (de "Pedidos" simple) +
-- reasignación/reconfirmación por ronda, wishlist, seña, gestión finalizada
-- (de "Pedidos búsquedas"). pedidos_busqueda y su tabla de reconfirmaciones
-- se eliminan.

alter table public.pedidos
  add column if not exists tipo text not null default 'avisame' check (tipo in ('avisame', 'busqueda')),
  add column if not exists reserva_senada boolean not null default false,
  add column if not exists wishlist boolean not null default false,
  add column if not exists gestion_finalizada boolean not null default false,
  add column if not exists contacto_confirmado_at timestamptz,
  add column if not exists ultima_reconfirmacion_at timestamptz,
  add column if not exists ultima_reasignacion_en timestamptz;

create table if not exists public.pedidos_reconfirmaciones (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  print_url text not null,
  nota text,
  autor_id uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create index if not exists pedidos_reconf_pedido_idx on public.pedidos_reconfirmaciones(pedido_id);

alter table public.pedidos_reconfirmaciones enable row level security;
drop policy if exists "equipo_pedidos_reconf" on public.pedidos_reconfirmaciones;
create policy "equipo_pedidos_reconf" on public.pedidos_reconfirmaciones for all to authenticated using (true) with check (true);

-- Reasignación por timeout sin "Confirmé contacto" — ahora sobre la tabla
-- unificada. Mismo cuerpo que tenía pedidos_busqueda, solo cambia la tabla.
create or replace function public.reasignar_pedidos_vencidos()
returns int
language plpgsql
as $$
declare
  fila record;
  candidato uuid;
  cfg record;
  total int := 0;
begin
  select * into cfg from public.configuracion_empresa where id = true;
  if cfg is null or cfg.reasignar_pedidos = false then
    return 0;
  end if;

  for fila in
    select p.id, p.vendedor_id, p.created_at
    from public.pedidos p
    where p.estado = 'activo'
      and p.gestion_finalizada = false
      and p.contacto_confirmado_at is null
      and p.vendedor_id is not null
      and coalesce(p.ultima_reasignacion_en, p.created_at) < now() - (cfg.plazo_reasignacion_pedidos_horas || ' hours')::interval
  loop
    select p.id into candidato
    from public.perfiles p
    left join public.disponibilidad_vendedor d on d.vendedor_id = p.id
    where p.activo = true
      and p.id <> fila.vendedor_id
      and (d.recibir_leads is null or d.recibir_leads = true)
    order by random()
    limit 1;

    if candidato is not null then
      update public.pedidos
      set vendedor_id = candidato, ultima_reasignacion_en = now(), contacto_confirmado_at = null
      where id = fila.id;

      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
      values (candidato, 'pedido_reasignado', 'novedad', 'Te reasignaron un pedido sin confirmar', '/panel-v2/pedidos?pedido=' || fila.id);

      total := total + 1;
    end if;
  end loop;

  return total;
end;
$$;

create or replace function public.chequear_reconfirmaciones_pedidos()
returns int
language plpgsql
as $$
declare
  fila record;
  candidato uuid;
  cfg record;
  total int := 0;
begin
  select * into cfg from public.configuracion_empresa where id = true;
  if cfg is null or cfg.reasignar_pedidos = false then
    return 0;
  end if;

  for fila in
    select p.id, p.vendedor_id, p.nombre_cliente,
      coalesce(p.ultima_reconfirmacion_at, p.contacto_confirmado_at, p.created_at) as base
    from public.pedidos p
    where p.estado = 'activo'
      and p.gestion_finalizada = false
      and p.vendedor_id is not null
  loop
    if fila.base < now() - (cfg.plazo_reconfirmacion_pedidos_dias * 2 || ' days')::interval then
      select p.id into candidato
      from public.perfiles p
      left join public.disponibilidad_vendedor d on d.vendedor_id = p.id
      where p.activo = true and p.id <> fila.vendedor_id and (d.recibir_leads is null or d.recibir_leads = true)
      order by random() limit 1;

      if candidato is not null then
        update public.pedidos
        set vendedor_id = candidato, ultima_reconfirmacion_at = null, contacto_confirmado_at = null
        where id = fila.id;

        insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
        values (candidato, 'pedido_reasignado', 'novedad', 'Te reasignaron un pedido sin reconfirmar', '/panel-v2/pedidos?pedido=' || fila.id);
        total := total + 1;
      end if;
    elsif fila.base < now() - (cfg.plazo_reconfirmacion_pedidos_dias || ' days')::interval then
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
      values (fila.vendedor_id, 'pedido_reconfirmar', 'media', 'Tenés que reconfirmar gestión de ' || fila.nombre_cliente, '/panel-v2/pedidos?pedido=' || fila.id);
      total := total + 1;
    end if;
  end loop;

  return total;
end;
$$;

-- pg_cron ya tenía los dos jobs agendados con estos nombres de función —
-- create or replace de arriba les cambia el cuerpo sin tocar el schedule.
-- Solo faltaba renombrar el job que corría sobre pedidos_busqueda al nombre
-- genérico si no existía ya (create or replace de función no crea el job).
select cron.schedule(
  'reasignar-pedidos-vencidos',
  '0 * * * *',
  $$select public.reasignar_pedidos_vencidos()$$
) where not exists (select 1 from cron.job where jobname = 'reasignar-pedidos-vencidos');

select cron.schedule(
  'chequear-reconfirmaciones-pedidos',
  '0 8 * * *',
  $$select public.chequear_reconfirmaciones_pedidos()$$
) where not exists (select 1 from cron.job where jobname = 'chequear-reconfirmaciones-pedidos');

-- Baja de lo viejo: trigger + función de match de pedidos_busqueda, su tabla
-- de reconfirmaciones, y la tabla en sí (vacía/solo test).
drop trigger if exists trg_pedidos_busqueda_detectar_match on public.vehiculos;
drop function if exists public.pedidos_busqueda_detectar_match();
drop table if exists public.pedidos_busqueda_reconfirmaciones;
drop table if exists public.pedidos_busqueda;
