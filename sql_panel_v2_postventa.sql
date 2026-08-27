-- Panel v2 — Postventa. Corre en la base NUEVA (vdcpmbajlyqgohrwpkeo).
-- Ventas todavía no existe, así que "Ya compraron" vive en su propia tabla
-- (compras cargadas a mano por escaneo de boleto o Excel). Cuando construyamos
-- Ventas de verdad, esta tabla se reconcilia/migra — por ahora Postventa
-- funciona independiente, tal como pide el manual ("cargar compras viejas
-- desde un Excel").

create table if not exists public.postventa_compras (
  id uuid primary key default gen_random_uuid(),
  comprador_nombre text not null,
  comprador_telefono text,
  comprador_dni text,
  vehiculo_marca text,
  vehiculo_modelo text,
  vehiculo_anio int,
  vehiculo_dominio text,
  fecha_venta date not null default current_date,
  precio numeric,
  moneda text default 'USD' check (moneda in ('USD', 'ARS')),
  vendedor_nombre text,
  origen text not null default 'manual' check (origen in ('manual', 'escaneo_boleto', 'excel')),
  foto_boleto text,
  notas text,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create index if not exists postventa_compras_fecha_idx on public.postventa_compras(fecha_venta);

alter table public.postventa_compras enable row level security;

drop policy if exists "ver_postventa_compras" on public.postventa_compras;
create policy "ver_postventa_compras" on public.postventa_compras for select to authenticated using (true);

drop policy if exists "crear_postventa_compras" on public.postventa_compras;
create policy "crear_postventa_compras" on public.postventa_compras for insert to authenticated with check (true);

drop policy if exists "editar_postventa_compras" on public.postventa_compras;
create policy "editar_postventa_compras" on public.postventa_compras for update to authenticated using (true) with check (true);

drop policy if exists "borrar_postventa_compras" on public.postventa_compras;
create policy "borrar_postventa_compras" on public.postventa_compras for delete to authenticated
  using (exists (select 1 from public.perfiles p where p.id = auth.uid() and 'admin' = any(p.roles)));

-- Recordatorios de recontacto ligados a una compra (service, VTV, seguro,
-- garantía, cumpleaños, etc). "Recontactos" del manual los agrupa por urgencia
-- según fecha_vencimiento, calculado en el cliente — acá solo se persiste.
create table if not exists public.postventa_recordatorios (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references public.postventa_compras(id) on delete cascade,
  tipo text not null check (tipo in ('llamada_seguimiento', 'control_post_entrega', 'vtv', 'service', 'seguro', 'patente', 'garantia', 'cumpleanos', 'otro')),
  fecha_vencimiento date not null,
  descripcion text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'hecho')),
  hecho_por uuid references public.perfiles(id),
  hecho_en timestamptz,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create index if not exists postventa_recordatorios_compra_idx on public.postventa_recordatorios(compra_id);
create index if not exists postventa_recordatorios_vencimiento_idx on public.postventa_recordatorios(fecha_vencimiento) where estado = 'pendiente';

alter table public.postventa_recordatorios enable row level security;

drop policy if exists "ver_postventa_recordatorios" on public.postventa_recordatorios;
create policy "ver_postventa_recordatorios" on public.postventa_recordatorios for select to authenticated using (true);

drop policy if exists "crear_postventa_recordatorios" on public.postventa_recordatorios;
create policy "crear_postventa_recordatorios" on public.postventa_recordatorios for insert to authenticated with check (true);

drop policy if exists "editar_postventa_recordatorios" on public.postventa_recordatorios;
create policy "editar_postventa_recordatorios" on public.postventa_recordatorios for update to authenticated using (true) with check (true);

drop policy if exists "borrar_postventa_recordatorios" on public.postventa_recordatorios;
create policy "borrar_postventa_recordatorios" on public.postventa_recordatorios for delete to authenticated using (true);
