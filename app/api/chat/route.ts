import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { NEGOCIO_CONFIG } from "@/data/NegocioConfig";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/logger";
import { chatJson, isAiConfigured } from "@/lib/ai";
import { obtenerDolarOficial } from "@/lib/dolarOficial";
import { z } from "zod";

const ChatBodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.string().max(20).optional(),
        sender: z.string().max(20).optional(),
        content: z.string().max(4000).optional(),
        text: z.string().max(4000).optional(),
      })
    )
    .max(50)
    .default([]),
});

// =====================================================================
// 🎛️ BUSCADOR HÍBRIDO
// 1. Reglas primero (0 tokens): institucional (horarios/sucursales/políticas).
// 2. Si nada matchea, la IA interpreta lenguaje natural (incluso presupuesto
//    tipo "tengo 15000 dólares") y devuelve filtros estructurados — la
//    búsqueda de stock la hacemos NOSOTROS contra la DB real (misma tabla y
//    mismas columnas que usa /catalogo), la IA nunca inventa vehículos.
// =====================================================================

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

const FiltrosSchema = z.object({
  reply_intro: z.string(),
  presupuesto: z.number().positive().nullable(),
  moneda: z.enum(["USD", "ARS"]).nullable(),
  marca: z.string().nullable(),
  tipo: z.string().nullable(),
  transmision: z.enum(["Manual", "Automática"]).nullable(),
  combustible: z.string().nullable(),
});

type VehiculoBusqueda = {
  marca: string;
  modelo: string;
  anio: number | null;
  tipo: string | null;
  transmision: string | null;
  tipo_combustible: string | null;
  kilometraje: number | null;
  precio_publicado_ars: number | null;
  precio_publicado_usd: number | null;
  slug: string | null;
};

function formatearListado(vehiculos: VehiculoBusqueda[]): string {
  if (vehiculos.length === 0) {
    return "No encontramos unidades disponibles con esos filtros ahora mismo. Probá ampliando el presupuesto o cambiando alguna preferencia.";
  }
  return vehiculos
    .slice(0, 6)
    .map((v) => {
      const precio = v.precio_publicado_usd
        ? `US$ ${v.precio_publicado_usd.toLocaleString("es-AR")}`
        : v.precio_publicado_ars
        ? `$ ${v.precio_publicado_ars.toLocaleString("es-AR")}`
        : "precio a consultar";
      return `🚗 **${v.marca} ${v.modelo}**${v.anio ? ` (${v.anio})` : ""}\n💰 ${precio}${v.kilometraje != null ? `\n🛣️ ${v.kilometraje.toLocaleString("es-AR")} km` : ""}${v.slug ? `\n🔗 https://pfaffenautos.com/catalogo/${v.slug}` : ""}`;
    })
    .join("\n\n");
}

export async function POST(request: Request) {
  try {
    const limite = rateLimit(ipDesdeRequest(request), { limite: 20, ventanaMs: 60 * 1000 });
    if (!limite.ok) {
      return NextResponse.json({ error: "Demasiados mensajes. Esperá un momento." }, { status: 429 });
    }

    const parsedBody = ChatBodySchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Formato de mensajes inválido." }, { status: 400 });
    }
    const rawMessages = parsedBody.data.messages;
    const preguntaOriginal = rawMessages[rawMessages.length - 1]?.content || "";
    const ultimoMensaje = preguntaOriginal.toLowerCase();

    // --- RESPUESTAS INSTITUCIONALES (0 tokens) ---
    let respuestaLocal: string | null = null;

    if (ultimoMensaje.includes("horario") || ultimoMensaje.includes("hora")) {
      respuestaLocal = `🕒 **Nuestros Horarios de Atención:**\n\n${NEGOCIO_CONFIG.contacto.horarios}\n\n¡Te esperamos!`;
    } else if (ultimoMensaje.includes("sucursal") || ultimoMensaje.includes("donde") || ultimoMensaje.includes("direccion") || ultimoMensaje.includes("ubicacion")) {
      const listaSucursales = NEGOCIO_CONFIG.sucursales.map(s =>
        `📍 **${s.nombre}**\n🗺️ ${s.direccion}\n📞 ${s.telefono}`
      ).join("\n\n");
      respuestaLocal = `🏢 **Nuestras Sucursales:**\n\n${listaSucursales}`;
    } else if (ultimoMensaje.includes("financiacion") || ultimoMensaje.includes("cuotas") || ultimoMensaje.includes("credito")) {
      respuestaLocal = `💳 **Planes de Financiación:**\n\n${NEGOCIO_CONFIG.politicas.financiacion}`;
    } else if (ultimoMensaje.includes("consignacion") || ultimoMensaje.includes("vender") || ultimoMensaje.includes("consignar")) {
      respuestaLocal = `🤝 **Consignación de Vehículos:**\n\n${NEGOCIO_CONFIG.politicas.consignacion}`;
    } else if (ultimoMensaje.includes("permuta") || ultimoMensaje.includes("parte de pago")) {
      respuestaLocal = `🔄 **Permutas:**\n\n${NEGOCIO_CONFIG.politicas.permutas}`;
    }

    if (respuestaLocal) {
      logPregunta(preguntaOriginal, true);
      return NextResponse.json({ reply: respuestaLocal });
    }

    // =================================================================
    // IA: extraer filtros estructurados del lenguaje natural
    // =================================================================
    if (!isAiConfigured()) {
      const generica = `👋 ¡Hola! Soy el asistente virtual de **${NEGOCIO_CONFIG.nombre}**.\n\nPodés preguntarme por nuestro stock de vehículos, horarios, sucursales o planes de financiación. ¿En qué te ayudo hoy?`;
      logPregunta(preguntaOriginal, false);
      return NextResponse.json({ reply: generica });
    }

    const SYSTEM_PROMPT = `Sos el asistente del buscador de stock de ${NEGOCIO_CONFIG.nombre}. Tu única tarea es leer el mensaje del cliente y extraer, si están, estos filtros de búsqueda:
- presupuesto: un número si el cliente menciona un monto de dinero (ej: "tengo 15000 dólares" → 15000). null si no menciona plata.
- moneda: "USD" si el monto es en dólares, "ARS" si es en pesos argentinos. Si el cliente no aclara pero dice un número grande (millones) asumí ARS; si dice un número chico (miles) sin aclarar, asumí USD. null si no hay presupuesto.
- marca: la marca del auto si la menciona (ej: "Toyota"), null si no.
- tipo: tipo de vehículo si lo menciona (Auto, Pickup, SUV, Utilitario), null si no.
- transmision: "Manual" o "Automática" si lo menciona, null si no.
- combustible: si menciona (Nafta, Diesel, GNC, Híbrido), null si no.
- reply_intro: una frase corta y comercial en español rioplatense confirmando qué vas a buscar (ej: "Dale, busco autos de hasta US$15.000 para vos" o si no hay filtros claros, pedile más info sobre qué busca).

Respondé ÚNICAMENTE con el JSON de estos campos, nada más.`;

    const formattedMessages = rawMessages
      .map((msg: any) => {
        const role: "user" | "assistant" =
          msg.role === "assistant" || msg.sender === "bot" ? "assistant" : "user";
        const content = (msg.content || msg.text || "").trim();
        return { role, content };
      })
      .filter((msg) => msg.content.length > 0);

    const resultado = await chatJson(
      FiltrosSchema,
      [{ role: "system", content: SYSTEM_PROMPT }, ...formattedMessages],
      { origen: "api/chat" }
    );

    if (!resultado.ok) {
      registrarError("api/chat modelo", new Error(resultado.error));
      return NextResponse.json({ error: "No pude generar una respuesta. Probá de nuevo." }, { status: 502 });
    }

    const filtros = resultado.data;

    // Sin ningún filtro real (ni presupuesto ni marca/tipo/etc): no hay nada
    // que buscar en la DB, devolvemos solo la intro/pregunta de la IA.
    const hayFiltros = filtros.presupuesto || filtros.marca || filtros.tipo || filtros.transmision || filtros.combustible;
    if (!hayFiltros) {
      logPregunta(preguntaOriginal, false);
      return NextResponse.json({ reply: filtros.reply_intro });
    }

    let query = supabase
      .from("vehiculos")
      .select("marca, modelo, anio, tipo, transmision, tipo_combustible, kilometraje, precio_publicado_ars, precio_publicado_usd, slug")
      .in("estado", ["Disponible", "Reservado"])
      .limit(6);

    if (filtros.marca) query = query.ilike("marca", `%${filtros.marca}%`);
    if (filtros.tipo) query = query.ilike("tipo", `%${filtros.tipo}%`);
    if (filtros.transmision) query = query.eq("transmision", filtros.transmision);
    if (filtros.combustible) query = query.ilike("tipo_combustible", `%${filtros.combustible}%`);

    // Presupuesto: convertimos con la cotización real (nunca dejamos que la
    // IA "adivine" el cambio) y filtramos por CUALQUIERA de las dos monedas
    // publicadas — así "15000 dólares" también matchea autos listados en
    // pesos por debajo del equivalente.
    if (filtros.presupuesto && filtros.moneda) {
      const dolar = await obtenerDolarOficial().catch(() => null);
      let presupuestoUsd: number | null = null;
      let presupuestoArs: number | null = null;
      if (filtros.moneda === "USD") {
        presupuestoUsd = filtros.presupuesto;
        presupuestoArs = dolar ? filtros.presupuesto * dolar : null;
      } else {
        presupuestoArs = filtros.presupuesto;
        presupuestoUsd = dolar ? filtros.presupuesto / dolar : null;
      }
      const condiciones: string[] = [];
      if (presupuestoArs) condiciones.push(`precio_publicado_ars.lte.${Math.round(presupuestoArs)}`);
      if (presupuestoUsd) condiciones.push(`precio_publicado_usd.lte.${Math.round(presupuestoUsd)}`);
      if (condiciones.length > 0) query = query.or(condiciones.join(","));
    }

    const { data: vehiculos } = await query;
    const listado = formatearListado((vehiculos ?? []) as VehiculoBusqueda[]);
    const reply = `${filtros.reply_intro}\n\n${listado}`;

    logPregunta(preguntaOriginal, true);
    return NextResponse.json({ reply });

  } catch (error: any) {
    registrarError("api/chat", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
