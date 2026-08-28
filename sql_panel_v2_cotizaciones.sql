-- Panel v2 — Cotizaciones. Corre en la base NUEVA (vdcpmbajlyqgohrwpkeo).
-- Esta base nace directo con estado 'pendiente' (no arrastra el viejo
-- 'borrador' de Firestore) — "Migrar borradores" queda igual como
-- herramienta defensiva/idempotente por si algún import futuro mete filas
-- con ese valor viejo.

create table if not exists public.cotizaciones (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id),
  cliente_nombre text not null,
  vehiculo_id uuid references public.vehiculos(id),
  vehiculo_descripcion text,
  vendedor_id uuid references public.perfiles(id),
  permuta_marca text,
  permuta_modelo text,
  permuta_anio int,
  permuta_km numeric,
  permuta_estado text,
  permuta_patente text,
  permuta_tasacion numeric,
  precio_sugerido numeric not null,
  moneda text not null default 'USD' check (moneda in ('USD', 'ARS')),
  fecha_emision date not null default current_date,
  fecha_vencimiento date,
  condiciones_pago text,
  notas text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobada', 'rechazada')),
  revision_pedida boolean not null default false,
  revision_mensaje text,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cotizaciones_estado_idx on public.cotizaciones(estado);
create index if not exists cotizaciones_vendedor_idx on public.cotizaciones(vendedor_id);

alter table public.cotizaciones enable row level security;

drop policy if exists "ver_cotizaciones" on public.cotizaciones;
create policy "ver_cotizaciones" on public.cotizaciones for select to authenticated using (true);

drop policy if exists "crear_cotizaciones" on public.cotizaciones;
create policy "crear_cotizaciones" on public.cotizaciones for insert to authenticated with check (true);

drop policy if exists "editar_cotizaciones" on public.cotizaciones;
create policy "editar_cotizaciones" on public.cotizaciones for update to authenticated using (true) with check (true);

drop policy if exists "borrar_cotizaciones" on public.cotizaciones;
create policy "borrar_cotizaciones" on public.cotizaciones for delete to authenticated
  using (exists (select 1 from public.perfiles p where p.id = auth.uid() and 'admin' = any(p.roles)));
