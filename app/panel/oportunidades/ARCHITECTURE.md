# Oportunidades — cómo funciona y qué falta

## v1 (actual): búsqueda en vivo contra MercadoLibre, sin guardar nada

`OportunidadesClient.tsx` → `GET /api/panel/oportunidades/buscar` → `lib/ads/mercadolibreSearch.ts` → API pública de MercadoLibre (`/sites/MLA/search`, categoría `MLA1743` "Autos, Camionetas y Utilitarios"). Se consulta en vivo en cada búsqueda, **no se guarda nada en la base** — siempre refleja publicaciones activas en ese momento (ML no devuelve en el buscador público avisos pausados/finalizados/vendidos), sin necesidad de un cron que la mantenga actualizada.

Reusa `ML_CLIENT_ID`/`ML_CLIENT_SECRET` (mismas variables que ya usan `lib/ads/mercadolibrePublish.ts` y `lib/ads/mercadolibre.ts` para publicar stock y Product Ads) pero **no** necesita ningún refresh_token de vendedor — es de solo lectura, alcanza con un access_token de aplicación (`client_credentials`). Si esas dos variables no están configuradas, el endpoint devuelve 503 con un mensaje claro en vez de romperse.

El filtro de provincia es client-side, sobre lo que devolvió la búsqueda (`address.state_name` de cada resultado) — no se arma ningún parámetro de ubicación en el fetch a ML todavía, porque los códigos de "state" que acepta esa API son IDs opacos específicos de ML que no se pudieron verificar sin acceso de red real a `api.mercadolibre.com` desde el entorno donde se armó esto.

**Advertencia**: `lib/ads/mercadolibreSearch.ts` está armado según la documentación pública de MercadoLibre, sin poder probarlo contra una respuesta real todavía (mismo caso que `mercadolibrePublish.ts`/`mercadolibre.ts`). Si algo no calza (nombres de campos como `address.city_name`/`address.state_name`, el código de categoría `MLA1743`), ajustar con la primera respuesta real — mirar el error que devuelve `/api/panel/oportunidades/buscar` o el log de `registrarError`.

También queda el botón "Ver en Comunidauto" (v0, sin cambios) como alternativa/respaldo — abre la búsqueda de comunidauto.com.ar en una pestaña nueva, sin traer datos a la base. El parámetro `q` de esa URL tampoco está confirmado.

## v2 pendiente: ampliar con más fuentes o guardar publicaciones propias

Si en algún momento Walter consigue una cuenta de agencia asociada en Comunidauto con API/feed de partner (más estable que scrapear su HTML), se podría sumar como una segunda fuente de resultados acá mismo, mezclada con las de MercadoLibre. No confirmar scraping de su HTML sin preguntarles primero si está permitido.

No confundir con la idea original (mercado interno entre agencias colegas, cada una publicando sus propios autos con login limitado) — se descartó por ahora a favor de esta búsqueda contra MercadoLibre, que ya cubre el caso de uso real sin necesitar que otras agencias tengan cuenta en este sistema.
