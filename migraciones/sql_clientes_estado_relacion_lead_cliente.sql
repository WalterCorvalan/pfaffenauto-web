-- Corrige el modelo lead/cliente: hoy "clientes" nace desde el primer
-- contacto (WhatsApp/Instagram/Rodi insertan una fila apenas entra alguien,
-- ver ChatClient.tsx) y "pipeline_stage = cerrado" se puede arrastrar a mano
-- en el Kanban sin que exista una venta real detrás -- no hay ninguna
-- columna que diga con certeza "esto es un cliente real, compró".
--
-- estado_relacion es la fuente de verdad, separada del pipeline_stage
-- (que sigue siendo la posición en el embudo comercial, puede moverse a
-- mano). Nace en 'lead' siempre. Pasa a 'cliente' SOLO automáticamente,
-- vía trigger, cuando existe una venta real cerrada -- nunca a mano desde
-- el Kanban.

alter table public.clientes add column if not exists estado_relacion text not null default 'lead';
alter table public.clientes drop constraint if exists clientes_estado_relacion_check;
alter table public.clientes add constraint clientes_estado_relacion_check check (estado_relacion in ('lead', 'cliente'));

-- Backfill: todo el que ya tiene una venta cerrada real es cliente ya.
update public.clientes
set estado_relacion = 'cliente'
where id in (select cliente_id from public.ventas where estado = 'cerrada' and cliente_id is not null);

create or replace function public.promover_lead_a_cliente()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado = 'cerrada' and new.cliente_id is not null then
    update public.clientes set estado_relacion = 'cliente' where id = new.cliente_id and estado_relacion <> 'cliente';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_promover_lead_a_cliente on public.ventas;
create trigger trg_promover_lead_a_cliente
after insert or update of estado, cliente_id on public.ventas
for each row
execute function public.promover_lead_a_cliente();
