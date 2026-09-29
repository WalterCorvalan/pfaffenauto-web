-- Etapas reales del proceso de taller (ver diagrama "PROCESOS" del usuario,
-- 29/9). Reemplaza el estado viejo (ingresado/presupuestado/aprobado/
-- en_proceso/cerrada -- nunca llegó a usarse en ningún tablero real) por la
-- secuencia física: ingreso_unidad -> checklist_reparaciones -> lavadero ->
-- mecanico -> gomeria -> chapa_pintura -> tapiceria -> detail -> preventa ->
-- proceso_venta -> pre_entrega -> entrega.
--
-- Gestoría corre en PARALELO a esa secuencia (no es una etapa más de la
-- fila) -- se trackea aparte con gestoria_lista, y hace falta tenerla en
-- true para pasar a "entrega" (se valida en el código, no acá).
--
-- Correr una vez en el SQL editor de Supabase y borrar este archivo del
-- repo después (mismo criterio que el resto de migraciones/*.sql).

alter table public.taller_ordenes drop constraint if exists taller_ordenes_estado_check;

alter table public.taller_ordenes add constraint taller_ordenes_estado_check check (
  estado in (
    'ingreso_unidad', 'checklist_reparaciones', 'lavadero', 'mecanico', 'gomeria',
    'chapa_pintura', 'tapiceria', 'detail', 'preventa', 'proceso_venta',
    'pre_entrega', 'entrega'
  )
);

alter table public.taller_ordenes alter column estado set default 'ingreso_unidad';

-- Vuelca cualquier OT vieja que haya quedado con un valor del enum anterior
-- (o null, porque NuevaOtModal.tsx nunca mandó estado) al arranque de la
-- secuencia nueva -- no hay forma de saber en qué etapa real estaban.
update public.taller_ordenes
set estado = 'ingreso_unidad'
where estado is null or estado not in (
  'ingreso_unidad', 'checklist_reparaciones', 'lavadero', 'mecanico', 'gomeria',
  'chapa_pintura', 'tapiceria', 'detail', 'preventa', 'proceso_venta',
  'pre_entrega', 'entrega'
);

alter table public.taller_ordenes add column if not exists gestoria_lista boolean not null default false;
