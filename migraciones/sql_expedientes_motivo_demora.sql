-- Campo nuevo para anotar por qué un expediente demorado (pasado el plazo
-- de transferencia) no se movió todavía -- lo usa la fila "⚠ Demorado" del
-- listado de Expedientes (app/panel/expedientes/ExpedientesClient.tsx).
--
-- Correr este SQL una sola vez en el editor SQL de Supabase.

alter table public.expedientes
  add column if not exists motivo_demora text;
