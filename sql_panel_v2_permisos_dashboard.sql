-- Dashboard ahora solo lo ven admin y finanzas -- el resto de los
-- sectores lo pierden (el login los reenvía solo al primer módulo que sí
-- tengan habilitado, ver useEffect nuevo en app/panel-v2/layout.tsx).
insert into public.visibilidad_sector (modulo, sector, visible) values
  ('dashboard', 'ventas', false),
  ('dashboard', 'encargado', false),
  ('dashboard', 'gestoria', false)
on conflict (modulo, sector) do update set visible = excluded.visible;
