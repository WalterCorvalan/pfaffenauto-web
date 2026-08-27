-- Caja de Gestoría (spec punto 4): reusa movimientos_caja (una sola fuente
-- de verdad de plata, como Seña/Venta/Financiación/Compra) en vez de armar
-- un libro contable paralelo. Se agregan 3 columnas específicas de gestoría.

alter table public.movimientos_caja add column if not exists tramite_id uuid references public.tramites_gestoria(id) on delete set null;
alter table public.movimientos_caja add column if not exists concepto text;
alter table public.movimientos_caja add column if not exists medio_pago text;

alter table public.movimientos_caja drop constraint if exists movimientos_caja_concepto_check;
alter table public.movimientos_caja add constraint movimientos_caja_concepto_check
  check (concepto is null or concepto in ('Honorarios', 'Patente', 'Infracción', 'Transferencia', 'Gasto extra', 'Otro'));

alter table public.movimientos_caja drop constraint if exists movimientos_caja_medio_pago_check;
alter table public.movimientos_caja add constraint movimientos_caja_medio_pago_check
  check (medio_pago is null or medio_pago in ('Efectivo', 'Transferencia', 'Depósito', 'Tarjeta', 'Pendiente'));

create index if not exists movimientos_caja_tramite_id_idx on public.movimientos_caja(tramite_id);

-- La policy de insert (sql_tesoreria_rls.sql) solo dejaba entrar a
-- admin/encargado o al vendedor dueño de una Seña/Venta/Financiación —
-- gestoría no podía cargar sus propios movimientos. Se agrega su rama.
drop policy if exists "movimientos_caja_insert" on public.movimientos_caja;
create policy "movimientos_caja_insert" on public.movimientos_caja as restrictive for insert to authenticated
with check (
  exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin', 'encargado'))
  or (
    vendedor_id = auth.uid()
    and tipo_movimiento in ('Seña', 'Pago Venta', 'Pago Financiación')
  )
  or (
    exists (select 1 from perfiles p where p.id = auth.uid() and p.rol = 'gestoria')
    and tramite_id is not null
  )
);
