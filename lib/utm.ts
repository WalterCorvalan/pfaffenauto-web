"use client";

// Mapea utm_source (o el dominio de referrer si no hay UTM) al mismo
// vocabulario que ya usa /panel/marketing/pautas y /panel/marketing/embudo
// ("Google Ads", "Meta Ads", "MercadoLibre") para que el gasto cargado a mano
// y el origen real del lead terminen hablando el mismo idioma.
const MAPA_FUENTE: Record<string, string> = {
  google: "Google Ads",
  adwords: "Google Ads",
  facebook: "Meta Ads",
  instagram: "Meta Ads",
  meta: "Meta Ads",
  mercadolibre: "MercadoLibre",
  meli: "MercadoLibre",
  whatsapp: "WhatsApp",
};

const MAPA_REFERRER: Record<string, string> = {
  "google.com": "Google (orgánico)",
  "facebook.com": "Facebook (orgánico)",
  "instagram.com": "Instagram (orgánico)",
  "mercadolibre.com.ar": "MercadoLibre (orgánico)",
  "mercadolibre.com": "MercadoLibre (orgánico)",
};

// Se llama en el submit del formulario (no en el mount) para no depender de
// que el usuario haya entrado por esa URL exacta en esta pestaña — igual
// alcanza porque los links de campaña siempre son la entrada al sitio.
// A diferencia de getCanalOrigen (que mapea a un balde legible y descarta
// medium/campaign), esto guarda los 3 valores crudos tal cual vienen en la
// URL — sin esto nunca se puede saber qué campaña puntual trajo un lead,
// solo la plataforma en general.
export function getUtmRaw(): { utm_source: string | null; utm_medium: string | null; utm_campaign: string | null } {
  if (typeof window === "undefined") return { utm_source: null, utm_medium: null, utm_campaign: null };
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source")?.trim() || null,
    utm_medium: params.get("utm_medium")?.trim() || null,
    utm_campaign: params.get("utm_campaign")?.trim() || null,
  };
}

export function getCanalOrigen(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get("utm_source")?.trim().toLowerCase();
    if (utmSource) return MAPA_FUENTE[utmSource] || utmSource;

    const ref = document.referrer;
    if (ref) {
      const host = new URL(ref).hostname.replace(/^www\./, "");
      for (const dominio in MAPA_REFERRER) {
        if (host.includes(dominio)) return MAPA_REFERRER[dominio];
      }
    }
  } catch {
    // referrer inválido o bloqueado por el navegador — no es crítico
  }
  return null;
}
