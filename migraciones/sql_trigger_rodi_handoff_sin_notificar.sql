-- trg_rodi_handoff notifica a un vendedor/encargado en CUALQUIER handoff,
-- sin distinguir motivo. Con el nuevo caso "cliente ofensivo" (bot se pausa
-- solo, sin avisarle a nadie -- ver app/api/panel-v2/rodi/mensaje/route.ts,
-- campo pausar_sin_notificar), este trigger seguía notificando igual porque
-- no sabía de ese caso. Se agrega el corte temprano correspondiente.

create or replace function public.rodi_notificar_handoff()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_encargado record;
  v_link text;
begin
  if new.handoff_at is null or old.handoff_at is not null then
    return new;
  end if;

  if new.handoff_reason = 'cliente_ofensivo' then
    return new;
  end if;

  v_link := '/panel/rodi?conversacion=' || new.id;

  if new.vendedor_id is not null then
    insert into public.alertas (destinatario_id, tipo, prioridad, titulo, mensaje, link)
    values (new.vendedor_id, 'rodi_handoff', 'alta', 'El visitante del sitio pidió hablar con una persona', new.handoff_resumen, v_link);
  else
    for v_encargado in select id from public.perfiles where ('encargado' = any(roles) or 'admin' = any(roles)) and activo = true loop
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, mensaje, link)
      values (v_encargado.id, 'rodi_handoff', 'alta', 'El visitante del sitio pidió hablar con una persona', new.handoff_resumen, v_link);
    end loop;
  end if;

  return new;
end;
$function$;
