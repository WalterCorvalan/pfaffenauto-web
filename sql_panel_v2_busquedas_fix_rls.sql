-- Panel v2 — Búsquedas Web, fix: la política de insert para anon en
-- busquedas_log no está funcionando en vivo (probó insertar el catálogo
-- público sin sesión y RLS lo bloqueó). Se reaplica desde cero.

alter table public.busquedas_log enable row level security;

drop policy if exists "insertar_busquedas_publico" on public.busquedas_log;
create policy "insertar_busquedas_publico" on public.busquedas_log for insert to anon, authenticated with check (true);

drop policy if exists "ver_busquedas" on public.busquedas_log;
create policy "ver_busquedas" on public.busquedas_log for select to authenticated using (true);
