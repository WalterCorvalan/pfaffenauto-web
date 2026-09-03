-- Panel v2 — Reportes, completar según manual (2026-09-03). Lo que ya
-- existía en sql_panel_v2_reportes.sql quedaba fijo al mes actual (sin
-- forma de navegar meses) y faltaban paneles enteros (Competencia del
-- mes/bonos, Expedientes, Infracciones, Facturación de taller). Solo
-- backend — el frontend llama a estas funciones, sin repetir la
-- agregación ahí.

-- ============================================================
-- 1) Navegación de mes real — las vistas viejas usaban date_trunc(now())
--    fijo. Se reemplazan por funciones que reciben el mes a mirar.
-- ============================================================

create or replace function public.reportes_ranking_velocidad(p_mes date)
returns table (
  vendedor_id uuid, vendedor_nombre text, tiempo_medio_minutos numeric,
  pct_bajo_1h numeric, contactados int, sin_contactar int, soltados int
)
language sql
stable
as $$
  with primer_contacto as (
    select ca.cliente_id, min(ca.created_at) as contactado_en
    from public.cliente_actividades ca
    where ca.tipo = 'llamada' and ca.descripcion = 'Primer contacto (automático)'
    group by ca.cliente_id
  ),
  tiempos as (
    select c.vendedor_id, c.id as cliente_id, c.created_at, pc.contactado_en,
           extract(epoch from (pc.contactado_en - c.created_at)) / 60 as minutos_respuesta
    from public.clientes c
    left join primer_contacto pc on pc.cliente_id = c.id
    where c.vendedor_id is not null
      and date_trunc('month', c.created_at) = date_trunc('month', p_mes)
  )
  select p.id, p.nombre,
         round(avg(t.minutos_respuesta) filter (where t.minutos_respuesta is not null)),
         round(100.0 * count(*) filter (where t.minutos_respuesta is not null and t.minutos_respuesta <= 60) /
               nullif(count(*) filter (where t.minutos_respuesta is not null), 0)),
         count(*) filter (where t.contactado_en is not null)::int,
         count(*) filter (where t.contactado_en is null)::int,
         coalesce((select count(*) from public.cliente_reasignaciones r
                   where r.vendedor_anterior_id = p.id
                     and date_trunc('month', r.created_at) = date_trunc('month', p_mes)), 0)::int
  from public.perfiles p
  left join tiempos t on t.vendedor_id = p.id
  where p.activo = true
  group by p.id, p.nombre;
$$;

create or replace function public.reportes_operaciones_por_vendedor(p_mes date)
returns table (vendedor_id uuid, vendedor_nombre text, ventas_mes numeric)
language sql
stable
as $$
  select p.id, p.nombre,
         coalesce(sum(vp.peso) filter (where vp.estado = 'cerrada' and date_trunc('month', vp.fecha_cierre) = date_trunc('month', p_mes)), 0)
  from public.perfiles p
  left join public.v_ventas_ponderadas vp on vp.vendedor_id = p.id
  where p.activo = true
  group by p.id, p.nombre
  order by 3 desc;
$$;

create or replace function public.reportes_origen_leads(p_mes date)
returns table (origen text, cantidad bigint)
language sql
stable
as $$
  select origen, count(*)
  from public.clientes
  where date_trunc('month', created_at) = date_trunc('month', p_mes)
  group by origen
  order by 2 desc;
$$;

create or replace function public.reportes_embudo_comercial(p_mes date)
returns table (clientes bigint, cotizaciones bigint, ventas bigint)
language sql
stable
as $$
  select
    (select count(*) from public.clientes where date_trunc('month', created_at) = date_trunc('month', p_mes)),
    (select count(*) from public.cotizaciones where date_trunc('month', created_at) = date_trunc('month', p_mes)),
    (select count(*) from public.ventas where estado = 'cerrada' and date_trunc('month', fecha_cierre) = date_trunc('month', p_mes));
$$;

-- ============================================================
-- 2) Competencia del mes / bonos — no hace falta SQL nuevo, ya existen
--    ranking_ventas(p_desde,p_hasta) y premios_consignaciones_vendedor
--    (sql_panel_v2_mis_ventas.sql) — el frontend de Reportes los llama
--    igual que Mis Ventas/Comisiones, pero mostrando TODOS los vendedores
--    en vez de "los míos".
-- ============================================================

-- ============================================================
-- 3) Expedientes — resumen del mes + distribución por estado.
-- ============================================================
create or replace function public.reportes_expedientes_resumen(p_mes date)
returns table (total bigint, activos bigint, cerrados bigint, vencidos bigint)
language sql
stable
as $$
  select
    count(*) filter (where date_trunc('month', fecha_apertura) = date_trunc('month', p_mes)),
    count(*) filter (where estado <> 'cerrado'),
    count(*) filter (where estado = 'cerrado' and date_trunc('month', fecha_apertura) = date_trunc('month', p_mes)),
    count(*) filter (where estado <> 'cerrado' and vencimiento is not null and vencimiento < current_date)
  from public.expedientes
  where not archivado;
$$;

create or replace function public.reportes_expedientes_por_estado()
returns table (estado text, cantidad bigint)
language sql
stable
as $$
  select estado, count(*) from public.expedientes where not archivado group by estado;
$$;

-- ============================================================
-- 4) Infracciones — resumen del mes + serie histórica por mes.
-- ============================================================
create or replace function public.reportes_infracciones_resumen(p_mes date)
returns table (total bigint, pendientes bigint, pagadas bigint, ganancia_total numeric)
language sql
stable
as $$
  select count(*), count(*) filter (where estado = 'Pendiente'), count(*) filter (where estado = 'Pagado'),
         coalesce(sum(ganancia_ars), 0)
  from public.infracciones
  where date_trunc('month', mes) = date_trunc('month', p_mes);
$$;

create or replace view public.v_reportes_infracciones_por_mes as
  select mes, count(*) as cantidad
  from public.infracciones
  group by mes
  order by mes desc;

-- ============================================================
-- 5) Facturación de taller originada en ventas — órdenes de taller que
--    surgieron por gestión del vendedor tras una venta (origen='vendedor'),
--    a diferencia de las que entran directo por mostrador/web/bot.
-- ============================================================
create or replace function public.reportes_taller_facturacion(p_mes date)
returns table (facturado_cobrado numeric, ots_cobradas bigint, ots_generadas bigint)
language sql
stable
as $$
  select
    coalesce((select sum(tc.monto) from public.taller_cobros tc
              join public.taller_ordenes o on o.id = tc.orden_id
              where o.origen = 'vendedor' and not tc.anulado
                and date_trunc('month', tc.fecha) = date_trunc('month', p_mes)), 0),
    (select count(distinct tc.orden_id) from public.taller_cobros tc
     join public.taller_ordenes o on o.id = tc.orden_id
     where o.origen = 'vendedor' and not tc.anulado
       and date_trunc('month', tc.fecha) = date_trunc('month', p_mes)),
    (select count(*) from public.taller_ordenes o
     where o.origen = 'vendedor' and date_trunc('month', o.created_at) = date_trunc('month', p_mes));
$$;

grant execute on function public.reportes_ranking_velocidad(date) to authenticated;
grant execute on function public.reportes_operaciones_por_vendedor(date) to authenticated;
grant execute on function public.reportes_origen_leads(date) to authenticated;
grant execute on function public.reportes_embudo_comercial(date) to authenticated;
grant execute on function public.reportes_expedientes_resumen(date) to authenticated;
grant execute on function public.reportes_expedientes_por_estado() to authenticated;
grant execute on function public.reportes_infracciones_resumen(date) to authenticated;
grant execute on function public.reportes_taller_facturacion(date) to authenticated;
grant select on public.v_reportes_infracciones_por_mes to authenticated;
