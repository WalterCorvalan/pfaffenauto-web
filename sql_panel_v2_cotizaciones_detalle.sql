-- Cotizaciones — ficha de detalle: precio aprobado, nota del admin,
-- conversación (comentarios) e historial de estados. Arrays jsonb en vez de
-- tablas nuevas para no sumar migraciones extra por algo de bajo volumen.
alter table public.cotizaciones
  add column if not exists precio_aprobado numeric,
  add column if not exists notas_admin text,
  add column if not exists conversacion jsonb not null default '[]',
  add column if not exists historial jsonb not null default '[]';
