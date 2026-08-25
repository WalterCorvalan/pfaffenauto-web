-- Razón de por qué se pautó un auto (temporada, rotación rápida, auto
-- clavado hace tiempo, etc) — pedido explícito para que Autos Pautados
-- explique el "por qué", no solo el "qué".
alter table public.vehiculos add column if not exists razon_pauta text;
