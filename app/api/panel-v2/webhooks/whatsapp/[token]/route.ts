import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { isAiConfiguredV2 } from "@/lib/ai/indexV2";
import { generarRespuestaAgenteV2, dividirRespuestaEnMensajes } from "@/lib/ai/agenteV2";
import { sendTextMessage } from "@/lib/meta/client";
import { decrypt } from "@/lib/crypto";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";

// Webhook de Meta para el WhatsApp de panel-v2 (Conversaciones → WhatsApp,
// replica /panel/chat de v1: bandeja de mensajes reales de clientes con
// asignación por ronda, con el mismo agente de respuesta automática que ya
// tenía v1 ahí). Sin relación con Rodi — Rodi es el chatbot del sitio
// público (home), un módulo totalmente aparte. Las credenciales (token del
// bot, phone_number_id, webhook_verify_token) están cifradas en
// whatsapp_configuracion (Configuración → WhatsApp), no en env vars como v1
// — así cada instalación puede tener su propio número sin redeployar.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

async function tokenValido(token: string): Promise<boolean> {
  const { data } = await supabase.from("whatsapp_configuracion").select("webhook_verify_token").eq("id", true).single();
  const expected = data?.webhook_verify_token ?? "";
  if (!expected) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await tokenValido(token))) return new Response("Not found", { status: 404 });

  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const verifyToken = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const { data: config } = await supabase.from("whatsapp_configuracion").select("webhook_verify_token").eq("id", true).single();
  if (mode === "subscribe" && verifyToken === config?.webhook_verify_token) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  // Endpoint público — Meta reintenta legítimo, pero sin límite cualquiera
  // que le pegue directo a la URL puede disparar llamadas pagas a Anthropic
  // sin freno. Generoso (60/min) para no frenar entregas reales de Meta.
  const limite = rateLimit(ipDesdeRequest(req), { limite: 60, ventanaMs: 60 * 1000 });
  if (!limite.ok) return new Response("Too many requests", { status: 429 });

  const { token } = await params;
  if (!(await tokenValido(token))) return new Response("Not found", { status: 404 });

  const rawBody = await req.text();

  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    console.error("[webhook-v2] META_APP_SECRET no está configurada.");
    return new Response("Unauthorized", { status: 401 });
  }

  const signature = req.headers.get("x-hub-signature-256") ?? "";
  const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  // Hay que esperar el procesamiento antes de responder: en el runtime
  // serverless de Vercel, la función se congela apenas se devuelve la
  // respuesta, así que "fire and forget" nunca llega a terminar y el
  // mensaje entrante se pierde sin guardarse.
  try {
    await procesarEvento(payload);
  } catch (err) {
    console.error("[webhook-v2] error procesando:", err);
  }

  return Response.json({ received: true });
}

async function procesarEvento(payload: any) {
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (change.field !== "messages") continue;

      for (const msg of value.messages ?? []) {
        const waId = msg.from;
        const nombrePerfil = value.contacts?.find((c: any) => c.wa_id === waId)?.profile?.name ?? null;
        await ingestarMensaje({ waId, nombrePerfil, msg });
      }
      for (const status of value.statuses ?? []) {
        await actualizarEstadoMensaje(status);
      }
    }
  }
}

async function ingestarMensaje({ waId, nombrePerfil, msg }: { waId: string; nombrePerfil: string | null; msg: any }) {
  const { data: contacto } = await supabase
    .from("whatsapp_contactos")
    .upsert({ telefono: waId, nombre_perfil: nombrePerfil }, { onConflict: "telefono", ignoreDuplicates: false })
    .select("id")
    .single();
  if (!contacto) return;

  let { data: conversacion } = await supabase
    .from("whatsapp_conversaciones")
    .select("id, vendedor_id, ai_habilitada")
    .eq("contacto_id", contacto.id)
    .maybeSingle();

  if (!conversacion) {
    // El trigger asignar_vendedor_conversacion_nueva le pone vendedor solo
    // (ronda) antes de que termine el insert.
    const { data: nueva } = await supabase.from("whatsapp_conversaciones").insert({ contacto_id: contacto.id }).select("id, vendedor_id, ai_habilitada").single();
    conversacion = nueva;
  }
  if (!conversacion) return;

  if (msg.referral?.headline) {
    await supabase.from("whatsapp_conversaciones").update({ origen_ads: msg.referral.headline }).eq("id", conversacion.id);
  }

  // Cuando el cliente toca una opción de la lista interactiva del menú de
  // bienvenida, Meta manda type "interactive" con interactive.list_reply en
  // vez de texto — se usa el título de la opción como si lo hubiera tipeado,
  // así el agente lo procesa igual que cualquier mensaje de texto.
  const texto = msg.type === "text"
    ? msg.text?.body
    : msg.type === "interactive"
      ? (msg.interactive?.list_reply?.title ?? msg.interactive?.button_reply?.title ?? null)
      : null;
  const { error } = await supabase.from("whatsapp_mensajes").insert({
    conversacion_id: conversacion.id,
    wa_message_id: msg.id,
    direccion: "in",
    tipo: msg.type ?? "text",
    texto,
    status: "received",
    wa_timestamp: new Date(Number(msg.timestamp) * 1000).toISOString(),
  });
  if (error) {
    if (error.code === "23505") return; // duplicado (reintento de Meta)
    console.error("[webhook-v2] error insertando mensaje:", error);
    return;
  }

  const { data: convActual } = await supabase.from("whatsapp_conversaciones").select("unread_count").eq("id", conversacion.id).single();
  await supabase.from("whatsapp_conversaciones").update({ last_inbound_at: new Date().toISOString(), last_message_at: new Date().toISOString(), unread_count: (convActual?.unread_count ?? 0) + 1 }).eq("id", conversacion.id);
  // Las alertas de "nuevo mensaje" y "handoff" las dispara el trigger sobre
  // whatsapp_mensajes/whatsapp_conversaciones — no hace falta repetirlas acá.

  await ejecutarAgente(conversacion.id);
}

const RESPUESTA_FALLBACK = "¡Hola! Gracias por escribirnos a Pfaffen Autos. En breve te contacta uno de nuestros asesores. 🚗";

function isWhatsappEnvioConfigurado(config: any): boolean {
  return !!config?.listo && !!config?.token_cifrado && !!config?.token_iv && !!config?.token_tag && !!config?.phone_number_id;
}

// Horario de atención: 8 a 22, hora Argentina — mismo criterio que v1.
function estaEnHorarioAtencion(): boolean {
  const hora = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Argentina/Buenos_Aires", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  return hora >= 8 && hora < 22;
}

async function ejecutarAgente(conversacionId: string) {
  if (!isAiConfiguredV2()) return;
  if (!estaEnHorarioAtencion()) return;

  const { data: conversacionActual } = await supabase.from("whatsapp_conversaciones").select("ai_habilitada").eq("id", conversacionId).single();
  if (conversacionActual?.ai_habilitada === false) return;

  const { data: mensajes } = await supabase.from("whatsapp_mensajes").select("direccion, texto").eq("conversacion_id", conversacionId).order("created_at", { ascending: true }).limit(20);
  const historial = (mensajes ?? []).filter((m) => m.texto).map((m) => ({ role: (m.direccion === "in" ? "user" : "assistant") as "user" | "assistant", content: m.texto as string }));

  const result = await generarRespuestaAgenteV2(historial, "panel-v2/webhooks/whatsapp");
  const { data: config } = await supabase.from("whatsapp_configuracion").select("*").eq("id", true).single();

  if (!result.ok) {
    console.error("[webhook-v2] error del agente:", result.error);
    const { data: mensajeFallback } = await supabase.from("whatsapp_mensajes").insert({ conversacion_id: conversacionId, direccion: "out", tipo: "text", texto: RESPUESTA_FALLBACK, status: "pending", ai_generado: false }).select("id").single();
    if (mensajeFallback) await enviarYActualizarMensaje(mensajeFallback.id, conversacionId, RESPUESTA_FALLBACK, config);
    return;
  }

  const { reply, handoff, calificacion, resumen_handoff, datos_detectados } = result.data;

  const estadoSegunCalificacion = calificacion === "caliente" ? "calificando" : undefined;
  const patchConversacion: Record<string, unknown> = { calificacion };
  if (estadoSegunCalificacion) patchConversacion.estado_lead = estadoSegunCalificacion;
  await supabase.from("whatsapp_conversaciones").update(patchConversacion).eq("id", conversacionId);

  // Nombre y mail que el cliente vaya dando durante la charla se guardan en
  // el contacto apenas se detectan, sin esperar al handoff — así quedan
  // aunque la charla se corte antes de derivar a un vendedor.
  if (datos_detectados?.nombre || datos_detectados?.email) {
    const { data: conv } = await supabase.from("whatsapp_conversaciones").select("contacto_id").eq("id", conversacionId).single();
    if (conv?.contacto_id) {
      const patchContacto: Record<string, unknown> = {};
      if (datos_detectados.nombre) patchContacto.nombre_perfil = datos_detectados.nombre;
      if (datos_detectados.email) patchContacto.email = datos_detectados.email;
      await supabase.from("whatsapp_contactos").update(patchContacto).eq("id", conv.contacto_id);
    }
  }

  // Cuando el agente muestra opciones de stock, "reply" viene partido en
  // varias burbujas (lista de autos + pregunta corta abajo) — se mandan como
  // mensajes de WhatsApp separados, en orden, no todo apelotonado en uno.
  for (const parte of dividirRespuestaEnMensajes(reply)) {
    const { data: mensajeSaliente } = await supabase.from("whatsapp_mensajes").insert({ conversacion_id: conversacionId, direccion: "out", tipo: "text", texto: parte, status: "pending", ai_generado: true }).select("id").single();
    if (mensajeSaliente) await enviarYActualizarMensaje(mensajeSaliente.id, conversacionId, parte, config);
  }

  if (handoff) {
    await supabase.from("whatsapp_conversaciones").update({
      handoff_at: new Date().toISOString(), handoff_reason: "cliente_pidio_humano",
      handoff_resumen: resumen_handoff || null,
    }).eq("id", conversacionId);
    // La alerta de handoff la dispara el trigger sobre whatsapp_conversaciones,
    // que ahora incluye este resumen en el mensaje de la alerta.
  }
}

async function enviarYActualizarMensaje(mensajeId: string, conversacionId: string, texto: string, config: any) {
  if (!isWhatsappEnvioConfigurado(config)) {
    console.warn("[webhook-v2] WhatsApp no está configurado — mensaje queda 'pending' sin enviar.");
    return;
  }

  const { data: conversacion } = await supabase.from("whatsapp_conversaciones").select("contacto_id, whatsapp_contactos(telefono)").eq("id", conversacionId).single();
  const telefono = (conversacion?.whatsapp_contactos as any)?.telefono;
  if (!telefono) return;

  try {
    const tokenPlano = decrypt(config.token_cifrado, config.token_iv, config.token_tag);
    const resultado = await sendTextMessage(config.phone_number_id, tokenPlano, telefono, texto);
    await supabase.from("whatsapp_mensajes").update({ status: "sent", wa_message_id: resultado.messages?.[0]?.id }).eq("id", mensajeId);
  } catch (err) {
    console.error("[webhook-v2] error enviando mensaje:", err);
    await supabase.from("whatsapp_mensajes").update({ status: "failed" }).eq("id", mensajeId);
  }
}

async function actualizarEstadoMensaje(status: any) {
  const orden = ["pending", "sent", "delivered", "read"];
  const { data: msg } = await supabase.from("whatsapp_mensajes").select("id, status").eq("wa_message_id", status.id).maybeSingle();
  if (!msg) return;

  if (status.status === "failed") {
    await supabase.from("whatsapp_mensajes").update({ status: "failed" }).eq("id", msg.id);
    return;
  }
  const actualIdx = orden.indexOf(msg.status);
  const nuevoIdx = orden.indexOf(status.status);
  if (nuevoIdx > actualIdx) {
    await supabase.from("whatsapp_mensajes").update({ status: status.status }).eq("id", msg.id);
  }
}
