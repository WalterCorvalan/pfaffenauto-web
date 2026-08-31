-- Panel v2 — Peritajes. Replica el módulo de v1 (app/(panel-v1)/panel/peritajes):
-- nace desde un lead existente (cotización, WhatsApp o Instagram), nunca desde
-- un formulario público. Checklist calcado 1:1 de lib/peritajeChecklist.ts
-- (única fuente de verdad ya compartida con v1 — no se duplica acá el listado
-- en TS, se siembra igual en SQL para que ambos queden sincronizados).

create table if not exists public.peritajes (
  id uuid primary key default gen_random_uuid(),
  cotizacion_id uuid references public.cotizaciones(id) on delete set null,
  whatsapp_conversacion_id uuid references public.whatsapp_conversaciones(id) on delete set null,
  instagram_conversacion_id uuid references public.instagram_conversaciones(id) on delete set null,
  realizado_por uuid references public.perfiles(id),
  estado text not null default 'Pendiente' check (estado in ('Pendiente', 'Completado')),
  puntaje int,
  accesorios jsonb not null default '{}'::jsonb,
  carroceria_marcas jsonb not null default '[]'::jsonb,
  estado_general_vu text,
  tipo_cliente text check (tipo_cliente in ('Publico', 'Revendedor')),
  valor_retoma numeric,
  gastos_reparacion numeric,
  gastos_preparacion numeric,
  precio_venta numeric,
  observaciones_uso_interno text,
  tasador text,
  ok_dto_vu boolean not null default false,
  ok_gerencia_ventas boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un lead (cualquiera de los tres orígenes) solo puede tener un peritaje —
-- así "leads sin peritaje" es simplemente el que no matchea acá.
create unique index if not exists peritajes_cotizacion_unq on public.peritajes(cotizacion_id) where cotizacion_id is not null;
create unique index if not exists peritajes_whatsapp_unq on public.peritajes(whatsapp_conversacion_id) where whatsapp_conversacion_id is not null;
create unique index if not exists peritajes_instagram_unq on public.peritajes(instagram_conversacion_id) where instagram_conversacion_id is not null;

alter table public.peritajes enable row level security;
drop policy if exists "equipo_peritajes" on public.peritajes;
create policy "equipo_peritajes" on public.peritajes for all to authenticated using (true) with check (true);

create table if not exists public.peritaje_items (
  id uuid primary key default gen_random_uuid(),
  peritaje_id uuid not null references public.peritajes(id) on delete cascade,
  categoria text not null,
  item text not null,
  orden int not null,
  estado text check (estado in ('Bueno', 'Regular', 'Malo', 'Recapable', 'No aplica')),
  observacion text,
  foto_url text,
  necesita_reparacion boolean not null default false,
  gastos_reparacion numeric
);

create index if not exists peritaje_items_peritaje_idx on public.peritaje_items(peritaje_id, orden);

alter table public.peritaje_items enable row level security;
drop policy if exists "equipo_peritaje_items" on public.peritaje_items;
create policy "equipo_peritaje_items" on public.peritaje_items for all to authenticated using (true) with check (true);

-- Crea el peritaje desde un lead + siembra el checklist fijo (mismo listado
-- que lib/peritajeChecklist.ts). Exactamente uno de los tres orígenes debe
-- venir cargado.
create or replace function public.crear_peritaje_desde_lead(
  p_cotizacion_id uuid default null,
  p_whatsapp_conversacion_id uuid default null,
  p_instagram_conversacion_id uuid default null,
  p_realizado_por uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if (p_cotizacion_id is not null)::int + (p_whatsapp_conversacion_id is not null)::int + (p_instagram_conversacion_id is not null)::int <> 1 then
    raise exception 'Un peritaje nace de exactamente un lead: cotización, WhatsApp o Instagram.';
  end if;

  insert into public.peritajes (cotizacion_id, whatsapp_conversacion_id, instagram_conversacion_id, realizado_por)
  values (p_cotizacion_id, p_whatsapp_conversacion_id, p_instagram_conversacion_id, p_realizado_por)
  returning id into v_id;

  insert into public.peritaje_items (peritaje_id, categoria, item, orden)
  values
    (v_id, 'Motor', 'Estado general', 1),
    (v_id, 'Transmisión', 'Embrague', 2),
    (v_id, 'Transmisión', 'Caja', 3),
    (v_id, 'Transmisión', 'Tren delantero', 4),
    (v_id, 'Electricidad', 'Techo', 5),
    (v_id, 'Electricidad', 'Diversos', 6),
    (v_id, 'Elementos de seguridad', 'Frenos', 7),
    (v_id, 'Elementos de seguridad', 'Suspensión', 8),
    (v_id, 'Elementos de seguridad', 'Dirección', 9),
    (v_id, 'Elementos de seguridad', 'Cinturón de seguridad', 10),
    (v_id, 'Aspecto', 'Chapa', 11),
    (v_id, 'Aspecto', 'Pintura', 12),
    (v_id, 'Aspecto', 'Tapicería', 13),
    (v_id, 'Observaciones', 'Prueba en ruta', 14),
    (v_id, 'Neumáticos', 'Delantero derecho', 15),
    (v_id, 'Neumáticos', 'Delantero izquierdo', 16),
    (v_id, 'Neumáticos', 'Trasero derecho', 17),
    (v_id, 'Neumáticos', 'Trasero izquierdo', 18),
    (v_id, 'Neumáticos', 'Rueda de auxilio', 19);

  return v_id;
end;
$$;

-- Al completar, deja una entrada en la línea de tiempo del cliente si se
-- puede resolver uno (vía la cotización o la conversación de origen).
create or replace function public.peritaje_notificar_completado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cliente_id uuid;
begin
  if new.estado <> 'Completado' or old.estado = 'Completado' then
    return new;
  end if;

  if new.cotizacion_id is not null then
    select cliente_id into v_cliente_id from public.cotizaciones where id = new.cotizacion_id;
  elsif new.whatsapp_conversacion_id is not null then
    select cliente_id into v_cliente_id from public.whatsapp_conversaciones where id = new.whatsapp_conversacion_id;
  elsif new.instagram_conversacion_id is not null then
    select cliente_id into v_cliente_id from public.instagram_conversaciones where id = new.instagram_conversacion_id;
  end if;

  if v_cliente_id is not null then
    insert into public.cliente_actividades (cliente_id, tipo, descripcion, autor_id)
    values (v_cliente_id, 'nota', 'Peritaje completado' || case when new.puntaje is not null then ' — puntaje ' || new.puntaje || '%' else '' end, new.realizado_por);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_peritaje_completado on public.peritajes;
create trigger trg_peritaje_completado
  after update on public.peritajes
  for each row execute function public.peritaje_notificar_completado();
