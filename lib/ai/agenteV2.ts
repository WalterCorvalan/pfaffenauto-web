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

// Tope de mensajes por conversación — evita charlas eternas (costo de API y
// vendedores esperando el handoff) cuando hay muchas consultas a la vez.
// SUAVE: a partir de este mensaje del cliente, el prompt empieza a
// sugerirle cerrar rápido con lo que necesita. DURO: a partir de acá se
// corta directo, sin llamar a la IA — se deriva con un mensaje fijo.
const LIMITE_MENSAJES_SUAVE = 25;
const LIMITE_MENSAJES_DURO = 70;

function respuestaLimiteAlcanzado(): AgentReplyV2 {
  return {
    reply: "Veo que ya llevamos bastante conversación — para no hacerte esperar más, en este momento te comunico con un asesor que sigue en persona con todo esto.",
    handoff: true,
    intencion: null,
    calificacion: null,
    datos_detectados: { timing: null, forma_pago: null, tiene_permuta: null },
    vehiculo_mencionado: null,
    presupuesto_mencionado: null,
  };
}

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
    .select("marca, modelo, anio, precio_venta, moneda_venta, patente, color, km, version, transmision, combustible")
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

// Los números "reales" no son solo precio/año del stock: si la respuesta
// también menciona una dirección de sucursal (ej: "el Vento está en Av. del
// Libertador 2067"), esos números vienen del prompt (dato real), no son una
// alucinación — sin esta lista, "2067" no matchea contra ningún precio/año
// y toda la respuesta se descarta por error, incluida la dirección real.
function respuestaMencionaStockInventado(reply: string, resultados: ResultadoStockV2[], sucursales: SucursalInfo[] = []): boolean {
  const numerosReply = extraerNumerosRelevantes(reply);
  if (numerosReply.length === 0) return false;

  const numerosReales = new Set<number>();
  for (const v of resultados) {
    numerosReales.add(v.precio_venta);
    numerosReales.add(v.anio);
  }
  for (const s of sucursales) {
    if (s.direccion) extraerNumerosRelevantes(s.direccion).forEach((n) => numerosReales.add(n));
    if (s.telefono_encargado) extraerNumerosRelevantes(s.telefono_encargado).forEach((n) => numerosReales.add(n));
  }

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
  const { data } = await supabase.from("sucursales").select("nombre, direccion, telefono_encargado, google_maps_url, encargado_nombre").order("nombre");
  return (data ?? []) as SucursalInfo[];
}

export async function generarRespuestaAgenteV2(historial: HistorialMensaje[], canal: string = "whatsapp-v2", nombreBot?: string): Promise<
  | { ok: true; data: AgentReplyV2 }
  | { ok: false; error: string }
> {
  const mensajesCliente = historial.filter((h) => h.role === "user").length;
  if (mensajesCliente > LIMITE_MENSAJES_DURO) {
    return { ok: true, data: respuestaLimiteAlcanzado() };
  }
  const sugerirCierre = mensajesCliente >= LIMITE_MENSAJES_SUAVE;

  const sucursales = await fetchSucursalesInfo();

  const result = await chatJsonV2(AgentReplySchemaV2, [
    { role: "system", content: buildSystemPromptV2(undefined, undefined, nombreBot, undefined, sucursales, sugerirCierre) },
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
      { role: "system", content: buildSystemPromptV2(undefined, resultados, nombreBot, esAlternativa, sucursales, sugerirCierre) },
      ...historial,
    ], { origen: canal });

    if (result2.ok) {
      const reply = respuestaMencionaStockInventado(result2.data.reply, resultados, sucursales)
        ? respuestaSeguraConStockReal(resultados, esAlternativa)
        : result2.data.reply;
      // La segunda pasada es la que tiene el dato correcto post-reglas
      // (permuta, confirmación, etc.) — si algo lee estos campos más
      // adelante (hoy nada los persiste, pero por las dudas), que refleje
      // la versión final, no la de la primera pasada sin stock inyectado.
      respuesta = {
        ...respuesta,
        reply,
        handoff: result2.data.handoff,
        calificacion: result2.data.calificacion,
        vehiculo_mencionado: result2.data.vehiculo_mencionado,
        presupuesto_mencionado: result2.data.presupuesto_mencionado,
        datos_detectados: result2.data.datos_detectados,
        intencion: result2.data.intencion,
      };
    } else {
      console.error("[agenteV2] error en 2da pasada (stock):", result2.error);
    }
  }

  return { ok: true, data: respuesta };
}
