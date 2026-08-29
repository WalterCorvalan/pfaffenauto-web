import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { encrypt } from "@/lib/crypto";
import { registrarError } from "@/lib/logger";

async function clienteAutenticado() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE2_URL!,
    process.env.NEXT_PUBLIC_SUPABASE2_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, esAdmin: false };
  const { data: perfil } = await supabase.from("perfiles").select("roles").eq("id", user.id).single();
  return { supabase, esAdmin: perfil?.roles?.includes("admin") ?? false };
}

export async function GET() {
  const { supabase, esAdmin } = await clienteAutenticado();
  if (!esAdmin) return NextResponse.json({ error: "Solo Admin puede ver esto." }, { status: 403 });

  let { data } = await supabase.from("whatsapp_configuracion").select("phone_number_id, listo, bot_nombre, webhook_verify_token, updated_at").eq("id", true).single();

  if (data && !data.webhook_verify_token) {
    const verifyToken = randomBytes(24).toString("hex");
    const { data: actualizado } = await supabase.from("whatsapp_configuracion").update({ webhook_verify_token: verifyToken }).eq("id", true)
      .select("phone_number_id, listo, bot_nombre, webhook_verify_token, updated_at").single();
    data = actualizado;
  }

  return NextResponse.json({ config: data });
}

export async function POST(request: Request) {
  try {
    const { supabase, esAdmin } = await clienteAutenticado();
    if (!esAdmin) return NextResponse.json({ error: "Solo Admin puede modificar esto." }, { status: 403 });

    const body = await request.json();
    const phoneNumberId = String(body.phoneNumberId || "").trim();
    const accessToken = String(body.accessToken || "").trim();
    const botNombre = String(body.botNombre || "").trim() || null;
    const regenerarVerifyToken = !!body.regenerarVerifyToken;

    if (!phoneNumberId) return NextResponse.json({ error: "Falta el Identificador del número (phone_number_id)." }, { status: 400 });

    const patch: Record<string, unknown> = { phone_number_id: phoneNumberId, bot_nombre: botNombre, updated_at: new Date().toISOString() };

    if (accessToken) {
      const { cipher, iv, tag } = encrypt(accessToken);
      patch.token_cifrado = cipher;
      patch.token_iv = iv;
      patch.token_tag = tag;
    }

    if (regenerarVerifyToken) {
      patch.webhook_verify_token = randomBytes(24).toString("hex");
    }

    const { data: actual } = await supabase.from("whatsapp_configuracion").select("token_cifrado").eq("id", true).single();
    patch.listo = !!(phoneNumberId && (accessToken || actual?.token_cifrado));

    const { data, error } = await supabase.from("whatsapp_configuracion").update(patch).eq("id", true).select("phone_number_id, listo, bot_nombre, webhook_verify_token, updated_at").single();
    if (error) throw error;

    return NextResponse.json({ config: data });
  } catch (error) {
    registrarError("api/panel-v2/whatsapp/configuracion", error);
    return NextResponse.json({ error: "Error interno guardando la configuración." }, { status: 500 });
  }
}
