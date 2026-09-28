import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { decrypt } from "@/lib/crypto";

// "Publicar en todos lados" (pedido 27/9): Instagram/Facebook Shop ya se
// sincroniza solo via feed (ver app/api/meta-catalog/feed/route.ts), Meta lo
// vuelve a pedir una vez por día. Este endpoint le pide a Meta que lo lea
// AHORA en vez de esperar ese ciclo -- mismo feed, mismos datos, solo se
// adelanta el momento de la lectura. Requiere feed_id + token con permiso
// catalog_management cargados en Configuración → Catálogo (catalogo_config).
//
// Diseñado para fallar en silencio si todavía no se cargaron esas
// credenciales (mismo criterio que los cron de WhatsApp/Instagram) -- el
// botón "Publicar en todos lados" no debe romper la parte de MercadoLibre
// solo porque Meta no esté configurado todavía.

function admin() {
  return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE2_URL!, process.env.SUPABASE2_SERVICE_ROLE_KEY!);
}

async function usuarioActual() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE2_URL!,
    process.env.NEXT_PUBLIC_SUPABASE2_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: perfil } = await supabase.from("perfiles").select("roles").eq("id", user.id).maybeSingle();
  if (!perfil?.roles?.includes("admin") && !perfil?.roles?.includes("encargado")) return null;
  return user;
}

export async function POST() {
  const user = await usuarioActual();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const supabase = admin();
  const { data: config } = await supabase.from("catalogo_config").select("meta_feed_id, meta_token_cifrado, meta_token_iv, meta_token_tag").eq("id", "default").maybeSingle();
  if (!config?.meta_feed_id || !config.meta_token_cifrado || !config.meta_token_iv || !config.meta_token_tag) {
    return NextResponse.json({ ok: true, sincronizado: false, motivo: "Meta no configurado todavía (falta feed_id o token en Configuración → Catálogo)." });
  }

  try {
    const token = decrypt(config.meta_token_cifrado, config.meta_token_iv, config.meta_token_tag);
    const feedUrl = "https://www.pfaffencars.com/api/meta-catalog/feed";
    const res = await fetch(`https://graph.facebook.com/v21.0/${config.meta_feed_id}/uploads?url=${encodeURIComponent(feedUrl)}&access_token=${encodeURIComponent(token)}`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ ok: true, sincronizado: false, motivo: data?.error?.message || "Meta rechazó la resincronización." });
    return NextResponse.json({ ok: true, sincronizado: true });
  } catch (err: any) {
    return NextResponse.json({ ok: true, sincronizado: false, motivo: err?.message || "Error de red con Meta." });
  }
}
