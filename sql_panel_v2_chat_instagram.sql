-- Panel v2 — completa el módulo de chat (WhatsApp + Instagram) para calzar
-- con /panel/chat de v1: notas por conversación, credenciales cifradas
-- completas (faltaban iv/tag), y todo el lado de Instagram que v2 no tenía.

-- 1) whatsapp_conversaciones.notas — v1 lo tiene, v2 no lo había sumado.
alter table public.whatsapp_conversaciones add column if not exists notas text;

-- 2) whatsapp_configuracion — token_cifrado guardaba solo el cipher; a
-- lib/crypto.ts también le hacen falta iv y tag para poder desencriptar.
alter table public.whatsapp_configuracion
  add column if not exists token_iv text,
  add column if not exists token_tag text;

-- 3) Instagram — mismas tablas que WhatsApp, mismo patrón.
create table if not exists public.instagram_contactos (
  id uuid primary key default gen_random_uuid(),
  ig_user_id text not null unique,
  username text,
  cliente_id uuid references public.clientes(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.instagram_conversaciones (
  id uuid primary key default gen_random_uuid(),
  contacto_id uuid not null references public.instagram_contactos(id) on delete cascade,
  vendedor_id uuid references public.perfiles(id),
  vehiculo_id uuid references public.vehiculos(id) on delete set null,
  cliente_id uuid references public.clientes(id),
  calificacion text check (calificacion in ('caliente', 'tibio', 'frio')),
  estado_pipeline text check (estado_pipeline is null or estado_pipeline in ('sin_contactar', 'contactado', 'visita', 'negociacion', 'cerrado', 'perdido')),
  notas text,
  last_message_at timestamptz,
  unread_count int not null default 0,
  ai_habilitada boolean not null default true,
  handoff_at timestamptz,
  handoff_reason text,
  origen_ads text,
  last_inbound_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists instagram_conv_last_msg_idx on public.instagram_conversaciones(last_message_at desc);

create table if not exists public.instagram_mensajes (
  id uuid primary key default gen_random_uuid(),
  conversacion_id uuid not null references public.instagram_conversaciones(id) on delete cascade,
  direccion text not null check (direccion in ('in', 'out')),
  tipo text not null default 'text',
  texto text,
  status text not null default 'pending',
  ai_generado boolean not null default false,
  ig_message_id text,
  created_at timestamptz not null default now()
);

create unique index if not exists instagram_msg_ig_id_idx on public.instagram_mensajes(ig_message_id) where ig_message_id is not null;
create index if not exists instagram_msg_conv_idx on public.instagram_mensajes(conversacion_id);

create table if not exists public.instagram_configuracion (
  id boolean primary key default true check (id),
  ig_user_id text,
  token_cifrado text,
  token_iv text,
  token_tag text,
  listo boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.instagram_configuracion (id) values (true) on conflict (id) do nothing;

alter table public.instagram_contactos enable row level security;
alter table public.instagram_conversaciones enable row level security;
alter table public.instagram_mensajes enable row level security;
alter table public.instagram_configuracion enable row level security;

drop policy if exists "equipo_instagram_contactos" on public.instagram_contactos;
create policy "equipo_instagram_contactos" on public.instagram_contactos for all to authenticated using (true) with check (true);
drop policy if exists "equipo_instagram_conversaciones" on public.instagram_conversaciones;
create policy "equipo_instagram_conversaciones" on public.instagram_conversaciones for all to authenticated using (true) with check (true);
drop policy if exists "equipo_instagram_mensajes" on public.instagram_mensajes;
create policy "equipo_instagram_mensajes" on public.instagram_mensajes for all to authenticated using (true) with check (true);
drop policy if exists "equipo_instagram_config" on public.instagram_configuracion;
create policy "equipo_instagram_config" on public.instagram_configuracion for all to authenticated using (true) with check (true);

-- 4) Instagram sincroniza el pipeline del cliente igual que WhatsApp.
create or replace function public.sync_pipeline_desde_instagram()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado_pipeline is not null and new.cliente_id is not null
     and new.estado_pipeline is distinct from old.estado_pipeline then
    update public.clientes
    set pipeline_stage = new.estado_pipeline, updated_at = now()
    where id = new.cliente_id and pipeline_stage_manual = false;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_pipeline_desde_instagram on public.instagram_conversaciones;
create trigger trg_sync_pipeline_desde_instagram
  after update of estado_pipeline on public.instagram_conversaciones
  for each row execute function public.sync_pipeline_desde_instagram();

-- 5) Alertas de Instagram — mismo patrón que sql_panel_v2_whatsapp_alertas.sql.
create or replace function public.instagram_notificar_mensaje_entrante()
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

  select c.vendedor_id, ic.username
    into v_vendedor_id, v_nombre
  from public.instagram_conversaciones c
  join public.instagram_contactos ic on ic.id = c.contacto_id
  where c.id = new.conversacion_id;

  v_link := '/panel-v2/whatsapp?canal=instagram&conversacion=' || new.conversacion_id;
  v_titulo := coalesce('@' || v_nombre, 'Cliente') || ': ' || coalesce(left(new.texto, 80), 'envió un mensaje');

  if v_vendedor_id is not null then
    insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
    values (v_vendedor_id, 'nuevo_mensaje_chat', 'media', v_titulo, v_link);
  else
    for v_encargado in select id from public.perfiles where ('encargado' = any(roles) or 'admin' = any(roles)) and activo = true loop
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
      values (v_encargado.id, 'nuevo_mensaje_chat', 'media', v_titulo, v_link);
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_instagram_mensaje_entrante on public.instagram_mensajes;
create trigger trg_instagram_mensaje_entrante
  after insert on public.instagram_mensajes
  for each row execute function public.instagram_notificar_mensaje_entrante();

create or replace function public.instagram_notificar_handoff()
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

  v_link := '/panel-v2/whatsapp?canal=instagram&conversacion=' || new.id;

  if new.vendedor_id is not null then
    insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
    values (new.vendedor_id, 'handoff_chat', 'alta', 'El cliente pidió hablar con una persona (Instagram)', v_link);
  else
    for v_encargado in select id from public.perfiles where ('encargado' = any(roles) or 'admin' = any(roles)) and activo = true loop
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
      values (v_encargado.id, 'handoff_chat', 'alta', 'El cliente pidió hablar con una persona (Instagram)', v_link);
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_instagram_handoff on public.instagram_conversaciones;
create trigger trg_instagram_handoff
  after update on public.instagram_conversaciones
  for each row execute function public.instagram_notificar_handoff();
