-- El prompt del bot pide el CUIL en el flujo de crédito/financiación y el
-- código lo guarda en whatsapp_contactos.cuil / rodi_conversaciones.cuil,
-- pero ninguna de las dos columnas existía -- el UPDATE fallaba completo
-- (PostgREST rechaza toda la fila por una columna desconocida), perdiendo
-- de paso el nombre y el mail si venían en el mismo patch.

alter table public.whatsapp_contactos add column if not exists cuil text;
alter table public.rodi_conversaciones add column if not exists cuil text;
