import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResultadoSync } from "./types";
import { guardarMetricas } from "./upsert";

// Meta Ads Insights API — reusa la misma app de Meta que ya usamos para
// WhatsApp/Instagram/Facebook, pero necesita un token de acceso CON permiso
// "ads_read" (el META_FACEBOOK_TOKEN actual es para postear/mensajear, no
// sirve acá). Se genera en Business Manager > System Users.
//
// Variables necesarias (agregar a .env.local):
//   META_ADS_ACCOUNT_ID   -> el número de la cuenta publicitaria, SIN "act_" adelante
//   META_ADS_ACCESS_TOKEN -> token de larga duración con scope ads_read

export function metaAdsConfigurado(): boolean {
  return !!process.env.META_ADS_ACCOUNT_ID && !!process.env.META_ADS_ACCESS_TOKEN;
}

export async function sincronizarMetaAds(supabase: SupabaseClient): Promise<ResultadoSync> {
  const plataforma = "Meta Ads";
  if (!metaAdsConfigurado()) {
    return { plataforma, configurado: false, ok: false, campanas: 0 };
  }

  const accountId = process.env.META_ADS_ACCOUNT_ID;
  const token = process.env.META_ADS_ACCESS_TOKEN;
  const hoy = new Date().toISOString().split("T")[0];

  try {
    const url = new URL(`https://graph.facebook.com/v21.0/act_${accountId}/insights`);
    url.searchParams.set("level", "campaign");
    url.searchParams.set("date_preset", "today");
    url.searchParams.set("fields", "campaign_id,campaign_name,spend,clicks,actions");
    url.searchParams.set("access_token", token!);

    const res = await fetch(url.toString());
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `Meta Ads respondió ${res.status}`);

    const metricas = (data.data || []).map((c: any) => {
      // Cualquier action_type que contenga "lead" cuenta como lead — Meta usa
      // varios nombres según el tipo de campaña (lead, onsite_conversion.lead_grouped,
      // offsite_conversion.fb_pixel_lead, etc).
      const leads = (c.actions || [])
        .filter((a: any) => String(a.action_type).includes("lead"))
        .reduce((acc: number, a: any) => acc + (Number(a.value) || 0), 0);
      return {
        campanaExternaId: c.campaign_id,
        nombreCampana: c.campaign_name,
        gasto: Number(c.spend) || 0,
        clics: Number(c.clicks) || 0,
        leads,
      };
    });

    await guardarMetricas(supabase, plataforma, hoy, metricas);
    return { plataforma, configurado: true, ok: true, campanas: metricas.length };
  } catch (err: any) {
    return { plataforma, configurado: true, ok: false, campanas: 0, error: err.message };
  }
}
