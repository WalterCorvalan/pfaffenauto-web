-- El envío de NPS es manual a propósito (abre WhatsApp Web para que la
-- persona revise el mensaje antes de mandarlo) -- no hay plantilla de Meta
-- para autoenviarlo. Lo que faltaba era el AVISO: nada le recordaba al
-- vendedor que tenía que pedir la encuesta después de una venta, una
-- entrega o una visita. Estos 3 triggers solo avisan (alerta interna,
-- misma tabla que el resto del panel) -- el envío lo sigue haciendo una
-- persona a mano desde /panel/nps.

create or replace function public.nps_recordatorio_venta()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  -- Una venta puede nacer directo en "cerrada" (INSERT, ej. venta en el
  -- momento sin pasar por borrador) o llegar ahí por UPDATE -- pero si es
  -- carga manual de una venta VIEJA, no corresponde recordar un NPS de algo
  -- que pasó hace tiempo.
  if new.estado <> 'cerrada' or new.vendedor_id is null then
    return new;
  end if;
  if tg_op = 'INSERT' and coalesce(new.carga_manual, false) then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.estado = 'cerrada' then
    return new;
  end if;

  insert into public.alertas (destinatario_id, tipo, prioridad, titulo, mensaje, link)
  values (new.vendedor_id, 'nps_recordatorio', 'baja', 'Pedile la encuesta NPS (post-venta)',
    'Se cerró la venta de ' || coalesce(new.comprador_nombre, 'el cliente') || ' -- buen momento para pedirle la encuesta.', '/panel/nps');
  return new;
end;
$function$;

drop trigger if exists trg_nps_recordatorio_venta on public.ventas;
create trigger trg_nps_recordatorio_venta
after insert or update of estado on public.ventas
for each row execute function public.nps_recordatorio_venta();

create or replace function public.nps_recordatorio_entrega()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.fecha_entrega is null or new.vendedor_id is null then
    return new;
  end if;
  if tg_op = 'INSERT' and coalesce(new.carga_manual, false) then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.fecha_entrega is not distinct from new.fecha_entrega then
    return new;
  end if;

  insert into public.alertas (destinatario_id, tipo, prioridad, titulo, mensaje, link)
  values (new.vendedor_id, 'nps_recordatorio', 'baja', 'Pedile la encuesta NPS (post-entrega)',
    'Se registró la entrega del auto a ' || coalesce(new.comprador_nombre, 'el cliente') || ' -- buen momento para pedirle la encuesta.', '/panel/nps');
  return new;
end;
$function$;

drop trigger if exists trg_nps_recordatorio_entrega on public.ventas;
create trigger trg_nps_recordatorio_entrega
after insert or update of fecha_entrega on public.ventas
for each row execute function public.nps_recordatorio_entrega();

create or replace function public.nps_recordatorio_visita()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.estado = 'Asistió' and old.estado is distinct from 'Asistió' and new.vendedor_id is not null then
    insert into public.alertas (destinatario_id, tipo, prioridad, titulo, mensaje, link)
    values (new.vendedor_id, 'nps_recordatorio', 'baja', 'Pedile la encuesta NPS (post-visita)',
      coalesce(new.nombre_cliente, 'El cliente') || ' asistió a la visita -- buen momento para pedirle la encuesta.', '/panel/nps');
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_nps_recordatorio_visita on public.visitas;
create trigger trg_nps_recordatorio_visita
after update of estado on public.visitas
for each row execute function public.nps_recordatorio_visita();
