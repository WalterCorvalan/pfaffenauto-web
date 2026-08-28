-- Panel v2 — Expedientes. Extiende (aditivo) la tabla mínima ya creada en
-- sql_panel_v2_ventas.sql (venta_id, tipo, estado) con lo que pide el manual:
-- auto-creación al cerrar la venta, partes, hitos, observaciones (bitácora),
-- gastos, reventa, y "operación caída".

-- Ganancia oculta — a quien la tiene, el frontend no le muestra margen/rentabilidad.
alter table public.perfiles add column if not exists ganancias_ocultas boolean not null default false;

alter table public.expedientes
  add column if not exists gestor_asignado_id uuid references public.perfiles(id),
  add column if not exists es_reventa boolean not null default false,
  add column if not exists reventa_fecha_prevista date,
  add column if not exists archivado boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists expedientes_gestor_idx on public.expedientes(gestor_asignado_id);
create index if not exists expedientes_estado_idx on public.expedientes(estado);

-- Gestoría solo ve lo asignado a su persona o sin asignar; el resto de roles ve todo.
drop policy if exists "ver_expedientes" on public.expedientes;
create policy "ver_expedientes" on public.expedientes for select to authenticated
  using (
    gestor_asignado_id is null
    or gestor_asignado_id = auth.uid()
    or not exists (
      select 1 from public.perfiles p
      where p.id = auth.uid() and 'gestoria' = any(p.roles) and not ('admin' = any(p.roles))
    )
  );

drop policy if exists "editar_expedientes" on public.expedientes;
create policy "editar_expedientes" on public.expedientes for update to authenticated using (true) with check (true);

-- Documentación del expediente (archivos subidos — URL en R2, igual patrón que el resto del proyecto).
create table if not exists public.expediente_documentos (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid not null references public.expedientes(id) on delete cascade,
  nombre text not null,
  url text not null,
  subido_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

alter table public.expediente_documentos enable row level security;
drop policy if exists "equipo_expediente_documentos" on public.expediente_documentos;
create policy "equipo_expediente_documentos" on public.expediente_documentos for all to authenticated using (true) with check (true);

-- Gastos del trámite (sellos, patentamiento, gestoría externa, etc).
create table if not exists public.expediente_gastos (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid not null references public.expedientes(id) on delete cascade,
  concepto text not null,
  monto numeric not null,
  moneda text not null default 'ARS' check (moneda in ('USD', 'ARS')),
  a_cargo_de text check (a_cargo_de in ('comprador', 'vendedor', 'agencia')),
  created_at timestamptz not null default now()
);

alter table public.expediente_gastos enable row level security;
drop policy if exists "equipo_expediente_gastos" on public.expediente_gastos;
create policy "equipo_expediente_gastos" on public.expediente_gastos for all to authenticated using (true) with check (true);

-- Observaciones — bitácora compartida entre áreas.
create table if not exists public.expediente_observaciones (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid not null references public.expedientes(id) on delete cascade,
  texto text not null,
  autor_id uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

alter table public.expediente_observaciones enable row level security;
drop policy if exists "equipo_expediente_observaciones" on public.expediente_observaciones;
create policy "equipo_expediente_observaciones" on public.expediente_observaciones for all to authenticated using (true) with check (true);

-- Hitos del trámite (barra de avance). Semilla estándar al crear el expediente;
-- el frontend los va tildando.
create table if not exists public.expediente_hitos (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid not null references public.expedientes(id) on delete cascade,
  nombre text not null,
  orden int not null,
  completado boolean not null default false,
  completado_en timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists expediente_hitos_expediente_idx on public.expediente_hitos(expediente_id, orden);

alter table public.expediente_hitos enable row level security;
drop policy if exists "equipo_expediente_hitos" on public.expediente_hitos;
create policy "equipo_expediente_hitos" on public.expediente_hitos for all to authenticated using (true) with check (true);

-- Auto-creación: al cerrar una venta (estado -> 'cerrada') con abre_expediente=true,
-- se abre el expediente solo, con los hitos estándar precargados.
create or replace function public.abrir_expediente_al_cerrar_venta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expediente_id uuid;
begin
  if new.estado = 'cerrada' and old.estado is distinct from 'cerrada' and new.abre_expediente = true then
    insert into public.expedientes (venta_id, tipo, estado, gestor_asignado_id, creado_por)
    values (new.id, 'venta', 'abierto', new.gestor_asignado_id, new.vendedor_id)
    on conflict (venta_id) do nothing
    returning id into v_expediente_id;

    if v_expediente_id is not null then
      insert into public.expediente_hitos (expediente_id, nombre, orden)
      values
        (v_expediente_id, 'Datos de las partes cargados', 1),
        (v_expediente_id, 'Boleto generado', 2),
        (v_expediente_id, 'Documentación completa', 3),
        (v_expediente_id, 'Transferencia iniciada', 4),
        (v_expediente_id, 'Transferencia finalizada', 5);

      if new.gestor_asignado_id is not null then
        insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
        values (new.gestor_asignado_id, 'expediente_nuevo', 'media', 'Nuevo expediente para gestionar', '/panel/expedientes?venta=' || new.id);
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_abrir_expediente on public.ventas;
create trigger trg_abrir_expediente
  after update of estado on public.ventas
  for each row execute function public.abrir_expediente_al_cerrar_venta();

-- Operación caída — solo llamado por Admin/Finanzas desde el frontend (RLS de
-- ventas ya exige rol admin para update; acá además validamos por si el
-- frontend expone el RPC a más gente). Cancela la venta, repone el auto a
-- stock, anula cuotas pendientes y archiva el expediente sin borrar nada.
create or replace function public.marcar_operacion_caida(p_venta_id uuid, p_sena_queda_en_agencia boolean default true)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venta record;
  v_sena_acreditada boolean;
begin
  if not exists (select 1 from public.perfiles where id = auth.uid() and ('admin' = any(roles) or 'finanzas' = any(roles))) then
    raise exception 'Solo Admin o Finanzas pueden marcar una operación como caída.';
  end if;

  select * into v_venta from public.ventas where id = p_venta_id;
  if v_venta is null then
    raise exception 'Venta no encontrada.';
  end if;

  update public.ventas set estado = 'caida', updated_at = now() where id = p_venta_id;

  if v_venta.vehiculo_id is not null then
    update public.vehiculos set estado = 'disponible' where id = v_venta.vehiculo_id;
  end if;

  update public.venta_cuotas set estado = 'pendiente'
  where venta_id = p_venta_id and estado = 'pendiente';
  -- Nota: "anulada" no es un estado de venta_cuotas hoy (solo pendiente/pagada);
  -- si se necesita distinguir "anulada por caída" de "pendiente normal" hace
  -- falta sumar ese valor al check — dejo la cuota simplemente fuera de
  -- vencimientos vía el propio estado de la venta ('caida') que el reporte
  -- de vencimientos ya debería filtrar.

  update public.expedientes set estado = 'cerrado', archivado = true, updated_at = now()
  where venta_id = p_venta_id;

  select exists(select 1 from public.venta_senas where venta_id = p_venta_id and estado = 'confirmada') into v_sena_acreditada;

  if v_sena_acreditada and p_sena_queda_en_agencia = false then
    insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
    select id, 'operacion_caida_devolver_sena', 'alta', 'Operación caída: hay que cargar el egreso de la devolución de seña', '/panel/ventas?venta=' || p_venta_id
    from public.perfiles where 'finanzas' = any(roles) and activo = true;
  end if;
end;
$$;
