-- NuevaVentaModal.tsx tenía los botones de "Adjuntar" (DNI Frente/Dorso,
-- Cédula Verde Frente/Dorso del comprador y de cada permuta) deshabilitados
-- ("Todavía no construido") -- no había ningún lugar en la base donde
-- guardar esos archivos. La venta todavía no tiene expediente_id en este
-- punto (el expediente se crea recién al cerrar la venta, vía trigger), así
-- que no se puede usar expediente_documentos directo -- se sube el archivo
-- DESPUÉS de crear la venta (ya con venta.id) a esta tabla nueva.
create table if not exists public.venta_documentos (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas(id) on delete cascade,
  tipo text not null, -- "dni_frente" | "dni_dorso" | "cedula_verde_frente" | "cedula_verde_dorso"
  permuta_index int, -- null = documento del comprador; 0,1,... = de qué vehículo de permuta
  nombre text not null,
  url text not null,
  subido_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create index if not exists venta_documentos_venta_id_idx on public.venta_documentos(venta_id);

alter table public.venta_documentos enable row level security;

-- Mismo criterio de acceso que el resto del panel (staff autenticado) --
-- ajustar si el proyecto usa un esquema de roles más fino para otras tablas
-- de documentos (ver expediente_documentos como referencia si existe una
-- policy más restrictiva ahí).
create policy "venta_documentos: staff autenticado" on public.venta_documentos
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
