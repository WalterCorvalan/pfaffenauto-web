-- Panel v2 — Tesorería completa sobre Expedientes (perspectiva de pago al
-- vendedor + cobro al comprador). 100% aditivo sobre lo que ya existe:
-- ventas, expedientes, expediente_checklist, expediente_documentos,
-- expediente_gastos, cuentas, movimientos_caja.

-- ============================================================
-- 1) Ventas — estado de pago al vendedor (Tesorería) + estado de pago del
-- comprador + gastos cobrados aparte del precio (ya existían
-- extra_cobrado_monto/moneda, se suma el resto).
-- ============================================================
alter table public.ventas
  add column if not exists estado_pago_tesoreria text not null default 'pendiente' check (estado_pago_tesoreria in ('pendiente', 'en_proceso', 'pagado')),
  add column if not exists fecha_pago_vendedor date,
  add column if not exists cuenta_pago_vendedor_id uuid references public.cuentas(id),
  add column if not exists notas_tesoreria text,
  add column if not exists comprador_pago_confirmado boolean not null default false,
  add column if not exists comprador_pago_fecha date,
  add column if not exists comprador_metodo_pago text,
  add column if not exists comprador_cuenta_id uuid references public.cuentas(id),
  add column if not exists extra_cobrado_detalle text,
  add column if not exists extra_cobrado_forma_pago text,
  add column if not exists extra_cobrado_cuenta_id uuid references public.cuentas(id);

-- ============================================================
-- 2) Expedientes — tipo de acuerdo con el propietario (bruto = se descuenta
-- comision_consignacion_pct de ventas al liquidar; neto = precio final tal cual).
-- ============================================================
alter table public.expedientes
  add column if not exists tipo_acuerdo_consignacion text not null default 'bruto' check (tipo_acuerdo_consignacion in ('bruto', 'neto'));

-- ============================================================
-- 3) Checklist — soporta adjuntar archivo por ítem (antes solo tildar), y
-- suma la categoría 'venta' (docs cargados al registrar la venta: DNI y
-- cédula verde de ambas partes).
-- ============================================================
alter table public.expediente_checklist
  add column if not exists archivo_url text;

alter table public.expediente_checklist drop constraint if exists expediente_checklist_parte_check;
alter table public.expediente_checklist add constraint expediente_checklist_parte_check
  check (parte in ('vendedora', 'compradora', 'venta'));

-- Los expedientes ya abiertos no tienen estos 4 ítems — se agregan ahora
-- para los que no los tengan, sin duplicar si ya existieran.
insert into public.expediente_checklist (expediente_id, parte, nombre, orden)
select e.id, 'venta', item.nombre, item.orden
from public.expedientes e
cross join (values ('DNI Frente', 1), ('DNI Dorso', 2), ('Cédula Verde Frente', 3), ('Cédula Verde Dorso', 4)) as item(nombre, orden)
where not exists (
  select 1 from public.expediente_checklist c where c.expediente_id = e.id and c.parte = 'venta'
);

-- Seed de expedientes nuevos: suma los 4 ítems de 'venta' junto a los ya
-- existentes de vendedora/compradora.
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
        (v_expediente_id, 'venta', 'DNI Frente', 1),
        (v_expediente_id, 'venta', 'DNI Dorso', 2),
        (v_expediente_id, 'venta', 'Cédula Verde Frente', 3),
        (v_expediente_id, 'venta', 'Cédula Verde Dorso', 4),
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
    end if;
  end if;
  return new;
end;
$$;

-- ============================================================
-- 4) Documentos del expediente — suma "tipo" para poder filtrar el
-- Duplicado de llaves/manual (y comprobantes de transferencia) sin crear
-- otra tabla.
-- ============================================================
alter table public.expediente_documentos
  add column if not exists tipo text;
