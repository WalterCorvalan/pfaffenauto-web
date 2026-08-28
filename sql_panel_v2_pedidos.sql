-- Panel v2 — Pedidos (lo que un cliente busca y no está en stock).
-- Base nova. Match automático contra vehiculos + alerta al vendedor cuando entra
-- al stock un auto que sirve. Sin match contra "consignar" todavía — ese pipeline
-- vive en el módulo Consignaciones, aún no construido en v2.

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id),
  nombre_cliente text not null,
  telefono text,
  marca text not null,
  modelo text,
  anio_desde int,
  anio_hasta int,
  presupuesto_max numeric,
  moneda text not null default 'USD' check (moneda in ('USD', 'ARS')),
  color_preferido text,
  notas text,
  vendedor_id uuid references public.perfiles(id),
  estado text not null default 'activo' check (estado in ('activo', 'cumplido', 'cancelado')),
  origen text not null default 'manual' check (origen in ('manual', 'web', 'instagram', 'whatsapp')),
  vehiculo_match_id uuid references public.vehiculos(id),
  vehiculo_cumplido_id uuid references public.vehiculos(id),
  match_detectado_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pedidos_estado_idx on public.pedidos(estado);
create index if not exists pedidos_vendedor_idx on public.pedidos(vendedor_id);

alter table public.pedidos enable row level security;
drop policy if exists "equipo_pedidos" on public.pedidos;
create policy "equipo_pedidos" on public.pedidos for all to authenticated using (true) with check (true);

-- Match: al entrar/actualizarse un auto disponible o reservado, prende en
-- amarillo (frontend) y avisa una sola vez por pedido (match_detectado_at).
create or replace function public.pedidos_detectar_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pedido record;
  v_link text;
  v_encargado record;
begin
  if new.estado not in ('disponible', 'reservado') then
    return new;
  end if;

  for v_pedido in
    select * from public.pedidos
    where estado = 'activo'
      and vehiculo_match_id is null
      and marca ilike new.marca
      and (modelo is null or new.modelo ilike '%' || modelo || '%')
      and (anio_desde is null or new.anio >= anio_desde)
      and (anio_hasta is null or new.anio <= anio_hasta)
      and (presupuesto_max is null or moneda <> new.moneda_venta or new.precio_venta <= presupuesto_max)
  loop
    update public.pedidos
      set vehiculo_match_id = new.id, match_detectado_at = now()
      where id = v_pedido.id;

    v_link := '/panel/pedidos?pedido=' || v_pedido.id;

    if v_pedido.vendedor_id is not null then
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
      values (v_pedido.vendedor_id, 'pedido_match', 'alta', 'Entró un auto para ' || v_pedido.nombre_cliente || ' (' || new.marca || ' ' || new.modelo || ')', v_link);
    else
      for v_encargado in select id from public.perfiles where rol in ('encargado', 'admin') and activo = true loop
        insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
        values (v_encargado.id, 'pedido_match', 'alta', 'Entró un auto para ' || v_pedido.nombre_cliente || ' (' || new.marca || ' ' || new.modelo || ')', v_link);
      end loop;
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_pedidos_detectar_match on public.vehiculos;
create trigger trg_pedidos_detectar_match
  after insert or update of estado, marca, modelo, anio, precio_venta, moneda_venta on public.vehiculos
  for each row execute function public.pedidos_detectar_match();
