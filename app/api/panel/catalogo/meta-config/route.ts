import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { z } from "zod";
import { encrypt } from "@/lib/crypto";

// Guarda feed_id + access token (cifrado) para forzar la resincronización
// del catálogo de Meta -- ver app/api/panel/meta-catalog/forzar-sync/route.ts.
// El token generado en Meta Commerce Manager necesita permiso
// "catalog_management" sobre el catálogo "Pfaffencars_CatalogoIG".

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
  if (!perfil?.roles?.includes("admin")) return null;
  return user;
}

const BodySchema = z.object({ feedId: z.string().min(1), accessToken: z.string().optional() });

export async function POST(request: Request) {
  const user = await usuarioActual();
  if (!user) return NextResponse.json({ error: "No autorizado — solo admin." }, { status: 403 });

  const body = BodySchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  const { feedId, accessToken } = body.data;

  const patch: Record<string, string> = { meta_feed_id: feedId };
  // Igual criterio que whatsapp_configuracion: dejar el token vacío no lo
  // borra, solo no lo cambia (así no hay que volver a pegarlo cada vez que
  // se edita el feed_id).
  if (accessToken) {
    const { cipher, iv, tag } = encrypt(accessToken);
    patch.meta_token_cifrado = cipher;
    patch.meta_token_iv = iv;
    patch.meta_token_tag = tag;
  }

  const supabase = admin();
  const { error } = await supabase.from("catalogo_config").update(patch).eq("id", "default");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
