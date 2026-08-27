-- Tesorería sumaba el saldo de TODAS las cuentas en un solo "$" sin distinguir
-- moneda -- una cuenta en dólares se mezclaba con las de pesos en el total.
-- Cada cuenta es de una sola moneda (no movimientos individuales mixtos), así
-- que alcanza con taguear la cuenta.
alter table public.cuentas
  add column if not exists moneda text not null default 'ARS' check (moneda in ('ARS', 'USD'));
