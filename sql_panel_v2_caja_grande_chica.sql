-- Caja Grande / Caja Chica: no se modela como tabla nueva -- son dos
-- `cuentas` más (tipo=Efectivo, con sucursal_id), reusando saldo_cuenta(),
-- registrar_movimiento_caja() y crear_transferencia() que ya existen. Solo
-- se agregan 2 columnas para poder distinguir el rol de cada caja y, en el
-- caso de una chica, saber a qué caja grande repone/devuelve con un click.
alter table public.cuentas add column if not exists rol_caja text check (rol_caja in ('grande', 'chica'));
alter table public.cuentas add column if not exists caja_grande_id uuid references public.cuentas(id);

create index if not exists idx_cuentas_rol_caja on public.cuentas(sucursal_id, rol_caja) where rol_caja is not null;
