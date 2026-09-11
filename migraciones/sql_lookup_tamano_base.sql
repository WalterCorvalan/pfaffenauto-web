-- Solo lectura: tamaño real actual de la base (para proyectar cuándo se
-- llega al límite de 500MB del plan gratis de Supabase).
select pg_size_pretty(pg_database_size(current_database())) as tamano_actual;
