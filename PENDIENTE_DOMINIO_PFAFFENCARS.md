# Pendiente: cuando se compre y conecte pfaffencars.com

Hoy el sitio corre en `https://pfaffenauto-web.vercel.app` (dominio de Vercel, no el final). Este archivo junta todo lo que depende de eso — se puede borrar una vez que el dominio esté comprado y conectado y se haya revisado esta lista.

## 1. Lo que hay que hacer en Vercel (fuera del código)

- Comprar `pfaffencars.com` (o el registrador que uses) y agregarlo como dominio del proyecto en Vercel → Settings → Domains.
- Configurar los DNS que Vercel indique (A/CNAME) y esperar a que verifique.
- Marcarlo como dominio primario (`www.pfaffencars.com`, con redirect desde `pfaffencars.com` sin `www` — así queda igual a como ya está hardcodeado en el código, ver punto 2).

## 2. Código: NO hay que cambiar nada — ya está escrito para `www.pfaffencars.com`

Es importante: **el código no apunta al dominio de Vercel en ningún lado**, ya asume `https://www.pfaffencars.com` en ~40 lugares (SEO, JSON-LD, sitemap, robots.txt, links que manda el bot de WhatsApp/IA, feed de Meta, etc.). Una vez conectado el dominio real, todo eso empieza a andar solo, sin tocar código. Los archivos principales, por si hay que auditar algo puntual:

- `app/layout.tsx` — metadataBase, Open Graph, JSON-LD de Organization.
- `app/sitemap.ts`, `app/robots.ts`.
- `app/(public)/**/page.tsx` — casi todas tienen `alternates: { canonical: "https://www.pfaffencars.com/..." }`.
- `app/api/meta-catalog/feed/route.ts` — el link de cada auto en el feed de Instagram/Facebook Shopping usa este dominio (ver `PENDIENTE` más abajo, punto 4).
- `lib/ai/promptsV2.ts`, `lib/ai/promptV2/sitioWeb.ts`, `lib/ai/promptV2/reglasGenerales.ts`, `lib/ai/promptV2/reglasStock.ts` — links que el bot de WhatsApp/Instagram manda a los clientes (catálogo, 0km, outlet, financiación, cotizador, consignación, sucursales).
- `components/modals/FavoritosPedidoModal.tsx` — arma el link de favoritos para mandar por WhatsApp.
- `public/llms.txt` — para crawlers de IA.

## 3. Inconsistencia encontrada: dos emails de contacto distintos

- `app/(public)/privacidad/page.tsx` usa **`info@pfaffencars.com`**.
- `data/NegocioConfig.ts` (archivo sin usar en ningún lado, código muerto con datos placeholder) tiene **`contacto@pfaffenautos.com`** — dominio viejo, y además el archivo entero no se importa desde ningún componente. No hace falta arreglarlo salvo que en algún momento se decida usar ese archivo de verdad; si no, se puede borrar directamente.

Decidir cuál es el email real de contacto y dejarlo consistente en `privacidad/page.tsx` (y en cualquier lado nuevo que se agregue).

## 4. Instagram / Meta Commerce Manager — catálogo de Shopping

Quedó a mitad de configurar en Meta Commerce Manager (catálogo "Pfaffencars_CatalogoIG", tipo Vehículos, portfolio "Pfaffen Autos 2"). Faltó cargar la fuente de datos porque el dominio final todavía no está conectado — los links de cada auto en el feed usan `www.pfaffencars.com/catalogo/...`, que hoy no resuelve.

**Cuando el dominio esté conectado:**
1. Volver a Meta Commerce Manager → el catálogo "Pfaffencars_CatalogoIG" ya creado.
2. Agregar productos → Fuente de datos programada → URL: `https://www.pfaffencars.com/api/meta-catalog/feed`.
3. Frecuencia: diaria.
4. Vincular el catálogo a la cuenta de Instagram/Facebook de la agencia (Shopping).

## 5. MercadoLibre (auto-publicación) — sin relación con el dominio

Esto quedó aparte, no depende de `pfaffencars.com` — depende de conseguir credenciales de OAuth de MercadoLibre. Ver conversación por separado si se retoma.
