-- Leads de WhatsApp que llegaron orgánicos (sin pauta de Meta Ads ni desde
-- un link de MercadoLibre) quedaban con canal_origen = null, mostrando
-- "Sin especificar" en el panel de Leads para siempre. Se backfillea a
-- "WhatsApp" -- de acá en más el webhook ya lo pone por default al crear
-- la conversación (app/api/panel/webhooks/whatsapp/[token]/route.ts).

update public.whatsapp_conversaciones
  set canal_origen = 'WhatsApp'
  where canal_origen is null;
