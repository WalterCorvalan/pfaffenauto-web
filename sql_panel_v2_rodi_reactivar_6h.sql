-- Rodi: cuando la IA se pausa (handoff, o un vendedor escribe manual, o se
-- apaga a mano desde la bandeja) se guarda el momento exacto. El propio
-- endpoint que recibe mensajes del widget (app/api/panel-v2/rodi/mensaje)
-- la reactiva sola si el visitante vuelve a escribir 6+ horas después --
-- sin depender de un cron nuevo, se resuelve en el mismo request.
alter table public.rodi_conversaciones add column if not exists ai_pausada_en timestamptz;
