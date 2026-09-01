-- Mismo patrón que v1 (migraciones/sql_logs_errores.sql), copiado a nova.
create table if not exists public.logs_errores (
  id uuid primary key default gen_random_uuid(),
  origen text not null,
  mensaje text not null,
  detalle jsonb,
  created_at timestamptz not null default now()
);

create index if not exists logs_errores_created_at_idx on public.logs_errores (created_at desc);

alter table public.logs_errores enable row level security;

drop policy if exists "staff_ve_logs_errores" on public.logs_errores;
create policy "staff_ve_logs_errores" on public.logs_errores for select to authenticated using (true);

-- Los inserts los hace siempre el backend con la service role (bypassea
-- RLS), no hace falta política de insert para anon/authenticated.
