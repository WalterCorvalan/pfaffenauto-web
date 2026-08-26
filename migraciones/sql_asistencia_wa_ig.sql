-- "Pedir asistencia" en el CRM (LeadDetailClient.tsx) solo funcionaba en leads
-- de cotización — whatsapp_conversaciones e instagram_conversaciones nunca
-- recibieron las columnas de asistencia_* que sí tiene "cotizaciones", así que
-- pedir ayuda en un lead de WhatsApp/Instagram tira error 400 (columna
-- inexistente) en vez de guardar la solicitud.
alter table whatsapp_conversaciones
  add column if not exists asistencia_solicitada boolean default false,
  add column if not exists asistencia_nota text,
  -- Sin FK a perfiles a propósito: ya existe vendedor_id -> perfiles, y una
  -- segunda relación a la misma tabla rompe el embed "perfiles(nombre)" en
  -- PostgREST (ver sql_fix_ambiguedad_asistencia_para.sql).
  add column if not exists asistencia_para uuid,
  add column if not exists asistencia_atendida boolean default false;

alter table instagram_conversaciones
  add column if not exists asistencia_solicitada boolean default false,
  add column if not exists asistencia_nota text,
  -- Sin FK a perfiles a propósito: ya existe vendedor_id -> perfiles, y una
  -- segunda relación a la misma tabla rompe el embed "perfiles(nombre)" en
  -- PostgREST (ver sql_fix_ambiguedad_asistencia_para.sql).
  add column if not exists asistencia_para uuid,
  add column if not exists asistencia_atendida boolean default false;
