-- Arregla 2 bugs del tab Comisiones (Configuración > Empresa):
--   1. Modo "Fijo" no hacía nada -- el trigger siempre calculaba por %.
--   2. Modo "Ninguna" solo escondía el menú "Mis Comisiones", pero las
--      comisiones se seguían generando igual en la base.
-- Se mantiene también el chequeo de paga_comisiones por compatibilidad
-- (nunca tuvo control en el panel, pero por las dudas si alguien lo tocó
-- directo en Supabase).

create or replace function public.generar_comisiones_al_cerrar_venta()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_modo text;
  v_monto_fijo numeric;
  v_paga_comisiones boolean;
  v_monto_vendedor numeric;
begin
  if new.estado <> 'cerrada' or (tg_op = 'UPDATE' and old.estado = 'cerrada') then
    return new;
  end if;

  select modo_comision, monto_fijo_comision, paga_comisiones
  into v_modo, v_monto_fijo, v_paga_comisiones
  from public.configuracion_empresa where id = true;

  if coalesce(v_modo, 'porcentaje') = 'ninguna' or coalesce(v_paga_comisiones, true) = false then
    return new;
  end if;

  -- Vendedor (o split con el compañero, cada uno su propia fila).
  if new.vendedor_id is not null then
    if v_modo = 'fijo' then
      v_monto_vendedor := coalesce(v_monto_fijo, 0);
    else
      v_monto_vendedor := new.precio_venta * coalesce(new.comision_vendedor_pct, 0) / 100;
    end if;

    if v_monto_vendedor > 0 then
      if new.vendedor_compartido and new.vendedor_compartido_id is not null then
        insert into public.comisiones (venta_id, beneficiario_id, tipo, monto, moneda, creado_por)
        values (
          new.id, new.vendedor_compartido_id, 'vendedor_compartido',
          case when v_modo = 'fijo' then v_monto_vendedor / 2 else new.precio_venta * coalesce(new.vendedor_compartido_pct, 0) / 100 end,
          new.moneda_venta, new.creado_por
        )
        on conflict (venta_id, beneficiario_id, tipo) where venta_id is not null do nothing;
        if v_modo = 'fijo' then
          v_monto_vendedor := v_monto_vendedor / 2;
        end if;
      end if;
      insert into public.comisiones (venta_id, beneficiario_id, tipo, monto, moneda, creado_por)
      values (new.id, new.vendedor_id, 'vendedor', v_monto_vendedor, new.moneda_venta, new.creado_por)
      on conflict (venta_id, beneficiario_id, tipo) where venta_id is not null do nothing;
    end if;
  end if;

  -- Responsable de consignación -- siempre por porcentaje. El monto fijo es
  -- para el vendedor únicamente, no se reparte también acá salvo que lo
  -- pidas explícitamente más adelante.
  if new.responsable_consignacion_id is not null and coalesce(new.comision_consignacion_pct, 0) > 0 then
    insert into public.comisiones (venta_id, beneficiario_id, tipo, monto, moneda, creado_por)
    values (new.id, new.responsable_consignacion_id, 'consignacion', new.precio_venta * new.comision_consignacion_pct / 100, new.moneda_venta, new.creado_por)
    on conflict (venta_id, beneficiario_id, tipo) where venta_id is not null do nothing;
  end if;

  return new;
end;
$function$;

-- Mismo criterio en el trigger que resincroniza el monto cuando se edita el
-- % o el precio de una venta ya cerrada -- si el modo es "fijo", no tiene
-- sentido recalcular al vendedor por %.
create or replace function public.sincronizar_comisiones_pct_venta()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_modo text;
begin
  if new.estado <> 'cerrada' then
    return new;
  end if;

  select modo_comision into v_modo from public.configuracion_empresa where id = true;

  if coalesce(v_modo, 'porcentaje') <> 'fijo' then
    if new.comision_vendedor_pct is distinct from old.comision_vendedor_pct or new.precio_venta is distinct from old.precio_venta then
      update public.comisiones
      set monto = new.precio_venta * coalesce(new.comision_vendedor_pct, 0) / 100, updated_at = now()
      where venta_id = new.id and tipo = 'vendedor' and estado = 'pendiente';
    end if;

    if new.vendedor_compartido_pct is distinct from old.vendedor_compartido_pct or new.precio_venta is distinct from old.precio_venta then
      update public.comisiones
      set monto = new.precio_venta * coalesce(new.vendedor_compartido_pct, 0) / 100, updated_at = now()
      where venta_id = new.id and tipo = 'vendedor_compartido' and estado = 'pendiente';
    end if;
  end if;

  if new.comision_consignacion_pct is distinct from old.comision_consignacion_pct or new.precio_venta is distinct from old.precio_venta then
    update public.comisiones
    set monto = new.precio_venta * coalesce(new.comision_consignacion_pct, 0) / 100, updated_at = now()
    where venta_id = new.id and tipo = 'consignacion' and estado = 'pendiente';
  end if;

  return new;
end;
$function$;
