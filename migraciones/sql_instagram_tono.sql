-- Tono diferenciado por canal para Instagram (ya existía en WhatsApp desde antes).
-- Correr una sola vez en el SQL Editor de Supabase.

alter table public.instagram_configuracion
  add column if not exists tono text;
