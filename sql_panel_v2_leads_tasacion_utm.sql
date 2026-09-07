-- Hoy solo se guarda canal_origen, un balde genérico ("Meta Ads", "Google
-- Ads") armado a partir de utm_source -- se pierde utm_medium y sobre todo
-- utm_campaign, así que nunca se puede saber qué campaña puntual trajo un
-- lead. Se agregan los 3 campos crudos, sin mapear, además de canal_origen
-- (que se sigue usando para el balde legible en el detalle del lead).
alter table public.leads_tasacion
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text;

create index if not exists leads_tasacion_utm_campaign_idx on public.leads_tasacion(utm_campaign);

-- Reporte de Marketing: leads reales por campaña (agrupa por lo que sí se
-- puede saber -- utm_source/utm_campaign -- en vez de la campanas_marketing
-- que hoy es 100% carga manual de gasto, sin cruzar con leads reales).
create or replace view public.v_reportes_leads_por_utm as
  select
    coalesce(utm_source, 'Sin UTM') as utm_source,
    coalesce(utm_campaign, 'Sin campaña') as utm_campaign,
    coalesce(utm_medium, '—') as utm_medium,
    count(*) as leads
  from public.leads_tasacion
  group by utm_source, utm_campaign, utm_medium
  order by leads desc;

alter view public.v_reportes_leads_por_utm set (security_invoker = true);
grant select on public.v_reportes_leads_por_utm to authenticated;
