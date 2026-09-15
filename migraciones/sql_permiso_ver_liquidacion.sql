-- Primer permiso real conectado al mecanismo central (lib/panel/permisos.ts
-- → tienePermiso()) -- antes Configuración → Permisos (PermisosTab.tsx)
-- guardaba filas en permisos_definiciones/rol_permisos/usuario_permisos
-- pero nada las leía. Este es el piloto: "Ver liquidación" (margen/ganancia
-- de Expedientes, Gestoría, Liquidaciones, Tesorería → Expedientes), que
-- antes era un chequeo hardcodeado idéntico repetido en esos 4 page.tsx
-- (`["admin", "finanzas", "gestoria"].includes(rol)`).
--
-- Correr este SQL una sola vez en el editor SQL de Supabase.

insert into public.permisos_definiciones (clave, nombre, descripcion, categoria)
values ('ver_liquidacion', 'Ver liquidación', 'Ver el margen/ganancia de la agencia en Expedientes, Gestoría, Liquidaciones y Tesorería → Expedientes.', 'Finanzas')
on conflict (clave) do nothing;

-- Mismo default que tenía hardcodeado el código (admin ya siempre tiene
-- todos los permisos vía tienePermiso(), no hace falta una fila para él acá).
insert into public.rol_permisos (rol, permiso_clave, otorgado)
values
  ('finanzas', 'ver_liquidacion', true),
  ('gestoria', 'ver_liquidacion', true)
on conflict (rol, permiso_clave) do update set otorgado = true;
