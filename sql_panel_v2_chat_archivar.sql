-- Archivar conversación = ocultarla de la bandeja activa sin borrar mensajes.
-- Resuelve "se llena la bandeja de chats viejos" sin perder historial.

alter table public.whatsapp_conversaciones
  add column if not exists archivada boolean not null default false;

alter table public.instagram_conversaciones
  add column if not exists archivada boolean not null default false;
