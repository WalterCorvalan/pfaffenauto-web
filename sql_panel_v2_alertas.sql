-- Panel v2 — Centro de Alertas. Corre en la base NUEVA (vdcpmbajlyqgohrwpkeo).
-- Infraestructura genérica: cualquier módulo futuro (Expedientes, Autorizaciones,
-- Tareas...) va a insertar filas acá. Una fila por destinatario (no roles
-- amplios) para que "Borrar todas"/leída sea per-usuario sin pisar a nadie más.

create table if not exists public.alertas (
  id uuid primary key default gen_random_uuid(),
  destinatario_id uuid not null references public.perfiles(id) on delete cascade,
  tipo text not null default 'general',
  prioridad text not null default 'novedad' check (prioridad in ('alta', 'media', 'baja', 'novedad')),
  titulo text not null,
  mensaje text,
  link text,
  leida boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists alertas_destinatario_idx on public.alertas(destinatario_id, leida);

alter table public.alertas enable row level security;

drop policy if exists "ver_propias_alertas" on public.alertas;
create policy "ver_propias_alertas" on public.alertas for select to authenticated
  using (destinatario_id = auth.uid());

drop policy if exists "actualizar_propias_alertas" on public.alertas;
create policy "actualizar_propias_alertas" on public.alertas for update to authenticated
  using (destinatario_id = auth.uid()) with check (destinatario_id = auth.uid());

drop policy if exists "borrar_propias_alertas" on public.alertas;
create policy "borrar_propias_alertas" on public.alertas for delete to authenticated
  using (destinatario_id = auth.uid());

-- Cualquier usuario autenticado puede crear una alerta para otro (ej:
-- responsable de un evento le llega un aviso armado por quien lo creó).
drop policy if exists "crear_alertas" on public.alertas;
create policy "crear_alertas" on public.alertas for insert to authenticated
  with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'alertas'
  ) then
    alter publication supabase_realtime add table public.alertas;
  end if;
end $$;
