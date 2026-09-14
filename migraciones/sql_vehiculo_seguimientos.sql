-- Tabla nueva para el "Plan de trabajo" de la Ficha rápida / Ficha completa
-- de Stock (app/panel/stock/VehiculoSeguimientos.tsx). Guarda las próximas
-- acciones comerciales agendadas sobre un vehículo puntual (ej. "revisar
-- precio con el propietario"), no confundir con tareas_lead (que cuelga de
-- una conversación, no de un vehículo).
--
-- Correr este SQL una sola vez en el editor SQL de Supabase.

create table if not exists public.vehiculo_seguimientos (
  id uuid primary key default gen_random_uuid(),
  vehiculo_id uuid not null references public.vehiculos(id) on delete cascade,
  proxima_accion text not null,
  responsable_id uuid references public.perfiles(id),
  fecha date,
  completado boolean not null default false,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_vehiculo_seguimientos_vehiculo_id on public.vehiculo_seguimientos(vehiculo_id);

alter table public.vehiculo_seguimientos enable row level security;

-- Mismo criterio de acceso que el resto del panel: cualquier usuario
-- autenticado (perfil activo) puede leer/escribir. Si el proyecto ya tiene
-- una función helper de "usuario autenticado con perfil activo", reemplazar
-- esta policy por la misma que usan el resto de las tablas del panel-v2.
create policy "vehiculo_seguimientos_select" on public.vehiculo_seguimientos
  for select using (auth.role() = 'authenticated');
create policy "vehiculo_seguimientos_insert" on public.vehiculo_seguimientos
  for insert with check (auth.role() = 'authenticated');
create policy "vehiculo_seguimientos_update" on public.vehiculo_seguimientos
  for update using (auth.role() = 'authenticated');
