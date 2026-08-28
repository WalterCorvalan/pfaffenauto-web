-- Panel v2 — WhatsApp-métricas. Base nova (vdcpmbajlyqgohrwpkeo). Schema
-- calcado de v1, recortado a lo que whatsapp-metricas/page.tsx precisa.
-- Sin bot v2 aún — tablas vacías hasta bot escribir (service role, salta RLS).

create table if not exists public.whatsapp_contactos (
  id uuid primary key default gen_random_uuid(),
  telefono text not null unique,
  nombre_perfil text,
  cliente_id uuid references public.clientes(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_conversaciones (
  id uuid primary key default gen_random_uuid(),
  contacto_id uuid not null references public.whatsapp_contactos(id) on delete cascade,
  vendedor_id uuid references public.perfiles(id),
  vehiculo_id uuid references public.vehiculos(id),
  calificacion text check (calificacion in ('caliente', 'tibio', 'frio')),
  last_message_at timestamptz,
  unread_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists whatsapp_conv_last_msg_idx on public.whatsapp_conversaciones(last_message_at desc);

create table if not exists public.whatsapp_mensajes (
  id uuid primary key default gen_random_uuid(),
  conversacion_id uuid not null references public.whatsapp_conversaciones(id) on delete cascade,
  direccion text not null check (direccion in ('in', 'out')),
  texto text,
  ai_generado boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_msg_conv_idx on public.whatsapp_mensajes(conversacion_id);
create index if not exists whatsapp_msg_created_idx on public.whatsapp_mensajes(created_at);

create table if not exists public.uso_ia_anthropic (
  id uuid primary key default gen_random_uuid(),
  origen text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.whatsapp_contactos enable row level security;
alter table public.whatsapp_conversaciones enable row level security;
alter table public.whatsapp_mensajes enable row level security;
alter table public.uso_ia_anthropic enable row level security;

drop policy if exists "equipo_contactos" on public.whatsapp_contactos;
create policy "equipo_contactos" on public.whatsapp_contactos for all to authenticated using (true) with check (true);

drop policy if exists "equipo_conversaciones" on public.whatsapp_conversaciones;
create policy "equipo_conversaciones" on public.whatsapp_conversaciones for all to authenticated using (true) with check (true);

drop policy if exists "equipo_mensajes" on public.whatsapp_mensajes;
create policy "equipo_mensajes" on public.whatsapp_mensajes for all to authenticated using (true) with check (true);

drop policy if exists "ver_uso_ia" on public.uso_ia_anthropic;
create policy "ver_uso_ia" on public.uso_ia_anthropic for select to authenticated using (true);
