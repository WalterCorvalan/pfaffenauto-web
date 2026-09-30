# Oportunidades — cómo funciona y qué falta

## v1 (actual): dos links de búsqueda, sin datos propios

`OportunidadesClient.tsx` no trae nada a la base — arma un link de búsqueda con marca/modelo y lo abre en una pestaña nueva, para MercadoLibre (`listado.mercadolibre.com.ar/<marca>-<modelo>`) y para Comunidauto (`comunidauto.com.ar/search?q=...`). Cubre el caso de uso real (un cliente pide un auto que no tenés, buscás rápido si alguien más lo tiene) sin depender de scraping ni de la API de MercadoLibre.

**Ninguno de los dos links está confirmado al 100%** — no se pudo abrir ninguno de los dos sitios desde el entorno donde se armó esto (proxy de red bloqueado) para verificar la URL exacta. Si alguno no filtra bien, hay que revisar la URL real que arma cada buscador (tipeando a mano en su sitio) y ajustar acá.

## Por qué NO se usa la API de MercadoLibre (intentado y descartado, 30/9)

Se intentó `/sites/MLA/search` de la API pública de MercadoLibre (ver commit anterior a este) para traer resultados en vivo dentro del panel, en vez de un link externo. **No funciona**: ese endpoint devuelve `403 forbidden` con un token de aplicación simple (`client_credentials`) — MercadoLibre restringió el buscador público a partir de 2023 como medida anti-scraping, y no alcanza con `ML_CLIENT_ID`/`ML_CLIENT_SECRET` solos.

Para que funcione de verdad haría falta el flujo completo de autorización de vendedor (`authorization_code`, login real contra la cuenta de ML, mismo patrón que ya usa `lib/ads/mercadolibrePublish.ts` con `ML_SELLER_REFRESH_TOKEN`) — y **tampoco hay garantía** de que ML lo permita para este caso de uso (leer el catálogo completo de otros vendedores) ni siquiera autenticado. No reintentar esto sin antes confirmar con la documentación oficial vigente de MercadoLibre si ese endpoint acepta ese flujo para terceros, o se vuelve a pegar contra el mismo bloqueo.

`ML_CLIENT_ID`/`ML_CLIENT_SECRET` quedaron cargados en Vercel igual (útiles para `mercadolibrePublish.ts`/`mercadolibre.ts`, que si necesitan ese flujo completo de autorización).

## v2 pendiente

Si en algún momento Walter consigue una cuenta de agencia asociada en Comunidauto con API/feed de partner (más estable que scrapear su HTML), se podría sumar como fuente de resultados propia. No confirmar scraping de su HTML sin preguntarles primero si está permitido.

No confundir con la idea original (mercado interno entre agencias colegas, cada una publicando sus propios autos con login limitado) — se descartó por ahora a favor de estos dos links externos.
