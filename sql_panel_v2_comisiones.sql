-- Panel v2 — Mis Comisiones. Solo backend (frontend lo hace Gemini después).
-- Corre en la base NUEVA (vdcpmbajlyqgohrwpkeo).

-- Config por empresa: si no paga comisiones, o si exige reseña antes de cobrar.
alter table public.configuracion_empresa
  add column if not exists paga_comisiones boolean not null default true,
  add column if not exists exigir_resena_comision boolean not null default false;

-- Una fila por beneficiario por venta (o suelta si es bono manual). Así el
-- vendedor, el responsable de consignación y un compañero compartido pueden
-- tener cada uno su propio estado de cobro sobre la misma venta.
create table if not exists public.comisiones (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid references public.ventas(id) on delete cascade,
  beneficiario_id uuid not null references public.perfiles(id),
  tipo text not null check (tipo in ('vendedor', 'consignacion', 'vendedor_compartido', 'bono')),
  concepto text,
  monto numeric not null,
  moneda text not null default 'USD' check (moneda in ('USD', 'ARS')),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'cobrada')),
  monto_pagado numeric not null default 0,
  pago_externo boolean not null default false,
  fecha_cobro date,
  aprobacion_pendiente boolean not null default false,
  solicitado_por uuid references public.perfiles(id),
  aprobado_sin_resena_por uuid references public.perfiles(id),
  aprobado_sin_resena_en timestamptz,
  comentario text,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Evita duplicar la fila de comisión si el trigger de abajo corre dos veces
-- sobre la misma venta (mismo patrón de bug que ya pisamos con expedientes).
create unique index if not exists comisiones_venta_beneficiario_tipo_idx
  on public.comisiones(venta_id, beneficiario_id, tipo) where venta_id is not null;

create index if not exists comisiones_beneficiario_idx on public.comisiones(beneficiario_id, estado);

alter table public.comisiones enable row level security;
drop policy if exists "ver_comisiones" on public.comisiones;
create policy "ver_comisiones" on public.comisiones for select to authenticated using (true);
drop policy if exists "crear_comisiones" on public.comisiones;
create policy "crear_comisiones" on public.comisiones for insert to authenticated with check (true);
-- El update de estado/monto_pagado pasa por las funciones de abajo
-- (security definer), no por escritura directa — pero dejamos update abierto
-- para campos blandos como comentario, que cualquiera puede editar.
drop policy if exists "editar_comisiones" on public.comisiones;
create policy "editar_comisiones" on public.comisiones for update to authenticated using (true) with check (true);
drop policy if exists "borrar_comisiones" on public.comisiones;
create policy "borrar_comisiones" on public.comisiones for delete to authenticated
  using (exists (select 1 from public.perfiles p where p.id = auth.uid() and 'admin' = any(p.roles)));

-- Historial de pagos parciales (comisión y bonos comparten esta tabla).
create table if not exists public.comision_pagos (
  id uuid primary key default gen_random_uuid(),
  comision_id uuid not null references public.comisiones(id) on delete cascade,
  monto numeric not null,
  pago_externo boolean not null default false,
  fecha date not null default current_date,
  registrado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

alter table public.comision_pagos enable row level security;
drop policy if exists "ver_comision_pagos" on public.comision_pagos;
create policy "ver_comision_pagos" on public.comision_pagos for select to authenticated using (true);

-- Pedidos de reseña (botón "C" comprador / "E" ex-dueño). Cada click es una
-- fila nueva — así el frontend puede mostrar "×N" y el historial al hover.
create table if not exists public.venta_resenas_solicitudes (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas(id) on delete cascade,
  tipo text not null check (tipo in ('comprador', 'ex_dueno')),
  solicitado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create index if not exists venta_resenas_venta_idx on public.venta_resenas_solicitudes(venta_id, tipo);

alter table public.venta_resenas_solicitudes enable row level security;
drop policy if exists "equipo_venta_resenas" on public.venta_resenas_solicitudes;
create policy "equipo_venta_resenas" on public.venta_resenas_solicitudes for all to authenticated using (true) with check (true);

-- Genera las filas de comisión solas al cerrar la venta — mismo patrón ya
-- corregido de INSERT+UPDATE (ver sql_panel_v2_expedientes_fix_insert.sql).
create or replace function public.generar_comisiones_al_cerrar_venta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pct_vendedor numeric;
begin
  if new.estado <> 'cerrada' or (tg_op = 'UPDATE' and old.estado = 'cerrada') then
    return new;
  end if;

  if not exists (select 1 from public.configuracion_empresa where id = true and paga_comisiones = true) then
    return new;
  end if;

  -- Vendedor (o split con el compañero, cada uno su propia fila).
  if new.vendedor_id is not null and coalesce(new.comision_vendedor_pct, 0) > 0 then
    v_pct_vendedor := new.comision_vendedor_pct;
    if new.vendedor_compartido and new.vendedor_compartido_id is not null then
      insert into public.comisiones (venta_id, beneficiario_id, tipo, monto, moneda, creado_por)
      values (new.id, new.vendedor_compartido_id, 'vendedor_compartido', new.precio_venta * coalesce(new.vendedor_compartido_pct, 0) / 100, new.moneda_venta, new.creado_por)
      on conflict (venta_id, beneficiario_id, tipo) where venta_id is not null do nothing;
    end if;
    insert into public.comisiones (venta_id, beneficiario_id, tipo, monto, moneda, creado_por)
    values (new.id, new.vendedor_id, 'vendedor', new.precio_venta * v_pct_vendedor / 100, new.moneda_venta, new.creado_por)
    on conflict (venta_id, beneficiario_id, tipo) where venta_id is not null do nothing;
  end if;

  -- Responsable de consignación.
  if new.responsable_consignacion_id is not null and coalesce(new.comision_consignacion_pct, 0) > 0 then
    insert into public.comisiones (venta_id, beneficiario_id, tipo, monto, moneda, creado_por)
    values (new.id, new.responsable_consignacion_id, 'consignacion', new.precio_venta * new.comision_consignacion_pct / 100, new.moneda_venta, new.creado_por)
    on conflict (venta_id, beneficiario_id, tipo) where venta_id is not null do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_generar_comisiones on public.ventas;
create trigger trg_generar_comisiones
  after insert or update of estado on public.ventas
  for each row execute function public.generar_comisiones_al_cerrar_venta();

-- Si la venta se marca caída, las comisiones generadas por ella se anulan
-- (no quedan cobrables) salvo que ya estuvieran cobradas.
create or replace function public.anular_comisiones_por_venta_caida()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado = 'caida' and old.estado is distinct from 'caida' then
    delete from public.comisiones where venta_id = new.id and estado = 'pendiente';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_anular_comisiones_caida on public.ventas;
create trigger trg_anular_comisiones_caida
  after update of estado on public.ventas
  for each row execute function public.anular_comisiones_por_venta_caida();

-- Cambiar estado: admin/finanzas lo hace directo; el propio beneficiario
-- (vendedor) solo puede "pedir" el cambio, queda pendiente de aprobación.
create or replace function public.cambiar_estado_comision(p_comision_id uuid, p_nuevo_estado text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comision record;
  v_soy_admin boolean;
  v_encargado record;
begin
  if p_nuevo_estado not in ('pendiente', 'cobrada') then
    raise exception 'Estado inválido.';
  end if;

  select * into v_comision from public.comisiones where id = p_comision_id;
  if v_comision is null then
    raise exception 'Comisión no encontrada.';
  end if;

  select exists(select 1 from public.perfiles where id = auth.uid() and ('admin' = any(roles) or 'finanzas' = any(roles))) into v_soy_admin;

  if v_soy_admin then
    update public.comisiones
    set estado = p_nuevo_estado, aprobacion_pendiente = false,
        fecha_cobro = case when p_nuevo_estado = 'cobrada' then coalesce(fecha_cobro, current_date) else null end,
        monto_pagado = case when p_nuevo_estado = 'cobrada' then monto else monto_pagado end,
        updated_at = now()
    where id = p_comision_id;
  elsif auth.uid() = v_comision.beneficiario_id then
    update public.comisiones set aprobacion_pendiente = true, solicitado_por = auth.uid(), updated_at = now() where id = p_comision_id;
    for v_encargado in select id from public.perfiles where ('admin' = any(roles) or 'finanzas' = any(roles)) and activo = true loop
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
      values (v_encargado.id, 'comision_pedido_cambio', 'media', 'Un vendedor pidió cambiar el estado de una comisión', '/panel-v2/comisiones');
    end loop;
  else
    raise exception 'No tenés permiso para modificar esta comisión.';
  end if;
end;
$$;

-- Marca cobrada validando la reseña exigida (o la fuerza, si es admin/finanzas y confirma).
create or replace function public.marcar_comision_cobrada(p_comision_id uuid, p_forzar_sin_resena boolean default false)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comision record;
  v_tipo_resena text;
  v_tiene_resena boolean;
  v_exige boolean;
  v_soy_admin boolean;
begin
  select * into v_comision from public.comisiones where id = p_comision_id;
  if v_comision is null then
    raise exception 'Comisión no encontrada.';
  end if;

  select exigir_resena_comision into v_exige from public.configuracion_empresa where id = true;
  select exists(select 1 from public.perfiles where id = auth.uid() and ('admin' = any(roles) or 'finanzas' = any(roles))) into v_soy_admin;

  if v_exige and v_comision.venta_id is not null and v_comision.tipo in ('vendedor', 'vendedor_compartido', 'consignacion') then
    v_tipo_resena := case when v_comision.tipo = 'consignacion' then 'ex_dueno' else 'comprador' end;
    select exists(select 1 from public.venta_resenas_solicitudes where venta_id = v_comision.venta_id and tipo = v_tipo_resena) into v_tiene_resena;

    if not v_tiene_resena then
      if p_forzar_sin_resena and v_soy_admin then
        update public.comisiones set aprobado_sin_resena_por = auth.uid(), aprobado_sin_resena_en = now() where id = p_comision_id;
      else
        raise exception 'Pedí la reseña antes de cobrar (o forzá el pago como admin/finanzas).';
      end if;
    end if;
  end if;

  update public.comisiones
  set estado = 'cobrada', monto_pagado = monto, fecha_cobro = coalesce(fecha_cobro, current_date), aprobacion_pendiente = false, updated_at = now()
  where id = p_comision_id;
end;
$$;

-- Pago parcial (comisión de venta o bono) — admin/finanzas.
create or replace function public.registrar_pago_parcial_comision(p_comision_id uuid, p_monto numeric, p_pago_externo boolean default false, p_fecha date default current_date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comision record;
  v_nuevo_pagado numeric;
begin
  if not exists (select 1 from public.perfiles where id = auth.uid() and ('admin' = any(roles) or 'finanzas' = any(roles))) then
    raise exception 'Solo Admin o Finanzas pueden registrar pagos.';
  end if;

  select * into v_comision from public.comisiones where id = p_comision_id;
  if v_comision is null then
    raise exception 'Comisión no encontrada.';
  end if;

  insert into public.comision_pagos (comision_id, monto, pago_externo, fecha, registrado_por)
  values (p_comision_id, p_monto, p_pago_externo, p_fecha, auth.uid());

  v_nuevo_pagado := v_comision.monto_pagado + p_monto;

  update public.comisiones
  set monto_pagado = v_nuevo_pagado,
      estado = case when v_nuevo_pagado >= monto then 'cobrada' else estado end,
      fecha_cobro = case when v_nuevo_pagado >= monto then coalesce(fecha_cobro, p_fecha) else fecha_cobro end,
      updated_at = now()
  where id = p_comision_id;
end;
$$;

-- Bono / comisión manual — admin/finanzas la carga directo; vendedor la
-- "pide" y queda pendiente de aprobación (misma idea que cambiar_estado_comision).
create or replace function public.crear_bono_comision(
  p_beneficiario_id uuid, p_concepto text, p_monto numeric, p_moneda text default 'USD'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_soy_admin boolean;
  v_id uuid;
  v_encargado record;
begin
  select exists(select 1 from public.perfiles where id = auth.uid() and ('admin' = any(roles) or 'finanzas' = any(roles))) into v_soy_admin;

  insert into public.comisiones (beneficiario_id, tipo, concepto, monto, moneda, creado_por, aprobacion_pendiente, solicitado_por)
  values (p_beneficiario_id, 'bono', p_concepto, p_monto, p_moneda, auth.uid(), not v_soy_admin, case when v_soy_admin then null else auth.uid() end)
  returning id into v_id;

  if not v_soy_admin then
    for v_encargado in select id from public.perfiles where ('admin' = any(roles) or 'finanzas' = any(roles)) and activo = true loop
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
      values (v_encargado.id, 'comision_bono_pedido', 'media', 'Pidieron un bono/comisión manual', '/panel-v2/comisiones');
    end loop;
  end if;

  return v_id;
end;
$$;
