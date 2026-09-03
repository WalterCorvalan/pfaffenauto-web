-- Fix (auditoría 2026-09-03): bono_retroactivo_proyectado() y
-- liquidar_bono_retroactivo_mes() sumaban precio_venta de TODAS las ventas
-- del vendedor en el rango sin filtrar por moneda_venta — un vendedor con
-- ventas en ARS y en USD en el mismo mes/rango sumaba ambas como un solo
-- número, y el resultado se muestra/inserta siempre etiquetado "USD"
-- (bonoProyectado en MisVentasClient.tsx, moneda:'USD' en el insert del
-- cron). liquidar_bono_retroactivo_mes además INSERTA una comisión real
-- con ese total mezclado — esto ya pudo haber liquidado bonos mal.
--
-- Fix mínimo y seguro: filtrar ambas sumas a solo ventas en USD (que es la
-- moneda con la que el bono ya se etiqueta en todos lados). Una venta en
-- ARS que subió de tier NO genera bono acá todavía — es mejor no calcularlo
-- que calcularlo mezclado. Si se necesita bono en ARS habría que sumarlo
-- aparte y generar una fila de comisión en ARS, que es una función nueva,
-- no un fix de este bug.

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
    and comision_vendedor_pct < v_tier.siguiente_pct
    and moneda_venta = 'USD';

  return v_bono;
end;
$$;

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
      and comision_vendedor_pct < v_tier.pct_actual
      and moneda_venta = 'USD';

    if v_bono > 0 and not exists (select 1 from public.comisiones where beneficiario_id = v_vendedor.id and periodo_liquidacion = v_desde and tipo = 'bono' and concepto = 'Bono retroactivo por tier') then
      -- Insert directo (no vía crear_bono_comision): esa función decide
      -- directo/pendiente-de-aprobación según auth.uid(), que acá no existe
      -- (corre por cron, sin sesión) — el bono automático nace liquidado.
      -- (fix: el código insertaba 'pendiente', contradiciendo este mismo
      -- comentario y el texto de la alerta de abajo, que dice "se liquidó".)
      insert into public.comisiones (beneficiario_id, tipo, concepto, monto, moneda, periodo_liquidacion, estado, monto_pagado, fecha_cobro)
      values (v_vendedor.id, 'bono', 'Bono retroactivo por tier', v_bono, 'USD', v_desde, 'cobrada', v_bono, current_date)
      returning id into v_id;
      total := total + 1;

      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, mensaje, link)
      values (v_vendedor.id, 'comision_bono_pedido', 'novedad', 'Bono retroactivo liquidado — subiste de tier', 'Llegaste a ' || v_tier.tier_actual || ' (' || v_tier.pct_actual || '%) y se liquidó la diferencia de todo el mes.', '/panel-v2/mis-ventas');
    end if;
  end loop;

  return total;
end;
$$;

-- ============================================================
-- Auditoría: ¿ya se liquidó algún bono mezclado antes de este fix? Revisar
-- a mano (no se borra nada automático — plata real, hay que mirarla primero).
-- ============================================================
-- select * from public.comisiones where tipo = 'bono' and concepto = 'Bono retroactivo por tier';
