-- Núcleo de seguimiento de leads/clientes: saber a quién no contactaste todavía.
alter table public.clientes add column if not exists estado_contacto text not null default 'Sin contactar';
alter table public.clientes add column if not exists ultimo_contacto timestamptz;

alter table public.clientes drop constraint if exists clientes_estado_contacto_check;
alter table public.clientes add constraint clientes_estado_contacto_check
  check (estado_contacto in ('Sin contactar', 'Contactado'));
