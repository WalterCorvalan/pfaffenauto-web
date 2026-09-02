-- Panel v2 — Mensajes: chat interno del equipo (canal General + directos +
-- grupos), sin código previo en v1 ni en panel-v2 — construido desde cero
-- según el manual. 100% aditivo, tablas nuevas.

-- ============================================================
-- 1) Canales — 'general' (único, implícito para todo el staff activo, sin
-- fila de membresía), 'directo' (2 miembros, deduplicado por par_clave) o
-- 'grupo' (N miembros, con nombre).
-- ============================================================
create table if not exists public.mensajes_canales (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('general', 'directo', 'grupo')),
  nombre text,
  par_clave text,
  created_by uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create unique index if not exists mensajes_canales_general_unq on public.mensajes_canales((true)) where tipo = 'general';
create unique index if not exists mensajes_canales_par_clave_unq on public.mensajes_canales(par_clave) where tipo = 'directo';

alter table public.mensajes_canales enable row level security;
drop policy if exists "equipo_mensajes_canales" on public.mensajes_canales;
create policy "equipo_mensajes_canales" on public.mensajes_canales for all to authenticated using (true) with check (true);

insert into public.mensajes_canales (tipo, nombre)
select 'general', 'General'
where not exists (select 1 from public.mensajes_canales where tipo = 'general');

-- ============================================================
-- 2) Miembros — participación en directos/grupos (general no necesita fila:
-- todo el staff activo lo ve implícitamente).
-- ============================================================
create table if not exists public.mensajes_canal_miembros (
  id uuid primary key default gen_random_uuid(),
  canal_id uuid not null references public.mensajes_canales(id) on delete cascade,
  perfil_id uuid not null references public.perfiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (canal_id, perfil_id)
);

create index if not exists mensajes_canal_miembros_perfil_idx on public.mensajes_canal_miembros(perfil_id);

alter table public.mensajes_canal_miembros enable row level security;
drop policy if exists "equipo_mensajes_canal_miembros" on public.mensajes_canal_miembros;
create policy "equipo_mensajes_canal_miembros" on public.mensajes_canal_miembros for all to authenticated using (true) with check (true);

-- ============================================================
-- 3) Mensajes — texto + hasta 4 adjuntos (jsonb: [{url, nombre, tipo}]).
-- ============================================================
create table if not exists public.mensajes (
  id uuid primary key default gen_random_uuid(),
  canal_id uuid not null references public.mensajes_canales(id) on delete cascade,
  autor_id uuid not null references public.perfiles(id),
  texto text,
  adjuntos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists mensajes_canal_idx on public.mensajes(canal_id, created_at);

alter table public.mensajes enable row level security;
drop policy if exists "equipo_mensajes" on public.mensajes;
create policy "equipo_mensajes" on public.mensajes for all to authenticated using (true) with check (true);

alter publication supabase_realtime add table public.mensajes;

-- ============================================================
-- 4) Lecturas — último mensaje visto por usuario y canal, para el globito de
-- no leídos (cuenta solo mensajes de otros, posteriores a esta marca).
-- ============================================================
create table if not exists public.mensajes_lecturas (
  id uuid primary key default gen_random_uuid(),
  canal_id uuid not null references public.mensajes_canales(id) on delete cascade,
  perfil_id uuid not null references public.perfiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  unique (canal_id, perfil_id)
);

alter table public.mensajes_lecturas enable row level security;
drop policy if exists "equipo_mensajes_lecturas" on public.mensajes_lecturas;
create policy "equipo_mensajes_lecturas" on public.mensajes_lecturas for all to authenticated using (true) with check (true);

-- ============================================================
-- 5) Presencia — heartbeat liviano (el cliente actualiza su propia fila cada
-- ~20s mientras la pantalla de Mensajes está abierta); "en línea" = visto
-- hace menos de 45s. Evita depender de canales de Presence de Realtime.
-- ============================================================
create table if not exists public.mensajes_presencia (
  perfil_id uuid primary key references public.perfiles(id) on delete cascade,
  last_seen_at timestamptz not null default now()
);

alter table public.mensajes_presencia enable row level security;
drop policy if exists "equipo_mensajes_presencia" on public.mensajes_presencia;
create policy "equipo_mensajes_presencia" on public.mensajes_presencia for all to authenticated using (true) with check (true);

alter publication supabase_realtime add table public.mensajes_presencia;
