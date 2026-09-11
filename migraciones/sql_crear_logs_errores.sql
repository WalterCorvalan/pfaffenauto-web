-- lib/panel/logger.ts (registrarError) inserta acá desde hace tiempo, y
-- app/panel/errores/page.tsx lee de acá -- pero la tabla nunca se creó en
-- el proyecto nuevo (nova), así que todo insert fallaba en silencio (el
-- logger es best-effort, no rompe el flujo que lo llama) y el módulo
-- Errores del panel siempre se veía vacío. Sin esto, no hay forma de ver
-- cuándo el agente de WhatsApp/Rodi falla una respuesta real.

create table if not exists public.logs_errores (
  id uuid primary key default gen_random_uuid(),
  origen text not null,
  mensaje text not null,
  detalle jsonb,
  created_at timestamptz not null default now()
);

create index if not exists logs_errores_created_at_idx on public.logs_errores (created_at desc);

alter table public.logs_errores enable row level security;

-- El insert real lo hace siempre el service role (lib/panel/logger.ts),
-- que no pasa por RLS -- esta policy es solo para que el panel (usuario
-- logueado, vía lib/supabase/server.ts) pueda LEER la lista en
-- app/panel/errores/page.tsx.
create policy "logs_errores_select_autenticados" on public.logs_errores
  for select
  to authenticated
  using (true);
