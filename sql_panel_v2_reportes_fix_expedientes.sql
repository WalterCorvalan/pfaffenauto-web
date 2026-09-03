-- Fix: reportes_expedientes_resumen mezclaba "total" acotado al mes de
-- apertura con "activos"/"vencidos" sin acotar — daba Activos > Total,
-- sin sentido. Los expedientes son trabajo en curso, no un evento
-- mensual — los 4 números pasan a ser todos "foto actual" (sin recorte
-- por mes), consistentes entre sí. p_mes queda sin uso real por ahora
-- pero se mantiene el parámetro por si el frontend evoluciona a filtrar
-- por mes de apertura más adelante.
create or replace function public.reportes_expedientes_resumen(p_mes date)
returns table (total bigint, activos bigint, cerrados bigint, vencidos bigint)
language sql
stable
as $$
  select
    count(*),
    count(*) filter (where estado <> 'cerrado'),
    count(*) filter (where estado = 'cerrado'),
    count(*) filter (where estado <> 'cerrado' and vencimiento is not null and vencimiento < current_date)
  from public.expedientes
  where not archivado;
$$;
