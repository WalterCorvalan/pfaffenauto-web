-- Panel v2 — Postulaciones/CVs. Replica el módulo de v1 (que no tenía SQL
-- propio, tabla armada a mano) en la base nova, con bucket de Storage propio
-- (v1 usaba el bucket "cvs" de SU proyecto Supabase — acá va uno nuevo,
-- mismo nombre, en el proyecto nova).

create table if not exists public.postulaciones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  apellido text not null,
  email text not null,
  telefono text not null,
  puesto text,
  cv_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists postulaciones_created_idx on public.postulaciones(created_at desc);

alter table public.postulaciones enable row level security;
drop policy if exists "equipo_postulaciones" on public.postulaciones;
create policy "equipo_postulaciones" on public.postulaciones for all to authenticated using (true) with check (true);

-- Bucket de Storage para los CVs, público (mismo criterio que v1: el link va
-- directo al panel, no hay descarga autenticada).
insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', true)
on conflict (id) do nothing;

-- El formulario público sube el archivo desde el navegador con la
-- publishable key (sin sesión) — necesita permiso de INSERT anónimo. Lectura
-- pública porque el link se comparte directo (bucket public = true ya cubre
-- el SELECT vía URL pública, pero sumamos la policy por las dudas de acceso
-- vía API de Storage).
drop policy if exists "publico_subir_cv" on storage.objects;
create policy "publico_subir_cv" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'cvs');

drop policy if exists "publico_leer_cv" on storage.objects;
create policy "publico_leer_cv" on storage.objects for select to anon, authenticated
  using (bucket_id = 'cvs');
