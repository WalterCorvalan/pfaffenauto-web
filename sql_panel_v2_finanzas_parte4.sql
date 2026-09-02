-- Panel v2 — Finanzas parte 4: Préstamos, Presupuesto (por categoría/mes,
-- distinto de `presupuestos` que son cotizaciones de venta — evitamos el
-- choque de nombre con `finanzas_presupuestos`), Recurrencias, Arqueos,
-- Cierre Caja (snapshot diario, distinto de cierres_mensuales que bloquea
-- mutaciones). Conciliación y el detalle fino de AFIP/IVA quedan de scaffold
-- (así los etiqueta el propio manual) — acá solo sumamos las columnas
-- fiscales que necesita AFIP/IVA.
--
-- Mismo mandato: cero tolerancia a errores de centavos, ARS/USD separados,
-- toda mutación de plata pasa por función security definer.

-- ============================================================
-- 1) Préstamos otorgados a una persona desde una caja. Nace activo y debita
-- al instante; "devuelto" genera el ingreso real de vuelta.
-- ============================================================
create table if not exists public.prestamos_otorgados (
  id uuid primary key default gen_random_uuid(),
  persona text not null,
  monto numeric not null,
  moneda text not null default 'USD' check (moneda in ('ARS', 'USD')),
  fecha date not null default current_date,
  cuenta_id uuid not null references public.cuentas(id),
  devolucion_esperada date,
  motivo text,
  notas text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'devuelto')),
  movimiento_id uuid not null references public.movimientos_caja(id),
  movimiento_devolucion_id uuid references public.movimientos_caja(id) on delete set null,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

alter table public.prestamos_otorgados enable row level security;
drop policy if exists "equipo_prestamos_otorgados" on public.prestamos_otorgados;
create policy "equipo_prestamos_otorgados" on public.prestamos_otorgados for all to authenticated using (true) with check (true);

create or replace function public.registrar_prestamo_otorgado(
  p_persona text, p_monto numeric, p_moneda text, p_fecha date, p_cuenta_id uuid,
  p_devolucion_esperada date default null, p_motivo text default null, p_notas text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_mov_id uuid;
begin
  v_mov_id := public.registrar_movimiento_caja('egreso', p_monto, p_cuenta_id, p_fecha, 'Préstamo otorgado', null, null, null, null, format('Préstamo a %s%s', p_persona, coalesce(' — ' || p_motivo, '')));

  insert into public.prestamos_otorgados (persona, monto, moneda, fecha, cuenta_id, devolucion_esperada, motivo, notas, movimiento_id, creado_por)
  values (p_persona, p_monto, p_moneda, p_fecha, p_cuenta_id, p_devolucion_esperada, p_motivo, p_notas, v_mov_id, auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.marcar_prestamo_devuelto(p_id uuid, p_cuenta_id uuid, p_fecha date default current_date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p record;
  v_mov_id uuid;
begin
  select * into v_p from public.prestamos_otorgados where id = p_id;
  if v_p is null then raise exception 'Préstamo no encontrado.'; end if;
  if v_p.estado = 'devuelto' then raise exception 'Ese préstamo ya está devuelto.'; end if;

  v_mov_id := public.registrar_movimiento_caja('ingreso', v_p.monto, p_cuenta_id, p_fecha, 'Préstamo devuelto', null, null, null, null, format('Devolución de préstamo — %s', v_p.persona));

  update public.prestamos_otorgados set estado = 'devuelto', movimiento_devolucion_id = v_mov_id where id = p_id;
end;
$$;

create or replace function public.eliminar_prestamo_otorgado(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p record;
begin
  select * into v_p from public.prestamos_otorgados where id = p_id;
  if v_p is null then raise exception 'Préstamo no encontrado.'; end if;
  perform public.eliminar_movimiento_caja(v_p.movimiento_id, 'Préstamo eliminado');
  if v_p.movimiento_devolucion_id is not null then
    perform public.eliminar_movimiento_caja(v_p.movimiento_devolucion_id, 'Préstamo eliminado');
  end if;
  delete from public.prestamos_otorgados where id = p_id;
end;
$$;

-- ============================================================
-- 2) Presupuesto por categoría/mes — cuánto se planea gastar/ingresar. El
-- consumo real se computa siempre al vuelo desde movimientos_caja, nunca se
-- guarda acá (mismo principio que saldo_cuenta).
-- ============================================================
create table if not exists public.finanzas_presupuestos (
  id uuid primary key default gen_random_uuid(),
  mes date not null,
  tipo text not null check (tipo in ('ingreso', 'egreso')),
  moneda text not null check (moneda in ('ARS', 'USD')),
  categoria text not null,
  monto_presupuestado numeric not null,
  notas text,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  unique (mes, tipo, moneda, categoria)
);

alter table public.finanzas_presupuestos enable row level security;
drop policy if exists "equipo_finanzas_presupuestos" on public.finanzas_presupuestos;
create policy "equipo_finanzas_presupuestos" on public.finanzas_presupuestos for all to authenticated using (true) with check (true);

-- ============================================================
-- 3) Recurrencias — plantillas de ingreso/egreso mensual (alquiler, sueldos,
-- servicios). "Generar" crea el movimiento real UNA sola vez por mes
-- (constraint evita duplicar si se clickea dos veces).
-- ============================================================
create table if not exists public.finanzas_recurrencias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text not null check (tipo in ('ingreso', 'egreso')),
  categoria text,
  monto numeric not null,
  moneda text not null default 'ARS' check (moneda in ('ARS', 'USD')),
  dia_mes int not null default 1 check (dia_mes between 1 and 28),
  cuenta_id uuid not null references public.cuentas(id),
  estado text not null default 'activa' check (estado in ('activa', 'pausada')),
  notas text,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

alter table public.finanzas_recurrencias enable row level security;
drop policy if exists "equipo_finanzas_recurrencias" on public.finanzas_recurrencias;
create policy "equipo_finanzas_recurrencias" on public.finanzas_recurrencias for all to authenticated using (true) with check (true);

create table if not exists public.finanzas_recurrencias_generaciones (
  id uuid primary key default gen_random_uuid(),
  recurrencia_id uuid not null references public.finanzas_recurrencias(id) on delete cascade,
  mes date not null,
  movimiento_id uuid not null references public.movimientos_caja(id),
  generado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  unique (recurrencia_id, mes)
);

alter table public.finanzas_recurrencias_generaciones enable row level security;
drop policy if exists "equipo_finanzas_recurrencias_generaciones" on public.finanzas_recurrencias_generaciones;
create policy "equipo_finanzas_recurrencias_generaciones" on public.finanzas_recurrencias_generaciones for all to authenticated using (true) with check (true);

create or replace function public.generar_recurrencia(p_id uuid, p_mes date default current_date)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_r record;
  v_mes date := date_trunc('month', p_mes)::date;
  v_fecha date;
  v_mov_id uuid;
  v_gen_id uuid;
begin
  select * into v_r from public.finanzas_recurrencias where id = p_id;
  if v_r is null then raise exception 'Recurrencia no encontrada.'; end if;
  if exists(select 1 from public.finanzas_recurrencias_generaciones where recurrencia_id = p_id and mes = v_mes) then
    raise exception 'Ya se generó el movimiento de este mes para esta recurrencia.';
  end if;

  v_fecha := least(v_mes + (v_r.dia_mes - 1), (v_mes + interval '1 month - 1 day')::date);
  v_mov_id := public.registrar_movimiento_caja(v_r.tipo, v_r.monto, v_r.cuenta_id, v_fecha, v_r.categoria, null, null, null, null, v_r.nombre);

  insert into public.finanzas_recurrencias_generaciones (recurrencia_id, mes, movimiento_id, generado_por)
  values (p_id, v_mes, v_mov_id, auth.uid())
  returning id into v_gen_id;

  return v_mov_id;
end;
$$;

-- ============================================================
-- 4) Arqueos — comparación saldo calculado vs efectivo contado. Solo un
-- registro/log, no muta plata.
-- ============================================================
create table if not exists public.finanzas_arqueos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default current_date,
  responsable_id uuid references public.perfiles(id),
  cuenta_id uuid not null references public.cuentas(id),
  moneda text not null check (moneda in ('ARS', 'USD')),
  saldo_esperado numeric not null,
  contado_real numeric not null,
  diferencia numeric not null,
  motivo text,
  created_at timestamptz not null default now()
);

alter table public.finanzas_arqueos enable row level security;
drop policy if exists "equipo_finanzas_arqueos" on public.finanzas_arqueos;
create policy "equipo_finanzas_arqueos" on public.finanzas_arqueos for all to authenticated using (true) with check (true);

-- ============================================================
-- 5) Cierre de caja diario — snapshot inmutable de saldos, no bloquea nada
-- (distinto de cierres_mensuales). Re-cerrar el mismo día reemplaza el
-- snapshot anterior de esa fecha.
-- ============================================================
create table if not exists public.finanzas_cierres_diarios (
  id uuid primary key default gen_random_uuid(),
  fecha date not null unique,
  cerrado_por uuid references public.perfiles(id),
  cerrado_en timestamptz not null default now()
);

alter table public.finanzas_cierres_diarios enable row level security;
drop policy if exists "equipo_finanzas_cierres_diarios" on public.finanzas_cierres_diarios;
create policy "equipo_finanzas_cierres_diarios" on public.finanzas_cierres_diarios for all to authenticated using (true) with check (true);

create table if not exists public.finanzas_cierres_diarios_detalle (
  id uuid primary key default gen_random_uuid(),
  cierre_id uuid not null references public.finanzas_cierres_diarios(id) on delete cascade,
  cuenta_id uuid references public.cuentas(id),
  cuenta_nombre text not null,
  moneda text not null check (moneda in ('ARS', 'USD')),
  saldo numeric not null
);

alter table public.finanzas_cierres_diarios_detalle enable row level security;
drop policy if exists "equipo_finanzas_cierres_diarios_detalle" on public.finanzas_cierres_diarios_detalle;
create policy "equipo_finanzas_cierres_diarios_detalle" on public.finanzas_cierres_diarios_detalle for all to authenticated using (true) with check (true);

create or replace function public.cerrar_dia_caja(p_fecha date default current_date)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cierre_id uuid;
begin
  insert into public.finanzas_cierres_diarios (fecha, cerrado_por)
  values (p_fecha, auth.uid())
  on conflict (fecha) do update set cerrado_por = excluded.cerrado_por, cerrado_en = now()
  returning id into v_cierre_id;

  delete from public.finanzas_cierres_diarios_detalle where cierre_id = v_cierre_id;

  insert into public.finanzas_cierres_diarios_detalle (cierre_id, cuenta_id, cuenta_nombre, moneda, saldo)
  select v_cierre_id, c.id, c.nombre, c.moneda, public.saldo_cuenta(c.id)
  from public.cuentas c
  where c.activa = true;

  return v_cierre_id;
end;
$$;

-- ============================================================
-- 6) AFIP/IVA (scaffold) — categorización fiscal por movimiento.
-- ============================================================
alter table public.movimientos_caja
  add column if not exists categoria_fiscal text check (categoria_fiscal in ('A', 'B', 'C', 'Exenta')),
  add column if not exists iva_pct numeric;
