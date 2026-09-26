import Anthropic from "@anthropic-ai/sdk";
import { registrarError } from "@/lib/panel/logger";

// Pedido del 26/9: antes /cotizador le calculaba al cliente una "oferta
// instantánea" restando un % fijo por km sobre el precio que ÉL puso -- sin
// ningún ancla de mercado real, así que si pedía muy por encima del valor
// real (ej: pide $30M por un auto que vale $10M), terminábamos ofreciendo
// $24M igual, muy por encima de lo que vale de verdad. No hay forma de saber
// de antemano qué va a poner el cliente, así que la referencia tiene que
// venir de otro lado: acá se usa la herramienta de búsqueda web de Claude
// para buscar publicaciones reales de ese mismo auto (año/km/versión) en
// portales argentinos y estimar un precio de mercado. Es una referencia para
// que el asesor compare contra lo que pidió el cliente en el panel de
// Cotizaciones -- NUNCA se le muestra automáticamente al cliente.
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });

export interface DatosVehiculoTasacion {
  marca: string;
  modelo: string | null | undefined;
  anio?: number | null;
  km?: number | null;
  version?: string | null;
  combustible?: string | null;
}

export interface PrecioMercadoEstimado {
  precio: number;
  fuentes: string[];
}

function extraerJson(texto: string): unknown {
  const fence = texto.match(/```(?:json)?\s*([\s\S]*?)```/);
  const bloque = fence ? fence[1] : texto;
  const start = bloque.indexOf("{");
  const end = bloque.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(bloque.slice(start, end + 1));
  } catch {
    return null;
  }
}

// Best-effort: nunca tira error para arriba -- si no hay API key, si la
// búsqueda no encuentra nada, o si la IA no devuelve un JSON parseable,
// devuelve null y quien llama sigue sin este dato (la cotización del
// cliente se guarda igual, este es solo un dato adicional para el asesor).
export async function estimarPrecioMercado(vehiculo: DatosVehiculoTasacion): Promise<PrecioMercadoEstimado | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!vehiculo.marca || !vehiculo.modelo) return null;

  const descripcion = [
    vehiculo.marca, vehiculo.modelo, vehiculo.version,
    vehiculo.anio ? `año ${vehiculo.anio}` : null,
    vehiculo.km != null ? `${vehiculo.km.toLocaleString("es-AR")} km` : null,
    vehiculo.combustible,
  ].filter(Boolean).join(" ");

  try {
    const response = await anthropic.messages.create(
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        tools: [{ type: "web_search_20250305" as const, name: "web_search", max_uses: 3 }],
        messages: [{
          role: "user",
          content: `Buscá el precio de mercado ACTUAL en pesos argentinos (ARS) para un vehículo usado: ${descripcion}. Fijate en publicaciones reales de portales argentinos (MercadoLibre, AutoCosmos, Kavak, DeRuedas, etc.) de unidades similares (mismo modelo, año y km parecidos). Al final de tu búsqueda respondé ÚNICAMENTE con un JSON en este formato exacto, sin texto adicional ni backticks:
{"precio_ars": <número entero, precio promedio de mercado en pesos argentinos, o null si no encontraste datos suficientes>, "fuentes": ["url1", "url2"]}`,
        }],
      },
      { timeout: 25000, maxRetries: 0 }
    );

    let textoFinal = "";
    for (const bloque of response.content) {
      if (bloque.type === "text") textoFinal += bloque.text;
    }

    const parsed = extraerJson(textoFinal) as { precio_ars?: number | null; fuentes?: string[] } | null;
    if (!parsed || !parsed.precio_ars || parsed.precio_ars <= 0) return null;

    return { precio: Math.round(parsed.precio_ars), fuentes: Array.isArray(parsed.fuentes) ? parsed.fuentes.slice(0, 5) : [] };
  } catch (err) {
    registrarError("estimarPrecioMercado", err, { vehiculo: descripcion });
    return null;
  }
}
