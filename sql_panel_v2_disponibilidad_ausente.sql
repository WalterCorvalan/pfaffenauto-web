-- Suma el estado "ausente" (genérico, distinto de vacaciones/enfermo) al
-- check existente de disponibilidad_vendedor.
alter table public.disponibilidad_vendedor drop constraint if exists disponibilidad_vendedor_estado_check;
alter table public.disponibilidad_vendedor add constraint disponibilidad_vendedor_estado_check
  check (estado in ('disponible', 'ausente', 'vacaciones', 'enfermo'));
