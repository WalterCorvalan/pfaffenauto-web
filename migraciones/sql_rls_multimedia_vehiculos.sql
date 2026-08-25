-- Cualquier vendedor podía borrar fotos de un auto que no gestiona. La app
-- ya tiene un sistema de permisos granular (tiene_permiso RPC, ver
-- /panel/usuarios > Permisos) — usamos esa misma función en vez de un rol
-- fijo, para no romper si algún local le da vehiculos.editar_completo a un
-- vendedor puntual.
drop policy if exists "restringir_editar_completo" on multimedia_vehiculos;
create policy "restringir_editar_completo" on multimedia_vehiculos as restrictive for all to authenticated
using (public.tiene_permiso(auth.uid(), 'vehiculos.editar_completo'))
with check (public.tiene_permiso(auth.uid(), 'vehiculos.editar_completo'));
