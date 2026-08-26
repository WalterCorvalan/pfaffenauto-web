import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { chatJson } from "@/lib/ai";
import { buildSystemPrompt, type ResultadoStock } from "@/lib/ai/prompts";
import { obtenerDolarOficial } from "@/lib/dolarOficial";

// Agente de ventas compartido entre canales (WhatsApp, Web Chat). Cada canal
// guarda su propio historial/estado en sus propias tablas — este módulo solo
// razona con el texto de la conversación, nunca escribe en la base.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const AgentReplySchema = z.object({
  reply: z.string(),
  handoff: z.boolean(),
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

export type AgentReply = z.infer<typeof AgentReplySchema>;
export type HistorialMensaje = { role: "user" | "assistant"; content: string };

// Búsqueda real de stock para el agente. Nunca inventa: si no hay filas, el prompt
// le dice a la IA que lo diga con honestidad en vez de simular disponibilidad.
// Marca es opcional: un cliente que dice "un Ranger" sin aclarar "Ford" tiene
// que poder buscarse igual por modelo solo — exigir las dos cosas dejaba al
// bot prometiendo "voy a chequear" sin disparar nunca la búsqueda real.
export async function buscarStockReal(
  marca: string | null,
  modelo: string | null,
  presupuesto?: { monto: number; moneda: "USD" | "ARS" } | null
): Promise<{ resultados: ResultadoStock[]; linkPublicacion: string | null }> {
  let query = supabase
    .from("vehiculos")
    .select("marca, modelo, anio, slug, precio_publicado_ars, precio_publicado_usd, sucursales!vehiculos_sucursal_id_fkey ( nombre )")
    .in("estado", ["Disponible", "Reservado"])
    .limit(modelo ? 3 : 6);
  if (marca) query = query.ilike("marca", `%${marca}%`);
  if (modelo) query = query.ilike("modelo", `%${modelo}%`);

  // Presupuesto: convertimos con la cotización real (nunca "adivina" la IA) y
  // filtramos por cualquiera de las dos monedas publicadas — mismo criterio
  // que usa el catálogo público, así "15000 dólares" matchea también autos
  // listados en pesos por debajo del equivalente.
  if (presupuesto) {
    const dolar = await obtenerDolarOficial().catch(() => null);
    let presupuestoUsd: number | null = null;
    let presupuestoArs: number | null = null;
    if (presupuesto.moneda === "USD") {
      presupuestoUsd = presupuesto.monto;
      presupuestoArs = dolar ? presupuesto.monto * dolar : null;
    } else {
      presupuestoArs = presupuesto.monto;
      presupuestoUsd = dolar ? presupuesto.monto / dolar : null;
    }
    const condiciones: string[] = [];
    if (presupuestoArs) condiciones.push(`precio_publicado_ars.lte.${Math.round(presupuestoArs)}`);
    if (presupuestoUsd) condiciones.push(`precio_publicado_usd.lte.${Math.round(presupuestoUsd)}`);
    if (condiciones.length > 0) query = query.or(condiciones.join(","));
  }

  const { data } = await query;

  const resultados: ResultadoStock[] = (data ?? []).map((v: any) => ({
    marca: v.marca,
    modelo: v.modelo,
    anio: v.anio,
    precio_publicado_ars: v.precio_publicado_ars,
    precio_publicado_usd: v.precio_publicado_usd,
    sucursal: v.sucursales?.nombre ?? null,
  }));

  // Le mandamos el link a la ficha real del catálogo (no una foto suelta) —
  // así el cliente ve precio, fotos completas y specs actualizados en la web.
  const primerAuto = (data ?? [])[0] as any;
  const linkPublicacion = primerAuto?.slug ? `https://pfaffenautos.com.ar/catalogo/${primerAuto.slug}` : null;

  return { resultados, linkPublicacion };
}

// Dos pasadas: 1) extrae qué auto nombró el cliente, 2) si nombró uno, busca stock
// real y le pide a la IA que redacte la respuesta final SOLO con esos datos.
export async function generarRespuestaAgente(historial: HistorialMensaje[], canal: string = "agente"): Promise<
  | { ok: true; data: AgentReply; linkParaEnviar: string | null }
  | { ok: false; error: string }
> {
  const result = await chatJson(AgentReplySchema, [
    { role: "system", content: buildSystemPrompt() },
    ...historial,
  ], { origen: canal });

  if (!result.ok) return { ok: false, error: result.error };

  let respuesta = result.data;
  let linkParaEnviar: string | null = null;

  if (respuesta.vehiculo_mencionado?.modelo || respuesta.presupuesto_mencionado) {
    const { resultados, linkPublicacion } = await buscarStockReal(
      respuesta.vehiculo_mencionado?.marca ?? null,
      respuesta.vehiculo_mencionado?.modelo ?? null,
      respuesta.presupuesto_mencionado
    );
    linkParaEnviar = linkPublicacion;

    const result2 = await chatJson(AgentReplySchema, [
      { role: "system", content: buildSystemPrompt(undefined, resultados) },
      ...historial,
    ], { origen: canal });

    if (result2.ok) {
      respuesta = { ...respuesta, reply: result2.data.reply, handoff: result2.data.handoff, calificacion: result2.data.calificacion };
    } else {
      console.error("[agente] error en 2da pasada (stock):", result2.error);
    }
  }

  return { ok: true, data: respuesta, linkParaEnviar };
}
