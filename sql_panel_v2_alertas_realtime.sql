-- Habilita Realtime para "alertas" si todavia no estaba -- sin esto, la
-- campana de notificaciones no actualiza el numero solo, hay que refrescar
-- la pagina para verlo.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'alertas'
  ) then
    alter publication supabase_realtime add table public.alertas;
  end if;
end $$;
