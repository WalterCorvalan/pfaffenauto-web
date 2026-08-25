-- CRÍTICO (2026-08-25): probado con vendedor de prueba. Pudo insertar
-- directo (sin pasar por ninguna pantalla, solo con su sesión normal):
--   - movimientos_caja (egreso falso de $50.000)
--   - cuentas (una cuenta bancaria nueva)
--   - sueldos (un sueldo de $5.000.000 a su nombre)
-- Estas tablas viven bajo "Administración" en el panel, con acceso a la UI
-- restringido a admin/encargado — pero eso es solo ocultar el botón, la API
-- de Supabase queda abierta igual. Mismo patrón de bug que ya arreglamos:
-- la protección real tiene que estar en RLS, no en qué se muestra en pantalla.

do $$
declare
  t text;
begin
  foreach t in array array[
    'movimientos_caja', 'cuentas', 'sueldos', 'liquidaciones_sueldo',
    'categorias_empleado', 'financiaciones', 'patentes',
    'transferencias_patentamientos', 'repuestos_reparaciones', 'gastos_varios'
  ]
  loop
    execute format('drop policy if exists "restringir_solo_admin_encargado" on %I', t);
    execute format(
      'create policy "restringir_solo_admin_encargado" on %I as restrictive for all to authenticated ' ||
      'using (exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in (''admin'', ''encargado''))) ' ||
      'with check (exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in (''admin'', ''encargado'')))',
      t
    );
  end loop;
end $$;
