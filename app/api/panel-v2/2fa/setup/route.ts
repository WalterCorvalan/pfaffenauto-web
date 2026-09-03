import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase2/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import QRCode from "qrcode";
import { generarSecreto, otpauthUrl } from "@/lib/twofa/totp";

export async function POST(request: Request) {
  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: "Falta userId." }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const { data: miPerfil } = await supabase.from("perfiles").select("roles").eq("id", user.id).single();
  const soyAdmin = miPerfil?.roles?.includes("admin") ?? false;
  if (!soyAdmin && user.id !== userId) {
    return NextResponse.json({ error: "No podés habilitar 2FA para otro usuario." }, { status: 403 });
  }

  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE2_URL!, process.env.SUPABASE2_SERVICE_ROLE_KEY!);
  const { data: objetivo } = await admin.auth.admin.getUserById(userId);
  if (!objetivo?.user?.email) return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });

  const secreto = generarSecreto();
  const url = otpauthUrl(objetivo.user.email, secreto);
  const qrDataUrl = await QRCode.toDataURL(url);

  const { error } = await admin.from("perfiles").update({ totp_secret: secreto, totp_enabled: false, totp_confirmed_at: null }).eq("id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ qrDataUrl, claveManual: secreto });
}
