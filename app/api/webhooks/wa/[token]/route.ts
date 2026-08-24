import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { isAiConfigured } from "@/lib/ai";
import { generarRespuestaAgente } from "@/lib/ai/agente";
import { sendTextMessage } from "@/lib/meta/client"; // ya lo tenés de antes
import { decrypt } from "@/lib/crypto"; // ya lo tenés de antes
import { notificarPersona, notificarEncargados } from "@/lib/notificaciones";
import { registrarError } from "@/lib/logger";

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
  if (!appSecret) {
    console.error("[webhook] Error: META_APP_SECRET is not configured in environment variables.");
    return new Response("Unauthorized", { status: 401 });
  }

  const signature = req.headers.get("x-hub-signature-256") ?? "";
  const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return new Response("Unauthorized", { status: 401 });
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
    .select("id, vendedor_id")
    .eq("contacto_id", contacto.id)
    .maybeSingle();

  if (!conversacion) {
    const { data: nueva } = await supabase
      .from("whatsapp_conversaciones")
      .insert({ contacto_id: contacto.id })
      .select("id, vendedor_id")
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
    registrarError("api/webhooks/wa ingest", error);
    return;
  }

  await supabase
    .from("whatsapp_conversaciones")
    .update({
      last_inbound_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
    })
    .eq("id", conversacion.id);

  if (msg.referral) {
    await vincularAutoDesdeAnuncio(conversacion.id, msg.referral);
  }

  const nombreLead = nombrePerfil || waId;
  const mensajeNoti = `${nombreLead}: ${texto || "envió un mensaje"}`;
  const linkNoti = `/panel/chat?conversacion=${conversacion.id}&canal=whatsapp`;
  if (conversacion.vendedor_id) {
    notificarPersona(supabase, conversacion.vendedor_id, "nuevo_mensaje_chat", mensajeNoti, linkNoti, "chat").catch((err) => console.error("[wa] error notificando:", err));
  } else {
    notificarEncargados(supabase, mensajeNoti, linkNoti, "chat", "nuevo_mensaje_chat").catch((err) => console.error("[wa] error notificando:", err));
  }

  await ejecutarAgente(conversacion.id, contacto.id);
}

// Escritura compartida: vincula auto + vendedor asignado a una conversación.
async function asignarVehiculoYVendedor(conversacionId: string, vehiculoId: string, vendedorId: string | null, origenAds?: string) {
  const update: Record<string, unknown> = { vehiculo_id: vehiculoId };
  if (vendedorId) update.vendedor_id = vendedorId;
  if (origenAds) update.origen_ads = origenAds;
  await supabase.from("whatsapp_conversaciones").update(update).eq("id", conversacionId);
}

// Si el lead menciona un auto puntual, lo vinculamos. El vendedor sale directo
// de vehiculos.vendedor_asignado_id (cada auto ya tiene su vendedor). Si el auto
// no tiene vendedor asignado, la conversación queda sin asignar para repartirse a mano.
async function vincularAutoYAsignar(conversacionId: string, marca: string, modelo: string) {
  const { data: auto } = await supabase
    .from("vehiculos")
    .select("id, vendedor_asignado_id")
    .ilike("marca", `%${marca}%`)
    .ilike("modelo", `%${modelo}%`)
    .in("estado", ["Disponible", "Reservado"])
    .limit(1)
    .maybeSingle();

  if (!auto) return;

  await asignarVehiculoYVendedor(conversacionId, auto.id, auto.vendedor_asignado_id ?? null);
}

// Meta manda "referral" en el primer mensaje de un Click-to-WhatsApp Ad (headline/body
// del anuncio). Si el título/texto matchea un auto en stock, vinculamos al instante sin
// esperar a que la IA lo infiera charlando.
async function vincularAutoDesdeAnuncio(conversacionId: string, referral: { headline?: string; body?: string }) {
  const textoAnuncio = `${referral.headline ?? ""} ${referral.body ?? ""}`.toLowerCase();
  if (!textoAnuncio.trim()) return;

  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select("id, marca, modelo, vendedor_asignado_id")
    .in("estado", ["Disponible", "Reservado"]);

  const match = (vehiculos ?? []).find(
    (v) => v.marca && v.modelo && textoAnuncio.includes(v.marca.toLowerCase()) && textoAnuncio.includes(v.modelo.toLowerCase())
  );
  if (!match) return;

  await asignarVehiculoYVendedor(conversacionId, match.id, match.vendedor_asignado_id ?? null, referral.headline);
}

// Si después de un par de mensajes la IA no logra identificar qué auto busca el
// cliente, no lo dejamos sin asignar para siempre: se lo tira a un vendedor activo al azar.
async function asignarVendedorAlAzar(conversacionId: string) {
  const { data: vendedores } = await supabase
    .from("perfiles")
    .select("id")
    .eq("rol", "vendedor")
    .eq("activo", true);

  if (!vendedores || vendedores.length === 0) return;

  const elegido = vendedores[Math.floor(Math.random() * vendedores.length)];
  await supabase
    .from("whatsapp_conversaciones")
    .update({ vendedor_id: elegido.id })
    .eq("id", conversacionId);
}

const RESPUESTA_FALLBACK =
  "¡Hola! Gracias por escribirnos a Pfaffen Autos. En breve te contacta uno de nuestros asesores. 🚗";

function isWhatsappEnvioConfigurado(): boolean {
  return !!process.env.META_WHATSAPP_TOKEN && !!process.env.META_WHATSAPP_PHONE_NUMBER_ID;
}

async function ejecutarAgente(conversacionId: string, contactoId: string) {
  if (!isAiConfigured()) return;

  const { data: conversacionActual } = await supabase
    .from("whatsapp_conversaciones")
    .select("ai_habilitada")
    .eq("id", conversacionId)
    .single();
  if (conversacionActual?.ai_habilitada === false) return; // ya tomó un humano, no interferir

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

  const result = await generarRespuestaAgente(historial, "api/webhooks/wa");

  if (!result.ok) {
    registrarError("api/webhooks/wa agente", result.error);
    // Fallback básico sin IA (ej: sin crédito en Anthropic) — mejor una respuesta
    // genérica que dejar al cliente sin nada.
    const { data: mensajeFallback } = await supabase
      .from("whatsapp_mensajes")
      .insert({
        conversacion_id: conversacionId,
        direccion: "out",
        tipo: "text",
        texto: RESPUESTA_FALLBACK,
        status: "pending",
        ai_generado: false,
      })
      .select("id")
      .single();
    if (mensajeFallback) {
      await enviarYActualizarMensaje(mensajeFallback.id, contactoId, RESPUESTA_FALLBACK);
    }
    return;
  }

  const { reply, handoff, calificacion, vehiculo_mencionado } = result.data;
  const linkParaEnviar = result.linkParaEnviar;

  // Frío no es "perdido" — es solo temperatura baja, sigue en el pipeline y
  // puede reactivarse solo (ver api/vehiculos/reactivar-leads). "Perdido" es
  // un estado que solo pone el vendedor a mano cuando confirma que se cayó.
  const estadoSegunCalificacion = calificacion === "caliente" ? "Interesado" : "Contactado";

  await supabase
    .from("whatsapp_conversaciones")
    .update({ calificacion, estado: estadoSegunCalificacion })
    .eq("id", conversacionId);

  if (vehiculo_mencionado?.marca && vehiculo_mencionado?.modelo) {
    const { data: conv } = await supabase
      .from("whatsapp_conversaciones")
      .select("vehiculo_id")
      .eq("id", conversacionId)
      .single();
    if (!conv?.vehiculo_id) {
      await vincularAutoYAsignar(conversacionId, vehiculo_mencionado.marca, vehiculo_mencionado.modelo);
    }
  } else {
    // Sin auto identificado: si ya le repreguntamos y en 2 o más mensajes del
    // cliente sigue sin decir marca/modelo, no lo dejamos sin asignar.
    const mensajesCliente = historial.filter((m) => m.role === "user").length;
    if (mensajesCliente >= 2) {
      const { data: conv } = await supabase
        .from("whatsapp_conversaciones")
        .select("vehiculo_id, vendedor_id")
        .eq("id", conversacionId)
        .single();
      if (!conv?.vehiculo_id && !conv?.vendedor_id) {
        await asignarVendedorAlAzar(conversacionId);
      }
    }
  }

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

  if (linkParaEnviar) {
    await enviarLink(contactoId, linkParaEnviar);
  }

  if (handoff) {
    const { data: convHandoff } = await supabase
      .from("whatsapp_conversaciones")
      .update({ handoff_at: new Date().toISOString(), handoff_reason: "cliente_pidio_humano", ai_habilitada: false })
      .eq("id", conversacionId)
      .select("vendedor_id")
      .single();
    const linkNoti = `/panel/chat?conversacion=${conversacionId}&canal=whatsapp`;
    const mensajeNoti = "El cliente pidió hablar con una persona — la IA dejó de responder.";
    if (convHandoff?.vendedor_id) {
      notificarPersona(supabase, convHandoff.vendedor_id, "handoff_chat", mensajeNoti, linkNoti, "chat").catch((err) => console.error("[wa] error notificando handoff:", err));
    } else {
      notificarEncargados(supabase, mensajeNoti, linkNoti, "chat", "handoff_chat").catch((err) => console.error("[wa] error notificando handoff:", err));
    }
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
    registrarError("api/webhooks/wa enviando mensaje", err);
    await supabase.from("whatsapp_mensajes").update({ status: "failed" }).eq("id", mensajeId);
  }
}

// Best-effort: si falla el envío del link no rompe la conversación, ya se mandó el texto.
// Le pasamos la ficha real del catálogo (fotos completas, specs, precio
// actualizado) en vez de una sola foto suelta.
async function enviarLink(contactoId: string, link: string) {
  if (!isWhatsappEnvioConfigurado()) return;

  const { data: contacto } = await supabase
    .from("whatsapp_contactos")
    .select("telefono")
    .eq("id", contactoId)
    .single();
  if (!contacto) return;

  try {
    await sendTextMessage(
      process.env.META_WHATSAPP_PHONE_NUMBER_ID!,
      process.env.META_WHATSAPP_TOKEN!,
      contacto.telefono,
      `Mirá todos los detalles acá: ${link}`
    );
  } catch (err) {
    registrarError("api/webhooks/wa enviando link", err);
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