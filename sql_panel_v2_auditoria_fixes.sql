-- Panel v2 — fixes de la auditoría de esquema (choques/duplicados detectados
-- leyendo el dump completo). Todo aditivo/correctivo, no borra datos.

-- ============================================================
-- 1) vehiculos.mandato_id <-> mandatos.vehiculo_id: dos caminos para el
-- mismo vínculo podían desincronizarse. En vez de elegir uno y romper
-- código existente que ya use cualquiera de los dos, los mantenemos
-- sincronizados solos con triggers en ambos sentidos.
-- ============================================================
create or replace function public.sync_vehiculo_mandato_desde_vehiculo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.mandato_id is distinct from old.mandato_id and new.mandato_id is not null then
    update public.mandatos set vehiculo_id = new.id where id = new.mandato_id and vehiculo_id is distinct from new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_vehiculo_mandato_desde_vehiculo on public.vehiculos;
create trigger trg_sync_vehiculo_mandato_desde_vehiculo
  after update of mandato_id on public.vehiculos
  for each row execute function public.sync_vehiculo_mandato_desde_vehiculo();

create or replace function public.sync_vehiculo_mandato_desde_mandato()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.vehiculo_id is distinct from old.vehiculo_id and new.vehiculo_id is not null then
    update public.vehiculos set mandato_id = new.id where id = new.vehiculo_id and mandato_id is distinct from new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_vehiculo_mandato_desde_mandato on public.mandatos;
create trigger trg_sync_vehiculo_mandato_desde_mandato
  after update of vehiculo_id on public.mandatos
  for each row execute function public.sync_vehiculo_mandato_desde_mandato();

-- ============================================================
-- 2) whatsapp_conversaciones.estado_pipeline era texto libre sin relación
-- con clientes.pipeline_stage (vocabularios distintos). Lo alineamos al
-- mismo enum y lo empujamos a clientes cuando hay cliente_id vinculado
-- (respetando pipeline_stage_manual: si el vendedor lo tocó a mano, el
-- bot no lo pisa).
-- ============================================================
alter table public.whatsapp_conversaciones drop constraint if exists whatsapp_conversaciones_estado_pipeline_check;
alter table public.whatsapp_conversaciones add constraint whatsapp_conversaciones_estado_pipeline_check
  check (estado_pipeline is null or estado_pipeline in ('sin_contactar', 'contactado', 'visita', 'negociacion', 'cerrado', 'perdido'));

create or replace function public.sync_pipeline_desde_whatsapp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado_pipeline is not null and new.cliente_id is not null
     and new.estado_pipeline is distinct from old.estado_pipeline then
    update public.clientes
    set pipeline_stage = new.estado_pipeline, updated_at = now()
    where id = new.cliente_id and pipeline_stage_manual = false;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_pipeline_desde_whatsapp on public.whatsapp_conversaciones;
create trigger trg_sync_pipeline_desde_whatsapp
  after update of estado_pipeline on public.whatsapp_conversaciones
  for each row execute function public.sync_pipeline_desde_whatsapp();

-- ============================================================
-- 3) expedientes.gestor_asignado_id se copiaba una sola vez desde
-- ventas.gestor_asignado_id al abrir el expediente y después podía
-- desincronizarse. Lo mantenemos sincronizado mientras el expediente
-- siga abierto (no lo tocamos si ya está cerrado/archivado).
-- ============================================================
create or replace function public.sync_gestor_expediente_desde_venta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.gestor_asignado_id is distinct from old.gestor_asignado_id then
    update public.expedientes
    set gestor_asignado_id = new.gestor_asignado_id, updated_at = now()
    where venta_id = new.id and archivado = false;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_gestor_expediente on public.ventas;
create trigger trg_sync_gestor_expediente
  after update of gestor_asignado_id on public.ventas
  for each row execute function public.sync_gestor_expediente_desde_venta();

-- ============================================================
-- 4) FKs a vehiculos sin ON DELETE (default NO ACTION) bloquean el borrado
-- de un vehículo apenas tiene un pedido/chat/orden de taller enganchado.
-- Vínculos "blandos" (sugerencias, chats, taller) -> SET NULL. Vínculos que
-- son historial real de una operación (ventas, permutas, mandatos,
-- peritajes) se dejan bloqueando el borrado a propósito: no tiene sentido
-- poder borrar un auto que ya se vendió o tiene papeles asociados.
-- ============================================================
alter table public.pedidos drop constraint if exists pedidos_vehiculo_match_id_fkey;
alter table public.pedidos add constraint pedidos_vehiculo_match_id_fkey
  foreign key (vehiculo_match_id) references public.vehiculos(id) on delete set null;

alter table public.pedidos drop constraint if exists pedidos_vehiculo_cumplido_id_fkey;
alter table public.pedidos add constraint pedidos_vehiculo_cumplido_id_fkey
  foreign key (vehiculo_cumplido_id) references public.vehiculos(id) on delete set null;

alter table public.pedidos_busqueda drop constraint if exists pedidos_busqueda_vehiculo_match_id_fkey;
alter table public.pedidos_busqueda add constraint pedidos_busqueda_vehiculo_match_id_fkey
  foreign key (vehiculo_match_id) references public.vehiculos(id) on delete set null;

alter table public.pedidos_busqueda drop constraint if exists pedidos_busqueda_vehiculo_cumplido_id_fkey;
alter table public.pedidos_busqueda add constraint pedidos_busqueda_vehiculo_cumplido_id_fkey
  foreign key (vehiculo_cumplido_id) references public.vehiculos(id) on delete set null;

alter table public.whatsapp_conversaciones drop constraint if exists whatsapp_conversaciones_vehiculo_id_fkey;
alter table public.whatsapp_conversaciones add constraint whatsapp_conversaciones_vehiculo_id_fkey
  foreign key (vehiculo_id) references public.vehiculos(id) on delete set null;

alter table public.taller_ordenes drop constraint if exists taller_ordenes_vehiculo_id_fkey;
alter table public.taller_ordenes add constraint taller_ordenes_vehiculo_id_fkey
  foreign key (vehiculo_id) references public.vehiculos(id) on delete set null;

-- ============================================================
-- 5) venta_cuotas no distinguía "anulada por operación caída" de
-- "pendiente" normal — marcar_operacion_caida() las dejaba en pendiente
-- por las dudas. Sumamos el estado y corregimos la función para usarlo.
-- ============================================================
alter table public.venta_cuotas drop constraint if exists venta_cuotas_estado_check;
alter table public.venta_cuotas add constraint venta_cuotas_estado_check
  check (estado in ('pendiente', 'pagada', 'anulada'));

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

  update public.venta_cuotas set estado = 'anulada'
  where venta_id = p_venta_id and estado = 'pendiente';

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
