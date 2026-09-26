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
        model: "claude-sonnet-5",
        max_tokens: 1536,
        tools: [{ type: "web_search_20250305" as const, name: "web_search", max_uses: 6 }],
        messages: [{
          role: "user",
          content: `Buscá el precio de mercado ACTUAL en pesos argentinos (ARS) para un vehículo usado: ${descripcion}.

Hacé varias búsquedas si hace falta (portales argentinos: MercadoLibre, AutoCosmos, Kavak, DeRuedas, etc.) hasta juntar publicaciones REALES de unidades comparables. Sé estricto al comparar:
- Mismo modelo y versión/trim (ej: no compares un XEi contra un SE-G o un GLi, son precios distintos).
- Año igual o el más cercano posible.
- Kilometraje parecido (±20.000 km aprox.) -- un auto con muchos más km vale menos, uno con menos km vale más, no los promedies como si fueran iguales.
- Si una publicación te da un rango de precios de varios vendedores (ej: "referencias de $X a $Y"), usá el valor medio de esa publicación, no el extremo más bajo.
- Descartá publicaciones que no coincidan razonablemente en las condiciones de arriba en vez de promediarlas igual -- mejor un precio basado en 2-3 unidades bien comparables que en muchas mal comparadas.

Al final de tu búsqueda respondé ÚNICAMENTE con un JSON en este formato exacto, sin texto adicional ni backticks:
{"precio_ars": <número entero, precio de mercado en pesos argentinos para ESTA unidad puntual (año/km/versión), o null si no encontraste datos suficientes>, "fuentes": ["url1", "url2"]}`,
        }],
      },
      { timeout: 40000, maxRetries: 0 }
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
