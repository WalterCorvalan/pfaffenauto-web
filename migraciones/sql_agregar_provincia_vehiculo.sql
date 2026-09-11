-- Nuevo campo "Provincia" en el form de Stock (Ubicación y dueños).
alter table public.vehiculos add column if not exists provincia text;
