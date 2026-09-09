select proname, pg_get_functiondef(oid) as definicion
from pg_proc
where proname in (
  'whatsapp_notificar_mensaje_entrante',
  'instagram_notificar_mensaje_entrante',
  'rodi_notificar_mensaje_entrante',
  'visitas_notificar_nueva'
);
