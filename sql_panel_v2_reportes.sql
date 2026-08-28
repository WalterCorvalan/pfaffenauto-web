-- Panel v2 — Reportes. Solo backend: vistas que agregan lo que ya cargan
-- Clientes/Stock/Cotizaciones/Ventas/Postventa. El frontend después solo
-- hace SELECT * FROM v_reportes_xxx, sin repetir la lógica de agregación.

-- Ventas "ponderadas": una fila por vendedor involucrado. Venta propia pesa
-- 1, venta compartida pesa 0,5 para cada uno (así entre los dos suma 1) —
-- regla del manual, hoy hardcodeada acá; cuando exista Configuración →
-- Empresa → Leaderboard se lee el peso de ahí en vez de 0.5 fijo.
create or replace view public.v_ventas_ponderadas as
  select v.id as venta_id, v.vendedor_id, v.estado, v.fecha_cierre, v.precio_venta, v.moneda_venta,
         v.vehiculo_marca, v.cliente_id,
         case when v.vendedor_compartido then 0.5 else 1 end as peso
  from public.ventas v
  where v.vendedor_id is not null
  union all
  select v.id, v.vendedor_compartido_id, v.estado, v.fecha_cierre, v.precio_venta, v.moneda_venta,
         v.vehiculo_marca, v.cliente_id, 0.5
  from public.ventas v
  where v.vendedor_compartido = true and v.vendedor_compartido_id is not null;

-- Ranking de velocidad: tiempo medio de primer contacto, % <1h hábil,
-- contactados/sin contactar del mes, y "soltados" (nunca se resetea aunque
-- el lead ya no sea de ese vendedor — cuenta por vendedor_anterior_id).
create or replace view public.v_reportes_ranking_velocidad as
  with primer_contacto as (
    select ca.cliente_id, min(ca.created_at) as contactado_en
    from public.cliente_actividades ca
    where ca.tipo = 'llamada' and ca.descripcion = 'Primer contacto (automático)'
    group by ca.cliente_id
  ),
  tiempos as (
    select c.vendedor_id, c.id as cliente_id, c.created_at,
           pc.contactado_en,
           extract(epoch from (pc.contactado_en - c.created_at)) / 60 as minutos_respuesta
    from public.clientes c
    left join primer_contacto pc on pc.cliente_id = c.id
    where c.vendedor_id is not null
      and date_trunc('month', c.created_at) = date_trunc('month', now())
  )
  select p.id as vendedor_id, p.nombre as vendedor_nombre,
         round(avg(t.minutos_respuesta) filter (where t.minutos_respuesta is not null)) as tiempo_medio_minutos,
         round(100.0 * count(*) filter (where t.minutos_respuesta is not null and t.minutos_respuesta <= 60) /
               nullif(count(*) filter (where t.minutos_respuesta is not null), 0)) as pct_bajo_1h,
         count(*) filter (where t.contactado_en is not null) as contactados,
         count(*) filter (where t.contactado_en is null) as sin_contactar,
         coalesce((select count(*) from public.cliente_reasignaciones r
                   where r.vendedor_anterior_id = p.id
                     and date_trunc('month', r.created_at) = date_trunc('month', now())), 0) as soltados
  from public.perfiles p
  left join tiempos t on t.vendedor_id = p.id
  where p.activo = true
  group by p.id, p.nombre;

-- Volumen de ventas por mes (cerradas), ponderado.
create or replace view public.v_reportes_ventas_por_mes as
  select date_trunc('month', fecha_cierre)::date as mes, moneda_venta,
         sum(peso) as ventas_ponderadas, sum(precio_venta * peso) as monto
  from public.v_ventas_ponderadas
  where estado = 'cerrada'
  group by 1, 2
  order by 1 desc;

-- Ventas por marca (cerradas), ponderado.
create or replace view public.v_reportes_ventas_por_marca as
  select coalesce(vehiculo_marca, 'Sin marca') as marca, sum(peso) as ventas_ponderadas
  from public.v_ventas_ponderadas
  where estado = 'cerrada'
  group by 1
  order by 2 desc;

-- Operaciones por vendedor (mes actual, cerradas), ponderado.
create or replace view public.v_reportes_operaciones_por_vendedor as
  select p.id as vendedor_id, p.nombre as vendedor_nombre,
         coalesce(sum(vp.peso) filter (where vp.estado = 'cerrada' and date_trunc('month', vp.fecha_cierre) = date_trunc('month', now())), 0) as ventas_mes
  from public.perfiles p
  left join public.v_ventas_ponderadas vp on vp.vendedor_id = p.id
  where p.activo = true
  group by p.id, p.nombre
  order by ventas_mes desc;

-- Origen de leads (clientes del mes).
create or replace view public.v_reportes_origen_leads as
  select origen, count(*) as cantidad
  from public.clientes
  where date_trunc('month', created_at) = date_trunc('month', now())
  group by origen
  order by cantidad desc;

-- Top clientes por cantidad de compras cerradas (histórico).
create or replace view public.v_reportes_top_clientes as
  select c.id as cliente_id, c.nombre,
         count(v.id) as compras, sum(v.precio_venta) as monto_total
  from public.clientes c
  join public.ventas v on v.cliente_id = c.id and v.estado = 'cerrada'
  group by c.id, c.nombre
  order by compras desc, monto_total desc
  limit 10;

-- Clientes por vendedor (cartera activa actual).
create or replace view public.v_reportes_clientes_por_vendedor as
  select p.id as vendedor_id, p.nombre as vendedor_nombre, count(c.id) as clientes
  from public.perfiles p
  left join public.clientes c on c.vendedor_id = p.id
  where p.activo = true
  group by p.id, p.nombre
  order by clientes desc;

-- Embudo comercial del mes: clientes nuevos → cotizaciones → ventas cerradas.
create or replace view public.v_reportes_embudo_comercial as
  select
    (select count(*) from public.clientes where date_trunc('month', created_at) = date_trunc('month', now())) as clientes,
    (select count(*) from public.cotizaciones where date_trunc('month', created_at) = date_trunc('month', now())) as cotizaciones,
    (select count(*) from public.ventas where estado = 'cerrada' and date_trunc('month', fecha_cierre) = date_trunc('month', now())) as ventas;

-- Cotizaciones: totales, aprobadas, en revisión, tasa de conversión,
-- desglose por estado y por vendedor (todo histórico, no solo el mes).
create or replace view public.v_reportes_cotizaciones_resumen as
  select count(*) as total_generadas,
         count(*) filter (where estado = 'aprobada') as aprobadas,
         count(*) filter (where revision_pedida = true) as en_revision,
         round(100.0 * count(*) filter (where estado = 'aprobada') / nullif(count(*), 0)) as tasa_conversion_pct
  from public.cotizaciones;

create or replace view public.v_reportes_cotizaciones_por_estado as
  select estado, count(*) as cantidad from public.cotizaciones group by estado;

create or replace view public.v_reportes_cotizaciones_por_vendedor as
  select p.id as vendedor_id, p.nombre as vendedor_nombre, count(c.id) as cotizaciones
  from public.perfiles p
  join public.cotizaciones c on c.vendedor_id = p.id
  group by p.id, p.nombre
  order by cotizaciones desc;

-- Stock por estado y por marca (todo lo cargado, no solo disponible).
create or replace view public.v_reportes_stock_por_estado as
  select estado, count(*) as cantidad from public.vehiculos group by estado;

create or replace view public.v_reportes_stock_por_marca as
  select marca, count(*) as cantidad from public.vehiculos group by marca order by cantidad desc;

-- Service (posventa): embudo de recordatorios pendientes/hechos del mes +
-- facturación de OTs (Taller no existe todavía, así que factura_cobrada
-- queda en 0 hasta que se construya ese módulo — no hay de dónde sacarlo).
create or replace view public.v_reportes_service_posventa as
  select
    count(*) filter (where estado = 'pendiente') as oportunidades,
    count(*) filter (where estado = 'hecho') as contactadas,
    round(100.0 * count(*) filter (where estado = 'hecho') / nullif(count(*), 0)) as pct_contactadas,
    0 as con_ot
  from public.postventa_recordatorios
  where date_trunc('month', created_at) = date_trunc('month', now());

-- Las vistas corren con los permisos de quien las creó por default; con
-- security_invoker pasan a respetar el RLS de quien las consulta desde la
-- API (aunque hoy esas tablas ya son "using(true)" para todo autenticado,
-- esto evita sorpresas si más adelante se restringe algo).
do $$
declare
  v text;
begin
  foreach v in array array[
    'v_ventas_ponderadas','v_reportes_ranking_velocidad','v_reportes_ventas_por_mes',
    'v_reportes_ventas_por_marca','v_reportes_operaciones_por_vendedor','v_reportes_origen_leads',
    'v_reportes_top_clientes','v_reportes_clientes_por_vendedor','v_reportes_embudo_comercial',
    'v_reportes_cotizaciones_resumen','v_reportes_cotizaciones_por_estado','v_reportes_cotizaciones_por_vendedor',
    'v_reportes_stock_por_estado','v_reportes_stock_por_marca','v_reportes_service_posventa'
  ]
  loop
    execute format('alter view public.%I set (security_invoker = true)', v);
    execute format('grant select on public.%I to authenticated', v);
  end loop;
end $$;
