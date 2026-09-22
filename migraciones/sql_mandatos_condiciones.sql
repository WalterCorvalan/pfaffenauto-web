-- Suma a "mandatos" los datos que aparecen en el papel del mandato de
-- consignación pero que el modal "Nuevo mandato" todavía no cargaba:
-- comisión, condiciones de compra asegurada y documentación a cargo del
-- vendedor. Correr una vez y borrar este archivo (mismo criterio que el
-- resto de migraciones/*.sql).

ALTER TABLE mandatos ADD COLUMN IF NOT EXISTS comision_pct numeric;

ALTER TABLE mandatos ADD COLUMN IF NOT EXISTS compra_asegurada text; -- 'si' | 'no' | null
ALTER TABLE mandatos ADD COLUMN IF NOT EXISTS condicion_pago text; -- 'inmediata' | '30_dias' | '45_dias'
ALTER TABLE mandatos ADD COLUMN IF NOT EXISTS monto_condicion_pago numeric;

ALTER TABLE mandatos ADD COLUMN IF NOT EXISTS doc_08_nro text;
ALTER TABLE mandatos ADD COLUMN IF NOT EXISTS doc_verificacion_policial text;
ALTER TABLE mandatos ADD COLUMN IF NOT EXISTS doc_titulo_cedula_deuda numeric;
ALTER TABLE mandatos ADD COLUMN IF NOT EXISTS doc_a_cargo_vendedor boolean DEFAULT false;

ALTER TABLE mandatos ADD COLUMN IF NOT EXISTS firma_url text;
