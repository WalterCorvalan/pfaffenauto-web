import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { z } from "zod";
import { publicarVehiculoEnML, mercadoLibrePublishConfigurado } from "@/lib/ads/mercadolibrePublish";

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
  return user;
}

const BodySchema = z.object({ vehiculoId: z.string().uuid() });

export async function POST(request: Request) {
  const user = await usuarioActual();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  if (!mercadoLibrePublishConfigurado()) {
    return NextResponse.json({ error: "MercadoLibre no está configurado todavía (faltan credenciales)." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });

  const resultado = await publicarVehiculoEnML(admin(), parsed.data.vehiculoId);
  if (!resultado.ok) return NextResponse.json({ error: resultado.error }, { status: 400 });

  return NextResponse.json({ ok: true, itemId: resultado.itemId, permalink: resultado.permalink });
}
