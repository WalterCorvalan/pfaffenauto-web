import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase2/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: "Falta userId." }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const { data: miPerfil } = await supabase.from("perfiles").select("roles").eq("id", user.id).single();
  const soyAdmin = miPerfil?.roles?.includes("admin") ?? false;
  if (!soyAdmin && user.id !== userId) {
    return NextResponse.json({ error: "No podés deshabilitar 2FA de otro usuario." }, { status: 403 });
  }

  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE2_URL!, process.env.SUPABASE2_SERVICE_ROLE_KEY!);
  const { error } = await admin.from("perfiles").update({ totp_secret: null, totp_enabled: false, totp_confirmed_at: null }).eq("id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
