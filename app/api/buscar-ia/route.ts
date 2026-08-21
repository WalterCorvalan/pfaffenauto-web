import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { interpretarBusqueda, isBuscadorIaDisponible } from "@/lib/ai/buscador";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/logger";

const BusquedaSchema = z.object({
  termino: z.string().trim().min(1).max(200),
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export async function POST(req: Request) {
  try {
    const limite = rateLimit(ipDesdeRequest(req), { limite: 20, ventanaMs: 60 * 1000 });
    if (!limite.ok) {
      return Response.json({ error: "Demasiadas búsquedas. Esperá un momento." }, { status: 429 });
    }

    if (!isBuscadorIaDisponible()) {
      return Response.json({ error: "Buscador con IA no disponible." }, { status: 400 });
    }

    const parsed = BusquedaSchema.safeParse(await req.json());
    if (!parsed.success) {
      return Response.json({ error: "Falta el término de búsqueda." }, { status: 400 });
    }
    const { termino } = parsed.data;

    const resultado = await interpretarBusqueda(termino);
    if (!resultado.ok) {
      return Response.json({ error: resultado.error }, { status: 500 });
    }

    const filtros = resultado.data;

    let query = supabase
      .from("vehiculos")
      .select(`*, multimedia_vehiculos ( url_archivo ), sucursales!vehiculos_sucursal_id_fkey ( nombre )`, { count: "exact" })
      .in("estado", ["Disponible", "Reservado"]);

    if (filtros.tipo) query = query.eq("tipo", filtros.tipo);
    if (filtros.marca) query = query.eq("marca", filtros.marca);
    if (filtros.transmision) query = query.eq("transmision", filtros.transmision);
    if (filtros.combustible) query = query.eq("tipo_combustible", filtros.combustible);
    if (filtros.condicion) query = query.eq("condicion", filtros.condicion);
    if (filtros.precio_max_usd) query = query.lte("precio_publicado_usd", filtros.precio_max_usd);

    query = query.order("created_at", { ascending: false }).limit(24);

    const { data, count, error } = await query;
    if (error) throw error;

    return Response.json({ ok: true, vehiculos: data || [], count: count || 0, interpretacion: filtros });
  } catch (error: any) {
    registrarError("api/buscar-ia", error);
    return Response.json({ error: "Error interno. Intentá de nuevo en unos minutos." }, { status: 500 });
  }
}
