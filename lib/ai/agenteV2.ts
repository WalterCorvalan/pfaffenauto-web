import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { chatJsonV2 } from "@/lib/ai/indexV2";
import { buildSystemPromptV2, type ResultadoStockV2 } from "@/lib/ai/promptsV2";

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

export async function buscarStockRealV2(
  marca: string | null,
  modelo: string | null,
  presupuesto?: { monto: number; moneda: "USD" | "ARS" } | null
): Promise<{ resultados: ResultadoStockV2[] }> {
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
  return { resultados: (data ?? []) as ResultadoStockV2[] };
}

export async function generarRespuestaAgenteV2(historial: HistorialMensaje[], canal: string = "whatsapp-v2", nombreBot?: string): Promise<
  | { ok: true; data: AgentReplyV2 }
  | { ok: false; error: string }
> {
  const result = await chatJsonV2(AgentReplySchemaV2, [
    { role: "system", content: buildSystemPromptV2(undefined, undefined, nombreBot) },
    ...historial,
  ], { origen: canal });

  if (!result.ok) return { ok: false, error: result.error };

  let respuesta = result.data;

  if (respuesta.vehiculo_mencionado?.modelo || respuesta.presupuesto_mencionado) {
    const { resultados } = await buscarStockRealV2(
      respuesta.vehiculo_mencionado?.marca ?? null,
      respuesta.vehiculo_mencionado?.modelo ?? null,
      respuesta.presupuesto_mencionado
    );

    const result2 = await chatJsonV2(AgentReplySchemaV2, [
      { role: "system", content: buildSystemPromptV2(undefined, resultados, nombreBot) },
      ...historial,
    ], { origen: canal });

    if (result2.ok) {
      respuesta = { ...respuesta, reply: result2.data.reply, handoff: result2.data.handoff, calificacion: result2.data.calificacion };
    } else {
      console.error("[agenteV2] error en 2da pasada (stock):", result2.error);
    }
  }

  return { ok: true, data: respuesta };
}
