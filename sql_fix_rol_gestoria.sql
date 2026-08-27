-- El constraint de perfiles.rol nunca se actualizó cuando se agregó el rol
-- "gestoria" a la app (RLS, sidebar, notificarGestoria, etc. ya lo asumían
-- válido) — bloqueaba crear cualquier usuario con ese rol a nivel DB.
alter table public.perfiles drop constraint if exists perfiles_rol_check;
alter table public.perfiles add constraint perfiles_rol_check
  check (rol in ('admin', 'encargado', 'vendedor', 'taller', 'gestoria'));
