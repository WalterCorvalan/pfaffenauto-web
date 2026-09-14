-- Campo nuevo para que el vendedor/propietario tenga el mismo campo
-- "Ocupación / profesión" que ya tiene el comprador (ventas.comprador_profesion)
-- -- lo usa el tab "Parte Vendedora" de Expedientes
-- (app/panel/expedientes/ExpedienteDetalleModal.tsx).
--
-- Correr este SQL una sola vez en el editor SQL de Supabase.

alter table public.vehiculos
  add column if not exists propietario_profesion text;
