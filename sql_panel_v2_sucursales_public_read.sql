-- La web pública (sucursales/[slug]) necesita leer sucursales con la anon key,
-- igual que ya puede leer vehiculos. Sin esta policy, RLS devuelve 0 filas.
create policy "sucursales_public_read" on public.sucursales
  for select
  to anon
  using (true);
