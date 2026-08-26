import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResultadoSync } from "./types";
import { guardarMetricas } from "./upsert";

// Google Ads API (REST v17, GAQL) — a diferencia de Meta/MercadoLibre, esta
// cuenta arranca de cero: hay que pedir un Developer Token en
// ads.google.com/aw/apicenter (Google tarda días/semanas en aprobarlo) y
// crear credenciales OAuth2 en console.cloud.google.com.
//
// Variables necesarias (agregar a .env.local):
//   GOOGLE_ADS_DEVELOPER_TOKEN
//   GOOGLE_ADS_CLIENT_ID
//   GOOGLE_ADS_CLIENT_SECRET
//   GOOGLE_ADS_REFRESH_TOKEN     -> se obtiene una vez con el flujo OAuth de un usuario con acceso a la cuenta
//   GOOGLE_ADS_CUSTOMER_ID       -> el ID de la cuenta de Google Ads, sin guiones
//   GOOGLE_ADS_LOGIN_CUSTOMER_ID -> opcional, solo si la cuenta está bajo una MCC (Manager Account)

export function googleAdsConfigurado(): boolean {
  return !!(
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
    process.env.GOOGLE_ADS_CLIENT_ID &&
    process.env.GOOGLE_ADS_CLIENT_SECRET &&
    process.env.GOOGLE_ADS_REFRESH_TOKEN &&
    process.env.GOOGLE_ADS_CUSTOMER_ID
  );
}

async function obtenerAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error_description || "No se pudo refrescar el token de Google Ads");
  return data.access_token;
}

export async function sincronizarGoogleAds(supabase: SupabaseClient): Promise<ResultadoSync> {
  const plataforma = "Google Ads";
  if (!googleAdsConfigurado()) {
    return { plataforma, configurado: false, ok: false, campanas: 0 };
  }

  try {
    const accessToken = await obtenerAccessToken();
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!.replace(/-/g, "");

    // metrics.conversions es un proxy de "leads" (todas las acciones de
    // conversión configuradas en la cuenta) — si quieren solo un tipo puntual
    // (ej. "Envío de formulario") hay que filtrar por conversion_action acá.
    const query = `
      SELECT campaign.id, campaign.name, metrics.cost_micros, metrics.clicks, metrics.conversions
      FROM campaign
      WHERE segments.date DURING TODAY AND campaign.status = 'ENABLED'
    `;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
      "Content-Type": "application/json",
    };
    if (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) {
      headers["login-customer-id"] = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, "");
    }

    const res = await fetch(`https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:search`, {
      method: "POST",
      headers,
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `Google Ads respondió ${res.status}`);

    const hoy = new Date().toISOString().split("T")[0];
    const metricas = (data.results || []).map((r: any) => ({
      campanaExternaId: String(r.campaign.id),
      nombreCampana: r.campaign.name,
      gasto: (Number(r.metrics.costMicros) || 0) / 1_000_000,
      clics: Number(r.metrics.clicks) || 0,
      leads: Math.round(Number(r.metrics.conversions) || 0),
    }));

    await guardarMetricas(supabase, plataforma, hoy, metricas);
    return { plataforma, configurado: true, ok: true, campanas: metricas.length };
  } catch (err: any) {
    return { plataforma, configurado: true, ok: false, campanas: 0, error: err.message };
  }
}
