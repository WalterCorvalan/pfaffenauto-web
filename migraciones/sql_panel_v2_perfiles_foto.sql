-- Foto de perfil (avatar) -- se muestra en el sitio público (presupuesto,
-- seguimiento, ficha del auto en el catálogo) junto al nombre del vendedor
-- asignado, y se edita desde Mi Espacio → Mi Perfil.

alter table perfiles
  add column if not exists foto_url text;

comment on column perfiles.foto_url is
  'URL pública de la foto de perfil (R2). Si es null, se muestran las iniciales del nombre.';
