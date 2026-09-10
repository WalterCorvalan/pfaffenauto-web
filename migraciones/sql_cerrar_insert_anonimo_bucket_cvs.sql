-- El formulario "Trabajá con nosotros" ahora sube el CV vía
-- /api/upload-cv (service role, con Turnstile + rate limit + validación real
-- de PDF por magic bytes) en vez de insertar directo desde el navegador con
-- la clave anon. Ya no hace falta que "anon"/"authenticated" tengan permiso
-- de INSERT directo en el bucket -- se cierra esa policy (quedaba abierta a
-- que cualquiera subiera lo que quisiera, sin pasar por ninguna validación).
-- La lectura pública ("publico_leer_cv") se deja igual, el link del CV se
-- comparte directo.
drop policy if exists "publico_subir_cv" on storage.objects;
