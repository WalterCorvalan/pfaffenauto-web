-- Campos de branding que faltaban para calcar el recibo de seña de Softcars:
-- logo, email, web e Ingresos Brutos (además de los ya existentes
-- branding_nombre/domicilio/telefono/cuit).
alter table public.configuracion_empresa add column if not exists branding_logo_url text;
alter table public.configuracion_empresa add column if not exists branding_email text;
alter table public.configuracion_empresa add column if not exists branding_web text;
alter table public.configuracion_empresa add column if not exists branding_ingresos_brutos text;
