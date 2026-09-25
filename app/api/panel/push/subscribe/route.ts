import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { registrarError } from "@/lib/panel/logger";

// Guarda la suscripción push (Web Push API) del dispositivo actual para el
// usuario logueado -- se llama desde PushSubscribeButton.tsx apenas acepta
// el permiso del navegador. onConflict por endpoint: el mismo navegador/
// dispositivo puede volver a suscribirse (ej: reinstaló la PWA) sin duplicar.
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE2_URL!,
    process.env.NEXT_PUBLIC_SUPABASE2_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  try {
    const body = await request.json();
    const endpoint = body?.endpoint as string | undefined;
    const p256dh = body?.keys?.p256dh as string | undefined;
    const auth = body?.keys?.auth as string | undefined;
    if (!endpoint || !p256dh || !auth) return NextResponse.json({ error: "Suscripción inválida." }, { status: 400 });

    const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE2_URL!, process.env.SUPABASE2_SERVICE_ROLE_KEY!);
    const { error } = await admin.from("push_subscriptions").upsert(
      { perfil_id: user.id, endpoint, p256dh, auth },
      { onConflict: "endpoint" }
    );
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    registrarError("api/panel/push/subscribe", error);
    return NextResponse.json({ error: "No se pudo guardar la suscripción." }, { status: 500 });
  }
}
