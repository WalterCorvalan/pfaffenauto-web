-- El chatbot del home (FloatingChatbot) dejó de crear "leads" propios --
-- ahora usa /api/chat (buscador con reglas+IA), que nunca escribió acá.
-- Esta tabla y su columna de vínculo en 7 tablas quedan huérfanas.

alter table public.senas drop column if exists web_chat_conversacion_id;
alter table public.boletos_venta drop column if exists web_chat_conversacion_id;
alter table public.presupuestos drop column if exists web_chat_conversacion_id;
alter table public.tareas_lead drop column if exists web_chat_conversacion_id;
alter table public.eventos_lead drop column if exists web_chat_conversacion_id;
alter table public.test_drives drop column if exists web_chat_conversacion_id;
alter table public.peritajes drop column if exists web_chat_conversacion_id;

drop table if exists public.web_chat_mensajes;
drop table if exists public.web_chat_conversaciones;
