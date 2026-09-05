-- Si el cliente manda varios mensajes seguidos antes de que alguien lea la
-- alerta anterior, ahora se suma un contador en la misma fila (sube al tope,
-- muestra "x2", "x3"...) en vez de dejar el titulo pisado sin rastro de
-- cuantos mensajes nuevos hay.

alter table public.alertas
  add column if not exists contador int not null default 1;

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

  v_link := '/panel-v2/whatsapp?conversacion=' || new.conversacion_id;
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
    for v_encargado in select id from public.perfiles where ('encargado' = any(roles) or 'admin' = any(roles)) and activo = true loop
      update public.alertas set titulo = v_titulo, created_at = now(), contador = contador + 1
      where destinatario_id = v_encargado.id and tipo = 'nuevo_mensaje_chat' and link = v_link and leida = false;
      get diagnostics v_actualizadas = row_count;
      if v_actualizadas = 0 then
        insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
        values (v_encargado.id, 'nuevo_mensaje_chat', 'media', v_titulo, v_link);
      end if;
    end loop;
  end if;

  return new;
end;
$$;

create or replace function public.instagram_notificar_mensaje_entrante()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vendedor_id uuid;
  v_username text;
  v_link text;
  v_titulo text;
  v_encargado record;
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

  v_link := '/panel-v2/whatsapp?canal=instagram&conversacion=' || new.conversacion_id;
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
    for v_encargado in select id from public.perfiles where ('encargado' = any(roles) or 'admin' = any(roles)) and activo = true loop
      update public.alertas set titulo = v_titulo, created_at = now(), contador = contador + 1
      where destinatario_id = v_encargado.id and tipo = 'nuevo_mensaje_chat' and link = v_link and leida = false;
      get diagnostics v_actualizadas = row_count;
      if v_actualizadas = 0 then
        insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
        values (v_encargado.id, 'nuevo_mensaje_chat', 'media', v_titulo, v_link);
      end if;
    end loop;
  end if;

  return new;
end;
$$;
