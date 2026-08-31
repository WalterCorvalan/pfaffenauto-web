-- Panel v2 — Rodi: el chat del sitio público (distinto del bot de WhatsApp).
-- Revive la idea de v1 antes de que sql_borrar_web_chat.sql la borrara —
-- ahora con Claude y generando leads reales de nuevo. Solo backend: tablas,
-- pipeline y ronda de asignación. El widget visual y el panel de
-- Conversaciones en el CRM quedan para después.

create table if not exists public.rodi_conversaciones (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  nombre_contacto text,
  telefono_contacto text,
  email_contacto text,
  origen_pagina text,
  cliente_id uuid references public.clientes(id),
  vendedor_id uuid references public.perfiles(id),
  calificacion text check (calificacion in ('caliente', 'tibio', 'frio')),
  estado_lead text not null default 'nuevo' check (estado_lead in ('nuevo', 'asignado', 'calificando', 'convertido', 'perdido')),
  ai_habilitada boolean not null default true,
  handoff_at timestamptz,
  handoff_reason text,
  notas text,
  last_message_at timestamptz,
  unread_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rodi_conv_last_msg_idx on public.rodi_conversaciones(last_message_at desc);
create index if not exists rodi_conv_estado_lead_idx on public.rodi_conversaciones(estado_lead);

create table if not exists public.rodi_mensajes (
  id uuid primary key default gen_random_uuid(),
  conversacion_id uuid not null references public.rodi_conversaciones(id) on delete cascade,
  direccion text not null check (direccion in ('in', 'out')),
  texto text not null,
  ai_generado boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists rodi_msg_conv_idx on public.rodi_mensajes(conversacion_id);

alter table public.rodi_conversaciones enable row level security;
alter table public.rodi_mensajes enable row level security;

-- El staff (autenticado) ve y gestiona todo. El visitante del sitio NO tiene
-- sesión de Supabase — su lado lo maneja el API route con service role, no
-- RLS de cliente.
drop policy if exists "equipo_rodi_conversaciones" on public.rodi_conversaciones;
create policy "equipo_rodi_conversaciones" on public.rodi_conversaciones for all to authenticated using (true) with check (true);
drop policy if exists "equipo_rodi_mensajes" on public.rodi_mensajes;
create policy "equipo_rodi_mensajes" on public.rodi_mensajes for all to authenticated using (true) with check (true);

-- Ronda propia de Rodi (pool separado del de WhatsApp — mismo criterio:
-- entre los que reciben leads, el que hace más tiempo no recibe uno).
create or replace function public.asignar_vendedor_ronda_rodi()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  candidato uuid;
begin
  select p.id into candidato
  from public.perfiles p
  left join public.disponibilidad_vendedor d on d.vendedor_id = p.id
  left join lateral (
    select max(c.created_at) as ultimo
    from public.rodi_conversaciones c
    where c.vendedor_id = p.id
  ) u on true
  where p.activo = true
    and 'ventas' = any(p.roles)
    and (d.recibir_leads is null or d.recibir_leads = true)
  order by u.ultimo asc nulls first
  limit 1;

  return candidato;
end;
$$;

create or replace function public.asignar_vendedor_conversacion_rodi_nueva()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.vendedor_id is null then
    new.vendedor_id := public.asignar_vendedor_ronda_rodi();
    if new.vendedor_id is not null then
      new.estado_lead := 'asignado';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_asignar_vendedor_conversacion_rodi on public.rodi_conversaciones;
create trigger trg_asignar_vendedor_conversacion_rodi
  before insert on public.rodi_conversaciones
  for each row execute function public.asignar_vendedor_conversacion_rodi_nueva();

create or replace function public.avanzar_estado_lead_rodi()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.calificacion in ('caliente', 'tibio') and old.calificacion is distinct from new.calificacion
     and new.estado_lead in ('nuevo', 'asignado') then
    new.estado_lead := 'calificando';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_avanzar_estado_lead_rodi on public.rodi_conversaciones;
create trigger trg_avanzar_estado_lead_rodi
  before update of calificacion on public.rodi_conversaciones
  for each row execute function public.avanzar_estado_lead_rodi();

-- "Convertido" cuando el cliente vinculado cierra — mismo patrón que WhatsApp.
create or replace function public.marcar_lead_rodi_convertido()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.pipeline_stage = 'cerrado' and old.pipeline_stage is distinct from 'cerrado' then
    update public.rodi_conversaciones set estado_lead = 'convertido' where cliente_id = new.id and estado_lead <> 'convertido';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_marcar_lead_rodi_convertido on public.clientes;
create trigger trg_marcar_lead_rodi_convertido
  after update of pipeline_stage on public.clientes
  for each row execute function public.marcar_lead_rodi_convertido();

-- Alertas: nuevo mensaje entrante y handoff — mismo patrón que WhatsApp.
create or replace function public.rodi_notificar_mensaje_entrante()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vendedor_id uuid;
  v_nombre text;
  v_link text;
  v_titulo text;
  v_encargado record;
begin
  if new.direccion <> 'in' then
    return new;
  end if;

  select c.vendedor_id, coalesce(c.nombre_contacto, 'Visitante del sitio')
    into v_vendedor_id, v_nombre
  from public.rodi_conversaciones c
  where c.id = new.conversacion_id;

  v_link := '/panel-v2/rodi?conversacion=' || new.conversacion_id;
  v_titulo := v_nombre || ': ' || coalesce(left(new.texto, 80), 'envió un mensaje');

  -- Igual que WhatsApp: si el visitante manda varios mensajes seguidos, se
  -- actualiza la alerta sin leer en vez de apilar una por mensaje.
  if v_vendedor_id is not null then
    update public.alertas set titulo = v_titulo, created_at = now()
    where destinatario_id = v_vendedor_id and tipo = 'rodi_nuevo_mensaje' and link = v_link and leida = false;
    if not found then
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
      values (v_vendedor_id, 'rodi_nuevo_mensaje', 'media', v_titulo, v_link);
    end if;
  else
    for v_encargado in select id from public.perfiles where ('encargado' = any(roles) or 'admin' = any(roles)) and activo = true loop
      update public.alertas set titulo = v_titulo, created_at = now()
      where destinatario_id = v_encargado.id and tipo = 'rodi_nuevo_mensaje' and link = v_link and leida = false;
      if not found then
        insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
        values (v_encargado.id, 'rodi_nuevo_mensaje', 'media', v_titulo, v_link);
      end if;
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_rodi_mensaje_entrante on public.rodi_mensajes;
create trigger trg_rodi_mensaje_entrante
  after insert on public.rodi_mensajes
  for each row execute function public.rodi_notificar_mensaje_entrante();

create or replace function public.rodi_notificar_handoff()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_encargado record;
  v_link text;
begin
  if new.handoff_at is null or old.handoff_at is not null then
    return new;
  end if;

  v_link := '/panel-v2/rodi?conversacion=' || new.id;

  if new.vendedor_id is not null then
    insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
    values (new.vendedor_id, 'rodi_handoff', 'alta', 'El visitante del sitio pidió hablar con una persona', v_link);
  else
    for v_encargado in select id from public.perfiles where ('encargado' = any(roles) or 'admin' = any(roles)) and activo = true loop
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
      values (v_encargado.id, 'rodi_handoff', 'alta', 'El visitante del sitio pidió hablar con una persona', v_link);
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_rodi_handoff on public.rodi_conversaciones;
create trigger trg_rodi_handoff
  after update on public.rodi_conversaciones
  for each row execute function public.rodi_notificar_handoff();
