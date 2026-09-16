import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/panel/logger";
import { fetchComparablesMeli, calcularEstadisticas, descuentoPorKm } from "@/lib/tasadorMercado";

const TasadorSchema = z.object({
  marca: z.string().trim().min(1),
  modelo: z.string().trim().min(1),
  version: z.string().trim().optional(),
  anio: z.number().int().min(1990).max(new Date().getFullYear() + 1),
  km: z.number().int().min(0),
});

// Requiere sesión de staff -- este endpoint hace scraping en vivo de MeLi,
// no está pensado para exponerse sin login (evita que cualquiera lo use
// como proxy gratis para bajar precios de MeLi en volumen).
export async function POST(request: Request) {
  const limite = await rateLimit(ipDesdeRequest(request), { limite: 15, ventanaMs: 60 * 1000, proyecto: "v2" });
  if (!limite.ok) {
    return NextResponse.json({ error: "Demasiadas tasaciones seguidas. Esperá un momento." }, { status: 429 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE2_URL!,
    process.env.NEXT_PUBLIC_SUPABASE2_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const parsed = TasadorSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Completá marca, modelo, año y km." }, { status: 400 });
  }
  const { marca, modelo, version, anio, km } = parsed.data;

  try {
    const comparables = await fetchComparablesMeli({ marca, modelo, version, anio });
    const estadisticas = calcularEstadisticas(comparables);
    if (!estadisticas) {
      return NextResponse.json({ error: "No se encontraron publicaciones comparables en MercadoLibre para esa búsqueda." }, { status: 404 });
    }
    const descuentoPct = descuentoPorKm(km);
    const ajustado = Math.round(estadisticas.media * (1 - descuentoPct / 100));

    return NextResponse.json({ comparables, estadisticas, descuentoPct, ajustado });
  } catch (err) {
    registrarError("api/panel/tasador-mercado", err, { marca, modelo, version, anio, km });
    return NextResponse.json({ error: "No se pudo consultar MercadoLibre. Puede que haya bloqueado el request -- probá de nuevo en un rato." }, { status: 502 });
  }
}
