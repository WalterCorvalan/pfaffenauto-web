alter table public.configuracion_empresa
  add column if not exists lead_routing_activo boolean not null default true,
  add column if not exists lead_routing_umbral_minutos numeric not null default 60,
  add column if not exists lead_routing_max_reasignaciones numeric not null default 3;

-- Misma función que sql_panel_v2_leads_velocidad_tope.sql, solo que ahora
-- umbral_minutos/max_reasignaciones salen de configuracion_empresa en vez
-- de estar fijos, y respeta un apagador general (lead_routing_activo).
create or replace function public.reasignar_leads_vencidos()
returns int
language plpgsql
as $$
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
          values (v_encargado.id, 'cliente', 'alta', 'Lead sin contactar tras varias reasignaciones', 'Ya se reasignó ' || v_reasignaciones_previas || ' veces y sigue sin respuesta — necesita seguimiento manual.', '/panel-v2/clientes');
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
      values (candidato, 'cliente', 'novedad', 'Te reasignaron un lead sin contactar', 'Pasó ' || umbral_minutos || ' minutos sin respuesta con el vendedor anterior.', '/panel-v2/clientes');

      total := total + 1;
    end if;
  end loop;

  return total;
end;
$$;

select cron.alter_job(jobid, command := 'select public.reasignar_leads_vencidos()')
from cron.job where jobname = 'reasignar-leads-vencidos';
