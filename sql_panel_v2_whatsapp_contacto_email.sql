-- El bot ahora pide nombre y email al calificar un lead (antes solo pedía
-- nombre por WhatsApp, nunca mail) — falta dónde guardarlos.
alter table public.whatsapp_contactos
  add column if not exists email text;
