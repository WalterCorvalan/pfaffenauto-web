import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase2/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { verificarCodigo } from "@/lib/twofa/totp";

export async function POST(request: Request) {
  const { userId, codigo } = await request.json();
  if (!userId || !codigo) return NextResponse.json({ error: "Faltan datos." }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const { data: miPerfil } = await supabase.from("perfiles").select("roles").eq("id", user.id).single();
  const soyAdmin = miPerfil?.roles?.includes("admin") ?? false;
  if (!soyAdmin && user.id !== userId) {
    return NextResponse.json({ error: "No podés confirmar 2FA de otro usuario." }, { status: 403 });
  }

  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE2_URL!, process.env.SUPABASE2_SERVICE_ROLE_KEY!);
  const { data: perfil } = await admin.from("perfiles").select("totp_secret").eq("id", userId).single();
  if (!perfil?.totp_secret) return NextResponse.json({ error: "No hay un 2FA en configuración para este usuario." }, { status: 400 });

  if (!(await verificarCodigo(codigo, perfil.totp_secret))) {
    return NextResponse.json({ error: "Código incorrecto." }, { status: 400 });
  }

  const { error } = await admin.from("perfiles").update({ totp_enabled: true, totp_confirmed_at: new Date().toISOString() }).eq("id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
