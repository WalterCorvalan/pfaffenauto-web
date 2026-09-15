-- Papelera: borrado lógico para ventas, expedientes y clientes (y
-- taller_ordenes, para cuando ese módulo tenga su propio flujo de
-- eliminar -- hoy no lo tiene, se deja la columna lista igual).
--
-- El resto del panel NO cambia una sola línea: se agrega el filtro acá,
-- en las políticas RLS de lectura, así todo lo que ya consulta estas
-- tablas (Ventas, Finanzas, Reportes, dropdowns, etc.) deja de ver
-- automáticamente lo "eliminado" sin que haya que auditar cada query.
--
-- Correr una sola vez en el editor SQL de Supabase (proyecto v2/nova).

alter table public.ventas add column if not exists deleted_at timestamptz;
alter table public.ventas add column if not exists deleted_by uuid;
alter table public.ventas add column if not exists motivo_eliminacion text;

alter table public.expedientes add column if not exists deleted_at timestamptz;
alter table public.expedientes add column if not exists deleted_by uuid;
alter table public.expedientes add column if not exists motivo_eliminacion text;

alter table public.clientes add column if not exists deleted_at timestamptz;
alter table public.clientes add column if not exists deleted_by uuid;
alter table public.clientes add column if not exists motivo_eliminacion text;

alter table public.taller_ordenes add column if not exists deleted_at timestamptz;
alter table public.taller_ordenes add column if not exists deleted_by uuid;
alter table public.taller_ordenes add column if not exists motivo_eliminacion text;

create index if not exists idx_ventas_deleted_at on public.ventas (deleted_at) where deleted_at is not null;
create index if not exists idx_expedientes_deleted_at on public.expedientes (deleted_at) where deleted_at is not null;
create index if not exists idx_clientes_deleted_at on public.clientes (deleted_at) where deleted_at is not null;
create index if not exists idx_taller_ordenes_deleted_at on public.taller_ordenes (deleted_at) where deleted_at is not null;

-- ── ver_ventas: mismo criterio que ya tenía (todos ven todas), + ocultar borradas ──
drop policy if exists ver_ventas on public.ventas;
create policy ver_ventas on public.ventas for select to authenticated
using (deleted_at is null);

-- ── ver_clientes: mismo criterio de "cada vendedor ve solo sus clientes" que ya tenía, + ocultar borrados ──
drop policy if exists ver_clientes on public.clientes;
create policy ver_clientes on public.clientes for select to authenticated
using (
  (
    (not (exists (select 1 from configuracion_empresa where (configuracion_empresa.id = true) and (configuracion_empresa.cada_vendedor_ve_solo_sus_clientes = true))))
    or (exists (select 1 from perfiles p where (p.id = auth.uid()) and (('admin' = any(p.roles)) or ('recepcion' = any(p.roles)))))
    or (vendedor_id = auth.uid())
  )
  and deleted_at is null
);

-- ── ver_expedientes: mismo criterio de filtro por gestoría que ya tenía, + ocultar borrados ──
drop policy if exists ver_expedientes on public.expedientes;
create policy ver_expedientes on public.expedientes for select to authenticated
using (
  (
    (gestor_asignado_id is null)
    or (gestor_asignado_id = auth.uid())
    or (not (exists (select 1 from perfiles p where (p.id = auth.uid()) and ('gestoria' = any(p.roles)) and (not ('admin' = any(p.roles))))))
  )
  and deleted_at is null
);

-- taller_ordenes: mismo criterio (ver_ordenes ya era "true"), + ocultar borradas.
drop policy if exists ver_ordenes on public.taller_ordenes;
create policy ver_ordenes on public.taller_ordenes for select to authenticated
using (deleted_at is null);
