import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { NEGOCIO_CONFIG } from "@/data/NegocioConfig";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";

// =====================================================================
// 🎛️ BUSCADOR HÍBRIDO
// 1. Reglas primero (0 tokens): institucional (horarios/sucursales/políticas)
//    y stock por keyword directo.
// 2. Si nada matchea con confianza, recién ahí cae a la IA (Claude + stock
//    en vivo) para interpretar lenguaje natural más complejo.
// =====================================================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
);

function logPregunta(pregunta: string, respondida: boolean) {
  if (!pregunta.trim()) return;
  supabase
    .from("chatbot_log")
    .insert({ pregunta, respondida })
    .then(({ error }) => {
      if (error) console.error("Error registrando pregunta del chatbot:", error);
    });
}

export async function POST(request: Request) {
  try {
    const limite = rateLimit(ipDesdeRequest(request), { limite: 20, ventanaMs: 60 * 1000 });
    if (!limite.ok) {
      return NextResponse.json({ error: "Demasiados mensajes. Esperá un momento." }, { status: 429 });
    }

    const body = await request.json();
    const rawMessages = body.messages || [];
    const preguntaOriginal = rawMessages[rawMessages.length - 1]?.content || "";
    const ultimoMensaje = preguntaOriginal.toLowerCase();

    const { data: vehiculos } = await supabase
      .from("vehiculos")
      .select("marca, modelo, anio, precio_publicado_ars, tipo, kilometraje, estado")
      .eq("estado", "Disponible");

    const vehiculosList = vehiculos ?? [];

    // =================================================================
    // PASO 1: REGLAS (0 tokens de IA)
    // =================================================================
    const autoEncontrado = vehiculosList.filter(v =>
      ultimoMensaje.includes(v.marca.toLowerCase()) ||
      ultimoMensaje.includes(v.modelo.toLowerCase()) ||
      ultimoMensaje.includes("auto") ||
      ultimoMensaje.includes("stock") ||
      ultimoMensaje.includes("tienen")
    );

    // --- RESPUESTA DE STOCK POR KEYWORD DIRECTO ---
    if (autoEncontrado.length > 0 && (
      ultimoMensaje.includes("tienen") ||
      ultimoMensaje.includes("stock") ||
      ultimoMensaje.includes("auto") ||
      vehiculosList.some(v => ultimoMensaje.includes(v.marca.toLowerCase()))
    )) {
      const listadoStock = autoEncontrado
        .map(v => `🚗 **${v.marca} ${v.modelo}** (${v.anio})\n💰 Precio: **$${v.precio_publicado_ars?.toLocaleString("es-AR")}**\n🛣️ Kilometraje: ${v.kilometraje} km\n`)
        .join("\n");

      logPregunta(preguntaOriginal, true);
      return NextResponse.json({ reply: `¡Sí! Tenemos estas opciones disponibles en stock:\n\n${listadoStock}` });
    }

    // --- RESPUESTAS INSTITUCIONALES ---
    let respuestaLocal: string | null = null;

    if (ultimoMensaje.includes("horario") || ultimoMensaje.includes("hora")) {
      respuestaLocal = `🕒 **Nuestros Horarios de Atención:**\n\n${NEGOCIO_CONFIG.contacto.horarios}\n\n¡Te esperamos!`;
    }
    else if (ultimoMensaje.includes("sucursal") || ultimoMensaje.includes("donde") || ultimoMensaje.includes("direccion") || ultimoMensaje.includes("ubicacion")) {
      const listaSucursales = NEGOCIO_CONFIG.sucursales.map(s =>
        `📍 **${s.nombre}**\n🗺️ ${s.direccion}\n📞 ${s.telefono}`
      ).join("\n\n");
      respuestaLocal = `🏢 **Nuestras Sucursales:**\n\n${listaSucursales}`;
    }
    else if (ultimoMensaje.includes("financiacion") || ultimoMensaje.includes("cuotas") || ultimoMensaje.includes("credito")) {
      respuestaLocal = `💳 **Planes de Financiación:**\n\n${NEGOCIO_CONFIG.politicas.financiacion}`;
    }
    else if (ultimoMensaje.includes("consignacion") || ultimoMensaje.includes("vender") || ultimoMensaje.includes("consignar")) {
      respuestaLocal = `🤝 **Consignación de Vehículos:**\n\n${NEGOCIO_CONFIG.politicas.consignacion}`;
    }
    else if (ultimoMensaje.includes("permuta") || ultimoMensaje.includes("parte de pago")) {
      respuestaLocal = `🔄 **Permutas:**\n\n${NEGOCIO_CONFIG.politicas.permutas}`;
    }

    if (respuestaLocal) {
      logPregunta(preguntaOriginal, true);
      return NextResponse.json({ reply: respuestaLocal });
    }

    // =================================================================
    // PASO 2: nada matcheó con confianza → cae a la IA (con tokens)
    // =================================================================
    if (!process.env.ANTHROPIC_API_KEY) {
      const generica = `👋 ¡Hola! Soy el asistente virtual de **${NEGOCIO_CONFIG.nombre}**.\n\nPodés preguntarme por nuestro stock de vehículos, horarios, sucursales o planes de financiación. ¿En qué te ayudo hoy?`;
      logPregunta(preguntaOriginal, false);
      return NextResponse.json({ reply: generica });
    }

    const stockContext =
      vehiculosList.length > 0
        ? vehiculosList
            .map(
              (v) =>
                `- ${v.marca} ${v.modelo} (${v.anio}) - Tipo: ${v.tipo} - ${v.kilometraje} km - Precio: $${v.precio_publicado_ars?.toLocaleString("es-AR")}`,
            )
            .join("\n")
        : "No hay vehículos cargados en este momento.";

    const SYSTEM_PROMPT = `Eres el asistente virtual experto de ${NEGOCIO_CONFIG.nombre}, ubicado en ${NEGOCIO_CONFIG.zona}.
INFORMACIÓN OFICIAL DEL NEGOCIO:
- Horarios: ${NEGOCIO_CONFIG.contacto.horarios}
- Sucursales: ${JSON.stringify(NEGOCIO_CONFIG.sucursales)}
- Políticas y Servicios: ${JSON.stringify(NEGOCIO_CONFIG.politicas)}

INFORMACIÓN DE STOCK ACTUAL EN TIEMPO REAL:
${stockContext}

REGLAS:
- Responde siempre en español rioplatense de forma natural, comercial y vendedora.
- Usa la información oficial del negocio para responder consultas sobre financiación, consignación o sucursales.`;

    const formattedMessages = rawMessages
      .map((msg: any) => {
        const role =
          msg.role === "assistant" || msg.sender === "bot"
            ? "assistant"
            : "user";
        const content = msg.content || msg.text || "";

        return {
          role,
          content: typeof content === "string" ? content.trim() : content,
        };
      })
      .filter((msg: any) => {
        if (typeof msg.content === "string") return msg.content.length > 0;
        if (Array.isArray(msg.content)) return msg.content.length > 0;
        return false;
      });

    const response = await anthropic.messages.create({
      model: "claude-opus-5",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: formattedMessages,
      output_config: { effort: "low" },
    } as any);

    if (response.stop_reason === "refusal") {
      logPregunta(preguntaOriginal, false);
      return NextResponse.json(
        { error: "No puedo responder esa consulta. Probá reformularla." },
        { status: 422 },
      );
    }

    let replyText = "";
    for (const block of response.content) {
      if (block.type === "text") {
        replyText += (block as any).text;
      }
    }

    logPregunta(preguntaOriginal, true);
    return NextResponse.json({ reply: replyText });

  } catch (error: any) {
    console.error("Error en la API de chat web:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 },
    );
  }
}
