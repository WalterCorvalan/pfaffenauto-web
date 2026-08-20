-- Vacía por completo los peritajes existentes (checklist viejo, no aprobado)
-- para arrancar de cero con la lista nueva calcada del papel.
-- IRREVERSIBLE. Correr DESPUÉS de sql_peritaje_uso_interno.sql.

TRUNCATE TABLE peritaje_items, peritajes RESTART IDENTITY CASCADE;
