-- Conecta el efectivo ARS/USD cargado en el boleto de venta con Tesorería,
-- diferenciando por moneda. Antes pago_efectivo_ars/usd solo quedaban
-- guardados en la venta sin generar movimiento de caja.

alter table public.ventas add column if not exists pago_efectivo_ars_cuenta_id uuid references public.cuentas(id);
alter table public.ventas add column if not exists pago_efectivo_ars_movimiento_id uuid references public.movimientos_caja(id);
alter table public.ventas add column if not exists pago_efectivo_usd_cuenta_id uuid references public.cuentas(id);
alter table public.ventas add column if not exists pago_efectivo_usd_movimiento_id uuid references public.movimientos_caja(id);

create or replace function public.registrar_pago_efectivo_venta(
  p_venta_id uuid,
  p_monto_ars numeric default null,
  p_cuenta_ars_id uuid default null,
  p_monto_usd numeric default null,
  p_cuenta_usd_id uuid default null,
  p_tipo_cambio numeric default null,
  p_fecha date default current_date
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_venta record;
  v_moneda text;
  v_mov_ars uuid;
  v_mov_usd uuid;
begin
  select * into v_venta from public.ventas where id = p_venta_id;
  if v_venta is null then
    raise exception 'Venta no encontrada.';
  end if;

  -- Revertir movimientos previos primero (evita duplicar en Tesorería si se
  -- corrige el monto, se cambia de caja, o se vuelve a guardar la edición).
  if v_venta.pago_efectivo_ars_movimiento_id is not null then
    perform public.eliminar_movimiento_caja(v_venta.pago_efectivo_ars_movimiento_id, 'Efectivo ARS del boleto corregido/revertido');
  end if;
  if v_venta.pago_efectivo_usd_movimiento_id is not null then
    perform public.eliminar_movimiento_caja(v_venta.pago_efectivo_usd_movimiento_id, 'Efectivo USD del boleto corregido/revertido');
  end if;

  if p_monto_ars is not null and p_monto_ars > 0 then
    if p_cuenta_ars_id is null then
      raise exception 'Elegí de qué caja entra el efectivo en ARS.';
    end if;
    select moneda into v_moneda from public.cuentas where id = p_cuenta_ars_id;
    if v_moneda is null then raise exception 'Caja ARS no encontrada.'; end if;
    if v_moneda <> 'ARS' then raise exception 'La caja elegida para el efectivo ARS no es de moneda ARS.'; end if;
    v_mov_ars := public.registrar_movimiento_caja(
      'ingreso', p_monto_ars, p_cuenta_ars_id, p_fecha, 'Venta — efectivo recibido (ARS)', 'Efectivo',
      v_venta.vehiculo_id, v_venta.cliente_id, p_venta_id,
      'Efectivo ARS del boleto — ' || coalesce(v_venta.comprador_nombre, '')
    );
  end if;

  if p_monto_usd is not null and p_monto_usd > 0 then
    if p_cuenta_usd_id is null then
      raise exception 'Elegí de qué caja entra el efectivo en USD.';
    end if;
    select moneda into v_moneda from public.cuentas where id = p_cuenta_usd_id;
    if v_moneda is null then raise exception 'Caja USD no encontrada.'; end if;
    if v_moneda <> 'USD' then raise exception 'La caja elegida para el efectivo USD no es de moneda USD.'; end if;
    v_mov_usd := public.registrar_movimiento_caja(
      'ingreso', p_monto_usd, p_cuenta_usd_id, p_fecha, 'Venta — efectivo recibido (USD)', 'Efectivo',
      v_venta.vehiculo_id, v_venta.cliente_id, p_venta_id,
      'Efectivo USD del boleto — ' || coalesce(v_venta.comprador_nombre, '')
    );
  end if;

  update public.ventas
  set pago_efectivo_ars = p_monto_ars, pago_efectivo_ars_cuenta_id = case when p_monto_ars > 0 then p_cuenta_ars_id else null end, pago_efectivo_ars_movimiento_id = v_mov_ars,
      pago_efectivo_usd = p_monto_usd, pago_efectivo_usd_cuenta_id = case when p_monto_usd > 0 then p_cuenta_usd_id else null end, pago_efectivo_usd_movimiento_id = v_mov_usd,
      tipo_cambio = p_tipo_cambio
  where id = p_venta_id;
end;
$function$;
