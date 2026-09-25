import { createClient } from "@supabase/supabase-js";
import { sendTextMessage } from "@/lib/meta/client";
import { decrypt } from "@/lib/crypto";

// Opción 2 de notificaciones (charlada con el usuario 25/9): un vendedor que
// no entra seguido al CRM se pierde alertas reales (lead nuevo, handoff,
// etc). Este cron reenvía cada alerta nueva como mensaje de WhatsApp al
// número PERSONAL del destinatario (perfiles.whatsapp, el mismo campo que ya
// usa el sitio público para "hablale a este vendedor"), reusando el número/
// token de WhatsApp Business YA conectado para el bot de clientes -- no hace
// falta un número nuevo. Corre cada 3 minutos (ver
// migraciones/sql_cron_setup_completo.sql).
//
// Rol "ventas" -- SIEMPRE activo, sin opt-in: pedido del 25/9, los
// vendedores no tienen acceso al módulo Mi Espacio (así que nunca podrían
// prender el toggle "whatsapp_forward" ellos mismos), y son justo la
// audiencia que este reenvío busca cubrir (no entran seguido al CRM). El
// resto de los roles (admin, encargado, finanzas, gestoría) sigue siendo
// opt-in real vía Mi Espacio → Notificaciones -- si esos roles sí tienen
// acceso, respetamos lo que elijan.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

const SITE_URL = "https://www.pfaffencars.com";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: config } = await supabase.from("whatsapp_configuracion").select("*").eq("id", true).single();
  if (!config?.listo || !config.token_cifrado || !config.token_iv || !config.token_tag || !config.phone_number_id) {
    return Response.json({ ok: true, enviados: 0, motivo: "whatsapp no configurado" });
  }

  // Tope por corrida (60, cada 3 min) para no pegarle una ráfaga enorme a la
  // API de Meta si hubo un pico de alertas -- lo que sobre lo agarra la
  // corrida siguiente, whatsapp_enviado sigue en false hasta procesarse.
  const { data: alertas } = await supabase
    .from("alertas")
    .select("id, destinatario_id, titulo, mensaje, link, prioridad")
    .eq("whatsapp_enviado", false)
    .order("created_at", { ascending: true })
    .limit(60);
  if (!alertas || alertas.length === 0) return Response.json({ ok: true, enviados: 0 });

  const destinatarioIds = [...new Set(alertas.map((a) => a.destinatario_id))];
  const [{ data: perfiles }, { data: prefs }] = await Promise.all([
    supabase.from("perfiles").select("id, whatsapp, activo, roles").in("id", destinatarioIds),
    supabase.from("espacio_notif_prefs").select("perfil_id, whatsapp_forward").in("perfil_id", destinatarioIds),
  ]);
  const perfilPorId = new Map((perfiles || []).map((p) => [p.id, p]));
  const forwardHabilitado = new Set((prefs || []).filter((p) => p.whatsapp_forward).map((p) => p.perfil_id));
  const puedeReenviar = (perfilId: string) => {
    const perfil = perfilPorId.get(perfilId);
    if (perfil?.roles?.includes("ventas")) return true; // siempre activo, sin opt-in
    return forwardHabilitado.has(perfilId);
  };

  const tokenPlano = decrypt(config.token_cifrado, config.token_iv, config.token_tag);
  let enviados = 0;
  const idsProcesadas: string[] = [];

  for (const alerta of alertas) {
    idsProcesadas.push(alerta.id);
    const perfil = perfilPorId.get(alerta.destinatario_id);
    if (!perfil?.activo || !perfil.whatsapp || !puedeReenviar(alerta.destinatario_id)) continue;

    const texto = [`🔔 ${alerta.titulo}`, alerta.mensaje || null, alerta.link ? `${SITE_URL}${alerta.link}` : null]
      .filter(Boolean)
      .join("\n");
    try {
      await sendTextMessage(config.phone_number_id, tokenPlano, perfil.whatsapp, texto);
      enviados++;
    } catch (err) {
      // Best-effort: si falla el envío (número mal cargado, ventana de 24hs
      // vencida, Meta caída) no reintenta en la corrida siguiente -- se
      // marca igual como procesada más abajo para no pegarle en loop a la
      // API con un número que nunca va a andar.
      console.error("[cron/notificar-whatsapp-vendedores] error enviando", alerta.id, err);
    }
  }

  // Se marcan TODAS las procesadas en esta corrida (se hayan mandado o no) --
  // el filtro de "no le toca a este destinatario" no es un error transitorio,
  // reintentarlo no cambia nada.
  await supabase.from("alertas").update({ whatsapp_enviado: true }).in("id", idsProcesadas);

  return Response.json({ ok: true, enviados, procesadas: idsProcesadas.length });
}
