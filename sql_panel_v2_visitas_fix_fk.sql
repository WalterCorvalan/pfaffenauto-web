-- Panel v2 — Visitas, fix: el catálogo público todavía pega contra la base
-- v1 (lib/supabase/server), así que los vehiculo_id que llegan del form
-- público son IDs de v1 y NO existen en public.vehiculos de nova. La FK
-- estricta rompía el insert. Se saca la FK y se guarda el vehículo
-- denormalizado (mismo patrón que ventas.vehiculo_marca/modelo) para no
-- depender de que el catálogo esté migrado.

alter table public.visitas drop constraint if exists visitas_vehiculo_id_fkey;

alter table public.visitas
  add column if not exists vehiculo_marca text,
  add column if not exists vehiculo_modelo text,
  add column if not exists vehiculo_patente text;
