-- Panel v2 — webhook de Instagram: mismo patrón que WhatsApp
-- (sql_panel_v2_whatsapp_alertas.sql + sql_panel_v2_bot_rodi.sql), pero sobre
-- instagram_conversaciones/instagram_mensajes/instagram_contactos.

alter table public.instagram_configuracion
  add column if not exists webhook_verify_token text unique;

-- Asignación por ronda de vendedor (mismo criterio que WhatsApp: entre los
-- que reciben leads, el que hace más tiempo no recibe uno).
create or replace function public.asignar_vendedor_ronda_instagram()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  candidato uuid;
begin
  select p.id into candidato
  from public.perfiles p
  left join public.disponibilidad_vendedor d on d.vendedor_id = p.id
  left join lateral (
    select max(c.created_at) as ultimo
    from public.instagram_conversaciones c
    where c.vendedor_id = p.id
  ) u on true
  where p.activo = true
    and 'ventas' = any(p.roles)
    and (d.recibir_leads is null or d.recibir_leads = true)
  order by u.ultimo asc nulls first
  limit 1;

  return candidato;
end;
$$;

create or replace function public.asignar_vendedor_conversacion_nueva_instagram()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.vendedor_id is null then
    new.vendedor_id := public.asignar_vendedor_ronda_instagram();
    if new.vendedor_id is not null then
      new.estado_lead := 'asignado';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_asignar_vendedor_conversacion_instagram on public.instagram_conversaciones;
create trigger trg_asignar_vendedor_conversacion_instagram
  before insert on public.instagram_conversaciones
  for each row execute function public.asignar_vendedor_conversacion_nueva_instagram();

-- Alertas: nuevo mensaje entrante.
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

drop trigger if exists trg_instagram_mensaje_entrante on public.instagram_mensajes;
create trigger trg_instagram_mensaje_entrante
  after insert on public.instagram_mensajes
  for each row execute function public.instagram_notificar_mensaje_entrante();

-- Alertas: handoff (cliente pidió hablar con una persona).
create or replace function public.instagram_notificar_handoff()
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

  v_link := '/panel-v2/whatsapp?canal=instagram&conversacion=' || new.id;

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

drop trigger if exists trg_instagram_handoff on public.instagram_conversaciones;
create trigger trg_instagram_handoff
  after update on public.instagram_conversaciones
  for each row execute function public.instagram_notificar_handoff();
