-- Permite fijar un precio de dólar manual que reemplaza al dólar blue
-- automático (dolarapi.com) en toda la app: catálogo público, simuladores
-- de financiación y el ticker del panel. Se configura desde
-- Financiaciones → Configuración (admin/finanzas).
ALTER TABLE configuracion_empresa ADD COLUMN IF NOT EXISTS dolar_manual_activo boolean NOT NULL DEFAULT false;
ALTER TABLE configuracion_empresa ADD COLUMN IF NOT EXISTS dolar_manual_compra numeric;
ALTER TABLE configuracion_empresa ADD COLUMN IF NOT EXISTS dolar_manual_venta numeric;
