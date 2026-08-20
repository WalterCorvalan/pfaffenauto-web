import { NextResponse } from "next/server";
import { obtenerDolarOficial } from "@/lib/dolarOficial";

// Descuento sobre el precio de mercado según km, ya definido para el cotizador
function descuentoPorKm(km: number): number {
  if (km <= 50000) return 0.08;
  if (km <= 80000) return 0.10;
  if (km <= 100000) return 0.12;
  if (km <= 120000) return 0.14;
  if (km <= 180000) return 0.16;
  return 0.20;
}

export async function POST(req: Request) {
  try {
    const { marca, modelo, version, anio, kilometraje } = await req.json();

    if (!marca || !modelo || !anio || kilometraje == null) {
      return NextResponse.json({ error: "Faltan datos del vehículo." }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY no configurada." }, { status: 500 });
    }

    const consulta = `${marca} ${modelo} ${version || ""} ${anio} ${kilometraje.toLocaleString("es-AR")}km`.trim();

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5",
        tools: [{ type: "web_search" }],
        input: [
          {
            role: "system",
            content:
              "Sos un tasador de autos usados en Argentina. Buscá publicaciones comparables reales en MercadoLibre y Kavak para el vehículo indicado, priorizando comparables con kilometraje similar (±20.000km) y misma versión/año. " +
              "IMPORTANTE: NO conviertas monedas vos. Separá los comparables según la moneda en la que están publicados y calculá la media de cada grupo por separado — la conversión USD→ARS la hacemos nosotros con una cotización real, no la inventes. " +
              "Respondé ÚNICA Y EXCLUSIVAMENTE un JSON válido, sin texto adicional, sin markdown, sin explicación, con esta forma exacta: " +
              '{"precio_medio_ars": number|null, "cantidad_ars": number, "precio_medio_usd": number|null, "cantidad_usd": number}. ' +
              "Si no encontrás comparables en alguna de las dos monedas, esa media va en null y la cantidad en 0. No inventes cifras — si no hay comparables reales, decilo con cantidad 0.",
          },
          { role: "user", content: consulta },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[precio-sugerido] error OpenAI:", errText);
      return NextResponse.json({ error: "No se pudo consultar el precio de mercado." }, { status: 502 });
    }

    const data = await response.json();
    const textoSalida: string =
      data.output_text ??
      data.output?.flatMap((o: any) => o.content?.map((c: any) => c.text) || []).join("") ??
      "";

    const match = textoSalida.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error("[precio-sugerido] respuesta sin JSON:", textoSalida);
      return NextResponse.json({ error: "Respuesta inesperada de la IA." }, { status: 502 });
    }

    const { precio_medio_ars, cantidad_ars, precio_medio_usd, cantidad_usd } = JSON.parse(match[0]);
    const totalComparables = (Number(cantidad_ars) || 0) + (Number(cantidad_usd) || 0);
    if (totalComparables === 0) {
      return NextResponse.json({ error: "No se encontraron comparables suficientes." }, { status: 422 });
    }

    // Conversión determinista USD → ARS con cotización real, no con lo que "crea" la IA.
    let cotizacionUsada: number | null = null;
    let precioMedioUsdEnArs = 0;
    if (precio_medio_usd && cantidad_usd > 0) {
      cotizacionUsada = await obtenerDolarOficial();
      precioMedioUsdEnArs = precio_medio_usd * cotizacionUsada;
    }

    // Promedio ponderado por cantidad de comparables de cada grupo.
    const precioMedioMercado =
      ((precio_medio_ars || 0) * (cantidad_ars || 0) + precioMedioUsdEnArs * (cantidad_usd || 0)) / totalComparables;

    const descuento = descuentoPorKm(Number(kilometraje));
    const precioSugerido = Math.round(precioMedioMercado * (1 - descuento));

    return NextResponse.json({
      precio_medio_mercado: Math.round(precioMedioMercado),
      cantidad_comparables: totalComparables,
      cantidad_ars: cantidad_ars || 0,
      cantidad_usd: cantidad_usd || 0,
      cotizacion_dolar_usada: cotizacionUsada,
      descuento_aplicado: descuento,
      precio_sugerido: precioSugerido,
    });
  } catch (err) {
    console.error("[precio-sugerido] error:", err);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
