import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { isAiConfigured } from "@/lib/ai";
import { generarRespuestaAgente, type HistorialMensaje } from "@/lib/ai/agente";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { notificarPersona, notificarEncargados } from "@/lib/notificaciones";
import { registrarError } from "@/lib/logger";
import { z } from "zod";

const WebchatSchema = z.object({
  sessionId: z.string().trim().min(1).max(100),
  mensaje: z.string().trim().min(1).max(2000),
});

// Canal Web Chat: mismo agente de IA que WhatsApp (lib/ai/agente.ts), pero
// síncrono request/respuesta en vez de webhook. Tablas propias (web_chat_*),
// no toca whatsapp_conversaciones/whatsapp_mensajes.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const limite = rateLimit(ipDesdeRequest(req), { limite: 20, ventanaMs: 60 * 1000 });
  if (!limite.ok) {
    return NextResponse.json({ error: "Demasiados mensajes. Esperá un momento." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = WebchatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Faltan sessionId o mensaje." }, { status: 400 });
  }
  const { sessionId, mensaje } = parsed.data;

  let { data: conversacion } = await supabase
    .from("web_chat_conversaciones")
    .select("id, vehiculo_id, vendedor_id")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (!conversacion) {
    const { data: nueva, error: errorCreacion } = await supabase
      .from("web_chat_conversaciones")
      .insert({ session_id: sessionId })
      .select("id, vehiculo_id, vendedor_id")
      .single();
    if (errorCreacion) console.error("[webchat] error creando conversación:", errorCreacion.message);
    conversacion = nueva;
  }

  if (!conversacion) {
    return NextResponse.json({ error: "No se pudo crear la conversación." }, { status: 500 });
  }

  await supabase.from("web_chat_mensajes").insert({
    conversacion_id: conversacion.id,
    direccion: "in",
    texto: mensaje.trim(),
  });

  // Mismo criterio que WhatsApp: si la conversación ya tiene vendedor, avisale
  // directo a él/ella; si no, a los encargados.
  const mensajeNoti = `Chat web: ${mensaje.trim().slice(0, 120)}`;
  const linkNoti = `/panel/chat?conversacion=${conversacion.id}&canal=webchat`;
  if (conversacion.vendedor_id) {
    notificarPersona(supabase, conversacion.vendedor_id, "nuevo_mensaje_chat", mensajeNoti, linkNoti, "chat").catch((err) => console.error("[webchat] error notificando:", err));
  } else {
    notificarEncargados(supabase, mensajeNoti, linkNoti, "chat", "nuevo_mensaje_chat").catch((err) => console.error("[webchat] error notificando:", err));
  }

  if (!isAiConfigured()) {
    return NextResponse.json({
      reply: "¡Hola! En este momento no puedo responder automáticamente, pero un asesor va a ver tu consulta a la brevedad.",
    });
  }

  const { data: mensajes } = await supabase
    .from("web_chat_mensajes")
    .select("direccion, texto")
    .eq("conversacion_id", conversacion.id)
    .order("created_at", { ascending: true })
    .limit(20);

  const historial: HistorialMensaje[] = (mensajes ?? []).map((m) => ({
    role: m.direccion === "in" ? "user" : "assistant",
    content: m.texto,
  }));

  const result = await generarRespuestaAgente(historial, "api/webchat");

  if (!result.ok) {
    registrarError("api/webchat agente", result.error);
    return NextResponse.json({ reply: "Perdón, tuve un problema para responder. ¿Podés reformular tu consulta?" });
  }

  const { reply, handoff, calificacion, vehiculo_mencionado } = result.data;

  const estadoSegunCalificacion =
    calificacion === "caliente" ? "Interesado" :
    calificacion === "frio" ? "Perdido" : "Contactado";

  const update: Record<string, unknown> = { calificacion, estado_pipeline: estadoSegunCalificacion, updated_at: new Date().toISOString() };
  if (handoff) {
    update.handoff_at = new Date().toISOString();
    update.handoff_reason = "cliente_pidio_humano";
    update.ai_habilitada = false;
  }
  await supabase.from("web_chat_conversaciones").update(update).eq("id", conversacion.id);

  // Igual que en WhatsApp: si nombró marca+modelo y todavía no había auto vinculado,
  // lo vinculamos y le asignamos el vendedor que ya tiene ese auto en stock.
  if (vehiculo_mencionado?.marca && vehiculo_mencionado?.modelo && !conversacion.vehiculo_id) {
    const { data: auto } = await supabase
      .from("vehiculos")
      .select("id, vendedor_asignado_id")
      .ilike("marca", `%${vehiculo_mencionado.marca}%`)
      .ilike("modelo", `%${vehiculo_mencionado.modelo}%`)
      .in("estado", ["Disponible", "Reservado"])
      .limit(1)
      .maybeSingle();

    if (auto) {
      await supabase
        .from("web_chat_conversaciones")
        .update({ vehiculo_id: auto.id, vendedor_id: auto.vendedor_asignado_id ?? null })
        .eq("id", conversacion.id);
    }
  }

  await supabase.from("web_chat_mensajes").insert({
    conversacion_id: conversacion.id,
    direccion: "out",
    texto: reply,
    ai_generado: true,
  });

  return NextResponse.json({ reply, link: result.linkParaEnviar });
}
