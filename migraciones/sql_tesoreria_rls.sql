-- Módulo de Tesorería — fase 2: acceso por rol para movimientos_caja.
--
-- Hoy (sql_rls_critico_financiero.sql) movimientos_caja es restrictive "solo
-- admin/encargado" para TODO (select/insert/update/delete) — correcto para
-- gastos/sueldos, pero bloquea lo que este módulo necesita: que un vendedor
-- cargue el pago de SU seña/venta, y que gestoría pueda ver y aprobar.
--
-- Reemplaza esa política SOLO para movimientos_caja (las otras 9 tablas de
-- sql_rls_critico_financiero.sql no se tocan) por 4 políticas separadas:
--   SELECT: admin/encargado/gestoría ven todo: vendedor solo lo suyo.
--   INSERT: admin/encargado sin restricción: vendedor solo si es dueño
--           (vendedor_id = uid) Y es un movimiento de operación (Seña/Pago
--           Venta/Pago Financiación) — no puede cargar un "Gasto" suelto.
--   UPDATE: admin/encargado/gestoría (aprobar, corregir) — vendedor no edita
--           después de cargado.
--   DELETE: admin/encargado únicamente (igual que antes).

drop policy if exists "restringir_solo_admin_encargado" on movimientos_caja;

create policy "movimientos_caja_select" on movimientos_caja as restrictive for select to authenticated
using (
  exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin', 'encargado', 'gestoria'))
  or vendedor_id = auth.uid()
);

create policy "movimientos_caja_insert" on movimientos_caja as restrictive for insert to authenticated
with check (
  exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin', 'encargado'))
  or (
    vendedor_id = auth.uid()
    and tipo_movimiento in ('Seña', 'Pago Venta', 'Pago Financiación')
  )
);

create policy "movimientos_caja_update" on movimientos_caja as restrictive for update to authenticated
using (
  exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin', 'encargado', 'gestoria'))
)
with check (
  exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin', 'encargado', 'gestoria'))
);

create policy "movimientos_caja_delete" on movimientos_caja as restrictive for delete to authenticated
using (
  exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin', 'encargado'))
);

-- Regla clave del documento: "el comprobante es obligatorio antes de
-- aprobar". No alcanza con pedirlo en la UI — se hace cumplir acá, y de paso
-- se auto-completa quién aprobó y cuándo (no confiamos en lo que mande el
-- cliente para esos dos campos).
create or replace function public.proteger_aprobacion_movimiento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.aprobado = true and old.aprobado = false then
    if new.comprobante_url is null or btrim(new.comprobante_url) = '' then
      raise exception 'No se puede aprobar un movimiento sin comprobante adjunto.';
    end if;
    new.aprobado_por := auth.uid();
    new.aprobado_at := now();
  end if;

  -- Si se desaprueba (raro, pero por consistencia), limpiamos el rastro.
  if new.aprobado = false and old.aprobado = true then
    new.aprobado_por := null;
    new.aprobado_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_proteger_aprobacion_movimiento on movimientos_caja;
create trigger trg_proteger_aprobacion_movimiento
  before update on movimientos_caja
  for each row
  execute function public.proteger_aprobacion_movimiento();
