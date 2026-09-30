import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { puedeVerModulo } from "@/lib/panel/permisosModulos";
import { buscarEnMercadoLibre, mercadoLibreSearchConfigurado } from "@/lib/ads/mercadolibreSearch";
import { registrarError } from "@/lib/panel/logger";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE2_URL!,
      process.env.NEXT_PUBLIC_SUPABASE2_PUBLISHABLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    if (!(await puedeVerModulo(supabase, user.id, "oportunidades"))) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    if (!mercadoLibreSearchConfigurado()) {
      return NextResponse.json({ error: "La búsqueda contra MercadoLibre todavía no está configurada (falta ML_CLIENT_ID/ML_CLIENT_SECRET)." }, { status: 503 });
    }

    const q = new URL(req.url).searchParams.get("q")?.trim();
    if (!q) return NextResponse.json({ error: "Falta el término de búsqueda." }, { status: 400 });

    const resultados = await buscarEnMercadoLibre(q);
    return NextResponse.json({ resultados });
  } catch (err) {
    registrarError("api/panel/oportunidades/buscar", err);
    return NextResponse.json({ error: "No se pudo buscar en MercadoLibre." }, { status: 500 });
  }
}
