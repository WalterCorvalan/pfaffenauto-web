import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { chatJson } from "@/lib/ai";
import { buildSystemPrompt, type ResultadoStock } from "@/lib/ai/prompts";

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
});

export type AgentReply = z.infer<typeof AgentReplySchema>;
export type HistorialMensaje = { role: "user" | "assistant"; content: string };

// Búsqueda real de stock para el agente. Nunca inventa: si no hay filas, el prompt
// le dice a la IA que lo diga con honestidad en vez de simular disponibilidad.
export async function buscarStockReal(marca: string, modelo: string): Promise<{ resultados: ResultadoStock[]; linkPublicacion: string | null }> {
  const { data } = await supabase
    .from("vehiculos")
    .select("marca, modelo, anio, slug, precio_publicado_ars, precio_publicado_usd, sucursales!vehiculos_sucursal_id_fkey ( nombre )")
    .ilike("marca", `%${marca}%`)
    .ilike("modelo", `%${modelo}%`)
    .in("estado", ["Disponible", "Reservado"])
    .limit(3);

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

  if (respuesta.vehiculo_mencionado?.marca && respuesta.vehiculo_mencionado?.modelo) {
    const { resultados, linkPublicacion } = await buscarStockReal(
      respuesta.vehiculo_mencionado.marca,
      respuesta.vehiculo_mencionado.modelo
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
