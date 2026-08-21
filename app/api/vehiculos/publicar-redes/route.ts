import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publishInstagramPost, publishFacebookPost, MetaApiError } from "@/lib/meta/client";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/logger";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PublicarRedesSchema = z.object({
  vehiculoId: z.string().uuid(),
});

const armarCaption = (v: any) => {
  const precio = v.precio_publicado_usd
    ? `US$ ${Number(v.precio_publicado_usd).toLocaleString("en-US")}`
    : `$${Number(v.precio_publicado_ars || 0).toLocaleString("es-AR")}`;
  const km = v.kilometraje != null ? `${Number(v.kilometraje).toLocaleString("es-AR")} km` : "0km";
  return [
    `${v.marca} ${v.modelo} ${v.anio}`,
    `${km} · ${precio}`,
    "Financiación disponible. Consultanos.",
    `👉 pfaffenautos.com.ar/catalogo/${v.slug}`,
  ].join("\n\n");
};

// Publica una foto del vehículo en Instagram y Facebook a la vez. Botón manual
// en el panel — el vendedor decide qué auto publicar y cuándo, no es automático
// al cargar stock.
export async function POST(req: Request) {
  try {
    const limite = rateLimit(ipDesdeRequest(req), { limite: 10, ventanaMs: 60 * 1000 });
    if (!limite.ok) {
      return Response.json({ error: "Demasiadas solicitudes. Esperá un momento." }, { status: 429 });
    }

    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return Response.json({ error: "No autorizado." }, { status: 401 });

    const parsed = PublicarRedesSchema.safeParse(await req.json());
    if (!parsed.success) {
      return Response.json({ error: "Falta vehiculoId." }, { status: 400 });
    }

    const { data: vehiculo } = await supabase
      .from("vehiculos")
      .select("id, marca, modelo, anio, kilometraje, slug, precio_publicado_ars, precio_publicado_usd, multimedia_vehiculos ( url_archivo )")
      .eq("id", parsed.data.vehiculoId)
      .single();

    if (!vehiculo) return Response.json({ error: "Vehículo no encontrado." }, { status: 404 });

    const fotoUrl = (vehiculo.multimedia_vehiculos as any)?.[0]?.url_archivo;
    if (!fotoUrl) return Response.json({ error: "El vehículo no tiene fotos cargadas." }, { status: 400 });

    if (!process.env.META_INSTAGRAM_TOKEN || !process.env.META_INSTAGRAM_USER_ID) {
      return Response.json({ error: "Instagram no está configurado (falta token/user_id)." }, { status: 503 });
    }
    if (!process.env.META_FACEBOOK_TOKEN || !process.env.META_FACEBOOK_PAGE_ID) {
      return Response.json({ error: "Facebook no está configurado (falta token/page_id)." }, { status: 503 });
    }

    const caption = armarCaption(vehiculo);
    const resultados: { canal: string; ok: boolean; error?: string }[] = [];

    try {
      const ig = await publishInstagramPost(process.env.META_INSTAGRAM_USER_ID, process.env.META_INSTAGRAM_TOKEN, fotoUrl, caption);
      await supabase.from("vehiculos").update({ ig_post_id: ig.id, publicado_redes_at: new Date().toISOString() }).eq("id", vehiculo.id);
      resultados.push({ canal: "instagram", ok: true });
    } catch (err) {
      resultados.push({ canal: "instagram", ok: false, error: err instanceof MetaApiError ? err.message : "Error desconocido." });
    }

    try {
      const fb = await publishFacebookPost(process.env.META_FACEBOOK_PAGE_ID, process.env.META_FACEBOOK_TOKEN, fotoUrl, caption);
      await supabase.from("vehiculos").update({ fb_post_id: fb.post_id ?? fb.id, publicado_redes_at: new Date().toISOString() }).eq("id", vehiculo.id);
      resultados.push({ canal: "facebook", ok: true });
    } catch (err) {
      resultados.push({ canal: "facebook", ok: false, error: err instanceof MetaApiError ? err.message : "Error desconocido." });
    }

    return Response.json({ ok: resultados.some((r) => r.ok), resultados });
  } catch (err) {
    registrarError("api/vehiculos/publicar-redes", err);
    return Response.json({ error: "Error al publicar." }, { status: 500 });
  }
}
