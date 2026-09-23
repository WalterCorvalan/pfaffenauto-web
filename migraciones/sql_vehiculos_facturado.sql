-- Pedido del 23/9: al cargar un vehículo en Stock, marcar si está
-- facturado y, si lo está, cargar importe/número/emisor + el archivo de
-- la factura.
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS facturado boolean NOT NULL DEFAULT false;
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS factura_importe numeric;
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS factura_numero text;
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS factura_emisor text;
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS factura_archivo_url text;
