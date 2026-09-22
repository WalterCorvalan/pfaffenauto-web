-- Datos estructurados de una solicitud de financiación (hasta ahora todo
-- quedaba comprimido en el campo de texto libre "version", ej: "Solicitud
-- de crédito: financia hasta $X..."). Se agregan como columnas propias para
-- poder mostrarlos ordenados en la tabla/modal de Financiaciones en vez de
-- un párrafo. Correr una vez y borrar este archivo (mismo criterio que el
-- resto de migraciones/*.sql).

ALTER TABLE leads_tasacion ADD COLUMN IF NOT EXISTS precio_vehiculo numeric;
ALTER TABLE leads_tasacion ADD COLUMN IF NOT EXISTS pct_financiado numeric;
ALTER TABLE leads_tasacion ADD COLUMN IF NOT EXISTS monto_financiar numeric;
ALTER TABLE leads_tasacion ADD COLUMN IF NOT EXISTS anticipo_monto numeric;
ALTER TABLE leads_tasacion ADD COLUMN IF NOT EXISTS plazo_meses integer;
ALTER TABLE leads_tasacion ADD COLUMN IF NOT EXISTS cuota_estimada numeric;
ALTER TABLE leads_tasacion ADD COLUMN IF NOT EXISTS credito_preaprobado boolean;
