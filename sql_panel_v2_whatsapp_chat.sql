-- Panel v2 — Módulo WhatsApp y Conversaciones (bandeja tipo /panel/chat de v1).
-- Base nova (vdcpmbajlyqgohrwpkeo). Extiende (aditivo) las tablas creadas en
-- sql_panel_v2_whatsapp_metricas.sql y suma plantillas + credenciales.

-- 1) whatsapp_conversaciones — columnas que le faltan para calzar con v1
--    (pipeline, IA, handoff, vínculo a cliente/vehículo/anuncio).
alter table public.whatsapp_conversaciones
  add column if not exists cliente_id uuid references public.clientes(id),
  add column if not exists vehiculo_id uuid,
  add column if not exists estado_pipeline text,
  add column if not exists ai_habilitada boolean not null default true,
  add column if not exists handoff_at timestamptz,
  add column if not exists handoff_reason text,
  add column if not exists origen_ads text,
  add column if not exists last_inbound_at timestamptz;

-- 2) whatsapp_mensajes — tipo/status/ids de Meta que usa el webhook y la bandeja.
alter table public.whatsapp_mensajes
  add column if not exists tipo text not null default 'text',
  add column if not exists status text not null default 'pending',
  add column if not exists wa_message_id text,
  add column if not exists wa_timestamp timestamptz;

create unique index if not exists whatsapp_msg_wa_id_idx on public.whatsapp_mensajes(wa_message_id) where wa_message_id is not null;

-- 3) Plantillas de mensaje por sector (paso 3 del manual — botón de plantillas).
create table if not exists public.whatsapp_plantillas (
  id uuid primary key default gen_random_uuid(),
  sector text not null,
  nombre text not null,
  texto text not null,
  activa boolean not null default true,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.whatsapp_plantillas enable row level security;
drop policy if exists "equipo_plantillas" on public.whatsapp_plantillas;
create policy "equipo_plantillas" on public.whatsapp_plantillas for all to authenticated using (true) with check (true);

-- 4) Credenciales del proveedor (Configuración — "WATI no está listo" en el manual).
--    Guardamos el texto ya cifrado con lib/crypto (mismo patrón que v1), nunca en claro.
create table if not exists public.whatsapp_configuracion (
  id boolean primary key default true check (id),
  proveedor text not null default 'meta',
  token_cifrado text,
  phone_number_id text,
  webhook_verify_token text,
  listo boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.whatsapp_configuracion enable row level security;
drop policy if exists "admin_config_whatsapp" on public.whatsapp_configuracion;
create policy "admin_config_whatsapp" on public.whatsapp_configuracion for all to authenticated using (true) with check (true);

insert into public.whatsapp_configuracion (id) values (true) on conflict (id) do nothing;
