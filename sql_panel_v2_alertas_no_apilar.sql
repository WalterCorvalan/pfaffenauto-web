-- Fix: la campana no debe llenarse con una alerta por cada mensaje que
-- manda un mismo cliente — solo la primera vez, y se actualiza (sube al
-- tope, cambia el texto) mientras siga sin leerse. Redefine las dos
-- funciones de notificación (WhatsApp y Rodi) con esa lógica.

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
    update public.alertas set titulo = v_titulo, created_at = now()
    where destinatario_id = v_vendedor_id and tipo = 'nuevo_mensaje_chat' and link = v_link and leida = false;
    if not found then
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
      values (v_vendedor_id, 'nuevo_mensaje_chat', 'media', v_titulo, v_link);
    end if;
  else
    for v_encargado in select id from public.perfiles where ('encargado' = any(roles) or 'admin' = any(roles)) and activo = true loop
      update public.alertas set titulo = v_titulo, created_at = now()
      where destinatario_id = v_encargado.id and tipo = 'nuevo_mensaje_chat' and link = v_link and leida = false;
      if not found then
        insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
        values (v_encargado.id, 'nuevo_mensaje_chat', 'media', v_titulo, v_link);
      end if;
    end loop;
  end if;

  return new;
end;
$$;

create or replace function public.rodi_notificar_mensaje_entrante()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vendedor_id uuid;
  v_nombre text;
  v_link text;
  v_titulo text;
  v_encargado record;
begin
  if new.direccion <> 'in' then
    return new;
  end if;

  select c.vendedor_id, coalesce(c.nombre_contacto, 'Visitante del sitio')
    into v_vendedor_id, v_nombre
  from public.rodi_conversaciones c
  where c.id = new.conversacion_id;

  v_link := '/panel-v2/rodi?conversacion=' || new.conversacion_id;
  v_titulo := v_nombre || ': ' || coalesce(left(new.texto, 80), 'envió un mensaje');

  if v_vendedor_id is not null then
    update public.alertas set titulo = v_titulo, created_at = now()
    where destinatario_id = v_vendedor_id and tipo = 'rodi_nuevo_mensaje' and link = v_link and leida = false;
    if not found then
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
      values (v_vendedor_id, 'rodi_nuevo_mensaje', 'media', v_titulo, v_link);
    end if;
  else
    for v_encargado in select id from public.perfiles where ('encargado' = any(roles) or 'admin' = any(roles)) and activo = true loop
      update public.alertas set titulo = v_titulo, created_at = now()
      where destinatario_id = v_encargado.id and tipo = 'rodi_nuevo_mensaje' and link = v_link and leida = false;
      if not found then
        insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
        values (v_encargado.id, 'rodi_nuevo_mensaje', 'media', v_titulo, v_link);
      end if;
    end loop;
  end if;

  return new;
end;
$$;
