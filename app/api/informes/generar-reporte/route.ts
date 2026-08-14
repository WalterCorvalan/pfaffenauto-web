import { createClient } from "@supabase/supabase-js";
import { chatJson, isAiConfigured } from "@/lib/ai";
import { obtenerDatosMes } from "@/lib/informes";
import { z } from "zod";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ReporteSchema = z.object({
  resumen: z.string(),
});

export async function POST() {
  try {
    if (!isAiConfigured()) {
      return Response.json({ error: "ANTHROPIC_API_KEY no configurado." }, { status: 400 });
    }

    const datos = await obtenerDatosMes(supabase);

    const prompt = `Sos el contador de una concesionaria de autos. Con estos datos del mes de ${datos.nombreMes}, escribí un resumen ejecutivo breve (máximo 200 palabras) en español rioplatense, directo y sin rodeos, para el dueño del negocio. Mencioná: cuántos autos se vendieron y cuánto generaron, cuál fue la venta más importante, cuáles fueron los gastos más significativos, y remarcá específicamente los gastos "atípicos" (los que se salieron del promedio histórico) explicando qué tan fuera de lo normal están — esa es la parte más importante, no la minimices. Terminá con una conclusión clara de si el mes cerró bien o mal en términos de neto.

DATOS:
- Autos vendidos: ${datos.cantidadVendidos}
- Ingresos por ventas: $${datos.ingresosTotales.toLocaleString("es-AR")}
- Venta más cara: ${datos.ventaMasCara ? `${datos.ventaMasCara.marca} ${datos.ventaMasCara.modelo} por $${Number(datos.ventaMasCara.venta_ars).toLocaleString("es-AR")}` : "sin ventas"}
- Egresos totales: $${datos.egresosTotales.toLocaleString("es-AR")}
- Neto del mes: $${datos.netoDelMes.toLocaleString("es-AR")}
- Gastos más caros: ${datos.gastosMasCaros.map((g) => `${g.concepto} (${g.categoria}): $${g.monto.toLocaleString("es-AR")}`).join(" | ") || "ninguno"}
- Gastos atípicos (más del doble del promedio histórico de su categoría): ${datos.gastosAtipicos.map((g) => `${g.concepto} (${g.categoria}): $${g.monto.toLocaleString("es-AR")}`).join(" | ") || "ninguno"}

Respondé ÚNICAMENTE con JSON: {"resumen": "..."}`;

    const resultado = await chatJson(ReporteSchema, [
      { role: "system", content: "Sos un analista financiero conciso, nunca inventás datos que no te dieron." },
      { role: "user", content: prompt },
    ]);

    if (!resultado.ok) {
      return Response.json({ error: resultado.error }, { status: 500 });
    }

    const { data: guardado, error } = await supabase
      .from("reportes_mensuales")
      .insert({ mes: new Date().toISOString().split("T")[0], contenido: resultado.data.resumen })
      .select("id, mes, contenido, generado_en")
      .single();

    if (error) throw error;

    return Response.json({ ok: true, reporte: guardado });
  } catch (error: any) {
    console.error("[informes] error generando reporte:", error);
    return Response.json({ error: error.message || "Error interno" }, { status: 500 });
  }
}
