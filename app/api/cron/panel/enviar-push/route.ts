import { createClient } from "@supabase/supabase-js";
import { enviarPush, pushConfigurado } from "@/lib/push";

// Corre cada 1 minuto (más seguido que el reenvío por WhatsApp, que corre
// cada 3 -- un push es instantáneo y no depende de la API de Meta, así que
// no hay motivo para hacer esperar más al usuario). Manda cada alerta nueva
// como notificación push nativa a todos los dispositivos que el
// destinatario tenga suscriptos (push_subscriptions) -- opt-in: si nunca
// aceptó el permiso del navegador, no tiene fila ahí y no le llega nada.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!pushConfigurado()) return Response.json({ ok: true, enviados: 0, motivo: "push no configurado (faltan VAPID keys)" });

  const { data: alertas } = await supabase
    .from("alertas")
    .select("id, destinatario_id, titulo, mensaje, link")
    .eq("push_enviado", false)
    .order("created_at", { ascending: true })
    .limit(100);
  if (!alertas || alertas.length === 0) return Response.json({ ok: true, enviados: 0 });

  const destinatarioIds = [...new Set(alertas.map((a) => a.destinatario_id))];
  const { data: subs } = await supabase.from("push_subscriptions").select("id, perfil_id, endpoint, p256dh, auth").in("perfil_id", destinatarioIds);
  const subsPorPerfil = new Map<string, typeof subs>();
  for (const s of subs || []) {
    const lista = subsPorPerfil.get(s.perfil_id) || [];
    lista.push(s);
    subsPorPerfil.set(s.perfil_id, lista);
  }

  let enviados = 0;
  const idsExpiradas: string[] = [];
  const idsProcesadas: string[] = [];

  for (const alerta of alertas) {
    idsProcesadas.push(alerta.id);
    const suscripciones = subsPorPerfil.get(alerta.destinatario_id) || [];
    for (const sub of suscripciones) {
      const resultado = await enviarPush(sub, { titulo: alerta.titulo, mensaje: alerta.mensaje, link: alerta.link });
      if (resultado.ok) enviados++;
      else if (resultado.expirada) idsExpiradas.push(sub.id);
    }
  }

  if (idsExpiradas.length) await supabase.from("push_subscriptions").delete().in("id", idsExpiradas);
  await supabase.from("alertas").update({ push_enviado: true }).in("id", idsProcesadas);

  return Response.json({ ok: true, enviados, procesadas: idsProcesadas.length, expiradasBorradas: idsExpiradas.length });
}
