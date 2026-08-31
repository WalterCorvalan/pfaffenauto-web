-- Borra automáticamente las conversaciones de Rodi que a las 24hs de
-- creadas todavía no tienen ni nombre ni teléfono del visitante — no dejan
-- lead accionable, solo ocupan espacio. WhatsApp no necesita este cron: ahí
-- el teléfono ya se conoce desde el primer mensaje.

create or replace function public.limpiar_conversaciones_rodi_sin_datos()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  total int;
begin
  delete from public.rodi_conversaciones
  where nombre_contacto is null
    and telefono_contacto is null
    and created_at < now() - interval '24 hours';

  get diagnostics total = row_count;
  return total;
end;
$$;

create extension if not exists pg_cron;

select cron.schedule(
  'limpiar-rodi-sin-datos',
  '0 * * * *',
  $$select public.limpiar_conversaciones_rodi_sin_datos()$$
) where not exists (select 1 from cron.job where jobname = 'limpiar-rodi-sin-datos');
