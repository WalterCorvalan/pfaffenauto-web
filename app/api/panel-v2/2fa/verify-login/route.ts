import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { verificarCodigo } from "@/lib/twofa/totp";

export async function POST(request: Request) {
  const limite = rateLimit(ipDesdeRequest(request), { limite: 10, ventanaMs: 60 * 1000 });
  if (!limite.ok) return NextResponse.json({ error: "Demasiados intentos. Esperá un momento." }, { status: 429 });

  const { userId, codigo } = await request.json();
  if (!userId || !codigo) return NextResponse.json({ error: "Faltan datos." }, { status: 400 });

  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE2_URL!, process.env.SUPABASE2_SERVICE_ROLE_KEY!);
  const { data: perfil } = await admin.from("perfiles").select("totp_secret, totp_enabled").eq("id", userId).single();
  if (!perfil?.totp_enabled || !perfil.totp_secret) return NextResponse.json({ error: "2FA no está activo para este usuario." }, { status: 400 });

  if (!(await verificarCodigo(codigo, perfil.totp_secret))) {
    return NextResponse.json({ error: "Código incorrecto." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
