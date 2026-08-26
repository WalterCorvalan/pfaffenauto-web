import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResultadoSync } from "./types";
import { guardarMetricas } from "./upsert";

// MercadoLibre Ads (Product Ads) — reusa ML_CLIENT_ID/ML_CLIENT_SECRET que ya
// existen en .env.local (misma app usada para publicar el stock). Falta un
// paso manual único: autorizar esa app contra la cuenta de MercadoLibre con
// permisos de Product Ads y guardar el refresh_token resultante.
//
// ADVERTENCIA: los endpoints exactos de la API de Ads de ML (rutas, nombres
// de campos en la respuesta) no se pudieron verificar en vivo sin credenciales
// reales — están armados según la documentación pública de MercadoLibre
// (developers.mercadolibre.com.ar/es_ar/product-ads), pero conviene
// confirmarlos contra una respuesta real la primera vez que se configure.
//
// Variables necesarias (agregar a .env.local):
//   ML_ADS_REFRESH_TOKEN -> se obtiene una vez con el flujo OAuth (authorization_code) de ML, usando ML_CLIENT_ID/SECRET/REDIRECT_URI ya existentes
//   ML_ADVERTISER_ID     -> se obtiene con GET /advertising/advertisers?product_id=PADS una vez autenticado

export function mercadoLibreAdsConfigurado(): boolean {
  return !!(
    process.env.ML_CLIENT_ID &&
    process.env.ML_CLIENT_SECRET &&
    process.env.ML_ADS_REFRESH_TOKEN &&
    process.env.ML_ADVERTISER_ID
  );
}

async function obtenerAccessToken(): Promise<string> {
  const res = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.ML_CLIENT_ID!,
      client_secret: process.env.ML_CLIENT_SECRET!,
      refresh_token: process.env.ML_ADS_REFRESH_TOKEN!,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "No se pudo refrescar el token de MercadoLibre");
  return data.access_token;
}

export async function sincronizarMercadoLibreAds(supabase: SupabaseClient): Promise<ResultadoSync> {
  const plataforma = "MercadoLibre";
  if (!mercadoLibreAdsConfigurado()) {
    return { plataforma, configurado: false, ok: false, campanas: 0 };
  }

  try {
    const accessToken = await obtenerAccessToken();
    const advertiserId = process.env.ML_ADVERTISER_ID!;
    const hoy = new Date().toISOString().split("T")[0];

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Api-Version": "2",
    };

    const resCampanas = await fetch(
      `https://api.mercadolibre.com/advertising/product_ads/campaigns?advertiser_id=${advertiserId}`,
      { headers }
    );
    const campanas = await resCampanas.json();
    if (!resCampanas.ok) throw new Error(campanas?.message || `MercadoLibre respondió ${resCampanas.status}`);

    const metricas = [];
    for (const c of campanas.results || campanas || []) {
      const resMetricas = await fetch(
        `https://api.mercadolibre.com/advertising/product_ads/campaigns/${c.id}?metrics_summary=true&date_from=${hoy}&date_to=${hoy}`,
        { headers }
      );
      const detalle = await resMetricas.json();
      if (!resMetricas.ok) continue;
      const m = detalle.metrics_summary || detalle.metrics || {};
      metricas.push({
        campanaExternaId: String(c.id),
        nombreCampana: c.name || `Campaña ${c.id}`,
        gasto: Number(m.cost ?? m.spend) || 0,
        clics: Number(m.clicks) || 0,
        // ML no tiene "leads" en el sentido tradicional (es un marketplace) —
        // usamos "contacts"/"direct_items_quantity" como proxy si existe, si no queda en 0.
        leads: Number(m.contacts ?? m.direct_items_quantity) || 0,
      });
    }

    await guardarMetricas(supabase, plataforma, hoy, metricas);
    return { plataforma, configurado: true, ok: true, campanas: metricas.length };
  } catch (err: any) {
    return { plataforma, configurado: true, ok: false, campanas: 0, error: err.message };
  }
}
