import { estimarSaldoIa, avisarSaldoIa } from "@/lib/ai/saldoIa";
import { registrarError } from "@/lib/panel/logger";

// Corre 1 vez por día vía pg_cron (ver migraciones/sql_ia_saldo.sql). Si el saldo ESTIMADO de la API de Anthropic
// quedó en el umbral configurado (por defecto US$ 5) o menos, avisa a los admin con una alerta en el panel.
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) return new Response("Unauthorized", { status: 401 });

  try {
    const e = await estimarSaldoIa();
    if (!e.configurado || e.restanteUsd == null) return Response.json({ ok: true, configurado: false });
    if (e.restanteUsd > e.umbralUsd) return Response.json({ ok: true, restanteUsd: Math.round(e.restanteUsd * 100) / 100, avisado: false });

    const restante = Math.max(0, e.restanteUsd).toLocaleString("es-AR", { maximumFractionDigits: 2 });
    const r = await avisarSaldoIa(
      `Quedan unos US$ ${restante} de crédito en la API de Anthropic`,
      `Saldo estimado: US$ ${restante} (aviso configurado en US$ ${e.umbralUsd}). Cargá crédito en console.anthropic.com antes de que el bot y el buscador dejen de responder. Es una estimación: si cargás el saldo real en Configuración > Empresa > IA, el cálculo se ajusta.`,
      24
    );
    return Response.json({ ok: true, restanteUsd: Math.round(e.restanteUsd * 100) / 100, avisado: r.avisado });
  } catch (err) {
    registrarError("cron/ia-saldo", err);
    return Response.json({ error: "No se pudo calcular el saldo de IA." }, { status: 500 });
  }
}
