-- /panel/logs mostraba "0 cambios" aunque historial_cambios tiene 103 filas
-- reales (confirmado con service role). RLS está habilitado en esa tabla
-- pero no tiene ninguna política de SELECT — deny por default, ni admin
-- podía leerla desde el panel. Agregamos SELECT para admin/encargado (mismo
-- gate que ya tiene el link en el sidebar).
drop policy if exists "logs_select_admin_encargado" on historial_cambios;
create policy "logs_select_admin_encargado" on historial_cambios for select to authenticated
using (
  exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin', 'encargado'))
);
