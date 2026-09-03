-- Feature (2026-09-03, a pedido): resumen para el vendedor al derivar
-- (handoff) — hoy la alerta decía solo "El cliente pidió hablar con una
-- persona", sin contexto. El vendedor tenía que leer todo el chat de
-- nuevo. Ahora el bot genera 1-2 líneas de resumen (auto, presupuesto,
-- motivo) y esas líneas van directo en el mensaje de la alerta.
--
-- Columna nueva y separada de "notas" — notas es un campo que el staff
-- edita a mano en el chat (ChatClient.tsx), no hay que pisarlo con texto
-- generado automáticamente.

alter table public.whatsapp_conversaciones add column if not exists handoff_resumen text;
alter table public.rodi_conversaciones add column if not exists handoff_resumen text;

create or replace function public.whatsapp_notificar_handoff()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_encargado record;
  v_link text;
  v_titulo text;
begin
  if new.handoff_at is null or old.handoff_at is not null then
    return new;
  end if;

  v_link := '/panel-v2/whatsapp?conversacion=' || new.id;
  v_titulo := 'El cliente pidió hablar con una persona' || coalesce(' — ' || new.handoff_resumen, '');

  if new.vendedor_id is not null then
    insert into public.alertas (destinatario_id, tipo, prioridad, titulo, mensaje, link)
    values (new.vendedor_id, 'handoff_chat', 'alta', 'El cliente pidió hablar con una persona', new.handoff_resumen, v_link);
  else
    for v_encargado in select id from public.perfiles where ('encargado' = any(roles) or 'admin' = any(roles)) and activo = true loop
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, mensaje, link)
      values (v_encargado.id, 'handoff_chat', 'alta', 'El cliente pidió hablar con una persona', new.handoff_resumen, v_link);
    end loop;
  end if;

  return new;
end;
$$;

create or replace function public.rodi_notificar_handoff()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_encargado record;
  v_link text;
begin
  if new.handoff_at is null or old.handoff_at is not null then
    return new;
  end if;

  v_link := '/panel-v2/rodi?conversacion=' || new.id;

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
$$;
