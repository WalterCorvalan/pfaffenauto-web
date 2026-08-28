-- Panel v2 — Teléfonos útiles. Corre en la base NUEVA (vdcpmbajlyqgohrwpkeo).
-- Cartelera compartida, sin dependencias de otros módulos.

create table if not exists public.telefonos_utiles (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text check (categoria in ('Gestoría', 'Mecánico', 'Chapa y pintura', 'Gomería', 'Lavadero', 'Trapito', 'Grúa', 'Despachante', 'Seguros', 'Banco', 'Proveedor repuestos', 'Servicios oficina', 'Otro')),
  telefono text,
  whatsapp text,
  email text,
  notas text,
  creado_por uuid references public.perfiles(id),
  actualizado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists telefonos_utiles_categoria_idx on public.telefonos_utiles(categoria);

alter table public.telefonos_utiles enable row level security;

-- Cartelera compartida: cualquiera de la agencia ve, crea, edita y borra
-- (el manual dice "lo cargás lo ven y lo pueden editar todos").
drop policy if exists "ver_telefonos" on public.telefonos_utiles;
create policy "ver_telefonos" on public.telefonos_utiles for select to authenticated using (true);

drop policy if exists "crear_telefonos" on public.telefonos_utiles;
create policy "crear_telefonos" on public.telefonos_utiles for insert to authenticated with check (true);

drop policy if exists "editar_telefonos" on public.telefonos_utiles;
create policy "editar_telefonos" on public.telefonos_utiles for update to authenticated using (true) with check (true);

drop policy if exists "borrar_telefonos" on public.telefonos_utiles;
create policy "borrar_telefonos" on public.telefonos_utiles for delete to authenticated using (true);
