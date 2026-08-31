import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { chatJsonV2 } from "@/lib/ai/indexV2";
import { buildSystemPromptV2, SEPARADOR_MENSAJES, type ResultadoStockV2, type SucursalInfo } from "@/lib/ai/promptsV2";

// Agente de ventas panel-v2 — lo usan tanto WhatsApp como Rodi (comparten el
// mismo prompt base, cada uno con su propio historial). Fork de
// lib/ai/agente.ts adaptado al schema de la base nova. Solo razona con el
// texto — nunca escribe la conversación, eso lo hace el webhook que lo llama.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

export const AgentReplySchemaV2 = z.object({
  reply: z.string(),
  handoff: z.boolean(),
  intencion: z.enum(["COMPRA", "VENTA", "CONSIGNACION", "COMPRA_CON_PERMUTA", "HABLAR_CON_ASESOR", "OTRA_CONSULTA"]).nullable(),
  calificacion: z.enum(["caliente", "tibio", "frio"]).nullable(),
  datos_detectados: z.object({
    timing: z.string().nullable(),
    forma_pago: z.string().nullable(),
    tiene_permuta: z.boolean().nullable(),
  }),
  vehiculo_mencionado: z.object({
    marca: z.string().nullable(),
    modelo: z.string().nullable(),
  }).nullable(),
  presupuesto_mencionado: z.object({
    monto: z.number().positive(),
    moneda: z.enum(["USD", "ARS"]),
  }).nullable(),
});

export type AgentReplyV2 = z.infer<typeof AgentReplySchemaV2>;
export type HistorialMensaje = { role: "user" | "assistant"; content: string };

// El prompt separa "reply" en varias burbujas con SEPARADOR_MENSAJES cuando
// muestra opciones de stock (lista + pregunta corta abajo, como mandaría una
// persona) — los canales (WhatsApp, Rodi) usan esto para mandar cada parte
// como un mensaje separado en vez de un solo bloque de texto largo.
export function dividirRespuestaEnMensajes(reply: string): string[] {
  return reply.split(SEPARADOR_MENSAJES).map((s) => s.trim()).filter(Boolean);
}

async function ejecutarBusquedaStock(
  marca: string | null,
  modelo: string | null,
  presupuesto?: { monto: number; moneda: "USD" | "ARS" } | null
): Promise<ResultadoStockV2[]> {
  let query = supabase
    .from("vehiculos")
    .select("marca, modelo, anio, precio_venta, moneda_venta, patente")
    .in("estado", ["disponible", "reservado"])
    .limit(modelo ? 3 : 6);
  if (marca) query = query.ilike("marca", `%${marca}%`);
  if (modelo) query = query.ilike("modelo", `%${modelo}%`);

  // Sin conversor de dólar propio en v2 todavía — filtramos solo por la
  // moneda que mencionó el cliente, sin intentar convertir la otra.
  if (presupuesto) {
    query = query.eq("moneda_venta", presupuesto.moneda).lte("precio_venta", presupuesto.monto);
  }

  const { data } = await query;
  return (data ?? []) as ResultadoStockV2[];
}

// Buscar exacto (marca+modelo) primero; si no hay nada, no le devolvemos al
// modelo una lista vacía sin salida — probamos alternativas reales (misma
// marca, cualquier modelo) para que el bot pueda ofrecerlas directo en vez
// de quedarse pidiendo año/presupuesto sin tener nada real que mostrar.
export async function buscarStockRealV2(
  marca: string | null,
  modelo: string | null,
  presupuesto?: { monto: number; moneda: "USD" | "ARS" } | null
): Promise<{ resultados: ResultadoStockV2[]; esAlternativa: boolean }> {
  const exacto = await ejecutarBusquedaStock(marca, modelo, presupuesto);
  if (exacto.length > 0 || !modelo) return { resultados: exacto, esAlternativa: false };

  if (marca) {
    const porMarca = await ejecutarBusquedaStock(marca, null, presupuesto);
    if (porMarca.length > 0) return { resultados: porMarca, esAlternativa: true };
  }

  const general = await ejecutarBusquedaStock(null, null, presupuesto);
  return { resultados: general, esAlternativa: true };
}

// Red de seguridad anti-alucinación: el prompt ya prohíbe inventar stock,
// pero un modelo chico (Haiku) a veces igual fabrica un auto "más lindo" en
// vez de mostrar los resultados reales que se le pasaron — visto en pruebas
// reales (pidió "Chevrolet Tracker" sin stock, el modelo inventó dos
// unidades con precio y año de la nada). No confiamos en el prompt solo:
// si la respuesta menciona un precio/año de 4+ dígitos que no aparece en
// los resultados reales, la descartamos y mostramos el stock real armado
// por código en su lugar.
function extraerNumerosRelevantes(texto: string): number[] {
  return Array.from(texto.matchAll(/\d[\d.,]*\d|\d/g))
    .map((m) => Number(m[0].replace(/[.,]/g, "")))
    .filter((n) => n >= 1900);
}

function respuestaMencionaStockInventado(reply: string, resultados: ResultadoStockV2[]): boolean {
  const numerosReply = extraerNumerosRelevantes(reply);
  if (numerosReply.length === 0) return false;
  const numerosReales = new Set<number>();
  for (const v of resultados) { numerosReales.add(v.precio_venta); numerosReales.add(v.anio); }
  return numerosReply.some((n) => !numerosReales.has(n));
}

function respuestaSeguraConStockReal(resultados: ResultadoStockV2[], esAlternativa: boolean): string {
  if (resultados.length === 0) {
    return "Por ahora no tengo esa unidad en stock. ¿Querés que te avise apenas entre una, o te muestro otras opciones que sí tengo?";
  }
  const lista = resultados.slice(0, 3)
    .map((v) => `🚗 ${v.marca} ${v.modelo} ${v.anio} — 💰 ${v.moneda_venta} ${v.precio_venta.toLocaleString("es-AR")}`)
    .join("\n");
  const intro = esAlternativa ? "Ese modelo puntual no lo tengo ahora, pero estas son opciones que sí tengo disponibles:" : "Estas son las opciones disponibles:";
  return `${intro}\n\n${lista}\n\n¿Alguna te interesa, o buscás un año o versión en particular?`;
}

async function fetchSucursalesInfo(): Promise<SucursalInfo[]> {
  const { data } = await supabase.from("sucursales").select("nombre, direccion, telefono_encargado, google_maps_url").order("nombre");
  return (data ?? []) as SucursalInfo[];
}

export async function generarRespuestaAgenteV2(historial: HistorialMensaje[], canal: string = "whatsapp-v2", nombreBot?: string): Promise<
  | { ok: true; data: AgentReplyV2 }
  | { ok: false; error: string }
> {
  const sucursales = await fetchSucursalesInfo();

  const result = await chatJsonV2(AgentReplySchemaV2, [
    { role: "system", content: buildSystemPromptV2(undefined, undefined, nombreBot, undefined, sucursales) },
    ...historial,
  ], { origen: canal });

  if (!result.ok) return { ok: false, error: result.error };

  let respuesta = result.data;

  // El vehículo que el cliente menciona cuando quiere VENDER o CONSIGNAR el
  // suyo NO es una búsqueda de stock para comprar — es el auto que él
  // ofrece. Sin este filtro, "quiero vender mi Corolla 2019" disparaba una
  // búsqueda de Corollas en stock y el bot terminaba mostrándole autos para
  // comprar en respuesta a que quería vender el propio.
  const esIntencionDeCompra = respuesta.intencion !== "VENTA" && respuesta.intencion !== "CONSIGNACION";

  if (esIntencionDeCompra && (respuesta.vehiculo_mencionado?.modelo || respuesta.vehiculo_mencionado?.marca || respuesta.presupuesto_mencionado)) {
    const { resultados, esAlternativa } = await buscarStockRealV2(
      respuesta.vehiculo_mencionado?.marca ?? null,
      respuesta.vehiculo_mencionado?.modelo ?? null,
      respuesta.presupuesto_mencionado
    );

    const result2 = await chatJsonV2(AgentReplySchemaV2, [
      { role: "system", content: buildSystemPromptV2(undefined, resultados, nombreBot, esAlternativa, sucursales) },
      ...historial,
    ], { origen: canal });

    if (result2.ok) {
      const reply = respuestaMencionaStockInventado(result2.data.reply, resultados)
        ? respuestaSeguraConStockReal(resultados, esAlternativa)
        : result2.data.reply;
      respuesta = { ...respuesta, reply, handoff: result2.data.handoff, calificacion: result2.data.calificacion };
    } else {
      console.error("[agenteV2] error en 2da pasada (stock):", result2.error);
    }
  }

  return { ok: true, data: respuesta };
}
