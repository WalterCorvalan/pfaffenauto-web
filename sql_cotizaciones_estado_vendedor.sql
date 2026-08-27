-- Solo para el módulo tasaciones (Aprobar/Rechazar): "estado" ya existe y lo usa
-- todo el embudo CRM (Nuevo/Pendiente/Contactado/Cliente/Perdido) — se necesita
-- una columna aparte para no romper eso. "vendedor_id" ya existe, se reutiliza.
alter table public.cotizaciones add column if not exists estado_tasacion text not null default 'Pendiente';

alter table public.cotizaciones drop constraint if exists cotizaciones_estado_tasacion_check;
alter table public.cotizaciones add constraint cotizaciones_estado_tasacion_check
  check (estado_tasacion in ('Pendiente', 'Aprobada', 'Rechazada'));
