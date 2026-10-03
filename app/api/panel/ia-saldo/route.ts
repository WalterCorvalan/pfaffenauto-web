import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { estimarSaldoIa } from "@/lib/ai/saldoIa";

// Saldo estimado de la API de Anthropic para la pantalla Configuración > Empresa > IA. Solo admin.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { data: perfil } = await supabase.from("perfiles").select("roles").eq("id", user.id).maybeSingle();
  if (!perfil?.roles?.includes("admin")) return NextResponse.json({ error: "Solo administradores." }, { status: 403 });

  return NextResponse.json(await estimarSaldoIa());
}
