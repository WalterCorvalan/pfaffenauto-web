-- Tab "Cuentas Registro" del detalle de expediente
-- (app/panel/expedientes/ExpedienteDetalleModal.tsx): datos bancarios
-- oficiales del registro (PDF/imagen con CBU/alias/titular) y el
-- desglose de en qué cuenta(s) del registro se transfiere el pago al
-- propietario.
--
-- Correr este SQL una sola vez en el editor SQL de Supabase.

alter table public.expedientes
  add column if not exists registro_datos_bancarios_url text,
  add column if not exists registro_importe_total numeric,
  add column if not exists registro_moneda_total text default 'ARS',
  add column if not exists registro_notas text;

create table if not exists public.expediente_cuentas_registro (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid not null references public.expedientes(id) on delete cascade,
  banco text,
  cbu_alias text,
  titular text,
  importe numeric,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_expediente_cuentas_registro_expediente on public.expediente_cuentas_registro(expediente_id);
