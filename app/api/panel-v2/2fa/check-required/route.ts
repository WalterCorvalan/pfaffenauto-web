import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: "Falta userId." }, { status: 400 });

  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE2_URL!, process.env.SUPABASE2_SERVICE_ROLE_KEY!);
  const { data: perfil } = await admin.from("perfiles").select("totp_enabled").eq("id", userId).single();

  return NextResponse.json({ requerido: perfil?.totp_enabled ?? false });
}
