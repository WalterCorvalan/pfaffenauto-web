-- CRM leads = solo WhatsApp e Instagram (el chat de la web NO es un lead,
-- eso vive en /panel/marketing/chatbot). Agrega la columna de vínculo para
-- Instagram en las mismas tablas que ya tenían whatsapp_conversacion_id.
-- Las columnas web_chat_conversacion_id (si llegaste a correr la migración
-- anterior) quedan sin uso, no hace falta borrarlas.

do $$
declare
  t text;
begin
  foreach t in array array['tareas_lead', 'test_drives', 'eventos_lead', 'presupuestos', 'senas', 'boletos_venta', 'peritajes']
  loop
    execute format('alter table %I add column if not exists instagram_conversacion_id uuid references instagram_conversaciones(id) on delete cascade', t);
    execute format('create index if not exists %I on %I (instagram_conversacion_id)', t || '_instagram_conversacion_id_idx', t);
  end loop;
end $$;

-- Habilita realtime para que el pipeline se refresque solo con mensajes nuevos de IG.
do $$
begin
  alter publication supabase_realtime add table instagram_conversaciones;
exception when duplicate_object then
  null; -- ya estaba agregada
end $$;
