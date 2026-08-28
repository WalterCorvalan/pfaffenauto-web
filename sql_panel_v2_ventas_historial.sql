-- Panel v2 — historial de estados de venta, para el detalle ("Historial de
-- estados" del modal calcado de v1). Se loguea solo con un trigger, no
-- depende de que el frontend lo inserte a mano.

create table if not exists public.venta_estado_historial (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas(id) on delete cascade,
  estado text not null,
  autor_id uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create index if not exists venta_estado_historial_venta_idx on public.venta_estado_historial(venta_id, created_at);

alter table public.venta_estado_historial enable row level security;
drop policy if exists "ver_venta_estado_historial" on public.venta_estado_historial;
create policy "ver_venta_estado_historial" on public.venta_estado_historial for select to authenticated using (true);

create or replace function public.log_venta_estado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.estado is distinct from old.estado then
    insert into public.venta_estado_historial (venta_id, estado, autor_id)
    values (new.id, new.estado, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists trg_log_venta_estado on public.ventas;
create trigger trg_log_venta_estado
  after insert or update of estado on public.ventas
  for each row execute function public.log_venta_estado();
