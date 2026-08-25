-- vehiculo_proveedores guarda DNI/CUIT/domicilio de quien nos vendió el auto.
-- vehiculos y vehiculo_titulares ya están bloqueados a admin/encargado (UI:
-- puedeGestionar en Gestión de Stock); esta tabla quedó afuera, cualquier
-- vendedor podía escribir/pisar esos datos de un auto que ni gestiona.
drop policy if exists "restringir_admin_encargado" on vehiculo_proveedores;
create policy "restringir_admin_encargado" on vehiculo_proveedores as restrictive for all to authenticated
using (exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin', 'encargado')))
with check (exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('admin', 'encargado')));
