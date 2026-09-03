-- create or replace function con una firma distinta no reemplaza la
-- anterior, crea una sobrecarga nueva. Quedaron 3 versiones de
-- reasignar_leads_vencidos coexistiendo (con 0, 1 y 2 parámetros),
-- ambiguas para llamar. Solo la de 0 parámetros es la que usa el cron ahora.
drop function if exists public.reasignar_leads_vencidos(int);
drop function if exists public.reasignar_leads_vencidos(int, int);
