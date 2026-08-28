-- Panel v2 — Notificaciones de WhatsApp (nuevo mensaje entrante + handoff).
-- Base nova. Triggers en vez de código de API porque el bot v2 escribe directo
-- a las tablas con service role (sin pasar por nuestra API) — así la alerta
-- sale pase lo que pase, igual que notificarPersona/notificarEncargados en v1.

create or replace function public.whatsapp_notificar_mensaje_entrante()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vendedor_id uuid;
  v_nombre text;
  v_telefono text;
  v_link text;
  v_titulo text;
  v_encargado record;
begin
  if new.direccion <> 'in' then
    return new;
  end if;

  select c.vendedor_id, wc.nombre_perfil, wc.telefono
    into v_vendedor_id, v_nombre, v_telefono
  from public.whatsapp_conversaciones c
  join public.whatsapp_contactos wc on wc.id = c.contacto_id
  where c.id = new.conversacion_id;

  v_link := '/panel-v2/whatsapp?conversacion=' || new.conversacion_id;
  v_titulo := coalesce(v_nombre, v_telefono, 'Cliente') || ': ' || coalesce(left(new.texto, 80), 'envió un mensaje');

  if v_vendedor_id is not null then
    insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
    values (v_vendedor_id, 'nuevo_mensaje_chat', 'media', v_titulo, v_link);
  else
    for v_encargado in select id from public.perfiles where ('encargado' = any(roles) or 'admin' = any(roles)) and activo = true loop
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
      values (v_encargado.id, 'nuevo_mensaje_chat', 'media', v_titulo, v_link);
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_whatsapp_mensaje_entrante on public.whatsapp_mensajes;
create trigger trg_whatsapp_mensaje_entrante
  after insert on public.whatsapp_mensajes
  for each row execute function public.whatsapp_notificar_mensaje_entrante();

create or replace function public.whatsapp_notificar_handoff()
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

  v_link := '/panel-v2/whatsapp?conversacion=' || new.id;

  if new.vendedor_id is not null then
    insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
    values (new.vendedor_id, 'handoff_chat', 'alta', 'El cliente pidió hablar con una persona', v_link);
  else
    for v_encargado in select id from public.perfiles where ('encargado' = any(roles) or 'admin' = any(roles)) and activo = true loop
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
      values (v_encargado.id, 'handoff_chat', 'alta', 'El cliente pidió hablar con una persona', v_link);
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_whatsapp_handoff on public.whatsapp_conversaciones;
create trigger trg_whatsapp_handoff
  after update on public.whatsapp_conversaciones
  for each row execute function public.whatsapp_notificar_handoff();
