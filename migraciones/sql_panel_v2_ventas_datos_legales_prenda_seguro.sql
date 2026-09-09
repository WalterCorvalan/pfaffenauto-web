-- Boleto de venta completo (paridad con v1): datos legales del comprador,
-- financiación prendaria, seguro contratado, desglose de forma de pago, y
-- ficha técnica completa del vehículo de permuta.

alter table ventas
  add column if not exists comprador_fecha_nacimiento date,
  add column if not exists comprador_cuit_cuil text,
  add column if not exists comprador_estado_civil text,
  add column if not exists comprador_profesion text,
  add column if not exists comprador_calle text,
  add column if not exists comprador_numero text,
  add column if not exists comprador_depto text,
  add column if not exists comprador_localidad text,
  add column if not exists comprador_codigo_postal text,
  add column if not exists comprador_provincia text,
  add column if not exists comprador_telefono_celular text,
  add column if not exists prenda_banco text,
  add column if not exists prenda_monto numeric,
  add column if not exists prenda_cuota_monto numeric,
  add column if not exists prenda_seguro_monto numeric,
  add column if not exists seguro_contratado boolean not null default false,
  add column if not exists seguro_compania text,
  add column if not exists seguro_importe_mensual numeric,
  add column if not exists pago_efectivo_ars numeric,
  add column if not exists pago_efectivo_usd numeric,
  add column if not exists tipo_cambio numeric,
  add column if not exists patentamiento_transferencia_monto numeric;

comment on column ventas.comprador_telefono is 'Teléfono de línea. El celular va en comprador_telefono_celular.';
comment on column ventas.prenda_monto is 'Monto total de la prenda -- distinto de monto_financiacion (lo que pone la financiera).';

alter table venta_permutas
  add column if not exists segmento text,
  add column if not exists tipo text,
  add column if not exists marca_motor text,
  add column if not exists numero_motor text,
  add column if not exists marca_chasis text,
  add column if not exists numero_chasis text,
  add column if not exists combustible text,
  add column if not exists radicado_localidad text,
  add column if not exists radicado_provincia text,
  add column if not exists tasado_en text;
