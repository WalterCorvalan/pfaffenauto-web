-- El agente le pregunta el nombre real al cliente en la charla de Instagram
-- (misma regla DATOS DE CONTACTO que WhatsApp), pero instagram_contactos
-- solo tenía "username" (el @ de Instagram) -- no había dónde guardar el
-- nombre real que el cliente da en el chat. Mismo patrón que
-- whatsapp_contactos.nombre_perfil.
alter table instagram_contactos add column if not exists nombre_perfil text;
