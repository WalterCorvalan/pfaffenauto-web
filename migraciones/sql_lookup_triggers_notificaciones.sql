select
  event_object_table as tabla,
  trigger_name,
  action_timing,
  event_manipulation as evento,
  action_statement
from information_schema.triggers
where event_object_table in (
  'rodi_mensajes', 'instagram_mensajes', 'whatsapp_mensajes',
  'senas', 'financiaciones', 'tareas_lead', 'pedidos', 'visitas'
)
order by tabla, trigger_name;
