-- Panel v2 — Leads de tasación pública (/cotizador, /vender, permuta).
-- Distinta de "cotizaciones" (esa es un presupuesto interno del vendedor
-- para un auto del stock que YA tiene precio y cliente conocido). Acá es al
-- revés: un desconocido describe SU auto para que se lo tasemos, sin precio
-- todavía — cuando un vendedor arranca la gestión, nace un peritaje real
-- (peritajes_lead, mismo patrón que ya usan los leads de WhatsApp/Instagram).

create table if not exists public.leads_tasacion (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text not null,
  email text,
  marca text not null,
  modelo text,
  anio int,
  version text,
  kilometraje numeric,
  gnc text,
  precio_esperado_cliente numeric,
  descuento_pct numeric,
  oferta_calculada numeric,
  acepta_oferta boolean,
  quiere_venir_sucursal boolean,
  sucursal_preferida text,
  visita_id uuid references public.visitas(id) on delete set null,
  fotos_y_videos jsonb not null default '[]'::jsonb,
  tipo text not null default 'tasacion' check (tipo in ('tasacion', 'permuta')),
  vehiculo_objetivo_id uuid references public.vehiculos(id), -- si es permuta, el auto del stock que quiere llevarse
  canal_origen text,
  estado text not null default 'nuevo' check (estado in ('nuevo', 'en_gestion', 'descartado')),
  peritaje_id uuid references public.peritajes_lead(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_tasacion_estado_idx on public.leads_tasacion(estado);
create index if not exists leads_tasacion_created_idx on public.leads_tasacion(created_at desc);

alter table public.leads_tasacion enable row level security;
drop policy if exists "equipo_leads_tasacion" on public.leads_tasacion;
create policy "equipo_leads_tasacion" on public.leads_tasacion for all to authenticated using (true) with check (true);
