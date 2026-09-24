-- Conectar Facturación (compra de vehículos) con AFIP/IVA en Finanzas, sin
-- tocar ni reemplazar nada de lo que ya existe en ninguno de los dos
-- módulos: son columnas nuevas y opcionales sobre "vehiculos", que
-- AfipIvaTab lee además de (no en vez de) su fuente actual (movimientos_caja).
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS factura_fecha date;
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS factura_tipo_comprobante text CHECK (factura_tipo_comprobante IS NULL OR factura_tipo_comprobante IN ('A', 'B', 'C', 'Exenta'));
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS factura_iva_pct numeric;
