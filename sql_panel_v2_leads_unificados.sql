-- Módulo "Leads" unificado: centraliza WhatsApp + Rodi + Instagram + leads
-- propios (creados a mano, sin conversación detrás) en una sola vista,
-- reusando LeadDetailModal (antes solo soportaba whatsapp/instagram).

-- Sucursal como campo propio y editable del lead (antes en el modal era
-- de solo lectura, derivado del vehículo vinculado -- ahora se puede elegir
-- directo, útil cuando todavía no hay auto vinculado).
alter table public.whatsapp_conversaciones add column if not exists sucursal_id uuid references public.sucursales(id);
alter table public.instagram_conversaciones add column if not exists sucursal_id uuid references public.sucursales(id);

-- rodi_conversaciones no tenía ninguno de los campos de gestión de lead que
-- whatsapp/instagram ya tienen (vehiculo, asistencia, cierre, domicilio,
-- canal de origen, sucursal) -- se agregan para que el mismo modal funcione
-- igual con los 3 canales.
alter table public.rodi_conversaciones add column if not exists vehiculo_id uuid references public.vehiculos(id);
alter table public.rodi_conversaciones add column if not exists asistencia_solicitada boolean not null default false;
alter table public.rodi_conversaciones add column if not exists asistencia_nota text;
alter table public.rodi_conversaciones add column if not exists asistencia_para uuid references public.perfiles(id);
alter table public.rodi_conversaciones add column if not exists asistencia_atendida boolean not null default false;
alter table public.rodi_conversaciones add column if not exists motivo_cierre_id uuid references public.motivos_cierre(id);
alter table public.rodi_conversaciones add column if not exists domicilio text;
alter table public.rodi_conversaciones add column if not exists canal_origen text;
alter table public.rodi_conversaciones add column if not exists sucursal_id uuid references public.sucursales(id);

-- Tabla nueva: leads creados a mano desde el módulo unificado (walk-in,
-- MercadoLibre, cliente anterior, etc) -- no tienen ninguna conversación
-- real detrás, así que necesitan su propia tabla en vez de vivir en
-- whatsapp/instagram/rodi_conversaciones.
create table if not exists public.leads_manuales (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text,
  email text,
  canal_origen text,
  sucursal_id uuid references public.sucursales(id),
  estado_lead text not null default 'nuevo',
  calificacion text,
  vendedor_id uuid references public.perfiles(id),
  vehiculo_id uuid references public.vehiculos(id),
  cliente_id uuid references public.clientes(id),
  domicilio text,
  notas text,
  asistencia_solicitada boolean not null default false,
  asistencia_nota text,
  asistencia_para uuid references public.perfiles(id),
  asistencia_atendida boolean not null default false,
  motivo_cierre_id uuid references public.motivos_cierre(id),
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads_manuales enable row level security;
create policy "leads_manuales_all_authenticated" on public.leads_manuales for all to authenticated using (true) with check (true);

-- Las tablas satélite (tareas/eventos/test drives/peritajes de un lead)
-- solo tenían FK a whatsapp/instagram -- se suman rodi y manuales.
alter table public.tareas_lead add column if not exists rodi_conversacion_id uuid references public.rodi_conversaciones(id);
alter table public.tareas_lead add column if not exists leads_manuales_id uuid references public.leads_manuales(id);
alter table public.eventos_lead add column if not exists rodi_conversacion_id uuid references public.rodi_conversaciones(id);
alter table public.eventos_lead add column if not exists leads_manuales_id uuid references public.leads_manuales(id);
alter table public.test_drives add column if not exists rodi_conversacion_id uuid references public.rodi_conversaciones(id);
alter table public.test_drives add column if not exists leads_manuales_id uuid references public.leads_manuales(id);
alter table public.peritajes_lead add column if not exists rodi_conversacion_id uuid references public.rodi_conversaciones(id);
alter table public.peritajes_lead add column if not exists leads_manuales_id uuid references public.leads_manuales(id);
