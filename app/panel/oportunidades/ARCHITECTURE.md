# Oportunidades — cómo funciona y qué falta

## v1 (actual): solo un link de búsqueda, sin datos propios

`OportunidadesClient.tsx` no trae nada de Comunidauto a la base — arma `https://comunidauto.com.ar/search?q=<marca modelo>` y lo abre en una pestaña nueva. Cubre el caso de uso real (un cliente pide un auto que no tenés, buscás rápido si otra agencia lo tiene) sin depender de scraping ni de resolver los términos de uso del sitio.

**El parámetro `q` de esa URL no está confirmado** — no se pudo abrir `comunidauto.com.ar` desde este entorno (bloqueado por el proxy de red de la sesión que lo armó) para verificar el nombre real del query param de búsqueda. Si al probarlo no filtra bien, hay que inspeccionar la URL real que arma el buscador de comunidauto.com.ar (con marca/modelo tipeados a mano en su sitio) y ajustar acá.

## v2 pendiente: traer las publicaciones a la base (catálogo real dentro del panel)

Walter puede conseguir una cuenta de agencia asociada en Comunidauto — si tienen una API/feed de datos para partners (más estable que scrapear HTML), usar eso en vez de web scraping. Si no ofrecen nada así, la alternativa es scraping del HTML público, con el riesgo de romperse con cualquier cambio de su sitio y de pisar sus términos de uso (confirmar con ellos antes de scrapear, no asumir que está permitido).

Diseño pensado para v2 (no implementado):
- Tabla `oportunidades_externas`: snapshot de publicaciones ajenas (marca, modelo, año, km, precio, agencia, ubicación, link original, fecha de captura) — se refresca periódicamente (cron), no en tiempo real.
- El buscador de esta pantalla pasa a filtrar esa tabla en vez de abrir una pestaña externa.
- El botón "Buscar en Comunidauto" (v1) puede quedarse como fallback para lo que el scraper/feed no haya capturado todavía.

No confundir con el módulo `oportunidades` de otras posibles lecturas del catálogo (`lib/panel/modulosCatalogo.ts`) — es el mismo módulo, esta es su única implementación real hoy.
