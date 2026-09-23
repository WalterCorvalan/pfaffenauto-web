-- "Mis Vehículos" (antes "Mis autos") pasa a cubrir cualquier tipo de
-- vehículo (auto, moto, lancha, camión, maquinaria, etc.), no solo autos --
-- los 3 campos fijos vence_vtv/vence_seguro/vence_patente solo tenían
-- sentido para un auto. Se reemplazan por una lista libre de vencimientos
-- (label + fecha), guardada en JSONB. Las columnas viejas quedan en la
-- tabla sin usarse (no se borran, por si hay datos cargados que se quieran
-- migrar a mano más adelante).
ALTER TABLE espacio_autos_personales ADD COLUMN IF NOT EXISTS tipo text;
ALTER TABLE espacio_autos_personales ADD COLUMN IF NOT EXISTS vencimientos jsonb NOT NULL DEFAULT '[]'::jsonb;
