-- Vincula un cheque emitido a un vehículo del stock (pensado para 0km
-- pagados con cheques a proveedores) -- así se puede descontar del
-- patrimonio en stock la deuda pendiente por cheques todavía no cobrados.
-- Correr una vez y borrar este archivo (mismo criterio que el resto de
-- migraciones/*.sql).

ALTER TABLE cheques ADD COLUMN IF NOT EXISTS vehiculo_id uuid REFERENCES vehiculos(id) ON DELETE SET NULL;
