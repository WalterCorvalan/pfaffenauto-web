select event_object_table as tabla, trigger_name, event_manipulation
from information_schema.triggers
where trigger_schema = 'public'
and event_object_table in ('whatsapp_conversaciones', 'rodi_conversaciones', 'instagram_conversaciones')
order by tabla, trigger_name;
