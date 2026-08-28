-- Panel v2 — Expedientes, pestaña Resumen (lista + detalle). Aditivo sobre
-- sql_panel_v2_expedientes.sql.

alter table public.expedientes
  add column if not exists titulo text,
  add column if not exists fecha_apertura date,
  add column if not exists prioridad text not null default 'Media' check (prioridad in ('Baja', 'Media', 'Alta')),
  add column if not exists confirmado_comprador boolean not null default false,
  add column if not exists confirmado_comprador_en timestamptz,
  add column if not exists confirmado_comprador_por uuid references public.perfiles(id),
  add column if not exists confirmado_consignacion boolean not null default false,
  add column if not exists confirmado_consignacion_en timestamptz,
  add column if not exists confirmado_consignacion_por uuid references public.perfiles(id),
  add column if not exists precio_propietario numeric,
  add column if not exists precio_propietario_moneda text default 'USD' check (precio_propietario_moneda in ('USD', 'ARS'));

update public.expedientes set fecha_apertura = created_at::date where fecha_apertura is null;

alter table public.expediente_documentos
  add column if not exists parte text not null default 'general' check (parte in ('vendedor', 'comprador', 'general'));

-- Seed de hitos: eran 5, el diseño real usa 4 (Datos de las partes, Boleto,
-- Documentación, Transferencia finalizada) — ajusto la función y borro el
-- 5to hito ("Transferencia iniciada") de los expedientes que ya lo tenían
-- sembrado, sin tocar los que el usuario ya haya completado/tildado.
delete from public.expediente_hitos where nombre = 'Transferencia iniciada' and completado = false;
update public.expediente_hitos set orden = 4 where nombre = 'Transferencia finalizada';

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
        (v_expediente_id, 'Datos de las partes cargados', 1),
        (v_expediente_id, 'Boleto generado', 2),
        (v_expediente_id, 'Documentación completa', 3),
        (v_expediente_id, 'Transferencia finalizada', 4);

      if new.gestor_asignado_id is not null then
        insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
        values (new.gestor_asignado_id, 'expediente_nuevo', 'media', 'Nuevo expediente para gestionar', '/panel-v2/expedientes?expediente=' || v_expediente_id);
      end if;
    end if;
  end if;

  return new;
end;
$$;
