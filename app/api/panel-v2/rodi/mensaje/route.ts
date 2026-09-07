import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { generarRespuestaAgenteV2, dividirRespuestaEnMensajes } from "@/lib/ai/agenteV2";
import { isAiConfiguredV2 } from "@/lib/ai/indexV2";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/panelV2/logger";

// Endpoint público (sin sesión — lo llama el widget del sitio, un visitante
// anónimo) que procesa un mensaje de Rodi. Identidad = sessionId generado
// por el frontend del widget (uuid en localStorage), no hay teléfono.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

const MensajeSchema = z.object({
  sessionId: z.string().min(8).max(200),
  texto: z.string().trim().min(1).max(2000),
  origenPagina: z.string().max(300).optional(),
  nombre: z.string().max(200).optional(),
  telefono: z.string().max(50).optional(),
  email: z.string().email().max(200).optional(),
});

export async function POST(request: Request) {
  const limite = await rateLimit(ipDesdeRequest(request), { limite: 20, ventanaMs: 60 * 1000, proyecto: "v2" });
  if (!limite.ok) {
    return NextResponse.json({ error: "Demasiados mensajes. Esperá un momento." }, { status: 429 });
  }

  const parsed = MensajeSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }
  const { sessionId, texto, origenPagina, nombre, telefono, email } = parsed.data;

  // Endpoint público del widget del sitio -- si algo revienta acá (red, IA,
  // supabase) antes no quedaba registro en ningún lado salvo los logs de
  // Vercel, invisibles desde el panel. Try/catch + registrarError para que
  // aparezca en Errores del sistema como cualquier otro canal.
  try {
    return await procesarMensaje({ sessionId, texto, origenPagina, nombre, telefono, email });
  } catch (err) {
    registrarError("api/panel-v2/rodi/mensaje", err, { sessionId });
    return NextResponse.json({ replies: ["¡Hola! Gracias por escribirnos a Pfaffen Autos. En breve te contacta uno de nuestros asesores. 🚗"], handoff: false });
  }
}

async function procesarMensaje({ sessionId, texto, origenPagina, nombre, telefono, email }: {
  sessionId: string; texto: string; origenPagina?: string; nombre?: string; telefono?: string; email?: string;
}) {
  let { data: conversacion } = await supabase.from("rodi_conversaciones").select("*").eq("session_id", sessionId).maybeSingle();

  if (!conversacion) {
    const { data: nueva, error } = await supabase
      .from("rodi_conversaciones")
      .insert({ session_id: sessionId, origen_pagina: origenPagina || null, nombre_contacto: nombre || null, telefono_contacto: telefono || null, email_contacto: email || null })
      .select("*")
      .single();
    if (error || !nueva) {
      return NextResponse.json({ error: "No se pudo iniciar la conversación." }, { status: 500 });
    }
    conversacion = nueva;
  } else {
    const patch: Record<string, unknown> = {};
    if (nombre && !conversacion.nombre_contacto) patch.nombre_contacto = nombre;
    if (telefono && !conversacion.telefono_contacto) patch.telefono_contacto = telefono;
    if (email && !conversacion.email_contacto) patch.email_contacto = email;
    if (Object.keys(patch).length > 0) await supabase.from("rodi_conversaciones").update(patch).eq("id", conversacion.id);
  }

  await supabase.from("rodi_mensajes").insert({ conversacion_id: conversacion.id, direccion: "in", texto });
  await supabase.from("rodi_conversaciones").update({
    last_message_at: new Date().toISOString(),
    unread_count: (conversacion.unread_count ?? 0) + 1,
  }).eq("id", conversacion.id);

  if (conversacion.ai_habilitada === false || !isAiConfiguredV2()) {
    return NextResponse.json({ replies: [], handoff: conversacion.ai_habilitada === false });
  }

  const { data: mensajesPrevios } = await supabase.from("rodi_mensajes").select("direccion, texto").eq("conversacion_id", conversacion.id).order("created_at", { ascending: true }).limit(20);
  const historial = (mensajesPrevios ?? []).map((m) => ({ role: (m.direccion === "in" ? "user" : "assistant") as "user" | "assistant", content: m.texto }));

  const result = await generarRespuestaAgenteV2(historial, "panel-v2/rodi", "Rodi");

  if (!result.ok) {
    registrarError("api/panel-v2/rodi/mensaje:agente", result.error, { conversacionId: conversacion.id });
    return NextResponse.json({ replies: ["¡Hola! Gracias por escribirnos a Pfaffen Autos. En breve te contacta uno de nuestros asesores. 🚗"], handoff: false });
  }

  const { reply, handoff, calificacion, resumen_handoff, datos_detectados } = result.data;
  const partes = dividirRespuestaEnMensajes(reply);

  for (const parte of partes) {
    await supabase.from("rodi_mensajes").insert({ conversacion_id: conversacion.id, direccion: "out", texto: parte, ai_generado: true });
  }
  await supabase.from("rodi_conversaciones").update({ calificacion }).eq("id", conversacion.id);

  // Nombre/email/teléfono que el cliente vaya dando durante la charla se
  // guardan apenas se detectan, sin esperar al handoff — así quedan aunque
  // la charla se corte antes de derivar a un vendedor (antes solo se
  // guardaban si venían en el body inicial del widget, nunca lo que la IA
  // extraía del texto de la conversación).
  if (datos_detectados?.nombre || datos_detectados?.email || datos_detectados?.telefono) {
    const patch: Record<string, unknown> = {};
    if (datos_detectados.nombre && !conversacion.nombre_contacto) patch.nombre_contacto = datos_detectados.nombre;
    if (datos_detectados.email && !conversacion.email_contacto) patch.email_contacto = datos_detectados.email;
    if (datos_detectados.telefono && !conversacion.telefono_contacto) patch.telefono_contacto = datos_detectados.telefono;
    if (Object.keys(patch).length > 0) await supabase.from("rodi_conversaciones").update(patch).eq("id", conversacion.id);
  }
  if (handoff) {
    await supabase.from("rodi_conversaciones").update({
      handoff_at: new Date().toISOString(), handoff_reason: "cliente_pidio_humano", ai_habilitada: false,
      handoff_resumen: resumen_handoff || null,
    }).eq("id", conversacion.id);
  }

  return NextResponse.json({ replies: partes, handoff });
}
