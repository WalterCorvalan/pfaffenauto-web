-- Panel v2 — Gestoría (tablero de trámites de transferencia). Aditivo sobre
-- sql_panel_v2_expedientes.sql y sql_panel_v2_expedientes_resumen.sql.

-- Vencimiento del trámite (lo carga gestoría a mano; sin fecha no cuenta
-- para "vencidos"/"vencen 7 días" en el frontend) y el título del automotor
-- ya transferido — mismo campo que exige Liquidaciones para cerrar el cobro.
alter table public.expedientes
  add column if not exists vencimiento date,
  add column if not exists titulo_transferido_url text,
  add column if not exists pedido_atencion_sector text,
  add column if not exists pedido_atencion_mensaje text,
  add column if not exists pedido_atencion_en timestamptz;

create index if not exists expedientes_vencimiento_idx on public.expedientes(vencimiento);

drop policy if exists "borrar_expedientes" on public.expedientes;
create policy "borrar_expedientes" on public.expedientes for delete to authenticated
  using (exists (select 1 from public.perfiles p where p.id = auth.uid() and 'admin' = any(p.roles)));

-- Los hitos ya existían (4, sembrados al abrir expediente) pero con nombres
-- provisorios de antes de tener el manual de Gestoría. Corrijo al vocabulario
-- real sin tocar el flag `completado` de lo que ya esté tildado.
update public.expediente_hitos set nombre = 'Documentación firmada / entregada' where orden = 1;
update public.expediente_hitos set nombre = 'Duplicado entregado' where orden = 2;
update public.expediente_hitos set nombre = 'Trámites gestoría completo' where orden = 3;
update public.expediente_hitos set nombre = 'Trámite finalizado' where orden = 4;

-- Checklist de documentación por parte — ítems fijos (no archivos subidos,
-- eso ya lo cubre expediente_documentos): la card de Gestoría solo necesita
-- tildar "llegó o no llegó" para saber qué falta.
create table if not exists public.expediente_checklist (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid not null references public.expedientes(id) on delete cascade,
  parte text not null check (parte in ('vendedora', 'compradora')),
  nombre text not null,
  orden int not null,
  completado boolean not null default false,
  completado_en timestamptz,
  completado_por uuid references public.perfiles(id)
);

create index if not exists expediente_checklist_expediente_idx on public.expediente_checklist(expediente_id, parte, orden);

alter table public.expediente_checklist enable row level security;
drop policy if exists "equipo_expediente_checklist" on public.expediente_checklist;
create policy "equipo_expediente_checklist" on public.expediente_checklist for all to authenticated using (true) with check (true);

create or replace function public.expediente_checklist_tildar(p_item_id uuid, p_completado boolean)
returns void
language sql
security definer
set search_path = public
as $$
  update public.expediente_checklist
  set completado = p_completado,
      completado_en = case when p_completado then now() else null end,
      completado_por = case when p_completado then auth.uid() else null end
  where id = p_item_id;
$$;

-- Seed de hitos + checklist al abrir el expediente (reemplaza la función
-- que sembraba solo hitos).
create or replace function public.abrir_expediente_al_cerrar_venta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expediente_id uuid;
begin
  if new.estado = 'cerrada'
     and (tg_op = 'INSERT' or old.estado is distinct from 'cerrada')
     and new.abre_expediente = true then
    insert into public.expedientes (venta_id, tipo, estado, gestor_asignado_id, creado_por, fecha_apertura)
    values (new.id, 'venta', 'abierto', new.gestor_asignado_id, new.vendedor_id, current_date)
    on conflict (venta_id) do nothing
    returning id into v_expediente_id;

    if v_expediente_id is not null then
      insert into public.expediente_hitos (expediente_id, nombre, orden)
      values
        (v_expediente_id, 'Documentación firmada / entregada', 1),
        (v_expediente_id, 'Duplicado entregado', 2),
        (v_expediente_id, 'Trámites gestoría completo', 3),
        (v_expediente_id, 'Trámite finalizado', 4);

      insert into public.expediente_checklist (expediente_id, parte, nombre, orden)
      values
        (v_expediente_id, 'vendedora', 'DNI Frente', 1),
        (v_expediente_id, 'vendedora', 'DNI Dorso', 2),
        (v_expediente_id, 'vendedora', 'Cédula verde / azul', 3),
        (v_expediente_id, 'vendedora', '08 firmado', 4),
        (v_expediente_id, 'vendedora', 'Verificación policial', 5),
        (v_expediente_id, 'vendedora', 'Libre deuda', 6),
        (v_expediente_id, 'compradora', 'DNI Frente', 1),
        (v_expediente_id, 'compradora', 'DNI Dorso', 2),
        (v_expediente_id, 'compradora', 'Domicilio', 3),
        (v_expediente_id, 'compradora', 'Boleto / recibo', 4);

      if new.gestor_asignado_id is not null then
        insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
        values (new.gestor_asignado_id, 'expediente_nuevo', 'media', 'Nuevo expediente para gestionar', '/panel-v2/expedientes?expediente=' || v_expediente_id);
      end if;
    end if;
  end if;

  return new;
end;
$$;

-- Confirmación de partes — desbloquea el expediente para Gestoría/Tesorería.
-- Separadas (comprador / consignación) porque cada una la da un sector
-- distinto y ambas tienen que estar OK antes de liberar la operación.
create or replace function public.expediente_confirmar_comprador(p_expediente_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.expedientes
  set confirmado_comprador = true, confirmado_comprador_en = now(), confirmado_comprador_por = auth.uid(), updated_at = now()
  where id = p_expediente_id;
$$;

create or replace function public.expediente_confirmar_consignacion(p_expediente_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.expedientes
  set confirmado_consignacion = true, confirmado_consignacion_en = now(), confirmado_consignacion_por = auth.uid(), updated_at = now()
  where id = p_expediente_id;
$$;

-- Pedido de atención — mismo patrón que Reclamos: una observación tipo
-- 'pedido_atencion' deja marcado el expediente como bloqueado-pendiente y
-- avisa a todo el sector elegido; cualquier otra observación lo despeja.
alter table public.expediente_observaciones
  add column if not exists tipo text not null default 'observacion' check (tipo in ('observacion', 'pedido_atencion')),
  add column if not exists sector text;

create or replace function public.expediente_registrar_observacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_persona record;
  v_link text;
begin
  v_link := '/panel-v2/expedientes?expediente=' || new.expediente_id;

  if new.tipo = 'pedido_atencion' then
    update public.expedientes
    set pedido_atencion_sector = new.sector, pedido_atencion_mensaje = new.texto, pedido_atencion_en = now(), updated_at = now()
    where id = new.expediente_id;

    for v_persona in select id from public.perfiles where new.sector = any(roles) and activo = true loop
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, mensaje, link)
      values (v_persona.id, 'expediente_pedido_atencion', 'alta', 'Te piden atención en un expediente', new.texto, v_link);
    end loop;
  else
    update public.expedientes
    set pedido_atencion_sector = null, pedido_atencion_mensaje = null, pedido_atencion_en = null, updated_at = now()
    where id = new.expediente_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_expediente_observacion on public.expediente_observaciones;
create trigger trg_expediente_observacion
  after insert on public.expediente_observaciones
  for each row execute function public.expediente_registrar_observacion();
