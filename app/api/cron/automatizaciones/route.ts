import { createClient } from "@supabase/supabase-js";
import { sendTextMessage } from "@/lib/meta/client";
import { notificarPersona, notificarEncargados } from "@/lib/notificaciones";

// Corre cada 15 min vía pg_cron (ver SQL de configuración). Idempotente: cada
// automatización se registra en `automatizaciones_wa` (tipo, referencia_id
// únicos) antes de disparar, así un mismo evento nunca se manda dos veces
// aunque el cron corra de nuevo.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isWhatsappEnvioConfigurado(): boolean {
  return !!process.env.META_WHATSAPP_TOKEN && !!process.env.META_WHATSAPP_PHONE_NUMBER_ID;
}

async function yaSeEnvio(tipo: string, referenciaId: string): Promise<boolean> {
  const { data } = await supabase
    .from("automatizaciones_wa")
    .select("id")
    .eq("tipo", tipo)
    .eq("referencia_id", referenciaId)
    .maybeSingle();
  return !!data;
}

async function registrarEnvio(tipo: string, referenciaId: string) {
  await supabase.from("automatizaciones_wa").insert({ tipo, referencia_id: referenciaId }).select("id").maybeSingle();
}

async function enviarWA(telefono: string, texto: string) {
  if (!isWhatsappEnvioConfigurado()) return false;
  try {
    await sendTextMessage(process.env.META_WHATSAPP_PHONE_NUMBER_ID!, process.env.META_WHATSAPP_TOKEN!, telefono, texto);
    return true;
  } catch (err) {
    console.error("[cron-automatizaciones] error enviando WA:", err);
    return false;
  }
}

// A. Lead caliente sin respuesta interna del vendedor hace 24h+ — escala avisando
// (no le manda nada al cliente, es una notificación interna de la campanita).
async function escalarLeadsCalientesSinAtender() {
  const hace24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data: conversaciones } = await supabase
    .from("whatsapp_conversaciones")
    .select("id, vendedor_id, calificacion, last_inbound_at, whatsapp_contactos(nombre_perfil, telefono)")
    .eq("calificacion", "caliente")
    .lte("last_inbound_at", hace24h)
    .is("handoff_at", null);

  for (const c of conversaciones || []) {
    if (await yaSeEnvio("escalado_caliente_24h", c.id)) continue;
    const contacto = c.whatsapp_contactos as any;
    const nombreLead = contacto?.nombre_perfil || contacto?.telefono || "un lead";
    const mensaje = `${nombreLead} está calificado como caliente y hace 24hs+ que nadie le responde.`;
    const link = `/panel/chat?conversacion=${c.id}&canal=whatsapp`;
    if (c.vendedor_id) {
      await notificarPersona(supabase, c.vendedor_id, "lead_caliente_sin_atender", mensaje, link, "chat");
    } else {
      await notificarEncargados(supabase, mensaje, link, "chat", "lead_caliente_sin_atender");
    }
    await registrarEnvio("escalado_caliente_24h", c.id);
  }
}

// B. Agradecimiento por WhatsApp después de una venta confirmada (1-3hs después,
// ventana para que el cron lo agarre una sola vez sin mandarlo al instante).
async function agradecerVentasRecientes() {
  const hace1h = new Date(Date.now() - 1 * 3600 * 1000).toISOString();
  const hace3h = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
  const { data: ventas } = await supabase
    .from("boletos_venta")
    .select("id, nombre, telefono_celular, marca, modelo")
    .lte("created_at", hace1h)
    .gte("created_at", hace3h)
    .not("telefono_celular", "is", null);

  for (const v of ventas || []) {
    if (await yaSeEnvio("agradecimiento_venta", v.id)) continue;
    const texto = `¡Hola ${v.nombre || ""}! Desde Pfaffen Autos queríamos agradecerte por tu compra${v.marca ? ` del ${v.marca} ${v.modelo}` : ""} 🚗. Cualquier consulta sobre la documentación o el service, estamos para ayudarte.`;
    const enviado = await enviarWA(v.telefono_celular!, texto);
    if (enviado) await registrarEnvio("agradecimiento_venta", v.id);
  }
}

// C. A los 30-45 min de nuestro último mensaje, si el cliente no volvió a
// escribir, un empujoncito suave preguntando si quiere más info.
async function nudgeSinRespuesta() {
  const hace30min = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const hace45min = new Date(Date.now() - 45 * 60 * 1000).toISOString();
  const { data: conversaciones } = await supabase
    .from("whatsapp_conversaciones")
    .select("id, calificacion, last_message_at, last_inbound_at, whatsapp_contactos(telefono, nombre_perfil)")
    .lte("last_message_at", hace30min)
    .gte("last_message_at", hace45min)
    .is("handoff_at", null);

  for (const c of conversaciones || []) {
    // Si el último mensaje fue del cliente (last_inbound_at === last_message_at), ya nos toca a nosotros, no hace falta nudge.
    if (c.last_inbound_at === c.last_message_at) continue;
    if (await yaSeEnvio("nudge_30min", c.id)) continue;
    const contacto = c.whatsapp_contactos as any;
    if (!contacto?.telefono) continue;
    const texto = "¿Te gustaría que te pase más información, fotos o el precio actualizado? Cualquier cosa, estamos por acá.";
    const enviado = await enviarWA(contacto.telefono, texto);
    if (enviado) await registrarEnvio("nudge_30min", c.id);
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  await Promise.all([
    escalarLeadsCalientesSinAtender().catch((err) => console.error("[cron] error escalarLeadsCalientesSinAtender:", err)),
    agradecerVentasRecientes().catch((err) => console.error("[cron] error agradecerVentasRecientes:", err)),
    nudgeSinRespuesta().catch((err) => console.error("[cron] error nudgeSinRespuesta:", err)),
  ]);

  return Response.json({ ok: true, ranAt: new Date().toISOString() });
}
