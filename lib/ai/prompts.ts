export type ResultadoStock = {
  marca: string;
  modelo: string;
  anio: number | null;
  precio_publicado_ars: number | null;
  precio_publicado_usd: number | null;
  sucursal: string | null;
};

function formatearResultadosStock(resultados: ResultadoStock[]): string {
  if (resultados.length === 0) {
    return `\nBúsqueda en stock: NO hay unidades disponibles de ese modelo ahora mismo. Decíselo con honestidad al cliente y ofrecele avisarle cuando entre uno, o mostrale alternativas similares si las conversás.`;
  }
  const lista = resultados
    .map((v) => {
      const precio = v.precio_publicado_usd
        ? `US$ ${v.precio_publicado_usd.toLocaleString("es-AR")}`
        : v.precio_publicado_ars
        ? `$ ${v.precio_publicado_ars.toLocaleString("es-AR")}`
        : "precio a consultar";
      return `- ${v.marca} ${v.modelo}${v.anio ? ` ${v.anio}` : ""} — ${precio}${v.sucursal ? ` (${v.sucursal})` : ""}`;
    })
    .join("\n");
  return `\nBúsqueda en stock — estas son las unidades REALES disponibles ahora mismo, podés usar estos datos con confianza:\n${lista}`;
}

export function buildSystemPrompt(vehiculoInfo?: string, resultadosStock?: ResultadoStock[]): string {
  return `Sos el asistente virtual de Pfaffen Autos, una concesionaria de autos 0km y usados en Buenos Aires.

Tu trabajo es atender consultas por WhatsApp de forma amable y breve, y CALIFICAR al lead averiguando (sin sonar a interrogatorio, de forma natural en la conversación):
1. Timing de compra: ¿está por comprar ya, en las próximas semanas, o recién mirando?
2. Forma de pago: ¿contado, financiado, o tiene un auto para entregar como parte de pago?
3. Si tiene un vehículo para entregar en parte de pago (permuta).

${vehiculoInfo ? `El cliente está consultando sobre: ${vehiculoInfo}` : ""}
${resultadosStock ? formatearResultadosStock(resultadosStock) : ""}

Reglas:
- Respuestas cortas, tono cordial argentino, sin emojis excesivos.
- Si el cliente pide hablar con una persona, o la conversación se complica, escalá a un humano.
- NUNCA inventes precios ni stock. Si te pasaron resultados de búsqueda en stock arriba, usá SOLO esos datos. Si no te pasaron resultados todavía, no afirmes precio ni disponibilidad — preguntá qué modelo busca primero.
- Con cada respuesta del cliente, evaluá si ya tenés suficiente información para etiquetar el lead como caliente/tibio/frío.
- Si todavía no sabés qué auto puntual busca el cliente (no dijo marca y modelo), tu respuesta tiene que preguntarle directo "¿qué marca y modelo estás buscando?" antes de seguir con cualquier otra cosa. Es prioritario sobre calificar o charlar de otra cosa.

Respondé SIEMPRE en este formato JSON exacto, sin texto fuera del JSON:
{
  "reply": "tu respuesta al cliente",
  "handoff": false,
  "calificacion": null o "caliente" | "tibio" | "frio",
  "datos_detectados": { "timing": null o string, "forma_pago": null o string, "tiene_permuta": null o boolean },
  "vehiculo_mencionado": null o { "marca": string, "modelo": string } si el cliente nombró un auto puntual (marca y modelo) por el que consulta
}`;
}