-- Panel v2 — Detalle de lead completo (paridad v1) sobre whatsapp_conversaciones
-- e instagram_conversaciones: tareas de seguimiento, historial de eventos,
-- test drives, pedir asistencia, motivo de cierre y prospecto (domicilio /
-- canal de origen). 100% aditivo. NO toca estado_lead/estado_pipeline (los
-- usan triggers existentes de bot_rodi.sql) ni el módulo Rodi (tabla
-- separada rodi_conversaciones).

-- ============================================================
-- 1) Motivos de cierre — lista global reutilizable (igual a v1).
-- ============================================================
create table if not exists public.motivos_cierre (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  created_at timestamptz not null default now()
);

alter table public.motivos_cierre enable row level security;
drop policy if exists "equipo_motivos_cierre" on public.motivos_cierre;
create policy "equipo_motivos_cierre" on public.motivos_cierre for all to authenticated using (true) with check (true);

insert into public.motivos_cierre (nombre)
values ('No contesta'), ('Precio muy alto'), ('Compró en otro lado'), ('Se arrepintió'), ('No calificaba para financiación')
on conflict (nombre) do nothing;

-- ============================================================
-- 2) Asistencia / prospecto / cierre — mismos campos que v1 tenía en
-- cotizaciones, sumados acá para whatsapp e instagram.
-- ============================================================
alter table public.whatsapp_conversaciones
  add column if not exists asistencia_solicitada boolean not null default false,
  add column if not exists asistencia_nota text,
  add column if not exists asistencia_para uuid references public.perfiles(id),
  add column if not exists asistencia_atendida boolean not null default false,
  add column if not exists motivo_cierre_id uuid references public.motivos_cierre(id),
  add column if not exists domicilio text,
  add column if not exists canal_origen text;

alter table public.instagram_conversaciones
  add column if not exists asistencia_solicitada boolean not null default false,
  add column if not exists asistencia_nota text,
  add column if not exists asistencia_para uuid references public.perfiles(id),
  add column if not exists asistencia_atendida boolean not null default false,
  add column if not exists motivo_cierre_id uuid references public.motivos_cierre(id),
  add column if not exists domicilio text,
  add column if not exists canal_origen text;

-- ============================================================
-- 3) Tareas de seguimiento por lead (WhatsApp o Instagram — exactamente uno
-- de los dos FK va cargado).
-- ============================================================
create table if not exists public.tareas_lead (
  id uuid primary key default gen_random_uuid(),
  whatsapp_conversacion_id uuid references public.whatsapp_conversaciones(id) on delete cascade,
  instagram_conversacion_id uuid references public.instagram_conversaciones(id) on delete cascade,
  tipo text not null,
  titulo text,
  fecha_vencimiento timestamptz not null,
  completada boolean not null default false,
  resultado text,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  constraint tareas_lead_un_solo_origen check (
    (whatsapp_conversacion_id is not null)::int + (instagram_conversacion_id is not null)::int = 1
  )
);

create index if not exists tareas_lead_wa_idx on public.tareas_lead(whatsapp_conversacion_id);
create index if not exists tareas_lead_ig_idx on public.tareas_lead(instagram_conversacion_id);

alter table public.tareas_lead enable row level security;
drop policy if exists "equipo_tareas_lead" on public.tareas_lead;
create policy "equipo_tareas_lead" on public.tareas_lead for all to authenticated using (true) with check (true);

-- ============================================================
-- 4) Eventos del lead — bitácora automática (asignación, calificación,
-- estado, tareas, test drive, asistencia, etc).
-- ============================================================
create table if not exists public.eventos_lead (
  id uuid primary key default gen_random_uuid(),
  whatsapp_conversacion_id uuid references public.whatsapp_conversaciones(id) on delete cascade,
  instagram_conversacion_id uuid references public.instagram_conversaciones(id) on delete cascade,
  tipo text not null,
  descripcion text not null,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  constraint eventos_lead_un_solo_origen check (
    (whatsapp_conversacion_id is not null)::int + (instagram_conversacion_id is not null)::int = 1
  )
);

create index if not exists eventos_lead_wa_idx on public.eventos_lead(whatsapp_conversacion_id);
create index if not exists eventos_lead_ig_idx on public.eventos_lead(instagram_conversacion_id);

alter table public.eventos_lead enable row level security;
drop policy if exists "equipo_eventos_lead" on public.eventos_lead;
create policy "equipo_eventos_lead" on public.eventos_lead for all to authenticated using (true) with check (true);

-- ============================================================
-- 5) Test drives agendados desde el lead.
-- ============================================================
create table if not exists public.test_drives (
  id uuid primary key default gen_random_uuid(),
  whatsapp_conversacion_id uuid references public.whatsapp_conversaciones(id) on delete cascade,
  instagram_conversacion_id uuid references public.instagram_conversaciones(id) on delete cascade,
  vehiculo_id uuid references public.vehiculos(id),
  fecha_hora timestamptz not null,
  estado text not null default 'Programado' check (estado in ('Programado', 'Realizado', 'Cancelado')),
  created_at timestamptz not null default now(),
  constraint test_drives_un_solo_origen check (
    (whatsapp_conversacion_id is not null)::int + (instagram_conversacion_id is not null)::int = 1
  )
);

create index if not exists test_drives_wa_idx on public.test_drives(whatsapp_conversacion_id);
create index if not exists test_drives_ig_idx on public.test_drives(instagram_conversacion_id);

alter table public.test_drives enable row level security;
drop policy if exists "equipo_test_drives" on public.test_drives;
create policy "equipo_test_drives" on public.test_drives for all to authenticated using (true) with check (true);
