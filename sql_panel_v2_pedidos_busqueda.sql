-- Panel v2 — "Pedidos (búsquedas de clientes)" (Comercial). Distinto del
-- módulo "Pedidos" a secas (Postventa, ya en sql_panel_v2_pedidos.sql):
-- acá el cliente se carga a mano (sin autocompletar de otro cliente), suma
-- reasignación + reconfirmación round-robin (mismo patrón que
-- sql_panel_v2_leads_velocidad.sql), wishlist y búsqueda formal con seña.

-- Config por empresa (singleton) — Configuración → Empresa → Reglas de leads.
-- Horas/días son calendario, no hábiles: la agenda hábil real queda para
-- cuando se necesite, igual que reasignar_leads_vencidos ya simplifica así.
create table if not exists public.configuracion_empresa (
  id boolean primary key default true check (id),
  reasignar_pedidos boolean not null default false,
  plazo_reasignacion_pedidos_horas int not null default 35,
  plazo_reconfirmacion_pedidos_dias int not null default 7,
  updated_at timestamptz not null default now()
);

alter table public.configuracion_empresa enable row level security;
drop policy if exists "equipo_config_empresa" on public.configuracion_empresa;
create policy "equipo_config_empresa" on public.configuracion_empresa for all to authenticated using (true) with check (true);

insert into public.configuracion_empresa (id) values (true) on conflict (id) do nothing;

create table if not exists public.pedidos_busqueda (
  id uuid primary key default gen_random_uuid(),
  nombre_cliente text not null,
  telefono text,
  marca text not null,
  modelo text,
  anio_desde int,
  anio_hasta int,
  presupuesto_max numeric,
  moneda text not null default 'USD' check (moneda in ('USD', 'ARS')),
  tipo text not null default 'avisame' check (tipo in ('avisame', 'busqueda')),
  reserva_senada boolean not null default false,
  notas text,
  vendedor_id uuid references public.perfiles(id),
  estado text not null default 'activo' check (estado in ('activo', 'cumplido', 'cancelado')),
  gestion_finalizada boolean not null default false,
  wishlist boolean not null default false,
  origen text not null default 'manual' check (origen in ('manual', 'web', 'instagram', 'whatsapp')),
  vehiculo_match_id uuid references public.vehiculos(id),
  vehiculo_cumplido_id uuid references public.vehiculos(id),
  match_detectado_at timestamptz,
  contacto_confirmado_at timestamptz,
  ultima_reconfirmacion_at timestamptz,
  ultima_reasignacion_en timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pedidos_busqueda_estado_idx on public.pedidos_busqueda(estado);
create index if not exists pedidos_busqueda_vendedor_idx on public.pedidos_busqueda(vendedor_id);

alter table public.pedidos_busqueda enable row level security;
drop policy if exists "equipo_pedidos_busqueda" on public.pedidos_busqueda;
create policy "equipo_pedidos_busqueda" on public.pedidos_busqueda for all to authenticated using (true) with check (true);

-- Historial de reconfirmaciones: print obligatorio + nota opcional.
create table if not exists public.pedidos_busqueda_reconfirmaciones (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos_busqueda(id) on delete cascade,
  print_url text not null,
  nota text,
  autor_id uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create index if not exists pedidos_busqueda_reconf_pedido_idx on public.pedidos_busqueda_reconfirmaciones(pedido_id);

alter table public.pedidos_busqueda_reconfirmaciones enable row level security;
drop policy if exists "equipo_pedidos_busqueda_reconf" on public.pedidos_busqueda_reconfirmaciones;
create policy "equipo_pedidos_busqueda_reconf" on public.pedidos_busqueda_reconfirmaciones for all to authenticated using (true) with check (true);

-- Match automático: mismo criterio que sql_panel_v2_pedidos.sql pero sobre
-- esta tabla — avisa una sola vez por pedido (match_detectado_at).
create or replace function public.pedidos_busqueda_detectar_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pedido record;
  v_link text;
  v_encargado record;
begin
  if new.estado not in ('disponible', 'reservado') then
    return new;
  end if;

  for v_pedido in
    select * from public.pedidos_busqueda
    where estado = 'activo'
      and vehiculo_match_id is null
      and marca ilike new.marca
      and (modelo is null or new.modelo ilike '%' || modelo || '%')
      and (anio_desde is null or new.anio >= anio_desde)
      and (anio_hasta is null or new.anio <= anio_hasta)
      and (presupuesto_max is null or moneda <> new.moneda_venta or new.precio_venta <= presupuesto_max)
  loop
    update public.pedidos_busqueda
      set vehiculo_match_id = new.id, match_detectado_at = now()
      where id = v_pedido.id;

    v_link := '/panel/pedidos-busqueda?pedido=' || v_pedido.id;

    if v_pedido.vendedor_id is not null then
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
      values (v_pedido.vendedor_id, 'pedido_busqueda_match', 'alta', 'Entró un auto para ' || v_pedido.nombre_cliente || ' (' || new.marca || ' ' || new.modelo || ')', v_link);
    else
      for v_encargado in select id from public.perfiles where ('encargado' = any(roles) or 'admin' = any(roles)) and activo = true loop
        insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
        values (v_encargado.id, 'pedido_busqueda_match', 'alta', 'Entró un auto para ' || v_pedido.nombre_cliente || ' (' || new.marca || ' ' || new.modelo || ')', v_link);
      end loop;
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_pedidos_busqueda_detectar_match on public.vehiculos;
create trigger trg_pedidos_busqueda_detectar_match
  after insert or update of estado, marca, modelo, anio, precio_venta, moneda_venta on public.vehiculos
  for each row execute function public.pedidos_busqueda_detectar_match();

-- Reasignación por timeout sin "Confirmé contacto" — solo corre si la empresa
-- prendió reasignar_pedidos. Rota al siguiente vendedor activo (round-robin
-- simple, igual criterio que reasignar_leads_vencidos).
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
    from public.pedidos_busqueda p
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
      update public.pedidos_busqueda
      set vendedor_id = candidato, ultima_reasignacion_en = now(), contacto_confirmado_at = null
      where id = fila.id;

      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
      values (candidato, 'pedido_reasignado', 'novedad', 'Te reasignaron un pedido sin confirmar', '/panel/pedidos-busqueda?pedido=' || fila.id);

      total := total + 1;
    end if;
  end loop;

  return total;
end;
$$;

create extension if not exists pg_cron;

select cron.schedule(
  'reasignar-pedidos-vencidos',
  '0 * * * *',
  $$select public.reasignar_pedidos_vencidos()$$
) where not exists (select 1 from cron.job where jobname = 'reasignar-pedidos-vencidos');

-- Reconfirmación vencida (plazo simple) y doble plazo (reasigna) — avisa por
-- campana al vendedor cuando se vence, y reasigna si pasa el doble sin acción.
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
    from public.pedidos_busqueda p
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
        update public.pedidos_busqueda
        set vendedor_id = candidato, ultima_reconfirmacion_at = null, contacto_confirmado_at = null
        where id = fila.id;

        insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
        values (candidato, 'pedido_reasignado', 'novedad', 'Te reasignaron un pedido sin reconfirmar', '/panel/pedidos-busqueda?pedido=' || fila.id);
        total := total + 1;
      end if;
    elsif fila.base < now() - (cfg.plazo_reconfirmacion_pedidos_dias || ' days')::interval then
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
      values (fila.vendedor_id, 'pedido_reconfirmar', 'media', 'Tenés que reconfirmar gestión de ' || fila.nombre_cliente, '/panel/pedidos-busqueda?pedido=' || fila.id);
      total := total + 1;
    end if;
  end loop;

  return total;
end;
$$;

select cron.schedule(
  'chequear-reconfirmaciones-pedidos',
  '0 8 * * *',
  $$select public.chequear_reconfirmaciones_pedidos()$$
) where not exists (select 1 from cron.job where jobname = 'chequear-reconfirmaciones-pedidos');
