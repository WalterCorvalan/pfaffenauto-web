-- Panel v2 — Liquidaciones de gestoría: economía de cada trámite de
-- transferencia (lo cobrado al cliente vs el costo real de registro/multas,
-- comisión de la gestora, ingreso neto de la agencia). NO mueve caja — es
-- un libro de seguimiento/control, la plata de la venta en sí ya se
-- registra en Finanzas por otros caminos (Ventas, Extra cobrado, etc.).
--
-- El título del automotor NO se duplica acá: se lee/escribe directo
-- expedientes.titulo_transferido_url (la misma columna que ya usa
-- Gestoría), así queda sincronizado en los dos lados sin lógica extra.

alter table public.configuracion_empresa
  add column if not exists liquidaciones_comision_fija numeric not null default 40000,
  add column if not exists liquidaciones_pct_gestora numeric not null default 10,
  add column if not exists liquidaciones_pct_agencia numeric not null default 90;

create table if not exists public.liquidaciones_gestoria (
  id uuid primary key default gen_random_uuid(),
  mes date not null,
  dominio text not null,
  fecha_operacion date not null default current_date,
  expediente_id uuid references public.expedientes(id) on delete set null,

  cliente_vendedor text,
  cliente_comprador text,
  marca text,
  modelo text,
  anio text,
  vendedor_interno_id uuid references public.perfiles(id),
  radicacion_actual text,
  radicacion_futura text,

  transf_cliente numeric not null default 0,
  transf_registro numeric not null default 0,
  fecha_pago_registro date,
  fecha_ingreso_registro date,

  multas_cliente numeric not null default 0,
  multas_costo_real numeric not null default 0,
  deuda_patente numeric not null default 0,

  diferencia_transferencia numeric generated always as (transf_cliente - transf_registro) stored,
  diferencia_multas numeric generated always as (multas_cliente - multas_costo_real) stored,

  comision_fija_aplicada numeric not null default 0,
  pct_gestora_aplicado numeric not null default 0,
  pct_agencia_aplicado numeric not null default 0,
  comision_gestora numeric generated always as (
    comision_fija_aplicada
    + (pct_gestora_aplicado / 100.0) * (transf_cliente - transf_registro)
    + (pct_gestora_aplicado / 100.0) * (multas_cliente - multas_costo_real)
  ) stored,
  ingreso_agencia numeric generated always as (
    (pct_agencia_aplicado / 100.0) * (transf_cliente - transf_registro)
    + (pct_agencia_aplicado / 100.0) * (multas_cliente - multas_costo_real)
  ) stored,

  gestora text,
  estado text not null default 'en_proceso' check (estado in ('en_proceso', 'terminado', 'pendiente_pago', 'observado')),
  fecha_finalizado date,

  hubo_devolucion_registro boolean,
  sobrante_registro numeric,
  sobrante_comentario text,
  devolucion_destino text check (devolucion_destino in ('cuenta_agencia', 'cuenta_cliente')),

  arancel_comprobante_url text,
  motivo_finalizacion_sin_titulo text,
  motivo_finalizacion_sin_arancel text,

  importes_bloqueados boolean not null default false,
  bloqueado_por uuid references public.perfiles(id),
  bloqueado_en timestamptz,

  liquidado_gestora boolean not null default false,
  liquidado_gestora_en timestamptz,

  observaciones text,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists liquidaciones_gestoria_mes_idx on public.liquidaciones_gestoria(mes);
create index if not exists liquidaciones_gestoria_dominio_idx on public.liquidaciones_gestoria(dominio);
create index if not exists liquidaciones_gestoria_expediente_idx on public.liquidaciones_gestoria(expediente_id);

alter table public.liquidaciones_gestoria enable row level security;
drop policy if exists "equipo_liquidaciones_gestoria" on public.liquidaciones_gestoria;
create policy "equipo_liquidaciones_gestoria" on public.liquidaciones_gestoria for all to authenticated using (true) with check (true);

create or replace function public.soy_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select exists(select 1 from public.perfiles where id = auth.uid() and 'admin' = any(roles));
$$;

-- Crear con los % vigentes ya "aplicados" (snapshot) — así si mañana
-- cambia el % default de config, las operaciones viejas no se recalculan
-- solas por atrás.
create or replace function public.crear_liquidacion_gestoria(
  p_mes date, p_dominio text, p_fecha_operacion date, p_expediente_id uuid default null,
  p_cliente_vendedor text default null, p_cliente_comprador text default null,
  p_marca text default null, p_modelo text default null, p_anio text default null,
  p_vendedor_interno_id uuid default null, p_radicacion_actual text default null, p_radicacion_futura text default null,
  p_gestora text default null, p_estado text default 'en_proceso',
  p_transf_cliente numeric default 0, p_transf_registro numeric default 0,
  p_fecha_pago_registro date default null, p_fecha_ingreso_registro date default null,
  p_multas_cliente numeric default 0, p_multas_costo_real numeric default 0, p_deuda_patente numeric default 0,
  p_observaciones text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_cfg record;
begin
  if p_estado = 'terminado' then
    raise exception 'No se puede crear ya como Terminado — guardala y usá "Finalizar" (valida título y arancel).';
  end if;

  select liquidaciones_comision_fija, liquidaciones_pct_gestora, liquidaciones_pct_agencia
    into v_cfg from public.configuracion_empresa where id = true;

  insert into public.liquidaciones_gestoria (
    mes, dominio, fecha_operacion, expediente_id, cliente_vendedor, cliente_comprador,
    marca, modelo, anio, vendedor_interno_id, radicacion_actual, radicacion_futura, gestora, estado,
    transf_cliente, transf_registro, fecha_pago_registro, fecha_ingreso_registro,
    multas_cliente, multas_costo_real, deuda_patente, observaciones,
    comision_fija_aplicada, pct_gestora_aplicado, pct_agencia_aplicado, creado_por
  ) values (
    date_trunc('month', p_mes)::date, p_dominio, p_fecha_operacion, p_expediente_id, p_cliente_vendedor, p_cliente_comprador,
    p_marca, p_modelo, p_anio, p_vendedor_interno_id, p_radicacion_actual, p_radicacion_futura, p_gestora, coalesce(p_estado, 'en_proceso'),
    coalesce(p_transf_cliente, 0), coalesce(p_transf_registro, 0), p_fecha_pago_registro, p_fecha_ingreso_registro,
    coalesce(p_multas_cliente, 0), coalesce(p_multas_costo_real, 0), coalesce(p_deuda_patente, 0), p_observaciones,
    coalesce(v_cfg.liquidaciones_comision_fija, 40000), coalesce(v_cfg.liquidaciones_pct_gestora, 10), coalesce(v_cfg.liquidaciones_pct_agencia, 90), auth.uid()
  ) returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.confirmar_importes_liquidacion(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.liquidaciones_gestoria
  set importes_bloqueados = true, bloqueado_por = auth.uid(), bloqueado_en = now(), updated_at = now()
  where id = p_id;
end;
$$;

-- Editar los importes de transferencia/multas. Si ya están bloqueados y no
-- sos admin/finanzas, en vez de aplicar directo queda pendiente de
-- autorización (mismo motor que Finanzas usa para egresos importantes).
drop function if exists public.editar_importes_liquidacion(uuid, numeric, numeric, numeric, numeric, date, date);
create or replace function public.editar_importes_liquidacion(
  p_id uuid, p_transf_cliente numeric, p_transf_registro numeric, p_multas_cliente numeric, p_multas_costo_real numeric,
  p_fecha_pago_registro date default null, p_fecha_ingreso_registro date default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
begin
  select * into v_row from public.liquidaciones_gestoria where id = p_id;
  if v_row is null then raise exception 'Transferencia no encontrada.'; end if;

  -- Si está bloqueado y no sos admin/finanzas, el pedido queda pendiente de
  -- autorización — NO lanza excepción, porque eso revertiría el insert de
  -- abajo (una función que raise-ea deshace todo lo que hizo en la misma
  -- transacción). Devuelve false para que el frontend sepa que no se aplicó.
  if v_row.importes_bloqueados and not public.soy_admin_o_finanzas() then
    insert into public.autorizaciones (tipo, riesgo, requiere_pin, descripcion, entidad_tabla, entidad_id, datos_despues, solicitado_por)
    values (
      'editar_importes_liquidacion', 'medio', false,
      format('Pedido de cambio de importes en liquidación %s', v_row.dominio),
      'liquidaciones_gestoria', p_id,
      jsonb_build_object(
        'liquidacion_id', p_id, 'transf_cliente', p_transf_cliente, 'transf_registro', p_transf_registro,
        'multas_cliente', p_multas_cliente, 'multas_costo_real', p_multas_costo_real,
        'fecha_pago_registro', p_fecha_pago_registro, 'fecha_ingreso_registro', p_fecha_ingreso_registro
      ),
      auth.uid()
    );
    return false;
  end if;

  update public.liquidaciones_gestoria
  set transf_cliente = p_transf_cliente, transf_registro = p_transf_registro,
      multas_cliente = p_multas_cliente, multas_costo_real = p_multas_costo_real,
      fecha_pago_registro = coalesce(p_fecha_pago_registro, fecha_pago_registro),
      fecha_ingreso_registro = coalesce(p_fecha_ingreso_registro, fecha_ingreso_registro),
      updated_at = now()
  where id = p_id;

  return true;
end;
$$;

-- Extiende el motor de Autorizaciones (additivo, no toca las ramas
-- existentes) para poder aplicar un cambio de importes que quedó pendiente.
create or replace function public.aplicar_autorizacion(p_autorizacion record)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_movimiento_id uuid;
  v_cp record;
  v_pd record;
  v_liq_id uuid;
begin
  case p_autorizacion.tipo
    when 'editar_comision_venta' then
      update public.ventas
      set comision_vendedor_pct = (p_autorizacion.datos_despues->>'comision_vendedor_pct')::numeric,
          comision_consignacion_pct = (p_autorizacion.datos_despues->>'comision_consignacion_pct')::numeric
      where id = p_autorizacion.entidad_id;
    when 'egreso_importante' then
      v_movimiento_id := (p_autorizacion.datos_despues->>'movimiento_id')::uuid;
      update public.movimientos_caja set estado = 'aprobado' where id = v_movimiento_id;

      select * into v_cp from public.cuota_pagos where movimiento_id = v_movimiento_id;
      if v_cp is not null then
        if v_cp.cuota_cobrar_id is not null then
          perform public.recalcular_cuota_cobrar(v_cp.cuota_cobrar_id);
        else
          perform public.recalcular_cuota_pagar(v_cp.cuota_pagar_id);
        end if;
      end if;

      select * into v_pd from public.pagos_disponibles_cobros where movimiento_id = v_movimiento_id;
      if v_pd is not null then
        perform public.recalcular_pago_disponible(v_pd.pago_disponible_id);
      end if;
    when 'editar_importes_liquidacion' then
      v_liq_id := (p_autorizacion.datos_despues->>'liquidacion_id')::uuid;
      update public.liquidaciones_gestoria
      set transf_cliente = (p_autorizacion.datos_despues->>'transf_cliente')::numeric,
          transf_registro = (p_autorizacion.datos_despues->>'transf_registro')::numeric,
          multas_cliente = (p_autorizacion.datos_despues->>'multas_cliente')::numeric,
          multas_costo_real = (p_autorizacion.datos_despues->>'multas_costo_real')::numeric,
          fecha_pago_registro = coalesce((p_autorizacion.datos_despues->>'fecha_pago_registro')::date, fecha_pago_registro),
          fecha_ingreso_registro = coalesce((p_autorizacion.datos_despues->>'fecha_ingreso_registro')::date, fecha_ingreso_registro),
          updated_at = now()
      where id = v_liq_id;
    else
      raise exception 'Tipo de autorización desconocido: %', p_autorizacion.tipo;
  end case;
end;
$$;

-- Finalizar (estado -> terminado): exige título del automotor (columna
-- compartida con el expediente) y arancel de registro declarado +
-- comprobante — salvo que seas admin y dejes motivo. También exige haber
-- contestado si el registro devolvió plata.
create or replace function public.finalizar_liquidacion_gestoria(
  p_id uuid, p_fecha_finalizado date,
  p_motivo_sin_titulo text default null, p_motivo_sin_arancel text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_titulo text;
  v_soy_admin boolean := public.soy_admin();
begin
  select * into v_row from public.liquidaciones_gestoria where id = p_id;
  if v_row is null then raise exception 'Transferencia no encontrada.'; end if;

  if v_row.expediente_id is not null then
    select titulo_transferido_url into v_titulo from public.expedientes where id = v_row.expediente_id;
  end if;

  if v_titulo is null then
    if not v_soy_admin then
      raise exception 'Falta el título del automotor.';
    elsif p_motivo_sin_titulo is null or length(trim(p_motivo_sin_titulo)) = 0 then
      raise exception 'Como admin podés finalizar sin título, pero tenés que cargar un motivo.';
    end if;
  end if;

  if v_row.transf_registro <= 0 or v_row.arancel_comprobante_url is null then
    if not v_soy_admin then
      raise exception 'Falta declarar el arancel del registro (costo real + comprobante).';
    elsif p_motivo_sin_arancel is null or length(trim(p_motivo_sin_arancel)) = 0 then
      raise exception 'Como admin podés finalizar sin comprobante de arancel, pero tenés que cargar un motivo.';
    end if;
  end if;

  if v_row.hubo_devolucion_registro is null then
    raise exception 'Contestá si el registro devolvió plata antes de finalizar.';
  end if;

  update public.liquidaciones_gestoria
  set estado = 'terminado', fecha_finalizado = p_fecha_finalizado,
      motivo_finalizacion_sin_titulo = p_motivo_sin_titulo, motivo_finalizacion_sin_arancel = p_motivo_sin_arancel,
      updated_at = now()
  where id = p_id;
end;
$$;

create or replace function public.marcar_liquidadas_gestora(p_mes date, p_gestora text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n int;
begin
  if not public.soy_admin_o_finanzas() then
    raise exception 'Solo Admin o Finanzas pueden marcar una liquidación como pagada.';
  end if;
  update public.liquidaciones_gestoria
  set liquidado_gestora = true, liquidado_gestora_en = now(), updated_at = now()
  where mes = date_trunc('month', p_mes)::date and coalesce(gestora, '') = coalesce(p_gestora, '') and estado = 'terminado' and liquidado_gestora = false;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- Borra duplicados (mismo dominio + mes), deja el más reciente.
create or replace function public.limpiar_duplicadas_liquidaciones()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n int;
begin
  if not public.soy_admin_o_finanzas() then
    raise exception 'Solo Admin o Finanzas pueden limpiar duplicadas.';
  end if;
  with ranked as (
    select id, row_number() over (partition by dominio, mes order by updated_at desc, created_at desc) as rn
    from public.liquidaciones_gestoria
  )
  delete from public.liquidaciones_gestoria where id in (select id from ranked where rn > 1);
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;
