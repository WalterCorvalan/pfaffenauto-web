-- Panel v2 — Ventas: liquidación de comisión, recordatorios post-venta y
-- calificación del cliente (calcado de v1). Todo aditivo sobre sql_panel_v2_ventas.sql.

alter table public.ventas
  add column if not exists comision_liquidada boolean not null default false,
  add column if not exists comision_liquidada_en timestamptz,
  add column if not exists calificacion_pedida boolean not null default false,
  add column if not exists calificacion_pedida_en timestamptz,
  add column if not exists calificacion_puntaje int check (calificacion_puntaje between 1 and 5),
  add column if not exists calificacion_comentario text;

create table if not exists public.venta_recordatorios (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas(id) on delete cascade,
  tipo text not null check (tipo in ('llamada_seguimiento', 'control_post_entrega', 'vtv', 'service', 'seguro', 'patente', 'garantia', 'cumpleanos', 'otro')),
  fecha_vencimiento date not null,
  notas text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'hecho')),
  hecho_por uuid references public.perfiles(id),
  hecho_en timestamptz,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create index if not exists venta_recordatorios_venta_idx on public.venta_recordatorios(venta_id);
create index if not exists venta_recordatorios_vencimiento_idx on public.venta_recordatorios(fecha_vencimiento) where estado = 'pendiente';

alter table public.venta_recordatorios enable row level security;
drop policy if exists "equipo_venta_recordatorios" on public.venta_recordatorios;
create policy "equipo_venta_recordatorios" on public.venta_recordatorios for all to authenticated using (true) with check (true);
