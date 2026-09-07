-- Panel v2 — Reportes: "¿qué modelo genera más consultas pero menos
-- ventas?". Usa tablas que ya existen, sin crear ninguna nueva:
-- - Consultas: conversaciones de WhatsApp/Instagram que ya están linkeadas
--   a un vehículo real (whatsapp_conversaciones.vehiculo_id,
--   instagram_conversaciones.vehiculo_id) — señal real de "alguien
--   preguntó por este auto puntual", no texto libre a interpretar.
-- - Ventas: ventas cerradas por marca+modelo (ya son columnas de texto en
--   la tabla ventas, no hace falta join).
create or replace view public.v_reportes_consultas_vs_ventas as
with consultas as (
  select v.marca, v.modelo, count(*) as consultas
  from public.vehiculos v
  join public.whatsapp_conversaciones c on c.vehiculo_id = v.id
  group by v.marca, v.modelo
  union all
  select v.marca, v.modelo, count(*) as consultas
  from public.vehiculos v
  join public.instagram_conversaciones c on c.vehiculo_id = v.id
  group by v.marca, v.modelo
),
consultas_agrupadas as (
  select marca, modelo, sum(consultas) as consultas
  from consultas
  group by marca, modelo
),
ventas_agrupadas as (
  select vehiculo_marca as marca, vehiculo_modelo as modelo, count(*) as ventas
  from public.ventas
  where estado = 'cerrada' and vehiculo_marca is not null and vehiculo_modelo is not null
  group by vehiculo_marca, vehiculo_modelo
)
select
  c.marca, c.modelo, c.consultas,
  coalesce(v.ventas, 0) as ventas,
  round(100.0 * coalesce(v.ventas, 0) / c.consultas) as tasa_conversion_pct
from consultas_agrupadas c
left join ventas_agrupadas v on v.marca = c.marca and v.modelo = c.modelo
order by c.consultas desc;

alter view public.v_reportes_consultas_vs_ventas set (security_invoker = true);
grant select on public.v_reportes_consultas_vs_ventas to authenticated;
