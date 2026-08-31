import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/logger";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

const BusquedaSchema = z.object({
  termino: z.string().trim().min(1).max(200),
  resultadosEncontrados: z.number().int().min(0),
});

// Log de búsquedas del catálogo público (Marketing → Búsquedas Web). Por
// ruta con service role, no insert directo de anon — mismo patrón que
// postulaciones/visitas/rodi. El insert directo de anon a busquedas_log
// (con RLS "to anon") daba 42501 pese a política+grants correctos; sin
// acceso a la config del proyecto para diagnosticarlo del todo, esta ruta
// lo evita sin depender de ese misterio.
export async function POST(req: Request) {
  try {
    const ip = ipDesdeRequest(req);
    const limite = rateLimit(ip, { limite: 20, ventanaMs: 60 * 1000 });
    if (!limite.ok) {
      return Response.json({ error: "Demasiadas solicitudes. Reintentá en unos minutos." }, { status: 429 });
    }

    const parsed = BusquedaSchema.safeParse(await req.json());
    if (!parsed.success) {
      return Response.json({ error: "Datos inválidos." }, { status: 400 });
    }
    const { termino, resultadosEncontrados } = parsed.data;

    const { error } = await supabase.from("busquedas_log").insert({ termino, resultados_encontrados: resultadosEncontrados });
    if (error) throw error;

    return Response.json({ ok: true });
  } catch (err) {
    registrarError("api/panel-v2/busquedas", err);
    return Response.json({ error: "No se pudo registrar la búsqueda." }, { status: 500 });
  }
}
