-- Panel v2 — "Mis Ventas": backend numérico (tiers de comisión con bono
-- retroactivo, premios por consignaciones, ranking, funnel, tiempo de
-- respuesta, % de reseñas pedidas). El copiloto de IA queda para después.

-- ============================================================
-- 1) Config de tiers de comisión — editable a futuro desde Configuración.
-- ============================================================
create table if not exists public.comision_tiers (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  ventas_min numeric not null,
  pct_comision numeric not null,
  emoji text,
  orden int not null
);

insert into public.comision_tiers (nombre, ventas_min, pct_comision, emoji, orden)
select * from (values
  ('Arrancando', 0, 1.00, '🌱', 1),
  ('En ritmo', 7, 1.25, '🚀', 2),
  ('Top Seller', 12, 1.50, '🏆', 3)
) as v(nombre, ventas_min, pct_comision, emoji, orden)
where not exists (select 1 from public.comision_tiers);

create table if not exists public.premios_consignaciones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  consignaciones_min int,
  premio_usd numeric not null,
  es_record_equipo boolean not null default false,
  emoji text,
  orden int not null
);

insert into public.premios_consignaciones (nombre, consignaciones_min, premio_usd, es_record_equipo, emoji, orden)
select * from (values
  ('Más consig. del equipo', null, 500, true, '🥇', 1),
  ('5 consig.', 5, 300, false, '🥉', 2),
  ('8 consig.', 8, 500, false, '🥈', 3),
  ('12 consig.', 12, 1000, false, '🏆', 4)
) as v(nombre, consignaciones_min, premio_usd, es_record_equipo, emoji, orden)
where not exists (select 1 from public.premios_consignaciones);

-- ============================================================
-- 2) Ventas equivalentes en un rango (compartida = 0.5 para cada uno).
-- ============================================================
create or replace function public.ventas_equivalentes_vendedor(p_vendedor_id uuid, p_desde date, p_hasta date)
returns numeric
language sql
stable
as $$
  select coalesce(sum(caso), 0) from (
    select case when vendedor_compartido then 0.5 else 1 end as caso
    from public.ventas
    where vendedor_id = p_vendedor_id and estado = 'cerrada' and fecha_cierre between p_desde and p_hasta
    union all
    select 0.5
    from public.ventas
    where vendedor_compartido_id = p_vendedor_id and vendedor_compartido = true and estado = 'cerrada' and fecha_cierre between p_desde and p_hasta
  ) t;
$$;

-- ============================================================
-- 3) Tier actual + siguiente, para un vendedor y rango de fechas.
-- ============================================================
create or replace function public.tier_para_vendedor(p_vendedor_id uuid, p_desde date, p_hasta date)
returns table (
  ventas_equivalentes numeric, tier_actual text, pct_actual numeric, tier_emoji text,
  siguiente_tier text, siguiente_pct numeric, ventas_para_siguiente numeric, siguiente_emoji text
)
language plpgsql
stable
as $$
declare
  v_ventas numeric;
begin
  v_ventas := public.ventas_equivalentes_vendedor(p_vendedor_id, p_desde, p_hasta);

  return query
  with actual as (
    select t.nombre, t.pct_comision, t.emoji, t.orden
    from public.comision_tiers t
    where t.ventas_min <= v_ventas
    order by t.ventas_min desc limit 1
  ),
  siguiente as (
    select t.nombre, t.pct_comision, t.ventas_min, t.emoji
    from public.comision_tiers t, actual a
    where t.orden = a.orden + 1
  )
  select v_ventas, a.nombre, a.pct_comision, a.emoji,
    s.nombre, s.pct_comision, greatest(coalesce(s.ventas_min, 0) - v_ventas, 0), s.emoji
  from actual a
  left join siguiente s on true;
end;
$$;

-- ============================================================
-- 4) Bono retroactivo proyectado (si llegara al siguiente tier HOY, cuánto
-- cobraría de más sobre las ventas que ya tiene en el mes).
-- ============================================================
create or replace function public.bono_retroactivo_proyectado(p_vendedor_id uuid, p_desde date, p_hasta date)
returns numeric
language plpgsql
stable
as $$
declare
  v_tier record;
  v_bono numeric := 0;
begin
  select * into v_tier from public.tier_para_vendedor(p_vendedor_id, p_desde, p_hasta);
  if v_tier.siguiente_pct is null then
    return 0;
  end if;

  select coalesce(sum(precio_venta * (v_tier.siguiente_pct - comision_vendedor_pct) / 100), 0)
  into v_bono
  from public.ventas
  where vendedor_id = p_vendedor_id and estado = 'cerrada' and fecha_cierre between p_desde and p_hasta
    and comision_vendedor_pct < v_tier.siguiente_pct;

  return v_bono;
end;
$$;

-- ============================================================
-- 5) Liquidación real de fin de mes — corre por cron el día 1 a la mañana
-- para el mes recién cerrado, genera el bono (si corresponde) como fila en
-- comisiones vía crear_bono_comision, una sola vez por vendedor/mes.
-- ============================================================
alter table public.comisiones add column if not exists periodo_liquidacion date;

create or replace function public.liquidar_bono_retroactivo_mes(p_mes date)
returns int
language plpgsql
security definer
set search_path = public
as $$
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
      and comision_vendedor_pct < v_tier.pct_actual;

    if v_bono > 0 and not exists (select 1 from public.comisiones where beneficiario_id = v_vendedor.id and periodo_liquidacion = v_desde and tipo = 'bono' and concepto = 'Bono retroactivo por tier') then
      -- Insert directo (no vía crear_bono_comision): esa función decide
      -- directo/pendiente-de-aprobación según auth.uid(), que acá no existe
      -- (corre por cron, sin sesión) — el bono automático nace liquidado.
      insert into public.comisiones (beneficiario_id, tipo, concepto, monto, moneda, periodo_liquidacion, estado, monto_pagado, fecha_cobro)
      values (v_vendedor.id, 'bono', 'Bono retroactivo por tier', v_bono, 'USD', v_desde, 'pendiente', 0, null)
      returning id into v_id;
      total := total + 1;

      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, mensaje, link)
      values (v_vendedor.id, 'comision_bono_pedido', 'novedad', 'Bono retroactivo liquidado — subiste de tier', 'Llegaste a ' || v_tier.tier_actual || ' (' || v_tier.pct_actual || '%) y se liquidó la diferencia de todo el mes.', '/panel-v2/mis-ventas');
    end if;
  end loop;

  return total;
end;
$$;

create extension if not exists pg_cron;
select cron.schedule(
  'liquidar-bono-retroactivo-mensual',
  '0 8 1 * *',
  $$select public.liquidar_bono_retroactivo_mes((current_date - interval '1 day')::date)$$
) where not exists (select 1 from cron.job where jobname = 'liquidar-bono-retroactivo-mensual');

-- ============================================================
-- 6) Premios por consignaciones — cuántas trajo el vendedor en el rango +
-- qué premios ya alcanzó / cuánto le falta para el próximo.
-- ============================================================
create or replace function public.consignaciones_traidas_vendedor(p_vendedor_id uuid, p_desde date, p_hasta date)
returns int
language sql
stable
as $$
  select count(*)::int from public.ventas
  where responsable_consignacion_id = p_vendedor_id and estado = 'cerrada' and fecha_cierre between p_desde and p_hasta;
$$;

create or replace function public.premios_consignaciones_vendedor(p_vendedor_id uuid, p_desde date, p_hasta date)
returns table (nombre text, emoji text, consignaciones_min int, premio_usd numeric, alcanzado boolean, faltan int)
language plpgsql
stable
as $$
declare
  v_cantidad int;
  v_soy_top boolean;
begin
  v_cantidad := public.consignaciones_traidas_vendedor(p_vendedor_id, p_desde, p_hasta);

  select (p_vendedor_id = (
    select v.responsable_consignacion_id from public.ventas v
    where v.responsable_consignacion_id is not null and v.estado = 'cerrada' and v.fecha_cierre between p_desde and p_hasta
    group by v.responsable_consignacion_id order by count(*) desc limit 1
  )) and v_cantidad > 0 into v_soy_top;

  return query
  select p.nombre, p.emoji, p.consignaciones_min, p.premio_usd,
    case when p.es_record_equipo then coalesce(v_soy_top, false) else v_cantidad >= p.consignaciones_min end,
    case when p.es_record_equipo then null else greatest(coalesce(p.consignaciones_min, 0) - v_cantidad, 0) end
  from public.premios_consignaciones p
  order by p.orden;
end;
$$;

-- ============================================================
-- 7) Ranking del mes (ventas equivalentes) entre todo el equipo de ventas.
-- ============================================================
create or replace function public.ranking_ventas(p_desde date, p_hasta date)
returns table (vendedor_id uuid, nombre text, ventas_equivalentes numeric, consignaciones int, posicion bigint)
language sql
stable
as $$
  select p.id, p.nombre,
    public.ventas_equivalentes_vendedor(p.id, p_desde, p_hasta),
    public.consignaciones_traidas_vendedor(p.id, p_desde, p_hasta),
    rank() over (order by public.ventas_equivalentes_vendedor(p.id, p_desde, p_hasta) desc)
  from public.perfiles p
  where 'ventas' = any(p.roles) and p.activo = true
  order by 3 desc;
$$;

-- ============================================================
-- 8) Funnel del mes: leads asignados / contactados / vendidos.
-- ============================================================
create or replace function public.funnel_vendedor(p_vendedor_id uuid, p_desde timestamptz, p_hasta timestamptz)
returns table (leads int, contactados int, vendidos int)
language sql
stable
as $$
  select
    count(*)::int,
    count(*) filter (where pipeline_stage <> 'sin_contactar')::int,
    count(*) filter (where pipeline_stage = 'cerrado')::int
  from public.clientes
  where vendedor_id = p_vendedor_id and created_at between p_desde and p_hasta;
$$;

-- ============================================================
-- 9) Tiempo de respuesta promedio (primer contacto real, logueado por el
-- trigger log_primer_contacto_cliente de sql_panel_v2_leads_velocidad.sql).
-- ============================================================
create or replace function public.tiempo_respuesta_promedio_vendedor(p_vendedor_id uuid, p_desde timestamptz, p_hasta timestamptz)
returns interval
language sql
stable
as $$
  select avg(ca.created_at - c.created_at)
  from public.clientes c
  join public.cliente_actividades ca on ca.cliente_id = c.id and ca.descripcion = 'Primer contacto (automático)'
  where c.vendedor_id = p_vendedor_id and c.created_at between p_desde and p_hasta;
$$;

-- ============================================================
-- 10) % de ventas del período con la reseña ya pedida (comprador si es
-- vendedor de la venta, ex_dueno si es responsable de consignación).
-- ============================================================
create or replace function public.pct_resenas_pedidas_vendedor(p_vendedor_id uuid, p_desde date, p_hasta date)
returns numeric
language sql
stable
as $$
  with mis_ventas as (
    select v.id, 'comprador'::text as tipo_resena from public.ventas v
    where v.vendedor_id = p_vendedor_id and v.estado = 'cerrada' and v.fecha_cierre between p_desde and p_hasta
    union all
    select v.id, 'ex_dueno'::text from public.ventas v
    where v.responsable_consignacion_id = p_vendedor_id and v.estado = 'cerrada' and v.fecha_cierre between p_desde and p_hasta
  )
  select case when count(*) = 0 then 0 else
    round(100.0 * count(*) filter (where exists (
      select 1 from public.venta_resenas_solicitudes r where r.venta_id = mis_ventas.id and r.tipo = mis_ventas.tipo_resena
    )) / count(*), 0)
  end
  from mis_ventas;
$$;
