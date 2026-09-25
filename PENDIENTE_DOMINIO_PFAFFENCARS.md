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

## 3. [RESUELTO 25/9] Email de contacto unificado

Había dos emails distintos en el código: `info@pfaffencars.com` en `privacidad/page.tsx` y `contacto@pfaffenautos.com` en `data/NegocioConfig.ts` (archivo sin usar en ningún componente, código muerto). El real es **`pfaffengabriel@gmail.com`** — ya se actualizó `app/(public)/privacidad/page.tsx` para usarlo. `data/NegocioConfig.ts` se dejó sin tocar (sigue sin ser código muerto, no lo importa nadie) — si en algún momento se decide usar ese archivo de verdad, actualizar el email ahí también o directamente borrarlo si no hace falta.

## 4. Instagram / Meta Commerce Manager — catálogo de Shopping

**Ya está creado y listo, quedó solo pendiente el último paso (cargar la fuente de datos) porque el dominio final todavía no resuelve.**

Estado exacto al 25/9:
- Portfolio comercial: **Pfaffen Autos 2**.
- Catálogo creado: **"Pfaffencars_CatalogoIG"**, tipo **Vehículos** ("Vehículos nuevos y usados en venta" — no "Vehículos y ofertas").
- En el paso "Conecta tus datos" se dejó vinculado el conjunto de datos existente **PfaffenAutos IBot** (seguimiento de eventos de inventario) — no hace falta tocarlo de nuevo.
- Se llegó hasta la pantalla "Agregar productos → Elige cómo subir el archivo", con **"Usar una URL u Hojas de cálculo de Google"** ya seleccionada. Se probó pegar `https://www.pfaffencars.com/api/meta-catalog/feed` y Meta la rechazó ("La URL no dirige a un archivo admitido") porque ese dominio todavía no está conectado — no llegó a probarse con la URL de Vercel (`https://pfaffenauto-web.vercel.app/api/meta-catalog/feed`) porque no tiene sentido cargar el feed con links de auto rotos (el feed arma cada link de producto con `www.pfaffencars.com/catalogo/...` hardcodeado, ver punto 2) mientras el dominio no esté vivo.

**Para terminarlo, una vez que `pfaffencars.com` esté comprado y conectado en Vercel:**
1. Meta Commerce Manager → Catálogos → abrir **"Pfaffencars_CatalogoIG"** (ya existe, no crear uno nuevo).
2. Agregar productos → **Usar una URL u Hojas de cálculo de Google** → pegar `https://www.pfaffencars.com/api/meta-catalog/feed`.
3. Antes de pegarla, probar la URL directo en el navegador para confirmar que devuelve el CSV (no un 404/500) — si el sitio recién migró de dominio puede tardar un rato en propagar DNS.
4. Frecuencia de actualización: **diaria**.
5. Vincular el catálogo a la cuenta de Instagram/Facebook de la agencia (Shopping) — Meta lo pide en el mismo asistente si la cuenta ya está habilitada para Shopping.

## 5. MercadoLibre (auto-publicación) — sin relación con el dominio

Esto quedó aparte, no depende de `pfaffencars.com` — depende de conseguir credenciales de OAuth de MercadoLibre. Ver conversación por separado si se retoma.
