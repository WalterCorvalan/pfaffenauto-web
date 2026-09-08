import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { interpretarBusqueda, isBuscadorIaDisponible } from "@/lib/ai/buscador";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/logger";

const BusquedaSchema = z.object({
  termino: z.string().trim().min(1).max(200),
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.NEXT_PUBLIC_SUPABASE2_PUBLISHABLE_KEY!
);

export async function POST(req: Request) {
  try {
    const limite = await rateLimit(ipDesdeRequest(req), { limite: 20, ventanaMs: 60 * 1000, proyecto: "v2" });
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

    // Primero DB directa (match literal contra marca/modelo/versión) -- la
    // mayoría de las búsquedas son un modelo tipeado tal cual ("Toyota
    // Hilux"), no necesitan que la IA las interprete. Solo se gasta un
    // llamado a la IA cuando el texto libre no matchea nada literal (typos,
    // sinónimos, "algo barato y automático", etc).
    // ".or()" de PostgREST usa "," y "()" como separadores propios -- se
    // sacan del término antes de armar el filtro para no romper la sintaxis
    // con texto libre que los traiga.
    const terminoFiltro = termino.replace(/[,()]/g, " ").trim();
    const { data: matchDirecto, count: countDirecto, error: errorDirecto } = terminoFiltro
      ? await supabase
          .from("vehiculos")
          .select(`*, sucursales!vehiculos_sucursal_id_fkey ( nombre )`, { count: "exact" })
          .in("estado", ["disponible", "reservado"])
          .or(`marca.ilike.%${terminoFiltro}%,modelo.ilike.%${terminoFiltro}%,version.ilike.%${terminoFiltro}%`)
          .order("created_at", { ascending: false })
          .limit(24)
      : { data: null, count: 0, error: null };
    if (errorDirecto) throw errorDirecto;

    if (matchDirecto && matchDirecto.length > 0) {
      return Response.json({ ok: true, vehiculos: matchDirecto, count: countDirecto || 0, interpretacion: null });
    }

    // Límite aparte para el fallback con IA (más estricto que el general de
    // arriba, que cubre casi siempre búsquedas directas contra la DB sin
    // costo) -- por IP y también un tope global diario compartido entre
    // todos, para no dejar el gasto de IA abierto a un ataque distribuido.
    const ip = ipDesdeRequest(req);
    const limiteIaIp = await rateLimit(ip, { limite: 5, ventanaMs: 60 * 1000, proyecto: "v2" });
    if (!limiteIaIp.ok) {
      return Response.json({ error: "Demasiadas búsquedas con IA. Esperá un momento." }, { status: 429 });
    }
    const limiteIaGlobal = await rateLimit("buscar-ia-global", { limite: 300, ventanaMs: 24 * 60 * 60 * 1000, proyecto: "v2" });
    if (!limiteIaGlobal.ok) {
      return Response.json({ error: "El buscador con IA alcanzó su límite de uso por hoy. Probá con una búsqueda más directa (marca y modelo)." }, { status: 429 });
    }

    const resultado = await interpretarBusqueda(termino);
    if (!resultado.ok) {
      return Response.json({ error: resultado.error }, { status: 500 });
    }

    const filtros = resultado.data;

    let query = supabase
      .from("vehiculos")
      .select(`*, sucursales!vehiculos_sucursal_id_fkey ( nombre )`, { count: "exact" })
      .in("estado", ["disponible", "reservado"]);

    if (filtros.tipo) query = query.eq("tipo", filtros.tipo);
    if (filtros.marca) query = query.eq("marca", filtros.marca);
    if (filtros.transmision) query = query.eq("transmision", filtros.transmision);
    if (filtros.combustible) query = query.eq("combustible", filtros.combustible);
    if (filtros.condicion === "0km") query = query.eq("km", 0);
    else if (filtros.condicion === "usados") query = query.gt("km", 0);
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
