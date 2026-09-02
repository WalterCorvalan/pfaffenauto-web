-- Panel v2 — Cobros: vista de las cuotas que la agencia cobra a sus
-- clientes (reusa cuotas_cobrar_clientes, ya creada por Finanzas). Suma
-- solo lo que faltaba: saber de qué vendedor es cada cuota, para que un
-- vendedor solo pueda ver/marcar las suyas (admin/finanzas ven todas).

alter table public.cuotas_cobrar_clientes
  add column if not exists vendedor_id uuid references public.perfiles(id);

-- Si la cuota está vinculada a una venta, el vendedor se deriva de ahí
-- automáticamente (así no hay que asignarlo a mano en el caso más común).
create or replace function public.sync_cuota_cobrar_vendedor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.venta_id is not null and new.vendedor_id is null then
    select vendedor_id into new.vendedor_id from public.ventas where id = new.venta_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_cuota_cobrar_vendedor on public.cuotas_cobrar_clientes;
create trigger trg_sync_cuota_cobrar_vendedor
  before insert or update of venta_id on public.cuotas_cobrar_clientes
  for each row execute function public.sync_cuota_cobrar_vendedor();

-- Backfill de lo que ya existía.
update public.cuotas_cobrar_clientes c
set vendedor_id = v.vendedor_id
from public.ventas v
where c.venta_id = v.id and c.vendedor_id is null;
