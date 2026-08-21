-- Tabla simple de logs de errores del backend (rutas /api/*). No reemplaza
-- Sentry, pero es gratis y alcanza para ver qué está rompiendo en producción
-- sin depender de leer la consola del servidor.
create table if not exists logs_errores (
  id uuid primary key default gen_random_uuid(),
  origen text not null,
  mensaje text not null,
  detalle jsonb,
  created_at timestamptz not null default now()
);

create index if not exists logs_errores_created_at_idx on logs_errores (created_at desc);

alter table logs_errores enable row level security;

-- Solo staff logueado puede leerlos desde el panel. Los inserts los hace
-- siempre el backend con la service role (bypassea RLS), así que no hace
-- falta política de INSERT para anon/authenticated.
create policy "Staff logueado puede ver logs de errores"
  on logs_errores for select
  to authenticated
  using (true);

-- Housekeeping: automático. app/api/cron/automatizaciones/route.ts (el cron
-- que ya corre cada 15 min vía pg_cron) borra los logs de más de 30 días una
-- vez por día a las 03:00 UTC — no hace falta correr nada a mano.
