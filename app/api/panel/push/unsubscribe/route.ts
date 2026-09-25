import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { registrarError } from "@/lib/panel/logger";

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
    if (!endpoint) return NextResponse.json({ error: "Falta el endpoint." }, { status: 400 });

    const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE2_URL!, process.env.SUPABASE2_SERVICE_ROLE_KEY!);
    await admin.from("push_subscriptions").delete().eq("endpoint", endpoint).eq("perfil_id", user.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    registrarError("api/panel/push/unsubscribe", error);
    return NextResponse.json({ error: "No se pudo desactivar." }, { status: 500 });
  }
}
