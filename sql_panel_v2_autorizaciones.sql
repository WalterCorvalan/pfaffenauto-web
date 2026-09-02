-- Panel v2 — Autorizaciones: circuito de aprobación para cambios de plata
-- hechos por no-admins (comisiones, ganancias, egresos importantes).
-- Nuevo desde cero según el manual, sin precedente en v1. 100% aditivo.
--
-- Arranca enganchado en UN flujo real como prueba de concepto: editar la
-- comisión de una venta (antes no existía ni siquiera la edición — se
-- construye acá junto con el gate). El resto de los puntos de la app se
-- suman incrementalmente después, cada uno como un nuevo "tipo".

create extension if not exists pgcrypto;

-- ============================================================
-- 1) Solicitudes de autorización.
-- ============================================================
create table if not exists public.autorizaciones (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  riesgo text not null check (riesgo in ('bajo', 'medio', 'alto')),
  descripcion text not null,
  entidad_tabla text,
  entidad_id uuid,
  datos_antes jsonb,
  datos_despues jsonb,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobada', 'rechazada')),
  requiere_pin boolean not null default false,
  motivo_rechazo text,
  solicitado_por uuid references public.perfiles(id),
  resuelto_por uuid references public.perfiles(id),
  resuelto_en timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists autorizaciones_estado_idx on public.autorizaciones(estado, created_at);

alter table public.autorizaciones enable row level security;
drop policy if exists "equipo_autorizaciones" on public.autorizaciones;
create policy "equipo_autorizaciones" on public.autorizaciones for all to authenticated using (true) with check (true);

alter publication supabase_realtime add table public.autorizaciones;

-- ============================================================
-- 2) PIN de emergencia del admin — hash server-side (pgcrypto), nunca texto
-- plano ni siquiera transitoriamente en una columna.
-- ============================================================
create table if not exists public.autorizaciones_pin (
  perfil_id uuid primary key references public.perfiles(id) on delete cascade,
  pin_hash text not null,
  updated_at timestamptz not null default now()
);

alter table public.autorizaciones_pin enable row level security;
drop policy if exists "equipo_autorizaciones_pin" on public.autorizaciones_pin;
create policy "equipo_autorizaciones_pin" on public.autorizaciones_pin for select to authenticated using (true);
-- El insert/update del PIN pasa siempre por la función security definer de
-- abajo (nunca un upsert directo del cliente), así el hash nunca se arma en
-- el navegador.

create table if not exists public.autorizaciones_pin_usos (
  id uuid primary key default gen_random_uuid(),
  autorizacion_id uuid not null references public.autorizaciones(id) on delete cascade,
  pin_de_perfil_id uuid references public.perfiles(id),
  usado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

alter table public.autorizaciones_pin_usos enable row level security;
drop policy if exists "equipo_autorizaciones_pin_usos" on public.autorizaciones_pin_usos;
create policy "equipo_autorizaciones_pin_usos" on public.autorizaciones_pin_usos for select to authenticated using (true);

-- ============================================================
-- 3) Funciones — fijar PIN, verificarlo, y resolver una solicitud (aplica
-- el cambio si aprueba, según "tipo").
-- ============================================================
create or replace function public.fijar_autorizacion_pin(p_pin text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if length(p_pin) < 4 then
    raise exception 'El PIN necesita al menos 4 caracteres.';
  end if;
  insert into public.autorizaciones_pin (perfil_id, pin_hash, updated_at)
  values (auth.uid(), crypt(p_pin, gen_salt('bf')), now())
  on conflict (perfil_id) do update set pin_hash = excluded.pin_hash, updated_at = now();
end;
$$;

create or replace function public.verificar_autorizacion_pin(p_pin text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_perfil_id uuid;
begin
  select perfil_id into v_perfil_id
  from public.autorizaciones_pin
  where pin_hash = crypt(p_pin, pin_hash)
  limit 1;
  return v_perfil_id;
end;
$$;

-- Aplica el payload de una solicitud aprobada. Extensible: cada "tipo" nuevo
-- suma un "when" acá.
create or replace function public.aplicar_autorizacion(p_autorizacion record)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  case p_autorizacion.tipo
    when 'editar_comision_venta' then
      update public.ventas
      set comision_vendedor_pct = (p_autorizacion.datos_despues->>'comision_vendedor_pct')::numeric,
          comision_consignacion_pct = (p_autorizacion.datos_despues->>'comision_consignacion_pct')::numeric
      where id = p_autorizacion.entidad_id;
    else
      raise exception 'Tipo de autorización desconocido: %', p_autorizacion.tipo;
  end case;
end;
$$;

create or replace function public.resolver_autorizacion(p_id uuid, p_aprobar boolean, p_motivo text default null, p_pin text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fila public.autorizaciones;
  v_pin_perfil_id uuid;
begin
  select * into v_fila from public.autorizaciones where id = p_id for update;
  if v_fila is null then
    raise exception 'Solicitud no encontrada.';
  end if;
  if v_fila.estado <> 'pendiente' then
    raise exception 'Esta solicitud ya fue resuelta.';
  end if;

  if p_aprobar and v_fila.requiere_pin then
    if p_pin is null then
      raise exception 'Esta solicitud requiere PIN de administrador.';
    end if;
    v_pin_perfil_id := public.verificar_autorizacion_pin(p_pin);
    if v_pin_perfil_id is null then
      raise exception 'PIN inválido.';
    end if;
    insert into public.autorizaciones_pin_usos (autorizacion_id, pin_de_perfil_id, usado_por)
    values (p_id, v_pin_perfil_id, auth.uid());
  end if;

  if p_aprobar then
    perform public.aplicar_autorizacion(v_fila);
  end if;

  update public.autorizaciones
  set estado = case when p_aprobar then 'aprobada' else 'rechazada' end,
      motivo_rechazo = case when p_aprobar then null else p_motivo end,
      resuelto_por = auth.uid(),
      resuelto_en = now()
  where id = p_id;
end;
$$;
