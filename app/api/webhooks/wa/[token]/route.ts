import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { chatJson, isAiConfigured } from "@/lib/ai";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { sendTextMessage } from "@/lib/meta/client"; // ya lo tenés de antes
import { decrypt } from "@/lib/crypto"; // ya lo tenés de antes

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function tokenValido(token: string): boolean {
  const expected = process.env.META_WEBHOOK_VERIFY_TOKEN ?? "";
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!tokenValido(token)) return new Response("Not found", { status: 404 });

  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const verifyToken = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && verifyToken === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!tokenValido(token)) return new Response("Not found", { status: 404 });

  const rawBody = await req.text();

  const appSecret = process.env.META_APP_SECRET;
  if (appSecret) {
    const signature = req.headers.get("x-hub-signature-256") ?? "";
    const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
    if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const payload = JSON.parse(rawBody);
  procesarEvento(payload).catch((err) => console.error("[webhook] error procesando:", err));

  return Response.json({ received: true });
}

async function procesarEvento(payload: any) {
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;

      if (change.field === "messages") {
        const phoneNumberId = value.metadata?.phone_number_id;
        if (!phoneNumberId) continue;

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
}

async function ingestarMensaje({ waId, nombrePerfil, msg }: { waId: string; nombrePerfil: string | null; msg: any }) {
  const { data: contacto } = await supabase
    .from("whatsapp_contactos")
    .upsert(
      { telefono: waId, nombre_perfil: nombrePerfil },
      { onConflict: "telefono", ignoreDuplicates: false }
    )
    .select("id")
    .single();
  if (!contacto) return;

  let { data: conversacion } = await supabase
    .from("whatsapp_conversaciones")
    .select("id")
    .eq("contacto_id", contacto.id)
    .maybeSingle();

  if (!conversacion) {
    const { data: nueva } = await supabase
      .from("whatsapp_conversaciones")
      .insert({ contacto_id: contacto.id })
      .select("id")
      .single();
    conversacion = nueva;
  }
  if (!conversacion) return;

  const texto = msg.type === "text" ? msg.text?.body : null;
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
    if (error.code === "23505") return;
    console.error("[ingest] error insertando mensaje:", error);
    return;
  }

  await supabase
    .from("whatsapp_conversaciones")
    .update({
      last_inbound_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
    })
    .eq("id", conversacion.id);

  await ejecutarAgente(conversacion.id, contacto.id);
}

const AgentReplySchema = z.object({
  reply: z.string(),
  handoff: z.boolean(),
  calificacion: z.enum(["caliente", "tibio", "frio"]).nullable(),
  datos_detectados: z.object({
    timing: z.string().nullable(),
    forma_pago: z.string().nullable(),
    tiene_permuta: z.boolean().nullable(),
  }),
});

function isWhatsappEnvioConfigurado(): boolean {
  return !!process.env.META_WHATSAPP_TOKEN && !!process.env.META_WHATSAPP_PHONE_NUMBER_ID;
}

async function ejecutarAgente(conversacionId: string, contactoId: string) {
  if (!isAiConfigured()) return;

  const { data: mensajes } = await supabase
    .from("whatsapp_mensajes")
    .select("direccion, texto")
    .eq("conversacion_id", conversacionId)
    .order("created_at", { ascending: true })
    .limit(20);

  const historial = (mensajes ?? [])
    .filter((m) => m.texto)
    .map((m) => ({
      role: (m.direccion === "in" ? "user" : "assistant") as "user" | "assistant",
      content: m.texto as string,
    }));

  const result = await chatJson(AgentReplySchema, [
    { role: "system", content: buildSystemPrompt() },
    ...historial,
  ]);

  if (!result.ok) {
    console.error("[agente] error:", result.error);
    return;
  }

  const { reply, handoff, calificacion } = result.data;

  const estadoSegunCalificacion =
    calificacion === "caliente" ? "Interesado" :
    calificacion === "frio" ? "Perdido" : "Contactado";

  await supabase
    .from("whatsapp_conversaciones")
    .update({ calificacion, estado: estadoSegunCalificacion })
    .eq("id", conversacionId);

  const { data: mensajeSaliente } = await supabase
    .from("whatsapp_mensajes")
    .insert({
      conversacion_id: conversacionId,
      direccion: "out",
      tipo: "text",
      texto: reply,
      status: "pending",
      ai_generado: true,
    })
    .select("id")
    .single();

  if (mensajeSaliente) {
    await enviarYActualizarMensaje(mensajeSaliente.id, contactoId, reply);
  }

  if (handoff) {
    await supabase
      .from("whatsapp_conversaciones")
      .update({ handoff_at: new Date().toISOString(), handoff_reason: "cliente_pidio_humano", ai_habilitada: false })
      .eq("id", conversacionId);
  }

  console.log(`[agente] respuesta generada (calificación: ${calificacion ?? "sin definir"}): ${reply}`);
}

async function enviarYActualizarMensaje(mensajeId: string, contactoId: string, texto: string) {
  if (!isWhatsappEnvioConfigurado()) {
    console.warn("[whatsapp] META_WHATSAPP_TOKEN / META_WHATSAPP_PHONE_NUMBER_ID no configurados: mensaje queda 'pending' sin enviar.");
    return;
  }

  const { data: contacto } = await supabase
    .from("whatsapp_contactos")
    .select("telefono")
    .eq("id", contactoId)
    .single();
  if (!contacto) return;

  try {
    const resultado = await sendTextMessage(
      process.env.META_WHATSAPP_PHONE_NUMBER_ID!,
      process.env.META_WHATSAPP_TOKEN!,
      contacto.telefono,
      texto
    );
    await supabase
      .from("whatsapp_mensajes")
      .update({ status: "sent", wa_message_id: resultado.messages?.[0]?.id })
      .eq("id", mensajeId);
  } catch (err) {
    console.error("[whatsapp] error enviando mensaje:", err);
    await supabase.from("whatsapp_mensajes").update({ status: "failed" }).eq("id", mensajeId);
  }
}

async function actualizarEstadoMensaje(status: any) {
  const orden = ["pending", "sent", "delivered", "read"];
  const { data: msg } = await supabase
    .from("whatsapp_mensajes")
    .select("id, status")
    .eq("wa_message_id", status.id)
    .maybeSingle();
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