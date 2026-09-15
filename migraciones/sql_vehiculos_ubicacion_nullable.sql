-- vehiculos.ubicacion tiene una restricción NOT NULL que no debería tener:
-- el campo se deja vacío a propósito al cargar un auto nuevo (se completa
-- después) -- NuevoVehiculoModal.tsx ya manda `null` cuando está vacío
-- (ubicacion: ubicacion || null), pero la base lo rechazaba con:
-- "null value in column "ubicacion" of relation "vehiculos" violates
-- not-null constraint".
--
-- Correr este SQL una sola vez en el editor SQL de Supabase.

alter table public.vehiculos
  alter column ubicacion drop not null;
