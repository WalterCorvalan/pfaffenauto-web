-- Segunda tanda de links rotos por el rename panel-v2 -> panel: 13
-- funciones más devueltas por el lookup de "%panel-v2%" en pg_proc, no
-- capturadas en sql_fix_triggers_notificaciones.sql (esas eran solo las 4
-- de "mensaje entrante" + visitas). Solo se toca la ruta del link, cero
-- cambio de lógica.

create or replace function public.notificar_consignacion_nueva()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if new.vendedor_id is not null then
    insert into public.alertas (destinatario_id, tipo, prioridad, titulo, mensaje, link)
    values (new.vendedor_id, 'consignacion_nueva', 'novedad', 'Nueva consignación asignada — ' || new.cliente_nombre, new.vehiculo_descripcion, '/panel/consignaciones?consignacion=' || new.id);
  end if;
  return new;
end;
$function$;

create or replace function public.reasignar_pedidos_vencidos()
 returns integer
 language plpgsql
as $function$
declare
  fila record;
  candidato uuid;
  cfg record;
  total int := 0;
begin
  select * into cfg from public.configuracion_empresa where id = true;
  if cfg is null or cfg.reasignar_pedidos = false then
    return 0;
  end if;

  for fila in
    select p.id, p.vendedor_id, p.created_at
    from public.pedidos p
    where p.estado = 'activo'
      and p.gestion_finalizada = false
      and p.contacto_confirmado_at is null
      and p.vendedor_id is not null
      and coalesce(p.ultima_reasignacion_en, p.created_at) < now() - (cfg.plazo_reasignacion_pedidos_horas || ' hours')::interval
  loop
    select p.id into candidato
    from public.perfiles p
    left join public.disponibilidad_vendedor d on d.vendedor_id = p.id
    where p.activo = true
      and p.id <> fila.vendedor_id
      and (d.recibir_leads is null or d.recibir_leads = true)
    order by random()
    limit 1;

    if candidato is not null then
      update public.pedidos
      set vendedor_id = candidato, ultima_reasignacion_en = now(), contacto_confirmado_at = null
      where id = fila.id;

      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
      values (candidato, 'pedido_reasignado', 'novedad', 'Te reasignaron un pedido sin confirmar', '/panel/pedidos?pedido=' || fila.id);

      total := total + 1;
    end if;
  end loop;

  return total;
end;
$function$;

create or replace function public.reclamo_registrar_movimiento()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_link text;
  v_persona record;
begin
  v_link := '/panel/reclamos?reclamo=' || new.reclamo_id;

  if new.tipo = 'pedido_atencion' then
    update public.reclamos
    set pedido_atencion_sector = new.sector, pedido_atencion_mensaje = new.texto, pedido_atencion_en = now(),
        ultimo_movimiento_at = now(), updated_at = now()
    where id = new.reclamo_id;

    for v_persona in select id from public.perfiles where new.sector = any(roles) and activo = true loop
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, mensaje, link)
      values (v_persona.id, 'reclamo_pedido_atencion', 'alta', 'Te piden atención en un reclamo', new.texto, v_link);
    end loop;
  else
    update public.reclamos
    set pedido_atencion_sector = null, pedido_atencion_mensaje = null, pedido_atencion_en = null,
        ultimo_movimiento_at = now(), updated_at = now()
    where id = new.reclamo_id;
  end if;

  return new;
end;
$function$;

create or replace function public.reclamo_notificar_asignado()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if new.asignado_a is not null and new.asignado_a is distinct from old.asignado_a then
    insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
    values (new.asignado_a, 'reclamo_asignado', 'media', 'Te asignaron el reclamo "' || new.titulo || '"', '/panel/reclamos?reclamo=' || new.id);
  end if;
  return new;
end;
$function$;

create or replace function public.whatsapp_notificar_handoff()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_encargado record;
  v_link text;
  v_titulo text;
begin
  if new.handoff_at is null or old.handoff_at is not null then
    return new;
  end if;

  v_link := '/panel/whatsapp?conversacion=' || new.id;
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
$function$;

create or replace function public.crear_bono_comision(p_beneficiario_id uuid, p_concepto text, p_monto numeric, p_moneda text DEFAULT 'USD'::text)
 returns uuid
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_soy_admin boolean;
  v_id uuid;
  v_encargado record;
begin
  select exists(select 1 from public.perfiles where id = auth.uid() and ('admin' = any(roles) or 'finanzas' = any(roles))) into v_soy_admin;

  insert into public.comisiones (beneficiario_id, tipo, concepto, monto, moneda, creado_por, aprobacion_pendiente, solicitado_por)
  values (p_beneficiario_id, 'bono', p_concepto, p_monto, p_moneda, auth.uid(), not v_soy_admin, case when v_soy_admin then null else auth.uid() end)
  returning id into v_id;

  if not v_soy_admin then
    for v_encargado in select id from public.perfiles where ('admin' = any(roles) or 'finanzas' = any(roles)) and activo = true loop
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
      values (v_encargado.id, 'comision_bono_pedido', 'media', 'Pidieron un bono/comisión manual', '/panel/comisiones');
    end loop;
  end if;

  return v_id;
end;
$function$;

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

create or replace function public.expediente_registrar_observacion()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_persona record;
  v_link text;
begin
  v_link := '/panel/expedientes?expediente=' || new.expediente_id;

  if new.tipo = 'pedido_atencion' then
    update public.expedientes
    set pedido_atencion_sector = new.sector, pedido_atencion_mensaje = new.texto, pedido_atencion_en = now(), updated_at = now()
    where id = new.expediente_id;

    for v_persona in select id from public.perfiles where new.sector = any(roles) and activo = true loop
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, mensaje, link)
      values (v_persona.id, 'expediente_pedido_atencion', 'alta', 'Te piden atención en un expediente', new.texto, v_link);
    end loop;
  else
    update public.expedientes
    set pedido_atencion_sector = null, pedido_atencion_mensaje = null, pedido_atencion_en = null, updated_at = now()
    where id = new.expediente_id;
  end if;

  return new;
end;
$function$;

create or replace function public.chequear_reconfirmaciones_pedidos()
 returns integer
 language plpgsql
as $function$
declare
  fila record;
  candidato uuid;
  cfg record;
  total int := 0;
begin
  select * into cfg from public.configuracion_empresa where id = true;
  if cfg is null or cfg.reasignar_pedidos = false then
    return 0;
  end if;

  for fila in
    select p.id, p.vendedor_id, p.nombre_cliente,
      coalesce(p.ultima_reconfirmacion_at, p.contacto_confirmado_at, p.created_at) as base
    from public.pedidos p
    where p.estado = 'activo'
      and p.gestion_finalizada = false
      and p.vendedor_id is not null
  loop
    if fila.base < now() - (cfg.plazo_reconfirmacion_pedidos_dias * 2 || ' days')::interval then
      select p.id into candidato
      from public.perfiles p
      left join public.disponibilidad_vendedor d on d.vendedor_id = p.id
      where p.activo = true and p.id <> fila.vendedor_id and (d.recibir_leads is null or d.recibir_leads = true)
      order by random() limit 1;

      if candidato is not null then
        update public.pedidos
        set vendedor_id = candidato, ultima_reconfirmacion_at = null, contacto_confirmado_at = null
        where id = fila.id;

        insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
        values (candidato, 'pedido_reasignado', 'novedad', 'Te reasignaron un pedido sin reconfirmar', '/panel/pedidos?pedido=' || fila.id);
        total := total + 1;
      end if;
    elsif fila.base < now() - (cfg.plazo_reconfirmacion_pedidos_dias || ' days')::interval then
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
      values (fila.vendedor_id, 'pedido_reconfirmar', 'media', 'Tenés que reconfirmar gestión de ' || fila.nombre_cliente, '/panel/pedidos?pedido=' || fila.id);
      total := total + 1;
    end if;
  end loop;

  return total;
end;
$function$;

create or replace function public.pedidos_detectar_match()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_pedido record;
  v_link text;
  v_encargado record;
begin
  if new.estado not in ('disponible', 'reservado') then
    return new;
  end if;

  for v_pedido in
    select * from public.pedidos
    where estado = 'activo'
      and vehiculo_match_id is null
      and marca ilike new.marca
      and (modelo is null or new.modelo ilike '%' || modelo || '%')
      and (anio_desde is null or new.anio >= anio_desde)
      and (anio_hasta is null or new.anio <= anio_hasta)
      and (presupuesto_max is null or moneda <> new.moneda_venta or new.precio_venta <= presupuesto_max)
  loop
    update public.pedidos
      set vehiculo_match_id = new.id, match_detectado_at = now()
      where id = v_pedido.id;

    v_link := '/panel/pedidos?pedido=' || v_pedido.id;

    if v_pedido.vendedor_id is not null then
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
      values (v_pedido.vendedor_id, 'pedido_match', 'alta', 'Entró un auto para ' || v_pedido.nombre_cliente || ' (' || new.marca || ' ' || new.modelo || ')', v_link);
    else
      for v_encargado in select id from public.perfiles where ('encargado' = any(roles) or 'admin' = any(roles)) and activo = true loop
        insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
        values (v_encargado.id, 'pedido_match', 'alta', 'Entró un auto para ' || v_pedido.nombre_cliente || ' (' || new.marca || ' ' || new.modelo || ')', v_link);
      end loop;
    end if;
  end loop;

  return new;
end;
$function$;

create or replace function public.liquidar_bono_retroactivo_mes(p_mes date)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_desde date := date_trunc('month', p_mes)::date;
  v_hasta date := (date_trunc('month', p_mes) + interval '1 month - 1 day')::date;
  v_vendedor record;
  v_tier record;
  v_bono numeric;
  v_id uuid;
  total int := 0;
begin
  for v_vendedor in select id from public.perfiles where 'ventas' = any(roles) and activo = true loop
    select * into v_tier from public.tier_para_vendedor(v_vendedor.id, v_desde, v_hasta);

    select coalesce(sum(precio_venta * (v_tier.pct_actual - comision_vendedor_pct) / 100), 0)
    into v_bono
    from public.ventas
    where vendedor_id = v_vendedor.id and estado = 'cerrada' and fecha_cierre between v_desde and v_hasta
      and comision_vendedor_pct < v_tier.pct_actual
      and moneda_venta = 'USD';

    if v_bono > 0 and not exists (select 1 from public.comisiones where beneficiario_id = v_vendedor.id and periodo_liquidacion = v_desde and tipo = 'bono' and concepto = 'Bono retroactivo por tier') then
      insert into public.comisiones (beneficiario_id, tipo, concepto, monto, moneda, periodo_liquidacion, estado, monto_pagado, fecha_cobro)
      values (v_vendedor.id, 'bono', 'Bono retroactivo por tier', v_bono, 'USD', v_desde, 'cobrada', v_bono, current_date)
      returning id into v_id;
      total := total + 1;

      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, mensaje, link)
      values (v_vendedor.id, 'comision_bono_pedido', 'novedad', 'Bono retroactivo liquidado — subiste de tier', 'Llegaste a ' || v_tier.tier_actual || ' (' || v_tier.pct_actual || '%) y se liquidó la diferencia de todo el mes.', '/panel/mis-ventas');
    end if;
  end loop;

  return total;
end;
$function$;

create or replace function public.reasignar_leads_vencidos()
 returns integer
 language plpgsql
as $function$
declare
  v_activo boolean;
  umbral_minutos int;
  max_reasignaciones int;
  fila record;
  candidato uuid;
  total int := 0;
  v_reasignaciones_previas int;
  v_encargado record;
begin
  select lead_routing_activo, lead_routing_umbral_minutos, lead_routing_max_reasignaciones
    into v_activo, umbral_minutos, max_reasignaciones
    from public.configuracion_empresa where id = true;

  umbral_minutos := coalesce(umbral_minutos, 60);
  max_reasignaciones := coalesce(max_reasignaciones, 3);

  if v_activo is not true then
    return 0;
  end if;

  for fila in
    select c.id, c.vendedor_id, c.canal_ingreso, c.created_at, c.reasignacion_tope_alertada
    from public.clientes c
    where c.pipeline_stage = 'sin_contactar'
      and c.vendedor_id is not null
      and coalesce(c.ultima_reasignacion_en, c.created_at) < now() - (umbral_minutos || ' minutes')::interval
  loop
    select count(*) into v_reasignaciones_previas from public.cliente_reasignaciones where cliente_id = fila.id;

    if v_reasignaciones_previas >= max_reasignaciones then
      if not fila.reasignacion_tope_alertada then
        for v_encargado in select id from public.perfiles where ('encargado' = any(roles) or 'admin' = any(roles)) and activo = true loop
          insert into public.alertas (destinatario_id, tipo, prioridad, titulo, mensaje, link)
          values (v_encargado.id, 'cliente', 'alta', 'Lead sin contactar tras varias reasignaciones', 'Ya se reasignó ' || v_reasignaciones_previas || ' veces y sigue sin respuesta — necesita seguimiento manual.', '/panel/clientes');
        end loop;
        update public.clientes set reasignacion_tope_alertada = true where id = fila.id;
      end if;
      continue;
    end if;

    select p.id into candidato
    from public.perfiles p
    left join public.disponibilidad_vendedor d on d.vendedor_id = p.id
    left join lateral (
      select max(cl.created_at) as ultimo
      from public.clientes cl
      where cl.vendedor_id = p.id and cl.canal_ingreso = fila.canal_ingreso
    ) u on true
    where p.activo = true
      and p.id <> fila.vendedor_id
      and (d.recibir_leads is null or d.recibir_leads = true)
    order by u.ultimo asc nulls first
    limit 1;

    if candidato is not null then
      insert into public.cliente_reasignaciones (cliente_id, vendedor_anterior_id, vendedor_nuevo_id)
      values (fila.id, fila.vendedor_id, candidato);

      update public.clientes
      set vendedor_id = candidato, ultima_reasignacion_en = now()
      where id = fila.id;

      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, mensaje, link)
      values (candidato, 'cliente', 'novedad', 'Te reasignaron un lead sin contactar', 'Pasó ' || umbral_minutos || ' minutos sin respuesta con el vendedor anterior.', '/panel/clientes');

      total := total + 1;
    end if;
  end loop;

  return total;
end;
$function$;

create or replace function public.instagram_notificar_handoff()
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

  v_link := '/panel/whatsapp?canal=instagram&conversacion=' || new.id;

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
$function$;
