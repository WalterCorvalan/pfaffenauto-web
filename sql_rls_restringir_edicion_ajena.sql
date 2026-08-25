-- Auditoría de RLS (2026-08-25): probado con un vendedor de prueba sin
-- relación a los registros, y pudo (1) cambiar el estado de una cotización
-- ajena, (2) reasignarse a sí mismo una cotización ajena (robo de lead),
-- (3) cambiar el estado de una seña ajena, (4) cambiar la etapa de
-- seguimiento de una venta ajena. Las políticas existentes de estas tablas
-- son permisivas para "authenticated" sin chequear ownership.
--
-- Postgres combina políticas permisivas con OR, así que agregar otra
-- permisiva no arregla nada. Usamos políticas RESTRICTIVE (AND con todas las
-- permisivas existentes) para no tener que tocar/adivinar las políticas que
-- ya están — solo le suman un candado extra encima.
--
-- Regla: puede escribir quien es dueño del registro (vendedor_id = uid()),
-- quien tiene rol admin/encargado, o si el registro todavía no tiene
-- vendedor asignado (lead sin tomar, cualquiera del staff puede tomarlo) —
-- calca la condición "puedeEditar" que ya usa la UI en LeadDetailClient.tsx.

do $$
declare
  t text;
begin
  foreach t in array array['cotizaciones', 'senas', 'boletos_venta']
  loop
    execute format('drop policy if exists "restringir_escritura_ajena" on %I', t);
    execute format(
      'create policy "restringir_escritura_ajena" on %I as restrictive for all to authenticated ' ||
      'using (' ||
      '  vendedor_id is null' ||
      '  or vendedor_id = auth.uid()' ||
      '  or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in (''admin'', ''encargado''))' ||
      ') ' ||
      'with check (' ||
      '  vendedor_id is null' ||
      '  or vendedor_id = auth.uid()' ||
      '  or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in (''admin'', ''encargado''))' ||
      ')',
      t
    );
  end loop;
end $$;
