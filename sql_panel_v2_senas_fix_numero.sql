-- Fix (auditoría 2026-09-03): el número de seña se calculaba en el
-- frontend (select max(numero) + 1) — sin secuencia ni unique, dos señas
-- creadas cerca en el tiempo (o en sesiones distintas) podían calcular el
-- mismo "siguiente número" y terminar duplicadas. Confirmado en la propia
-- base: dos señas activas con "Nº 1".
--
-- Fix: numero pasa a asignarse con una secuencia real de Postgres
-- (atómica, sin condición de carrera) vía DEFAULT — el insert del
-- frontend ya no manda numero, la base lo pone sola. Se agrega unique
-- para que no vuelva a pasar ni por error.

-- 1) Renumerar los duplicados existentes antes de poder poner unique —
--    se conserva el numero de la más vieja de cada grupo, las más nuevas
--    pasan al final de la cola (no se toca ningún dato de negocio, solo
--    la etiqueta visual "Nº X").
with duplicados as (
  select id, numero, row_number() over (partition by numero order by fecha, id) as rn
  from public.senas
  where numero is not null
),
a_renumerar as (
  select id, row_number() over (order by id) as nuevo_offset
  from duplicados
  where rn > 1
),
max_actual as (
  select coalesce(max(numero), 0) as m from public.senas
)
update public.senas s
set numero = max_actual.m + a_renumerar.nuevo_offset
from a_renumerar, max_actual
where s.id = a_renumerar.id;

-- 2) Secuencia arrancando después del número más alto actual.
create sequence if not exists public.senas_numero_seq;
select setval('public.senas_numero_seq', greatest((select coalesce(max(numero), 0) from public.senas), 1), true);

alter table public.senas alter column numero set default nextval('public.senas_numero_seq');

-- 3) Nunca más duplicados.
create unique index if not exists senas_numero_unique_idx on public.senas(numero) where numero is not null;

-- Mismo bug, mismo fix, en presupuestos (misma lógica client-side copiada).
with duplicados as (
  select id, numero, row_number() over (partition by numero order by fecha, id) as rn
  from public.presupuestos
  where numero is not null
),
a_renumerar as (
  select id, row_number() over (order by id) as nuevo_offset
  from duplicados
  where rn > 1
),
max_actual as (
  select coalesce(max(numero), 0) as m from public.presupuestos
)
update public.presupuestos p
set numero = max_actual.m + a_renumerar.nuevo_offset
from a_renumerar, max_actual
where p.id = a_renumerar.id;

create sequence if not exists public.presupuestos_numero_seq;
select setval('public.presupuestos_numero_seq', greatest((select coalesce(max(numero), 0) from public.presupuestos), 1), true);
alter table public.presupuestos alter column numero set default nextval('public.presupuestos_numero_seq');
create unique index if not exists presupuestos_numero_unique_idx on public.presupuestos(numero) where numero is not null;
