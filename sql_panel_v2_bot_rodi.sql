-- Panel v2 — backend del bot de WhatsApp (Rodi): pipeline de leads +
-- asignación por ronda de vendedor. Los triggers de alerta (nuevo mensaje,
-- handoff) ya existen en sql_panel_v2_whatsapp_alertas.sql — esto solo suma
-- lo que faltaba: el estado del lead y quién lo asigna.

alter table public.whatsapp_conversaciones
  add column if not exists estado_lead text not null default 'nuevo' check (estado_lead in ('nuevo', 'asignado', 'calificando', 'convertido', 'perdido'));

create index if not exists whatsapp_conv_estado_lead_idx on public.whatsapp_conversaciones(estado_lead);

-- Asigna vendedor por ronda (mismo criterio que reasignar_leads_vencidos:
-- entre los que reciben leads, el que hace más tiempo no recibe uno). Se
-- llama una sola vez, cuando el contacto escribe por primera vez.
create or replace function public.asignar_vendedor_ronda_whatsapp()
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
    from public.whatsapp_conversaciones c
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

-- Al crear la conversación (primer mensaje de un contacto nuevo) le asigna
-- vendedor antes de que exista ningún mensaje — el webhook siempre inserta
-- la conversación primero y el mensaje después, así que cuando corre el
-- trigger de alerta "nuevo mensaje" (sql_panel_v2_whatsapp_alertas.sql,
-- dispara sobre whatsapp_mensajes) el vendedor ya está seteado.
create or replace function public.asignar_vendedor_conversacion_nueva()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.vendedor_id is null then
    new.vendedor_id := public.asignar_vendedor_ronda_whatsapp();
    if new.vendedor_id is not null then
      new.estado_lead := 'asignado';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_asignar_vendedor_conversacion on public.whatsapp_conversaciones;
create trigger trg_asignar_vendedor_conversacion
  before insert on public.whatsapp_conversaciones
  for each row execute function public.asignar_vendedor_conversacion_nueva();

-- Cuando el agente califica al cliente (caliente/tibio), el lead pasa a
-- "calificando" si todavía estaba en nuevo/asignado — no pisa un estado ya
-- avanzado (convertido/perdido) que haya puesto un humano a mano.
create or replace function public.avanzar_estado_lead_por_calificacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.calificacion in ('caliente', 'tibio') and old.calificacion is distinct from new.calificacion
     and new.estado_lead in ('nuevo', 'asignado') then
    new.estado_lead := 'calificando';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_avanzar_estado_lead on public.whatsapp_conversaciones;
create trigger trg_avanzar_estado_lead
  before update of calificacion on public.whatsapp_conversaciones
  for each row execute function public.avanzar_estado_lead_por_calificacion();

-- Cuando se vincula un cliente a la conversación (paso "convertido" del
-- funnel) y ese cliente pasa a pipeline_stage='cerrado', reflejalo acá.
create or replace function public.marcar_lead_convertido()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.pipeline_stage = 'cerrado' and old.pipeline_stage is distinct from 'cerrado' then
    update public.whatsapp_conversaciones set estado_lead = 'convertido' where cliente_id = new.id and estado_lead <> 'convertido';
    update public.instagram_conversaciones set estado_lead = 'convertido' where cliente_id = new.id and estado_lead <> 'convertido';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_marcar_lead_convertido on public.clientes;
create trigger trg_marcar_lead_convertido
  after update of pipeline_stage on public.clientes
  for each row execute function public.marcar_lead_convertido();

-- Instagram también necesita estado_lead (paridad con WhatsApp).
alter table public.instagram_conversaciones
  add column if not exists estado_lead text not null default 'nuevo' check (estado_lead in ('nuevo', 'asignado', 'calificando', 'convertido', 'perdido'));

-- Nombre del bot, para que el frontend titule "Conversaciones (Rodi)" sin
-- hardcodearlo.
alter table public.whatsapp_configuracion
  add column if not exists bot_nombre text not null default 'Rodi';
