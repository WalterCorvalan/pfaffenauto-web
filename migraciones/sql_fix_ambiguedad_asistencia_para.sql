-- BUG: "asistencia_para" tiene una foreign key a perfiles(id), pero estas
-- tablas YA tienen otra FK a perfiles vía vendedor_id — dos relaciones hacia
-- la misma tabla hacen que PostgREST no pueda resolver el embed
-- "perfiles ( nombre )" usado en todo el CRM (KanbanBoard, LeadDetailClient,
-- etc), y la query entera falla con error 300 "more than one relationship
-- found" → el Kanban queda vacío aunque los leads existan.
--
-- cotizaciones ya tenía este problema desde que se agregó asistencia_para
-- (bug viejo, no de hoy); sql_asistencia_wa_ig.sql replicó el mismo patrón
-- en whatsapp/instagram sin querer. Esto lo corrige en las 3.
--
-- No hace falta integridad referencial en asistencia_para — el dropdown de
-- "Pedir asistencia" ya solo manda ids de perfiles existentes.

alter table cotizaciones drop constraint if exists cotizaciones_asistencia_para_fkey;
alter table whatsapp_conversaciones drop constraint if exists whatsapp_conversaciones_asistencia_para_fkey;
alter table instagram_conversaciones drop constraint if exists instagram_conversaciones_asistencia_para_fkey;
