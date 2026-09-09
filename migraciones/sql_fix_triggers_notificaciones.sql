-- Dos bugs reales encontrados:
--
-- 1. Los 4 triggers de notificación (whatsapp/instagram/rodi mensaje
--    entrante + visita nueva) armaban el link con "/panel-v2/..." -- roto
--    desde que esta sesión renombró panel-v2 a /panel. Cada notificación
--    llevaba a un 404.
--
-- 2. El caso "sin vendedor asignado" solo avisaba a encargado/admin, igual
--    en las 4 -- el pedido explícito era que el primer "hola" de un lead
--    nuevo avise a TODOS los vendedores por igual (no solo a quien tiene
--    que reasignar), para que se tome más rápido. Se ensancha el loop a
--    admin/encargado/ventas en los 4.
--
-- El código de la app (webhook de WhatsApp) llamaba ADEMÁS a
-- notificarPersona/notificarEncargados por su cuenta -- 100% duplicado con
-- este trigger (quedaba alerta doble). Se sacó esa llamada del código
-- (ver commit de app) porque el trigger ya lo cubre con mejor lógica
-- anti-espam (actualiza la alerta sin leer en vez de insertar una nueva).

create or replace function public.whatsapp_notificar_mensaje_entrante()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_vendedor_id uuid;
  v_nombre text;
  v_telefono text;
  v_link text;
  v_titulo text;
  v_destinatario record;
  v_actualizadas int;
begin
  if new.direccion <> 'in' then
    return new;
  end if;

  select c.vendedor_id, wc.nombre_perfil, wc.telefono
    into v_vendedor_id, v_nombre, v_telefono
  from public.whatsapp_conversaciones c
  join public.whatsapp_contactos wc on wc.id = c.contacto_id
  where c.id = new.conversacion_id;

  v_link := '/panel/whatsapp?conversacion=' || new.conversacion_id;
  v_titulo := coalesce(v_nombre, v_telefono, 'Cliente') || ': ' || coalesce(left(new.texto, 80), 'envió un mensaje');

  if v_vendedor_id is not null then
    update public.alertas set titulo = v_titulo, created_at = now(), contador = contador + 1
    where destinatario_id = v_vendedor_id and tipo = 'nuevo_mensaje_chat' and link = v_link and leida = false;
    get diagnostics v_actualizadas = row_count;
    if v_actualizadas = 0 then
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
      values (v_vendedor_id, 'nuevo_mensaje_chat', 'media', v_titulo, v_link);
    end if;
  else
    for v_destinatario in select id from public.perfiles where ('encargado' = any(roles) or 'admin' = any(roles) or 'ventas' = any(roles)) and activo = true loop
      update public.alertas set titulo = v_titulo, created_at = now(), contador = contador + 1
      where destinatario_id = v_destinatario.id and tipo = 'nuevo_mensaje_chat' and link = v_link and leida = false;
      get diagnostics v_actualizadas = row_count;
      if v_actualizadas = 0 then
        insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
        values (v_destinatario.id, 'nuevo_mensaje_chat', 'media', v_titulo, v_link);
      end if;
    end loop;
  end if;

  return new;
end;
$function$;

create or replace function public.instagram_notificar_mensaje_entrante()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_vendedor_id uuid;
  v_username text;
  v_link text;
  v_titulo text;
  v_destinatario record;
  v_actualizadas int;
begin
  if new.direccion <> 'in' then
    return new;
  end if;

  select c.vendedor_id, ic.username
    into v_vendedor_id, v_username
  from public.instagram_conversaciones c
  join public.instagram_contactos ic on ic.id = c.contacto_id
  where c.id = new.conversacion_id;

  v_link := '/panel/whatsapp?canal=instagram&conversacion=' || new.conversacion_id;
  v_titulo := coalesce('@' || v_username, 'Cliente') || ': ' || coalesce(left(new.texto, 80), 'envió un mensaje');

  if v_vendedor_id is not null then
    update public.alertas set titulo = v_titulo, created_at = now(), contador = contador + 1
    where destinatario_id = v_vendedor_id and tipo = 'nuevo_mensaje_chat' and link = v_link and leida = false;
    get diagnostics v_actualizadas = row_count;
    if v_actualizadas = 0 then
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
      values (v_vendedor_id, 'nuevo_mensaje_chat', 'media', v_titulo, v_link);
    end if;
  else
    for v_destinatario in select id from public.perfiles where ('encargado' = any(roles) or 'admin' = any(roles) or 'ventas' = any(roles)) and activo = true loop
      update public.alertas set titulo = v_titulo, created_at = now(), contador = contador + 1
      where destinatario_id = v_destinatario.id and tipo = 'nuevo_mensaje_chat' and link = v_link and leida = false;
      get diagnostics v_actualizadas = row_count;
      if v_actualizadas = 0 then
        insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
        values (v_destinatario.id, 'nuevo_mensaje_chat', 'media', v_titulo, v_link);
      end if;
    end loop;
  end if;

  return new;
end;
$function$;

create or replace function public.rodi_notificar_mensaje_entrante()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_vendedor_id uuid;
  v_nombre text;
  v_link text;
  v_titulo text;
  v_destinatario record;
begin
  if new.direccion <> 'in' then
    return new;
  end if;

  select c.vendedor_id, coalesce(c.nombre_contacto, 'Visitante del sitio')
    into v_vendedor_id, v_nombre
  from public.rodi_conversaciones c
  where c.id = new.conversacion_id;

  v_link := '/panel/rodi?conversacion=' || new.conversacion_id;
  v_titulo := v_nombre || ': ' || coalesce(left(new.texto, 80), 'envió un mensaje');

  if v_vendedor_id is not null then
    update public.alertas set titulo = v_titulo, created_at = now()
    where destinatario_id = v_vendedor_id and tipo = 'rodi_nuevo_mensaje' and link = v_link and leida = false;
    if not found then
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
      values (v_vendedor_id, 'rodi_nuevo_mensaje', 'media', v_titulo, v_link);
    end if;
  else
    for v_destinatario in select id from public.perfiles where ('encargado' = any(roles) or 'admin' = any(roles) or 'ventas' = any(roles)) and activo = true loop
      update public.alertas set titulo = v_titulo, created_at = now()
      where destinatario_id = v_destinatario.id and tipo = 'rodi_nuevo_mensaje' and link = v_link and leida = false;
      if not found then
        insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
        values (v_destinatario.id, 'rodi_nuevo_mensaje', 'media', v_titulo, v_link);
      end if;
    end loop;
  end if;

  return new;
end;
$function$;

create or replace function public.visitas_notificar_nueva()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_titulo text;
  v_link text;
  v_destinatario record;
begin
  v_titulo := 'Nueva visita: ' || new.nombre_cliente || ' — ' || to_char(new.fecha_visita, 'DD/MM') || ' ' || new.horario_visita || ' (' || new.sucursal || ')';
  v_link := '/panel/visitas?visita=' || new.id;

  if new.vendedor_id is not null then
    insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
    values (new.vendedor_id, 'visita_nueva', 'media', v_titulo, v_link);
  else
    for v_destinatario in select id from public.perfiles where ('encargado' = any(roles) or 'admin' = any(roles) or 'ventas' = any(roles)) and activo = true loop
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
      values (v_destinatario.id, 'visita_nueva', 'media', v_titulo, v_link);
    end loop;
  end if;

  return new;
end;
$function$;
