-- Panel v2 — WhatsApp/Instagram, fix: el frontend ya suscribe postgres_changes
-- sobre estas 4 tablas (bandeja + hilo de mensajes en vivo), pero nunca se
-- agregaron a la publicación de Supabase Realtime, así que Postgres nunca
-- avisaba nada — el chat solo se actualizaba al recargar. Mismo patrón que
-- ya se usó para alertas/clientes.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'whatsapp_conversaciones'
  ) then
    alter publication supabase_realtime add table public.whatsapp_conversaciones;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'whatsapp_mensajes'
  ) then
    alter publication supabase_realtime add table public.whatsapp_mensajes;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'instagram_conversaciones'
  ) then
    alter publication supabase_realtime add table public.instagram_conversaciones;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'instagram_mensajes'
  ) then
    alter publication supabase_realtime add table public.instagram_mensajes;
  end if;
end $$;

alter table public.whatsapp_conversaciones replica identity full;
alter table public.whatsapp_mensajes replica identity full;
alter table public.instagram_conversaciones replica identity full;
alter table public.instagram_mensajes replica identity full;
