-- Mandar un mensaje en el chat interno (Mensajes -- General, grupos, directos)
-- nunca generaba notificación en la campanita: no había NINGÚN trigger en la
-- tabla "mensajes". Se agrega acá.

create or replace function public.mensajes_notificar_nuevo()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_canal record;
  v_autor_nombre text;
  v_preview text;
  v_destinatario_id uuid;
begin
  select tipo, nombre into v_canal from public.mensajes_canales where id = new.canal_id;
  if v_canal is null then return new; end if;

  select nombre into v_autor_nombre from public.perfiles where id = new.autor_id;

  v_preview := coalesce(new.texto, case when jsonb_array_length(coalesce(new.adjuntos, '[]'::jsonb)) > 0 then '📎 Adjunto' else 'Mensaje nuevo' end);
  if length(v_preview) > 80 then v_preview := left(v_preview, 80) || '…'; end if;

  if v_canal.tipo = 'general' then
    -- El canal General no tiene filas de membresía (todo perfil activo lo ve) -- se avisa a todos menos al autor.
    for v_destinatario_id in select id from public.perfiles where activo = true and id <> new.autor_id loop
      insert into public.alertas (destinatario_id, tipo, titulo, link, prioridad)
      values (v_destinatario_id, 'mensaje_nuevo', coalesce(v_autor_nombre, 'Alguien') || ' en General: ' || v_preview, '/panel/mensajes', 'media');
    end loop;
  else
    for v_destinatario_id in select perfil_id from public.mensajes_canal_miembros where canal_id = new.canal_id and perfil_id <> new.autor_id loop
      insert into public.alertas (destinatario_id, tipo, titulo, link, prioridad)
      values (v_destinatario_id, 'mensaje_nuevo', coalesce(v_autor_nombre, 'Alguien') || ': ' || v_preview, '/panel/mensajes', 'media');
    end loop;
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_mensajes_notificar_nuevo on public.mensajes;
create trigger trg_mensajes_notificar_nuevo
after insert on public.mensajes
for each row execute function public.mensajes_notificar_nuevo();
