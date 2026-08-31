-- Panel v2 — Infracciones (multas de vehículos, para Finanzas/Admin).
-- Base nova.

create table if not exists public.infracciones (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default current_date,
  mes date not null default date_trunc('month', current_date)::date, -- YYYY-MM-01
  jurisdiccion text,
  estado text not null default 'Pendiente' check (estado in ('Pendiente', 'En trámite', 'Pagado', 'Cancelado')),
  cliente_nombre text,
  dominio_dni text,
  deuda_ars numeric,
  pago_cliente_ars numeric,
  pago_real_ars numeric,
  ganancia_ars numeric generated always as (pago_cliente_ars - pago_real_ars) stored,
  medio_pago text,
  planilla text,
  gestor text,
  vehiculo_id uuid references public.vehiculos(id) on delete set null,
  comentarios text,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint infracciones_pagado_requiere_montos check (
    estado <> 'Pagado' or (pago_cliente_ars is not null and pago_real_ars is not null)
  )
);

create index if not exists infracciones_estado_idx on public.infracciones(estado);
create index if not exists infracciones_mes_planilla_idx on public.infracciones(mes, planilla);
create index if not exists infracciones_vehiculo_idx on public.infracciones(vehiculo_id);

alter table public.infracciones enable row level security;
drop policy if exists "equipo_infracciones" on public.infracciones;
create policy "equipo_infracciones" on public.infracciones for all to authenticated using (true) with check (true);

drop policy if exists "borrar_infracciones" on public.infracciones;
create policy "borrar_infracciones" on public.infracciones for delete to authenticated
  using (exists (select 1 from public.perfiles p where p.id = auth.uid() and 'admin' = any(p.roles)));

-- Resumen de liquidación mensual por planilla — la pestaña "Liquidación"
-- del manual pega directo acá en vez de reagrupar en el frontend.
create or replace function public.infracciones_liquidacion_mensual(p_mes date)
returns table (
  planilla text,
  cantidad bigint,
  total_deuda numeric,
  total_pago_cliente numeric,
  total_pago_real numeric,
  total_ganancia numeric
)
language sql
stable
as $$
  select
    coalesce(i.planilla, 'Sin planilla') as planilla,
    count(*) as cantidad,
    coalesce(sum(i.deuda_ars), 0) as total_deuda,
    coalesce(sum(i.pago_cliente_ars), 0) as total_pago_cliente,
    coalesce(sum(i.pago_real_ars), 0) as total_pago_real,
    coalesce(sum(i.ganancia_ars), 0) as total_ganancia
  from public.infracciones i
  where i.mes = date_trunc('month', p_mes)::date
    and i.estado <> 'Cancelado'
  group by coalesce(i.planilla, 'Sin planilla')
  order by planilla;
$$;
