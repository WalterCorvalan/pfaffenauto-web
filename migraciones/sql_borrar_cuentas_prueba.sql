-- Borra únicamente las cuentas de Tesorería que NO tienen ningún registro
-- enganchado en ninguna tabla (movimientos_caja, ventas, señas, comisiones,
-- cuotas, cheques, préstamos, tarjetas, retiros, recurrencias, arqueos,
-- etc.) -- detecta las referencias dinámicamente vía las foreign keys reales
-- de la base, no una lista de tablas escrita a mano (evita que se me pase
-- alguna y borre una cuenta con historial real).
--
-- PASO 1 -- Correr esto primero: lista las cuentas que existen hoy.
select id, nombre, moneda, activa from public.cuentas order by nombre;

-- PASO 2 -- Chequeo real y completo contra TODAS las foreign keys que
-- apuntan a cuentas(id), sea cual sea su nombre de columna o tabla.
-- Devuelve, por cuenta, en qué tabla.columna tiene registros -- si una
-- cuenta aparece acá, NO se borra en el paso 3.
do $$
declare
  r record;
  total bigint;
begin
  raise notice '--- Cuentas con referencias encontradas ---';
  for r in
    select
      tc.table_name,
      kcu.column_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
    join information_schema.constraint_column_usage ccu
      on tc.constraint_name = ccu.constraint_name and tc.table_schema = ccu.table_schema
    where tc.constraint_type = 'FOREIGN KEY'
      and ccu.table_name = 'cuentas'
      and tc.table_schema = 'public'
  loop
    execute format('select count(*) from public.%I where %I is not null', r.table_name, r.column_name) into total;
    if total > 0 then
      raise notice '% . % -> % fila(s)', r.table_name, r.column_name, total;
    end if;
  end loop;
end $$;

-- PASO 3 -- Recién correr esto después de revisar los pasos 1 y 2 y
-- confirmar que ninguna cuenta que te importa tiene referencias.
-- Borra SOLO las cuentas sin ninguna fila enganchada en ninguna tabla que
-- tenga una FK real hacia cuentas(id).
do $$
declare
  r record;
  ids_referenciados uuid[] := '{}';
  nuevos uuid[];
begin
  for r in
    select tc.table_name, kcu.column_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
    join information_schema.constraint_column_usage ccu
      on tc.constraint_name = ccu.constraint_name and tc.table_schema = ccu.table_schema
    where tc.constraint_type = 'FOREIGN KEY'
      and ccu.table_name = 'cuentas'
      and tc.table_schema = 'public'
  loop
    execute format('select array_agg(distinct %I) from public.%I where %I is not null', r.column_name, r.table_name, r.column_name)
      into nuevos;
    if nuevos is not null then
      ids_referenciados := ids_referenciados || nuevos;
    end if;
  end loop;

  delete from public.cuentas
  where id <> all (ids_referenciados);

  raise notice 'Listo. Cuentas referenciadas que se conservaron: %', array_length(ids_referenciados, 1);
end $$;
