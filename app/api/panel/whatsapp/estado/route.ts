import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { getPhoneNumberStatus, getWabaVerificationStatus, MetaApiError } from "@/lib/meta/client";
import { decrypt } from "@/lib/crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

// Chequeo en vivo del estado real de envío contra la API de Meta -- para que
// el equipo pueda verificar ustedes mismos si ya se destrabó la
// verificación del negocio (error #141010, ver lib/meta/erroresWhatsapp.ts)
// sin depender de herramientas externas ni de mí.
export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE2_URL!,
    process.env.NEXT_PUBLIC_SUPABASE2_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { data: perfil } = await supabase.from("perfiles").select("roles").eq("id", user.id).single();
  if (!perfil?.roles?.includes("admin") && !perfil?.roles?.includes("encargado")) {
    return NextResponse.json({ error: "Solo admin o encargado." }, { status: 403 });
  }

  const { data: config } = await supabaseAdmin.from("whatsapp_configuracion").select("*").eq("id", true).maybeSingle();
  if (!config?.listo || !config.token_cifrado || !config.phone_number_id || !config.waba_id) {
    return NextResponse.json({ error: "Faltan credenciales cargadas en Configuración → WhatsApp." }, { status: 400 });
  }

  try {
    const token = decrypt(config.token_cifrado, config.token_iv, config.token_tag);
    const [numero, waba] = await Promise.all([
      getPhoneNumberStatus(config.phone_number_id, token),
      getWabaVerificationStatus(config.waba_id, token),
    ]);

    const puedeEnviar = waba.business_verification_status === "verified";

    return NextResponse.json({
      ok: true,
      numero: { display: numero.display_phone_number, verificado: numero.verified_name, calidad: numero.quality_rating || null, estado: numero.status || null },
      negocio: { nombre: waba.name || null, verificacion: waba.business_verification_status || "desconocido" },
      puedeEnviar,
      mensaje: puedeEnviar
        ? "El negocio está verificado en Meta — el envío no debería estar bloqueado por este motivo."
        : `El negocio figura "${waba.business_verification_status || "desconocido"}" en Meta. Mientras no diga "verified", ningún mensaje sale (ver Verificación de la Empresa en Meta Business Suite).`,
    });
  } catch (err) {
    const mensaje = err instanceof MetaApiError ? err.message : "Error consultando la API de Meta.";
    return NextResponse.json({ error: mensaje }, { status: 502 });
  }
}
