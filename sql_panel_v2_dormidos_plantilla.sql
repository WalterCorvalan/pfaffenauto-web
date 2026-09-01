-- Dormidos no necesita tablas nuevas (se arma con ventas + clientes que ya
-- existen). Solo suma la plantilla de WhatsApp editable, mismo patrón que
-- las 4 de Recontactos.
alter table public.configuracion_empresa
  add column if not exists plantilla_reactivacion_dormidos text not null default 'Hola {nombre}! Soy {vendedor} de Pfaffen Autos. Vimos que tu {vehiculo} ya tiene un tiempo — ¿pensaste en renovar? Tenemos excelentes condiciones para vos.';
