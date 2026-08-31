-- Los leads de WhatsApp/Instagram no traen datos estructurados del auto que
-- el cliente quiere tasar (eso lo tendría el /cotizador público, que todavía
-- no migró a nova) — se carga a mano al iniciar el peritaje.
alter table public.peritajes_lead add column if not exists vehiculo_descripcion text;
