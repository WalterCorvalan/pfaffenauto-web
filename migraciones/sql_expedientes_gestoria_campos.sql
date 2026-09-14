-- Campos nuevos para el tab "Gestoría" del detalle de expediente
-- (app/panel/expedientes/ExpedienteDetalleModal.tsx): quién lo administra
-- internamente, prioridad, gestor externo asignado, arancel del registro,
-- si el registro devolvió plata y fecha estimada de cierre del trámite.
--
-- Correr este SQL una sola vez en el editor SQL de Supabase.

alter table public.expedientes
  add column if not exists gestoria_responsable_id uuid references public.perfiles(id),
  add column if not exists gestoria_prioridad text default 'media',
  add column if not exists arancel_comprobante_url text,
  add column if not exists registro_devolvio_plata text,
  add column if not exists fecha_estimada_cierre date,
  add column if not exists gestor_externo_nombre text,
  add column if not exists gestor_externo_telefono text;
