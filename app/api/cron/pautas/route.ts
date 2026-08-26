import { createClient } from "@supabase/supabase-js";
import { sincronizarMetaAds } from "@/lib/ads/meta";
import { sincronizarGoogleAds } from "@/lib/ads/google";
import { sincronizarMercadoLibreAds } from "@/lib/ads/mercadolibre";
import { registrarError } from "@/lib/logger";

// Sincroniza gasto/clics/leads del día desde Meta Ads, Google Ads y
// MercadoLibre hacia `campanas_marketing`, para que /panel/marketing/pautas
// se llene solo en vez de cargarse a mano con "Cargar Métricas". Cada
// plataforma se salta sola si no tiene las variables de entorno cargadas
// (ver comentarios en lib/ads/*.ts) — no rompe nada mientras falten keys.
//
// Pensado para correr cada 1-2hs vía pg_cron (mismo patrón que
// /api/cron/automatizaciones), para que el gasto del día se vea actualizado
// sin esperar al cierre del día.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const resultados = await Promise.all([
    sincronizarMetaAds(supabase),
    sincronizarGoogleAds(supabase),
    sincronizarMercadoLibreAds(supabase),
  ]);

  for (const r of resultados) {
    if (r.configurado && !r.ok) {
      registrarError(`api/cron/pautas ${r.plataforma}`, new Error(r.error || "error desconocido"));
    }
  }

  return Response.json({ ok: true, ranAt: new Date().toISOString(), resultados });
}
