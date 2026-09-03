-- Fix (auditoría 2026-09-03, mismo patrón que sql_panel_v2_ventas_fix_funnel.sql):
-- marcar una consignación como "consignado" (estado terminal — el dueño
-- convirtió, trajo el auto) nunca actualizaba clientes.pipeline_stage.
-- El funnel/embudo de ese vendedor no veía esa conversión real como
-- "cerrado". Trigger nuevo y aditivo, no toca nada de la lógica existente
-- de consignaciones (notificación al vendedor, etc.).

create or replace function public.marcar_cliente_cerrado_al_consignar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado <> 'consignado' or (tg_op = 'UPDATE' and old.estado = 'consignado') then
    return new;
  end if;
  if new.cliente_id is not null then
    update public.clientes
    set pipeline_stage = 'cerrado', pipeline_stage_manual = true
    where id = new.cliente_id and pipeline_stage <> 'cerrado';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_marcar_cliente_cerrado_al_consignar on public.consignaciones;
create trigger trg_marcar_cliente_cerrado_al_consignar
  after insert or update on public.consignaciones
  for each row execute function public.marcar_cliente_cerrado_al_consignar();
