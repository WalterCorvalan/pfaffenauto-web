-- Cambia el momento y el criterio de asignación de vendedor en WhatsApp/
-- Instagram/Rodi:
--   ANTES: se asignaba apenas se creaba la conversación, ronda global entre
--   TODOS los vendedores sin importar sucursal.
--   AHORA: la conversación arranca SIN vendedor (visible para todos, ya lo
--   está -- el panel no filtra por vendedor_id). Recién cuando se vincula un
--   auto (vehiculo_id) se asigna, por ronda entre los vendedores de LA
--   SUCURSAL de ese auto; si no hay vendedores en esa sucursal, cae al
--   encargado de esa sucursal; si tampoco hay, cae a un admin.
-- La reasignación manual de encargado/admin sigue igual (son triggers
-- BEFORE INSERT / BEFORE UPDATE puntuales, nunca tocan un UPDATE manual del
-- panel salvo el caso vehiculo_id que se agrega acá).

-- 1) Apagar la asignación automática al crear la conversación -----------
drop trigger if exists trg_asignar_vendedor_conversacion on public.whatsapp_conversaciones;
drop trigger if exists trg_asignar_vendedor_conversacion_instagram on public.instagram_conversaciones;
drop trigger if exists trg_asignar_vendedor_conversacion_rodi on public.rodi_conversaciones;

-- 2) Ronda por sucursal (con fallback a encargado, y a admin) -----------
create or replace function public.asignar_vendedor_ronda_whatsapp_por_sucursal(p_sucursal_id uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
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
  where p.activo = true and 'ventas' = any(p.roles) and p.sucursal_id = p_sucursal_id
    and (d.recibir_leads is null or d.recibir_leads = true)
  order by u.ultimo asc nulls first
  limit 1;

  if candidato is null then
    select p.id into candidato from public.perfiles p where p.activo = true and 'encargado' = any(p.roles) and p.sucursal_id = p_sucursal_id limit 1;
  end if;
  if candidato is null then
    select p.id into candidato from public.perfiles p where p.activo = true and 'admin' = any(p.roles) limit 1;
  end if;

  return candidato;
end;
$function$;

create or replace function public.asignar_vendedor_ronda_rodi_por_sucursal(p_sucursal_id uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  candidato uuid;
begin
  select p.id into candidato
  from public.perfiles p
  left join public.disponibilidad_vendedor d on d.vendedor_id = p.id
  left join lateral (
    select max(c.created_at) as ultimo
    from public.rodi_conversaciones c
    where c.vendedor_id = p.id
  ) u on true
  where p.activo = true and 'ventas' = any(p.roles) and p.sucursal_id = p_sucursal_id
    and (d.recibir_leads is null or d.recibir_leads = true)
  order by u.ultimo asc nulls first
  limit 1;

  if candidato is null then
    select p.id into candidato from public.perfiles p where p.activo = true and 'encargado' = any(p.roles) and p.sucursal_id = p_sucursal_id limit 1;
  end if;
  if candidato is null then
    select p.id into candidato from public.perfiles p where p.activo = true and 'admin' = any(p.roles) limit 1;
  end if;

  return candidato;
end;
$function$;

create or replace function public.asignar_vendedor_ronda_instagram_por_sucursal(p_sucursal_id uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
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
  where p.activo = true and 'ventas' = any(p.roles) and p.sucursal_id = p_sucursal_id
    and (d.recibir_leads is null or d.recibir_leads = true)
  order by u.ultimo asc nulls first
  limit 1;

  if candidato is null then
    select p.id into candidato from public.perfiles p where p.activo = true and 'encargado' = any(p.roles) and p.sucursal_id = p_sucursal_id limit 1;
  end if;
  if candidato is null then
    select p.id into candidato from public.perfiles p where p.activo = true and 'admin' = any(p.roles) limit 1;
  end if;

  return candidato;
end;
$function$;

-- 3) Trigger: al vincular un auto (vehiculo_id null -> algo), si todavía no
--    hay vendedor, asignar por la sucursal de ese auto. -----------------
create or replace function public.asignar_vendedor_por_vehiculo_whatsapp()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_sucursal_id uuid;
begin
  if new.vehiculo_id is not null and old.vehiculo_id is distinct from new.vehiculo_id and new.vendedor_id is null then
    select sucursal_id into v_sucursal_id from public.vehiculos where id = new.vehiculo_id;
    if v_sucursal_id is not null then
      new.vendedor_id := public.asignar_vendedor_ronda_whatsapp_por_sucursal(v_sucursal_id);
      if new.vendedor_id is not null then
        new.estado_lead := 'asignado';
      end if;
    end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_asignar_vendedor_por_vehiculo_whatsapp on public.whatsapp_conversaciones;
create trigger trg_asignar_vendedor_por_vehiculo_whatsapp
before update on public.whatsapp_conversaciones
for each row execute function public.asignar_vendedor_por_vehiculo_whatsapp();

create or replace function public.asignar_vendedor_por_vehiculo_rodi()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_sucursal_id uuid;
begin
  if new.vehiculo_id is not null and old.vehiculo_id is distinct from new.vehiculo_id and new.vendedor_id is null then
    select sucursal_id into v_sucursal_id from public.vehiculos where id = new.vehiculo_id;
    if v_sucursal_id is not null then
      new.vendedor_id := public.asignar_vendedor_ronda_rodi_por_sucursal(v_sucursal_id);
      if new.vendedor_id is not null then
        new.estado_lead := 'asignado';
      end if;
    end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_asignar_vendedor_por_vehiculo_rodi on public.rodi_conversaciones;
create trigger trg_asignar_vendedor_por_vehiculo_rodi
before update on public.rodi_conversaciones
for each row execute function public.asignar_vendedor_por_vehiculo_rodi();

create or replace function public.asignar_vendedor_por_vehiculo_instagram()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_sucursal_id uuid;
begin
  if new.vehiculo_id is not null and old.vehiculo_id is distinct from new.vehiculo_id and new.vendedor_id is null then
    select sucursal_id into v_sucursal_id from public.vehiculos where id = new.vehiculo_id;
    if v_sucursal_id is not null then
      new.vendedor_id := public.asignar_vendedor_ronda_instagram_por_sucursal(v_sucursal_id);
      if new.vendedor_id is not null then
        new.estado_lead := 'asignado';
      end if;
    end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_asignar_vendedor_por_vehiculo_instagram on public.instagram_conversaciones;
create trigger trg_asignar_vendedor_por_vehiculo_instagram
before update on public.instagram_conversaciones
for each row execute function public.asignar_vendedor_por_vehiculo_instagram();
