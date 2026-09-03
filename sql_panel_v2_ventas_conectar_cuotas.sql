-- Fix (auditoría 2026-09-03): una venta Financiada en Ventas genera su
-- propia tabla `venta_cuotas` (numero, monto, moneda, vencimiento) — pero
-- eso nunca se refleja en `cuotas_cobrar_clientes`, que es la tabla real
-- que leen Cobros y Finanzas. Resultado: una venta financiada jamás
-- aparece como cuota a cobrar en ningún lado salvo que alguien la
-- vuelva a cargar a mano (el propio código deja una nota de texto en
-- comentario_finanzas pidiendo eso).
--
-- Fix aditivo, sin tocar Ventas ni Finanzas: un trigger en `venta_cuotas`
-- que, cuando se crea el plan de cuotas de una venta, crea la fila real
-- correspondiente en `cuotas_cobrar_clientes` — vendedor_id se autocompleta
-- solo (ya existe el trigger sync_cuota_cobrar_vendedor de Cobros). Es
-- hacia adelante: NO migra financiaciones viejas ya cargadas (podrían
-- haberse re-cargado a mano siguiendo el proceso anterior — duplicarlas
-- sería peor que dejarlas como están).

alter table public.cuotas_cobrar_clientes
  add column if not exists venta_cuota_id uuid references public.venta_cuotas(id) on delete set null;

create unique index if not exists cuotas_cobrar_clientes_venta_cuota_idx
  on public.cuotas_cobrar_clientes(venta_cuota_id) where venta_cuota_id is not null;

create or replace function public.crear_cuota_cobrar_desde_venta_cuota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venta record;
  v_total int;
begin
  select cliente_id into v_venta from public.ventas where id = new.venta_id;
  select count(*) into v_total from public.venta_cuotas where venta_id = new.venta_id;

  insert into public.cuotas_cobrar_clientes (cliente_id, venta_id, concepto, moneda, monto, vencimiento, cuota_actual, cuota_total, venta_cuota_id)
  values (v_venta.cliente_id, new.venta_id, 'Financiación — cuota ' || new.numero || '/' || v_total, new.moneda, new.monto, new.vencimiento, new.numero, v_total, new.id)
  on conflict (venta_cuota_id) where venta_cuota_id is not null do nothing;

  return new;
end;
$$;

drop trigger if exists trg_crear_cuota_cobrar_desde_venta_cuota on public.venta_cuotas;
create trigger trg_crear_cuota_cobrar_desde_venta_cuota
  after insert on public.venta_cuotas
  for each row execute function public.crear_cuota_cobrar_desde_venta_cuota();
