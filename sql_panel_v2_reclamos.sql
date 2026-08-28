-- Panel v2 — Reclamos. Base nova.

create table if not exists public.reclamos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  tipo text not null default 'Administrativo' check (tipo in ('Transferencia', 'Pago', 'Gestoría', 'Documentación', 'Administrativo', 'Otro')),
  prioridad text not null default 'Normal' check (prioridad in ('Baja', 'Normal', 'Alta', 'Urgente')),
  estado text not null default 'abierto' check (estado in ('abierto', 'en_curso', 'cerrado')),
  asignado_a uuid references public.perfiles(id),
  cliente_id uuid references public.clientes(id),
  cliente_nombre text not null,
  cliente_telefono text,
  cliente_email text,
  referencia text,
  pedido_atencion_sector text,
  pedido_atencion_mensaje text,
  pedido_atencion_en timestamptz,
  nota_cierre text,
  cerrado_en timestamptz,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ultimo_movimiento_at timestamptz not null default now()
);

create index if not exists reclamos_estado_idx on public.reclamos(estado);
create index if not exists reclamos_asignado_idx on public.reclamos(asignado_a);
create index if not exists reclamos_cliente_idx on public.reclamos(cliente_id);

alter table public.reclamos enable row level security;
drop policy if exists "equipo_reclamos" on public.reclamos;
create policy "equipo_reclamos" on public.reclamos for all to authenticated using (true) with check (true);

-- Seguimiento — bitácora del reclamo (creación, comentarios, cambios de
-- estado, pedidos de atención, cierre/reapertura). El emoji lo pone el
-- frontend según `tipo`.
create table if not exists public.reclamo_seguimiento (
  id uuid primary key default gen_random_uuid(),
  reclamo_id uuid not null references public.reclamos(id) on delete cascade,
  autor_id uuid references public.perfiles(id),
  tipo text not null default 'comentario' check (tipo in ('creacion', 'comentario', 'cambio_estado', 'pedido_atencion', 'cierre', 'reapertura')),
  texto text,
  sector text,
  created_at timestamptz not null default now()
);

create index if not exists reclamo_seguimiento_reclamo_idx on public.reclamo_seguimiento(reclamo_id, created_at);

alter table public.reclamo_seguimiento enable row level security;
drop policy if exists "equipo_reclamo_seguimiento" on public.reclamo_seguimiento;
create policy "equipo_reclamo_seguimiento" on public.reclamo_seguimiento for all to authenticated using (true) with check (true);

create table if not exists public.reclamo_adjuntos (
  id uuid primary key default gen_random_uuid(),
  reclamo_id uuid not null references public.reclamos(id) on delete cascade,
  nombre text not null,
  url text not null,
  subido_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

alter table public.reclamo_adjuntos enable row level security;
drop policy if exists "equipo_reclamo_adjuntos" on public.reclamo_adjuntos;
create policy "equipo_reclamo_adjuntos" on public.reclamo_adjuntos for all to authenticated using (true) with check (true);

-- Cualquier movimiento (comentario, cambio de estado, etc) marca el reclamo
-- como revisado: actualiza ultimo_movimiento_at y apaga el cartelito
-- "Pedido" — excepto cuando el movimiento ES un nuevo pedido de atención,
-- que además dispara la alerta al sector.
create or replace function public.reclamo_registrar_movimiento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link text;
  v_persona record;
begin
  v_link := '/panel-v2/reclamos?reclamo=' || new.reclamo_id;

  if new.tipo = 'pedido_atencion' then
    update public.reclamos
    set pedido_atencion_sector = new.sector, pedido_atencion_mensaje = new.texto, pedido_atencion_en = now(),
        ultimo_movimiento_at = now(), updated_at = now()
    where id = new.reclamo_id;

    for v_persona in select id from public.perfiles where new.sector = any(roles) and activo = true loop
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, mensaje, link)
      values (v_persona.id, 'reclamo_pedido_atencion', 'alta', 'Te piden atención en un reclamo', new.texto, v_link);
    end loop;
  else
    update public.reclamos
    set pedido_atencion_sector = null, pedido_atencion_mensaje = null, pedido_atencion_en = null,
        ultimo_movimiento_at = now(), updated_at = now()
    where id = new.reclamo_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_reclamo_movimiento on public.reclamo_seguimiento;
create trigger trg_reclamo_movimiento
  after insert on public.reclamo_seguimiento
  for each row execute function public.reclamo_registrar_movimiento();

-- Al asignar el reclamo (alta o reasignación), avisa al asignado.
create or replace function public.reclamo_notificar_asignado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.asignado_a is not null and new.asignado_a is distinct from old.asignado_a then
    insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
    values (new.asignado_a, 'reclamo_asignado', 'media', 'Te asignaron el reclamo "' || new.titulo || '"', '/panel-v2/reclamos?reclamo=' || new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_reclamo_notificar_asignado on public.reclamos;
create trigger trg_reclamo_notificar_asignado
  after insert or update of asignado_a on public.reclamos
  for each row execute function public.reclamo_notificar_asignado();

-- cerrado_en se completa/limpia solo según el estado.
create or replace function public.reclamo_sync_cerrado_en()
returns trigger
language plpgsql
as $$
begin
  if new.estado = 'cerrado' and old.estado is distinct from 'cerrado' then
    new.cerrado_en := now();
  elsif new.estado <> 'cerrado' and old.estado = 'cerrado' then
    new.cerrado_en := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_reclamo_sync_cerrado_en on public.reclamos;
create trigger trg_reclamo_sync_cerrado_en
  before update of estado on public.reclamos
  for each row execute function public.reclamo_sync_cerrado_en();
