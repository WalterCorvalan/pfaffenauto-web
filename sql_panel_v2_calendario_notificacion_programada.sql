-- El aviso de un evento del calendario debe llegar el día/hora del evento,
-- no al crearlo (eso se probó y estaba mal). Se agrega una marca de
-- "ya avisado" para que el cron (cada 5 min) no mande el mismo aviso de
-- nuevo en la corrida siguiente.
alter table public.eventos_calendario add column if not exists notificado boolean not null default false;
alter table public.eventos_calendario add column if not exists notificado_en timestamptz;

create index if not exists idx_eventos_calendario_pendientes on public.eventos_calendario(fecha, hora) where not notificado;
