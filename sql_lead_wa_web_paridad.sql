-- Paridad completa entre leads de cotización y leads de WhatsApp/Web Chat:
-- mismas 2 columnas alternativas de tareas_lead, ahora también en
-- test_drives, eventos_lead, presupuestos, senas, boletos_venta y peritajes.
-- Una sola de las tres columnas (cotizacion_id / whatsapp_conversacion_id /
-- web_chat_conversacion_id) se completa según el origen real del lead.

do $$
declare
  t text;
begin
  foreach t in array array['tareas_lead', 'test_drives', 'eventos_lead', 'presupuestos', 'senas', 'boletos_venta', 'peritajes']
  loop
    execute format('alter table %I alter column cotizacion_id drop not null', t);
    execute format('alter table %I add column if not exists whatsapp_conversacion_id uuid references whatsapp_conversaciones(id) on delete cascade', t);
    execute format('alter table %I add column if not exists web_chat_conversacion_id uuid references web_chat_conversaciones(id) on delete cascade', t);
    execute format('create index if not exists %I on %I (whatsapp_conversacion_id)', t || '_whatsapp_conversacion_id_idx', t);
    execute format('create index if not exists %I on %I (web_chat_conversacion_id)', t || '_web_chat_conversacion_id_idx', t);
  end loop;
end $$;
